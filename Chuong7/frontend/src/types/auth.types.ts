// ==============================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU XÁC THỰC VÀ HỒ SƠ NGƯỜI DÙNG (CHƯƠNG 07 - BƯỚC 8)
// File: frontend/src/types/auth.types.ts
// Mục đích: Type safety cho chức năng Đăng nhập và Hồ sơ cá nhân phía Frontend
// ==============================================================================

// Interface dữ liệu thông tin gửi lên để đăng nhập
export interface ILoginCredentials {
  // Địa chỉ email tài khoản
  email: string;
  // Mật khẩu dạng rõ do người dùng nhập vào ô input
  password: string;
}

// Interface dữ liệu trả về trong data khi POST /api/auth/login thành công
export interface ILoginResultData {
  // Chuỗi Access Token JSON Web Token (JWT)
  accessToken: string;
  // Loại mã xác thực (luôn là 'Bearer')
  tokenType: string;
  // Thời gian sống của token tính bằng giây (3600)
  expiresIn: number;
}

// Interface thông tin hồ sơ cá nhân trả về từ GET /api/auth/profile
export interface IUserProfile {
  // Định danh duy nhất của tài khoản
  id: number;
  // Họ và tên đầy đủ
  fullName: string;
  // Địa chỉ email đã đăng ký
  email: string;
  // Vai trò của người dùng ('student' hoặc 'admin')
  role: 'student' | 'admin' | string;
  // Đường dẫn ảnh đại diện tương đối /uploads/... (hoặc null nếu chưa có)
  avatarUrl: string | null;
}
