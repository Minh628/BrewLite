import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /**
   * Endpoint gốc xác nhận backend đang chạy bình thường theo yêu cầu Task 1.2
   */
  @Get()
  getHello(): string {
    return 'Hello BrewLite';
  }
}
