import { AppController } from '../src/app.controller';
import { PrismaService } from '../src/prisma/prisma.service';
import type { Response } from 'express';

describe('AppController', () => {
  let appController: AppController;
  let prisma: { $queryRaw: jest.Mock };
  let response: { status: jest.Mock };

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    response = {
      status: jest.fn(),
    };

    appController = new AppController(
      prisma as unknown as PrismaService,
    );
  });

  describe('root', () => {
    it('should return Hello BrewLite', () => {
      expect(appController.getHello()).toBe('Hello BrewLite');
    });
  });

  describe('health', () => {
    it('should return backend and database health information', async () => {
      const result = await appController.getHealth(
        response as unknown as Response,
      );

      expect(result.status).toBe('ok');
      expect(result.service).toBe('brewlite-backend');
      expect(result.database).toBe('connected');
      expect(result.version).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(typeof result.uptime).toBe('number');
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(response.status).not.toHaveBeenCalled();
    });

    it('should return disconnected status when database is unavailable', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Database unavailable'));

      const result = await appController.getHealth(
        response as unknown as Response,
      );

      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnected');
      expect(result.version).toBeDefined();
      expect(response.status).toHaveBeenCalledWith(
        503,
      );
    });
  });
});