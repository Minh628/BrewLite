import {
  Controller,
  Get,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHello() {
    return 'Hello BrewLite';
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check: backend, database và build version',
  })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-10-24T10:00:00.000Z',
        uptime: 123.45,
        service: 'brewlite-backend',
        database: 'connected',
        version: '1.0.0',
      },
    },
  })
  async getHealth(@Res({ passthrough: true }) response: Response) {
    let database: 'connected' | 'disconnected' = 'connected';

    try {
      await this.prisma.$queryRaw<unknown[]>`SELECT 1`;
    } catch {
      database = 'disconnected';
    }

    const status = database === 'connected' ? 'ok' : 'error';

    if (database === 'disconnected') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'brewlite-backend',
      database,
      version: process.env.BUILD_VERSION || '1.0.0',
    };
  }
}