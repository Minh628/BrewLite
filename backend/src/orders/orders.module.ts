import { Module } from '@nestjs/common';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { PricingModule } from '../pricing/pricing.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatusService } from './order-status.service';
import { LoyaltyHooksService } from './loyalty-hooks.service';

@Module({
  imports: [PricingModule, PromotionsModule, LoyaltyModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderStatusService, LoyaltyHooksService],
  exports: [OrdersService, OrderStatusService],
})
export class OrdersModule {}
