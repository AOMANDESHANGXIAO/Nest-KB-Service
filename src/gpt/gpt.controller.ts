import { Controller, Post, Body, Res } from '@nestjs/common';
import { GptService } from './gpt.service';
import { Response } from 'express';
@Controller('gpt')
export class GptController {
  constructor(private readonly gptService: GptService) {}

  @Post('stream-completion')
  async streamCompletion(
    @Body()
    body: {
      messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
      student_id: string;
      topic_id: string;
      new_message: string;
    },
    @Res() res: Response,
  ) {
    return this.gptService.streamCompletion(
      body.messages,
      {
        student_id: body.student_id,
        topic_id: body.topic_id,
        new_message: body.new_message,
      },
      res,
    );
  }
}
