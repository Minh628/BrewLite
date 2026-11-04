import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { PricingModule } from '../pricing/pricing.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { StockModule } from '../stock/stock.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatusService } from './order-status.service';
import { LoyaltyHooksService } from './loyalty-hooks.service';
import { StockHooksService } from './stock-hooks.service';

@Module({
  imports: [AuthModule, PricingModule, PromotionsModule, LoyaltyModule, StockModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderStatusService, LoyaltyHooksService, StockHooksService],
  exports: [OrdersService, OrderStatusService],
})
export class OrdersModule {}
