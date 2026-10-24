import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  /**
   * Endpoint gốc xác nhận backend đang chạy bình thường theo yêu cầu Task 1.2
   */
  @Get()
  @ApiOperation({ summary: 'Kiểm tra backend đang chạy' })
  @ApiOkResponse({
    description: 'Chuỗi chào',
    schema: { type: 'string', example: 'Hello BrewLite' },
  })
  getHello(): string {
    return 'Hello BrewLite';
  }

  /**
   * Health check endpoint theo Sub-task 14.3
   * Trả về HTTP 200 kèm thông tin trạng thái hoạt động của backend
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Trả về trạng thái và uptime của service.',
  })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-10-03T08:00:00.000Z',
        uptime: 123.45,
        service: 'brewlite-backend',
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'brewlite-backend',
    };
  }
}
