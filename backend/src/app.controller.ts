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

  /**
   * Health check endpoint theo Sub-task 14.3
   * Trả về HTTP 200 kèm thông tin trạng thái hoạt động của backend
   */
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'brewlite-backend',
    };
  }
}
