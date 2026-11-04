import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { BEARER_AUTH } from '../swagger';
import { ValidatePromotionDto, ValidatedPromotionDto } from './dto/validate-promotion.dto';
import { PromotionsService } from './promotions.service';

/**
 * Controller kiểm tra mã giảm giá (Sub-task 10.4a).
 */
@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  /**
   * @route POST /promotions/validate (JWT)
   * @returns 200 { code, discount } khi hợp lệ; 400 PROMO_* khi không hợp lệ.
   */
  @UseGuards(JwtAuthGuard)
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Kiểm tra mã giảm giá',
    description:
      'Trả về số tiền giảm theo quy tắc PERCENT/FIXED. Lỗi trả 400 kèm code PROMO_NOT_FOUND, ' +
      'PROMO_INACTIVE, PROMO_EXPIRED, PROMO_MIN_ORDER hoặc PROMO_EXHAUSTED.',
  })
  @ApiOkResponse({ type: ValidatedPromotionDto })
  @ApiBadRequestResponse({
    type: ApiErrorDto,
    description: 'Mã không tồn tại / tạm ngưng / hết hạn / chưa đủ giá trị tối thiểu / hết lượt',
  })
  @ApiUnauthorizedResponse({ type: ApiErrorDto, description: 'Thiếu hoặc sai Bearer token' })
  async validate(@Body() dto: ValidatePromotionDto): Promise<ValidatedPromotionDto> {
    return this.promotionsService.validate(dto.code, dto.subtotal);
  }
}
