// Import các kiểu Request, Response, NextFunction từ Express
import type { Request, Response, NextFunction } from 'express';

// Import class AppError để kiểm tra và xử lý các lỗi nghiệp vụ tùy biến (lưu ý đuôi .js)
import { AppError } from '../utils/AppError.js';

// Middleware xử lý lỗi tập trung cho toàn bộ ứng dụng (bắt buộc phải có đủ 4 tham số)
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // In chi tiết lỗi ra console server để lập trình viên theo dõi
  console.error('[ERROR]', err);

  // Trường hợp 1: Lỗi nghiệp vụ dự kiến (AppError) được ném ra từ tầng Service/Controller
  if (err instanceof AppError) {
    // Trả về đúng mã HTTP statusCode và thông điệp lỗi của AppError
    res.status(err.statusCode).json({
      // Báo hiệu thất bại
      success: false,
      // Thông báo lỗi chi tiết
      message: err.message
    });
    return;
  }

  // Trường hợp 2: Lỗi do Client gửi định dạng JSON sai cú pháp (SyntaxError do express.json sinh ra)
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    // Trả về mã HTTP 400 Bad Request
    res.status(400).json({
      // Báo hiệu thất bại
      success: false,
      // Thông báo lỗi JSON không hợp lệ
      message: 'Dữ liệu JSON gửi lên không hợp lệ'
    });
    return;
  }

  // Trường hợp 3: Các lỗi không xác định khác (Internal Server Error)
  res.status(500).json({
    // Báo hiệu thất bại
    success: false,
    // Ẩn chi tiết kỹ thuật hệ thống, chỉ trả thông báo chung
    message: 'Lỗi hệ thống'
  });
}
