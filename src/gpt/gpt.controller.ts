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
    },
    @Res() res: Response,
  ) {
    return this.gptService.streamCompletion(body.messages, res);
  }
}
