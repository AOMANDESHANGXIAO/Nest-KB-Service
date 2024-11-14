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

const ChatMessageLog = async (
  sqlService: SqlService,
  params: {
    student_id: string;
    topic_id: string;
    new_message: string;
    success: number;
  },
) => {
  const { student_id, topic_id, new_message, success } = params;
  // 记录学生发送的消息
  await sqlService.transaction(async () => {
    const sql = `
  INSERT INTO chat_message_storage (student, topic, message, created_time, success) 
  VALUES (${student_id}, ${topic_id}, ${new_message}, NOW(), ${success})
  `;
    await sqlService.insert(sql);
  });
};

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
      await ChatMessageLog(this, {
        student_id,
        topic_id,
        new_message,
        success: SUCCESS_CHAT,
      });
      res.end();
    } catch (error) {
      console.error('Stream response error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      await ChatMessageLog(this, {
        student_id,
        topic_id,
        new_message,
        success: FAILED_CHAT,
      });
      res.end();
    }
  }
}
