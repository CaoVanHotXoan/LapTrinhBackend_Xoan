// ==============================================================================
// MIDDLEWARE XỬ LÝ LỖI TẬP TRUNG TOÀN ỨNG DỤNG (CHƯƠNG 07 - BƯỚC 2)
// File: src/middlewares/error.middleware.ts
// Mục đích: Bắt các ngoại lệ AppError, SyntaxError, MulterError và trả mã HTTP chuẩn
// ==============================================================================

// Import các kiểu Request, Response, NextFunction từ Express
import type { Request, Response, NextFunction } from 'express';

// Import thư viện Multer để kiểm tra lỗi sinh ra bởi Multer (MulterError)
import multer from 'multer';

// Import class AppError để kiểm tra và xử lý các lỗi nghiệp vụ tùy biến (lưu ý đuôi .js)
import { AppError } from '../utils/AppError.js';

// Middleware xử lý lỗi tập trung cho toàn bộ ứng dụng (bắt buộc phải có đủ 4 tham số)
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // In chi tiết lỗi ra console server để lập trình viên theo dõi và gỡ lỗi
  console.error('[ERROR]', err);

  // Trường hợp 1: Lỗi nghiệp vụ dự kiến (AppError) được ném ra từ tầng Service/Controller/Middleware
  if (err instanceof AppError) {
    // Trả về đúng mã HTTP statusCode và thông điệp lỗi của AppError
    res.status(err.statusCode).json({
      // Báo hiệu kết quả thất bại
      success: false,
      // Thông báo lỗi nghiệp vụ chi tiết
      message: err.message
    });
    return;
  }

  // Trường hợp 2: Lỗi do Multer ném ra khi xử lý file upload (kích thước quá lớn, sai trường,...)
  if (err instanceof multer.MulterError) {
    // Nếu lỗi do kích thước file vượt quá limits.fileSize (2MB)
    if (err.code === 'LIMIT_FILE_SIZE') {
      // Trả về đúng mã HTTP 413 Payload Too Large theo quy ước lab
      res.status(413).json({
        // Báo hiệu kết quả thất bại
        success: false,
        // Thông báo lỗi kích thước vượt quá giới hạn
        message: 'Kích thước tập tin vượt quá giới hạn cho phép (tối đa 2MB)'
      });
      return;
    }

    // Nếu lỗi do gửi sai tên trường file (không phải 'avatar') hoặc vượt quá số lượng file
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      // Trả về mã HTTP 400 Bad Request
      res.status(400).json({
        // Báo hiệu kết quả thất bại
        success: false,
        // Thông báo lỗi trường tải lên không hợp lệ
        message: 'Trường tập tin tải lên không hợp lệ, yêu cầu trường "avatar"'
      });
      return;
    }

    // Đối với các mã lỗi Multer khác, trả về HTTP 400 Bad Request
    res.status(400).json({
      // Báo hiệu kết quả thất bại
      success: false,
      // Thông báo lỗi chi tiết từ Multer
      message: `Lỗi tải lên tập tin: ${err.message}`
    });
    return;
  }

  // Trường hợp 3: Lỗi do Client gửi định dạng JSON sai cú pháp (SyntaxError do express.json sinh ra)
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    // Trả về mã HTTP 400 Bad Request
    res.status(400).json({
      // Báo hiệu kết quả thất bại
      success: false,
      // Thông báo lỗi JSON không hợp lệ
      message: 'Dữ liệu JSON gửi lên không hợp lệ'
    });
    return;
  }

  // Trường hợp 4: Các lỗi không xác định khác (Internal Server Error)
  res.status(500).json({
    // Báo hiệu kết quả thất bại
    success: false,
    // Ẩn chi tiết kỹ thuật hệ thống, chỉ trả thông báo chung
    message: 'Lỗi hệ thống'
  });
}
