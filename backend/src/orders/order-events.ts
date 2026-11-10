import { EventEmitter } from 'node:events';

// EventEmitter dùng chung cho các sự kiện liên quan đến đơn hàng.
export const orderEvents = new EventEmitter();