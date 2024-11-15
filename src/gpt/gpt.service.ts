/*
 * @Author: tom 13849343+tomFfff@user.noreply.gitee.com
 * @Date: 2024-11-12 11:27:00
 * @LastEditors: tom 13849343+tomFfff@user.noreply.gitee.com
 * @LastEditTime: 2024-11-12 11:48:09
 * @FilePath: \knowledge-building-web\src\gpt\demo.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import OpenAI from 'openai';
import { SqlService } from 'src/db';
import { SUCCESS_CHAT, FAILED_CHAT } from 'src/crud/Table.model';

@Injectable()
export class GptService extends SqlService {
  private readonly openai: OpenAI;

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.BASE_URL,
    });
  }

  private escapeSqlString(str: string): string {
    return str.replace(/[\0\n\r\b\t\\'"\x1a]/g, (s) => {
      switch (s) {
        case '\0':
          return '\\0';
        case '\n':
          return '\\n';
        case '\r':
          return '\\r';
        case '\b':
          return '\\b';
        case '\t':
          return '\\t';
        case '\x1a':
          return '\\Z';
        case "'":
          return "''"; // 在 SQL 中，单引号需要用两个单引号转义
        case '"':
          return '\\"';
        case '\\':
          return '\\\\';
        default:
          return s;
      }
    });
  }

  private async chatMessageLog(params: {
    student_id: string;
    topic_id: string;
    new_message: string;
    success: number;
  }) {
    const { student_id, topic_id, new_message, success } = params;
    // console.log('params', params);
    this.transaction(async () => {
      const escapedMessage = this.escapeSqlString(new_message);
      const sql = `
      INSERT INTO chat_message_storage (student, topic, message, created_time, success) 
      VALUES (${student_id}, ${topic_id}, '${escapedMessage}', NOW(), ${success})
      `;
      await this.insert(sql);
    });
  }

  async streamCompletion(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    params: {
      student_id: string;
      topic_id: string;
      new_message: string; // 前端发送时带上这一次的信息
    },
    res: Response,
  ) {
    // 参数检查
    const { student_id, topic_id, new_message } = params;
    if (!student_id || !topic_id || !new_message) {
      throw new Error('student_id, topic_id and new_message are required');
    }
    let isSuccess = false;

    // 流式传输
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    try {
      const stream = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: '你是豆包，是由字节跳动开发的 AI 人工智能助手',
          },
          ...messages,
        ],
        model: process.env.MODEL,
        stream: true,
      });

      for await (const part of stream) {
        const content = part.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      isSuccess = true;
    } catch (error) {
      console.error('Stream response error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      isSuccess = false;
    } finally {
      await this.chatMessageLog({
        student_id,
        topic_id,
        new_message,
        success: isSuccess ? SUCCESS_CHAT : FAILED_CHAT,
      });
      res.end();
    }
  }
}
