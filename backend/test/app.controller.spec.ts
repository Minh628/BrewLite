import { AppController } from '../src/app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(() => {
    appController = new AppController();
  });

  describe('root', () => {
    it('should return "Hello BrewLite"', () => {
      expect(appController.getHello()).toBe('Hello BrewLite');
    });
  });

  describe('health', () => {
    it('should return status ok and service info with HTTP 200 payload', () => {
      const result = appController.getHealth();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'brewlite-backend');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(typeof result.uptime).toBe('number');
    });
  });
});
