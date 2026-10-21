// Import các kiểu Request, Response, NextFunction từ framework Express
import type { Request, Response, NextFunction } from 'express';

// Import hàm verifyToken từ module utils/jwt.js để kiểm tra tính hợp lệ của token
import { verifyToken } from '../utils/jwt.js';

// Danh sách các vai trò (roles) hợp lệ được hệ thống chấp nhận
const VALID_ROLES = ['student', 'admin'];

// Middleware xác thực danh tính người dùng qua Bearer JWT Token
export function isAuth(req: Request, res: Response, next: NextFunction): void {
  // 1. Trích xuất giá trị header Authorization từ Request gửi lên
  const authHeader = req.headers.authorization;

  // 2. Kiểm tra nếu không có header Authorization hoặc không bắt đầu bằng tiền tố 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Phản hồi mã HTTP 401 (Unauthorized) nếu thiếu header hoặc sai định dạng Bearer
    res.status(401).json({
      // Báo hiệu trạng thái thất bại
      success: false,
      // Thông báo lỗi rõ ràng cho client
      message: 'Vui lòng cung cấp mã xác thực Bearer Token hợp lệ'
    });
    // Dừng luồng xử lý tại đây (short-circuit), tuyệt đối không gọi next() sau khi đã gửi lỗi
    return;
  }

  // 3. Tách chuỗi để lấy phần token sau chữ 'Bearer ' và cắt bỏ khoảng trắng thừa
  const token = authHeader.substring(7).trim();

  // 4. Kiểm tra nếu chuỗi token bị rỗng sau khi cắt
  if (!token) {
    // Phản hồi mã HTTP 401 nếu token rỗng
    res.status(401).json({
      // Báo hiệu thất bại
      success: false,
      // Thông điệp lỗi
      message: 'Token xác thực không được để rỗng'
    });
    // Dừng luồng xử lý ngay lập tức
    return;
  }

  try {
    // 5. Xác minh chữ ký số, hạn dùng và giải mã payload của token bằng verifyToken
    const payload = verifyToken(token);

    // 6. Kiểm tra tính toàn vẹn của các claims trong payload (sub và role)
    if (!payload.sub || !payload.role || !VALID_ROLES.includes(payload.role)) {
      // Phản hồi mã HTTP 401 nếu claims không hợp lệ hoặc role không được chấp nhận
      res.status(401).json({
        // Báo hiệu thất bại
        success: false,
        // Thông điệp lỗi
        message: 'Thông tin xác thực trong token không hợp lệ'
      });
      // Dừng luồng xử lý
      return;
    }

    // 7. Gán thông tin người dùng đã xác thực an toàn vào req.user (đã được định kiểu trong src/types/express.d.ts)
    req.user = {
      // Mã định danh người dùng
      id: payload.sub,
      // Vai trò phân quyền
      role: payload.role
    };

    // 8. Chuyển quyền xử lý cho Middleware kế tiếp hoặc Controller
    next();
  } catch (error) {
    // Phản hồi mã HTTP 401 khi token bị sửa đổi, sai chữ ký, sai định dạng hoặc hết hạn
    res.status(401).json({
      // Báo hiệu thất bại
      success: false,
      // Thông báo lỗi chung thống nhất (không in secret hay chi tiết nội bộ ra ngoài)
      message: 'Mã xác thực không hợp lệ hoặc đã hết hạn'
    });
    // Dừng luồng xử lý, không gọi next()
    return;
  }
}
