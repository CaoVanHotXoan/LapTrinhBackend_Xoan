// ==============================================================================
// MIDDLEWARE XỬ LÝ LỖI TẬP TRUNG TOÀN ỨNG DỤNG (CHƯƠNG 08 - LAB 2 - BƯỚC 8)
// File: src/middlewares/error.middleware.ts
// Mục đích: Chuẩn hóa toàn bộ cấu trúc phản hồi lỗi (success, status, message, data),
// bảo vệ bí mật hệ thống ở HTTP 500, hỗ trợ stack trace an toàn trong development
// ==============================================================================

// 1. Import các kiểu Request, Response, NextFunction từ Express
import type { Request, Response, NextFunction } from 'express';

// 2. Import thư viện Multer để nhận diện lỗi upload file (MulterError)
import multer from 'multer';

// 3. Import lỗi UniqueConstraintError từ Sequelize để bắt lỗi trùng khóa chính (maSV)
import { UniqueConstraintError } from 'sequelize';

// 4. Import class AppError định nghĩa lỗi nghiệp vụ tùy chỉnh (lưu ý đuôi .js)
import { AppError } from '../utils/AppError.js';

// 5. Middleware xử lý lỗi tập trung toàn hệ thống (bắt buộc đủ 4 tham số để Express nhận diện)
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // BƯỚC 1: Kiểm tra an toàn: Nếu header phản hồi đã được gửi đi rồi, chuyển tiếp cho handler mặc định của Express
  // nhằm tránh lỗi kinh điển "Cannot set headers after they are sent to the client"
  if (res.headersSent) {
    return next(err);
  }

  // BƯỚC 2: Ghi log chi tiết lỗi ra console server phục vụ việc gỡ lỗi của lập trình viên
  console.error('🚨 [SERVER ERROR LOG]:', err);

  // BƯỚC 3: Xác định môi trường hiện tại (mặc định là development nếu chưa cấu hình NODE_ENV)
  const isDev = (process.env.NODE_ENV ?? 'development') === 'development';

  // ----------------------------------------------------------------------------
  // TRƯỜNG HỢP 1: Lỗi nghiệp vụ có chủ đích (AppError) được ném ra từ Service / Controller
  // ----------------------------------------------------------------------------
  if (err instanceof AppError) {
    // Trả về đúng mã HTTP statusCode định nghĩa trong AppError (400, 404, 409,...)
    res.status(err.statusCode).json({
      // Trạng thái thất bại
      success: false,
      // Mã trạng thái HTTP chuẩn hóa theo yêu cầu Chương 08
      status: err.statusCode,
      // Thông điệp lỗi nghiệp vụ an toàn gửi tới client
      message: err.message,
      // Dữ liệu data trả về null theo đúng hợp đồng thống nhất
      data: null,
      // Chỉ bổ sung stack trace khi đang chạy ở môi trường development cục bộ
      ...(isDev && err.stack ? { stack: err.stack } : {})
    });
    return;
  }

  // ----------------------------------------------------------------------------
  // TRƯỜNG HỢP 2: Lỗi phát sinh từ thư viện Multer khi upload ảnh đại diện (Chương 07)
  // ----------------------------------------------------------------------------
  if (err instanceof multer.MulterError) {
    // 2.1: Kích thước file vượt quá giới hạn 2MB quy định
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        status: 413,
        message: 'Kích thước tập tin vượt quá giới hạn cho phép (tối đa 2MB)',
        data: null
      });
      return;
    }

    // 2.2: Sai tên trường dữ liệu file tải lên (yêu cầu field 'avatar')
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        status: 400,
        message: 'Trường tập tin tải lên không hợp lệ, yêu cầu trường "avatar"',
        data: null
      });
      return;
    }

    // 2.3: Các lỗi Multer khác trả về HTTP 400
    res.status(400).json({
      success: false,
      status: 400,
      message: `Lỗi tải lên tập tin: ${err.message}`,
      data: null
    });
    return;
  }

  // ----------------------------------------------------------------------------
  // TRƯỜNG HỢP 3: Lỗi cú pháp JSON do Client gửi body hỏng (express.json() sinh ra)
  // ----------------------------------------------------------------------------
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    res.status(400).json({
      success: false,
      status: 400,
      message: 'Dữ liệu JSON gửi lên không hợp lệ',
      data: null
    });
    return;
  }

  // ----------------------------------------------------------------------------
  // TRƯỜNG HỢP 4: Lỗi trùng khóa chính từ Database Sequelize (trùng maSV)
  // ----------------------------------------------------------------------------
  if (err instanceof UniqueConstraintError) {
    res.status(409).json({
      success: false,
      status: 409,
      message: 'Mã sinh viên đã tồn tại trong hệ thống',
      data: null
    });
    return;
  }

  // ----------------------------------------------------------------------------
  // TRƯỜNG HỢP 5: LỖI HỆ THỐNG KHÔNG XÁC ĐỊNH (HTTP 500 INTERNAL SERVER ERROR)
  // ----------------------------------------------------------------------------
  // Quy định bảo mật tuyệt đối của Chương 08:
  // - Luôn dùng HTTP 500 và thông báo công khai: "Lỗi hệ thống, vui lòng thử lại sau"
  // - Tuyệt đối KHÔNG trả câu lệnh SQL, tên bảng, chuỗi kết nối hay thông tin nhạy cảm
  // - Tuyệt đối KHÔNG gửi stack trace ở môi trường Production
  res.status(500).json({
    // Trạng thái thất bại
    success: false,
    // Mã trạng thái HTTP 500
    status: 500,
    // Thông báo lỗi thân thiện, bảo mật cho người dùng cuối
    message: 'Lỗi hệ thống, vui lòng thử lại sau',
    // Dữ liệu data trả về null
    data: null,
    // Chỉ kèm stack trace khi đang chạy ở môi trường development phục vụ debug cục bộ
    ...(isDev && err instanceof Error ? { stack: err.stack } : {})
  });
}
