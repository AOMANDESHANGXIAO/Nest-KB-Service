/*
 * @Author: tom 13849343+tomFfff@user.noreply.gitee.com
 * @Date: 2024-11-12 11:27:00
 * @LastEditors: tom 13849343+tomFfff@user.noreply.gitee.com
 * @LastEditTime: 2024-11-12 13:58:52
 * @FilePath: \knowledge-building-web\src\gpt\demo.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import OpenAI from 'openai';

@Injectable()
export class GptService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    });
  }

  async streamCompletion(prompt: string, res: Response) {
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
          { role: 'user', content: prompt },
        ],
        model: 'ep-20241112112248-r7llx',
        stream: true,
      });

      for await (const part of stream) {
        const content = part.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Stream response error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}
