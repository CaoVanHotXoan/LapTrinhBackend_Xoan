// ==============================================================================
// MIDDLEWARE GIỚI HẠN TẦN SUẤT GỌI API (RATE LIMITING) - CHƯƠNG 09 LAB 2
// File: src/middlewares/rate-limit.middleware.ts
// Mục đích: Chống tấn công dò quét mật khẩu Brute-force & từ chối dịch vụ DoS
// ==============================================================================

// 1. Import hàm rateLimit từ thư viện express-rate-limit để tạo bộ đếm request
import { rateLimit } from 'express-rate-limit';

// 2. Import các kiểu Request và Response từ Express để định kiểu chặt chẽ
import type { Request, Response } from 'express';

// 3. Khởi tạo và xuất middleware loginLimiter áp dụng riêng cho endpoint POST /api/auth/login
export const loginLimiter = rateLimit({
  // Cửa sổ thời gian tính giới hạn: 60.000 milliseconds tương đương 60 giây (1 phút)
  windowMs: 60 * 1000,

  // Số lượng yêu cầu tối đa được phép thực hiện từ cùng một địa chỉ IP trong 60 giây
  limit: 5,

  // Sử dụng chuẩn Header hiện đại draft-7 (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
  standardHeaders: 'draft-7',

  // Vô hiệu hóa các Header cũ không còn khuyến nghị (X-RateLimit-*)
  legacyHeaders: false,

  // Mã trạng thái HTTP trả về khi vượt hạn mức: 429 Too Many Requests
  statusCode: 429,

  // Cấu trúc đối tượng phản hồi lỗi chuẩn hóa
  message: {
    // Trạng thái thất bại
    success: false,
    // Mã HTTP 429
    status: 429,
    // Thông điệp cảnh báo rõ ràng gửi tới client
    message: 'Bạn đã gửi quá nhiều yêu cầu',
    // Dữ liệu trả về null theo đúng hợp đồng hệ thống
    data: null
  },

  // Hàm xử lý tùy biến khi người dùng vượt quá 5 request trong 60 giây
  handler: (_req: Request, res: Response) => {
    // Trả về mã HTTP 429 kèm dữ liệu JSON đúng cấu trúc thống nhất của dự án
    res.status(429).json({
      // Trạng thái thất bại
      success: false,
      // Mã lỗi HTTP 429 Too Many Requests
      status: 429,
      // Thông báo phản hồi cho người dùng
      message: 'Bạn đã gửi quá nhiều yêu cầu',
      // Dữ liệu null
      data: null
    });
  }
});
