import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import * as crypto from 'crypto';
import * as qs from 'qs';

export interface CreateVnpayUrlParams {
  orderId: number;
  amount: number;
  method?: PaymentMethod | 'CARD' | 'WALLET';
  ipAddr?: string;
}

export interface VerifyVnpayCallbackResult {
  isValid: boolean;
  orderId: number;
  method: PaymentMethod;
  amount: number;
  isSuccess: boolean;
  responseCode: string;
  transactionNo: string;
}

@Injectable()
export class VnpayService {
  private readonly tmnCode = process.env.VNP_TMN_CODE ?? 'GPEZRE6S';
  private readonly hashSecret = process.env.VNP_HASH_SECRET ?? 'YVMGCTHHYQWKKFMIVZKKCHEPXJKLZJOW';
  private readonly vnpUrl =
    process.env.VNP_URL ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  private readonly returnUrl =
    process.env.VNP_RETURN_URL ?? 'http://localhost:3000/orders/vnpay-return';

  /**
   * Tạo URL chuyển hướng sang cổng thanh toán VNPay Sandbox theo chuẩn v2.1.0
   */
  createPaymentUrl(params: CreateVnpayUrlParams): string {
    const now = new Date();
    const createDate = this.formatDateGMT7(now);
    // Hết hạn sau 15 phút theo đặc tả VNPay v2.1.0
    const expireDate = this.formatDateGMT7(new Date(now.getTime() + 15 * 60 * 1000));

    // Số tiền nhân 100 (VNPay quy định đơn vị nhỏ nhất là hào/xu, VND nhân 100)
    const vnpAmount = Math.round(Number(params.amount) * 100);

    const paymentMethod = params.method || PaymentMethod.CARD;
    // Mã tham chiếu duy nhất: Ghép orderId, method và timestamp ngăn cách bằng chữ 'X' (an toàn tuyệt đối cho chữ và số)
    const txnRef = `${params.orderId}X${paymentMethod}X${now.getTime()}`;

    // Chuẩn hóa địa chỉ IP về IPv4 (tránh lỗi IPv6 ::1 trên localhost làm VNPay báo lỗi code=03)
    let ipAddr = params.ipAddr ?? '127.0.0.1';
    if (ipAddr === '::1' || ipAddr.startsWith('::ffff:') || ipAddr.includes(':')) {
      ipAddr = '127.0.0.1';
    }

    let vnpParams: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode.trim(),
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      // Bắt buộc tiếng Việt không dấu, không chứa ký tự đặc biệt (#, :, ...)
      vnp_OrderInfo: `Thanh toan don hang ${params.orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: vnpAmount,
      vnp_ReturnUrl: this.returnUrl.trim(),
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Sắp xếp tham số theo thứ tự bảng chữ cái A-Z trước khi tạo chuỗi băm
    vnpParams = this.sortObject(vnpParams);

    const signData = qs.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.hashSecret.trim());
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpParams['vnp_SecureHash'] = signed;

    return `${this.vnpUrl}?${qs.stringify(vnpParams, { encode: false })}`;
  }

  /**
   * Kiểm tra chữ ký số (Checksum) khi VNPay gọi về IPN hoặc Return URL
   */
  verifyCallback(query: Record<string, any>): VerifyVnpayCallbackResult {
    const secureHash = String(query['vnp_SecureHash'] || '');
    const cloneQuery = { ...query };
    delete cloneQuery['vnp_SecureHash'];
    delete cloneQuery['vnp_SecureHashType'];

    const sortedParams = this.sortObject(cloneQuery);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.hashSecret.trim());
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // So khớp chữ ký bảo mật (không phân biệt hoa thường)
    const isValid = secureHash.toLowerCase() === signed.toLowerCase();

    // Bóc tách orderId và method từ chuỗi tham chiếu txnRef dạng {orderId}X{method}X{timestamp}
    const rawTxnRef = String(query['vnp_TxnRef'] || '');
    let orderId = 0;
    let method: PaymentMethod = PaymentMethod.CARD;

    if (rawTxnRef.includes('X')) {
      const parts = rawTxnRef.split('X');
      orderId = Number(parts[0]);
      if (parts[1] === 'WALLET') {
        method = PaymentMethod.WALLET;
      } else {
        method = PaymentMethod.CARD;
      }
    } else if (rawTxnRef.includes('T')) {
      orderId = Number(rawTxnRef.split('T')[0]);
    } else {
      orderId = Number(rawTxnRef);
    }

    const amount = Number(query['vnp_Amount'] || 0) / 100;
    const responseCode = String(query['vnp_ResponseCode'] || '99');
    const transactionStatus = String(query['vnp_TransactionStatus'] || responseCode);

    // Giao dịch chỉ thành công khi cả ResponseCode và TransactionStatus đều là '00'
    const isSuccess = responseCode === '00' && transactionStatus === '00';

    return {
      isValid,
      orderId,
      method,
      amount,
      isSuccess,
      responseCode,
      transactionNo: String(query['vnp_TransactionNo'] || Date.now()),
    };
  }

  /**
   * Sắp xếp key theo alphabet và encode chuẩn URI (%20 thay bằng +) theo đúng đặc tả VNPay
   */
  private sortObject(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
      }
    }
    return sorted;
  }

  /**
   * Định dạng thời gian chuẩn yyyyMMddHHmmss theo múi giờ GMT+7 (Việt Nam)
   */
  private formatDateGMT7(date: Date): string {
    const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
    const vnTime = new Date(utcTime + 7 * 3600000);

    const yyyy = vnTime.getFullYear();
    const MM = String(vnTime.getMonth() + 1).padStart(2, '0');
    const dd = String(vnTime.getDate()).padStart(2, '0');
    const HH = String(vnTime.getHours()).padStart(2, '0');
    const mm = String(vnTime.getMinutes()).padStart(2, '0');
    const ss = String(vnTime.getSeconds()).padStart(2, '0');

    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  }
}
