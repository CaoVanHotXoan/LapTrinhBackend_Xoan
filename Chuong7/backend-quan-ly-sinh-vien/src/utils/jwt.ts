// Import thư viện jsonwebtoken để tạo chữ ký số và giải mã token
import jwt from 'jsonwebtoken';

// Interface định nghĩa cấu trúc dữ liệu Payload bên trong JWT token
export interface IJwtPayload {
  // sub (Subject): Chứa mã id của người dùng dạng chuỗi theo chuẩn RFC 7519
  sub: string;
  // role: Vai trò của người dùng trong hệ thống (student hoặc admin)
  role: string;
  // iat (Issued At): Thời điểm phát hành token (tính bằng giây)
  iat?: number;
  // exp (Expiration Time): Thời điểm token hết hạn (tính bằng giây)
  exp?: number;
}

// Interface định nghĩa tham số đầu vào khi tạo token
export interface IGenerateTokenInput {
  // Mã id định danh người dùng
  id: number | string;
  // Vai trò của người dùng trong hệ thống
  role: string;
}

// Hàm lấy khóa bí mật JWT_SECRET từ biến môi trường với kiểm tra an toàn
export function getJwtSecret(): string {
  // Đọc giá trị JWT_SECRET từ biến môi trường process.env
  const secret = process.env.JWT_SECRET;
  // Kiểm tra nếu biến môi trường chưa được định nghĩa hoặc bị rỗng
  if (!secret || secret.trim() === '') {
    // Ném lỗi cấu hình hệ thống ngay lập tức để cảnh báo lập trình viên
    throw new Error('Lỗi cấu hình: JWT_SECRET chưa được khai báo hoặc bị rỗng trong file .env');
  }
  // Trả về khóa bí mật hợp lệ
  return secret;
}

// Khai báo overload hàm generateToken khi truyền vào một object { id, role }
export function generateToken(payload: IGenerateTokenInput): string;
// Khai báo overload hàm generateToken khi truyền trực tiếp các đối số (id, role)
export function generateToken(id: number | string, role: string): string;
// Triển khai thực tế của hàm generateToken hỗ trợ linh hoạt cả hai cách gọi
export function generateToken(
  firstArg: IGenerateTokenInput | number | string,
  secondArg?: string
): string {
  // Lấy khóa bí mật an toàn từ biến môi trường
  const secret = getJwtSecret();

  // Khai báo biến lưu id của người dùng
  let userId: string;
  // Khai báo biến lưu role của người dùng
  let userRole: string;

  // Kiểm tra nếu đối số thứ nhất truyền vào là một object
  if (typeof firstArg === 'object' && firstArg !== null) {
    // Trích xuất id từ object và chuyển đổi sang dạng chuỗi
    userId = String(firstArg.id);
    // Trích xuất vai trò role từ object
    userRole = firstArg.role;
  } else {
    // Lấy id từ đối số thứ nhất và chuyển sang dạng chuỗi
    userId = String(firstArg);
    // Lấy vai trò role từ đối số thứ hai (mặc định là 'student' nếu không truyền)
    userRole = secondArg ?? 'student';
  }

  // Gọi hàm jwt.sign để ký số token với các tham số chuẩn
  return jwt.sign(
    // Payload an toàn chứa sub (id) và role (tuyệt đối không đưa mật khẩu/passwordHash vào)
    {
      // Trường sub (Subject) định danh người dùng theo chuẩn RFC 7519
      sub: userId,
      // Vai trò phân quyền của tài khoản
      role: userRole
    },
    // Khóa bí mật dùng để ký token
    secret,
    // Các cấu hình bảo mật bắt buộc
    {
      // Thời hạn sống của token là 1 giờ (1h)
      expiresIn: '1h',
      // Thuật toán ký đối xứng an toàn HMAC SHA-256
      algorithm: 'HS256'
    }
  );
}

// Hàm xác minh tính hợp lệ và giải mã chữ ký JWT
export function verifyToken(token: string): IJwtPayload {
  // Lấy khóa bí mật an toàn từ biến môi trường
  const secret = getJwtSecret();

  // Gọi hàm jwt.verify để kiểm tra tính toàn vẹn, chữ ký và thời hạn
  const decoded = jwt.verify(token, secret, {
    // Chỉ chấp nhận duy nhất thuật toán HS256 để chống các cuộc tấn công thay đổi thuật toán
    algorithms: ['HS256']
  });

  // Ép kiểu dữ liệu an toàn sang interface IJwtPayload đã định nghĩa
  return decoded as IJwtPayload;
}
