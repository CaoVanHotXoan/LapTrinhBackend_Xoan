// ==============================================================================
// KHAI BÁO MỞ RỘNG KIỂU DỮ LIỆU TYPESCRIPT CHO FRAMEWORK EXPRESS
// File: src/types/express.d.ts
// Mục đích: Định nghĩa type-safe cho thuộc tính req.user, tránh dùng 'any'
// ==============================================================================

// Interface định nghĩa thông tin người dùng được giải mã từ JWT token
export interface AuthUser {
  // Mã định danh tài khoản người dùng trích xuất từ trường 'sub' của token
  id: string;
  // Vai trò của người dùng trong hệ thống (chỉ nhận 'student' hoặc 'admin')
  role: string;
}

// Khai báo mở rộng phạm vi toàn cục cho Express
declare global {
  // Không gian tên Express
  namespace Express {
    // Mở rộng interface Request có sẵn của Express
    interface Request {
      // Thuộc tính user tùy chọn (được gán sau khi middleware isAuth xác thực thành công)
      user?: AuthUser;
    }
  }
}
