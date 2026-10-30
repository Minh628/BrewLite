import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { BEARER_AUTH } from '../swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatedOrderDto } from './dto/order-response.dto';
import { OrdersService } from './orders.service';

/**
 * Controller xử lý đơn hàng (PB-06)
 */
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Endpoint tạo đơn hàng từ giỏ hàng (Sub-task 6.4)
   * @route POST /orders
   * @param userId Mã người dùng lấy từ JWT Bearer token
   * @param dto Danh sách món: productId, size, qty, toppingIds
   * @returns HTTP 201 Created cùng `{orderId, code, status: PENDING, total, items, createdAt}`
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Tạo đơn hàng PENDING từ giỏ',
    description: 'Server tự tính giá từ DB; mọi trường giá client gửi kèm đều bị bỏ qua.',
  })
  @ApiCreatedResponse({ type: CreatedOrderDto })
  @ApiBadRequestResponse({
    type: ApiErrorDto,
    description: 'Sai DTO, sản phẩm/topping không tồn tại hoặc ngừng bán',
  })
  @ApiUnauthorizedResponse({ type: ApiErrorDto, description: 'Thiếu hoặc sai Bearer token' })
  async create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateOrderDto,
  ): Promise<CreatedOrderDto> {
    return this.ordersService.create(userId, dto);
  }
}
