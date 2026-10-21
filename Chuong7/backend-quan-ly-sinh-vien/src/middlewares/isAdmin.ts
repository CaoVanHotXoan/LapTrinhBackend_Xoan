// Import các kiểu Request, Response, NextFunction từ framework Express
import type { Request, Response, NextFunction } from 'express';

// Middleware phân quyền kiểm tra vai trò quản trị viên (Admin Authorization)
export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  // 1. Kiểm tra an toàn: Đảm bảo req.user đã tồn tại (đã được middleware isAuth chạy trước xác thực)
  if (!req.user) {
    // Phản hồi mã HTTP 401 nếu thiếu thông tin xác thực, tránh lỗi truy cập thuộc tính của undefined (gây lỗi 500)
    res.status(401).json({
      // Báo hiệu trạng thái thất bại
      success: false,
      // Thông báo yêu cầu đăng nhập xác thực trước khi kiểm tra quyền
      message: 'Yêu cầu đăng nhập xác thực trước khi kiểm tra quyền truy cập'
    });
    // Dừng luồng xử lý ngay lập tức (short-circuit)
    return;
  }

  // 2. Kiểm tra vai trò của người dùng: Chỉ chấp nhận duy nhất vai trò 'admin'
  // Tuyệt đối không lấy role từ req.body hay req.query để chống giả mạo quyền
  if (req.user.role !== 'admin') {
    // Phản hồi mã HTTP 403 (Forbidden) vì đã xác thực danh tính nhưng không đủ thẩm quyền quản trị
    res.status(403).json({
      // Báo hiệu trạng thái thất bại
      success: false,
      // Thông điệp từ chối truy cập rõ ràng
      message: 'Từ chối truy cập: Yêu cầu vai trò quản trị viên (Admin)'
    });
    // Dừng luồng xử lý, tuyệt đối không gọi next() và không đổi mã 403 thành 401
    return;
  }

  // 3. Nếu người dùng sở hữu vai trò 'admin' hợp lệ, cho phép chuyển tiếp sang controller xử lý nghiệp vụ
  next();
}
