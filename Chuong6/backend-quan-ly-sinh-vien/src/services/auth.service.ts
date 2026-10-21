// Import thư viện bcrypt để băm mật khẩu một chiều an toàn
import bcrypt from 'bcrypt';

// Import ngoại lệ AppError tùy biến để quản lý mã lỗi HTTP chuẩn hóa (đuôi .js theo chuẩn ESM)
import { AppError } from '../utils/AppError.js';

// Import User model từ thư mục models để thao tác trực tiếp với bảng dbo.Users
import { User } from '../models/user.model.js';

// Import hàm tạo token từ module jwt utility (lưu ý đuôi .js)
import { generateToken } from '../utils/jwt.js';

// Import các kiểu DTO dùng cho dữ liệu đăng ký, đăng nhập và phản hồi
import type {
  IRegisterDTO,
  IUserResponseDTO,
  ILoginDTO,
  ILoginResponseDTO
} from '../dtos/auth.dto.js';

// Định nghĩa số vòng băm mật khẩu (Salt Rounds) theo đúng yêu cầu đề bài là 12
const BCRYPT_SALT_ROUNDS = 12;

// Hàm nghiệp vụ đăng ký tài khoản người dùng mới vào hệ thống
export async function registerUser(dto: IRegisterDTO): Promise<IUserResponseDTO> {
  // Chuẩn hóa địa chỉ email về chữ thường và cắt bỏ khoảng trắng hai đầu để đảm bảo tính nhất quán
  const normalizedEmail = dto.email.trim().toLowerCase();

  // Kiểm tra xem email đã được đăng ký trước đó trong hệ thống hay chưa
  const existingUser = await User.findOne({
    // Điều kiện tìm kiếm theo trường email đã chuẩn hóa
    where: { email: normalizedEmail }
  });

  // Nếu tìm thấy tài khoản đã sử dụng email này
  if (existingUser) {
    // Ném ngoại lệ AppError với mã HTTP 409 (Conflict) theo đúng quy ước hợp đồng API
    throw new AppError(409, 'Email đã tồn tại trong hệ thống');
  }

  // Thực hiện băm mật khẩu bằng thuật toán bcrypt với độ phức tạp (cost factor) là 12
  const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

  // Tạo mới bản ghi người dùng vào bảng dbo.Users trong SQL Server
  const createdUser = await User.create({
    // Lưu họ và tên người dùng đã loại bỏ khoảng trắng thừa
    fullName: dto.fullName.trim(),
    // Lưu địa chỉ email đã được chuẩn hóa
    email: normalizedEmail,
    // Lưu chuỗi băm mật khẩu bảo mật (tuyệt đối không lưu mật khẩu gốc dạng văn bản rõ)
    passwordHash: passwordHash,
    // Mặc định vai trò của người dùng mới tự đăng ký luôn là 'student' (chặn quyền admin)
    role: 'student'
  });

  // Trả về đối tượng DTO công khai (chỉ chứa id, fullName, email, role; tuyệt đối KHÔNG trả password/passwordHash)
  return {
    // Mã định danh duy nhất của người dùng vừa tạo
    id: createdUser.id,
    // Họ và tên người dùng
    fullName: createdUser.fullName,
    // Địa chỉ email người dùng
    email: createdUser.email,
    // Vai trò của người dùng trong hệ thống
    role: createdUser.role
  };
}

// Hàm nghiệp vụ xác thực đăng nhập người dùng và cấp phát Access Token (JWT)
export async function loginUser(dto: ILoginDTO): Promise<ILoginResponseDTO> {
  // Chuẩn hóa địa chỉ email về chữ thường và cắt bỏ khoảng trắng hai đầu
  const normalizedEmail = dto.email.trim().toLowerCase();

  // Truy vấn tìm người dùng trong bảng dbo.Users bằng email đã chuẩn hóa
  const user = await User.findOne({
    // Điều kiện lọc theo cột email
    where: { email: normalizedEmail }
  });

  // Nếu không tìm thấy người dùng với email cung cấp
  if (!user) {
    // Trả về lỗi 401 với thông báo chung (không tiết lộ tài khoản có tồn tại hay không nhằm chống User Enumeration)
    throw new AppError(401, 'Email hoặc mật khẩu không chính xác');
  }

  // So sánh mật khẩu dạng rõ từ client với chuỗi hash bcrypt trong cơ sở dữ liệu
  const isMatch = await bcrypt.compare(dto.password, user.passwordHash);

  // Nếu mật khẩu không khớp với chuỗi băm
  if (!isMatch) {
    // Trả về lỗi 401 với thông báo chung giống hệt trường hợp không tìm thấy email
    throw new AppError(401, 'Email hoặc mật khẩu không chính xác');
  }

  // Gọi hàm generateToken để tạo mã JWT chứa sub (id người dùng) và role (vai trò)
  const accessToken = generateToken({
    // Mã id định danh tài khoản
    id: user.id,
    // Vai trò của tài khoản (student hoặc admin)
    role: user.role
  });

  // Trả về dữ liệu kết quả đăng nhập thành công theo đúng cấu trúc đề bài quy định
  return {
    // Chuỗi JWT Access Token
    accessToken: accessToken,
    // Loại định danh phương thức xác thực
    tokenType: 'Bearer',
    // Thời hạn token hết hạn tính bằng giây (3600 giây = 1 giờ)
    expiresIn: 3600
  };
}

// Hàm nghiệp vụ truy vấn thông tin hồ sơ tài khoản từ cơ sở dữ liệu dựa trên id đã xác thực
export async function getUserProfile(userId: number | string): Promise<IUserResponseDTO> {
  // Tìm kiếm bản ghi người dùng theo khóa chính id trong bảng dbo.Users
  const user = await User.findByPk(userId, {
    // Chỉ chọn lọc các trường an toàn công khai, tuyệt đối KHÔNG lấy passwordHash
    attributes: ['id', 'fullName', 'email', 'role']
  });

  // Nếu không tìm thấy người dùng (ví dụ tài khoản bị xóa sau khi cấp token)
  if (!user) {
    // Ném ngoại lệ AppError với mã lỗi 404 Không tìm thấy
    throw new AppError(404, 'Không tìm thấy thông tin người dùng');
  }

  // Trả về thông tin hồ sơ người dùng hợp lệ
  return {
    // Mã định danh tài khoản
    id: user.id,
    // Họ và tên người dùng
    fullName: user.fullName,
    // Địa chỉ email
    email: user.email,
    // Vai trò tài khoản
    role: user.role
  };
}
