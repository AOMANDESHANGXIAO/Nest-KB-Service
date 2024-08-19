/**
 * 核心业务：控制流程图Service
 */
import { Controller } from '@nestjs/common';
import { FlowService } from './flow.service';

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}
}
