// Interface quy định dữ liệu đầu vào khi thực hiện đăng ký tài khoản mới
export interface IRegisterDTO {
  // Họ và tên của người dùng đăng ký
  fullName: string;
  // Địa chỉ email của tài khoản
  email: string;
  // Mật khẩu dạng rõ gửi lên từ client (sẽ được băm trước khi lưu vào CSDL)
  password: string;
}

// Interface đại diện cho dữ liệu người dùng công khai trả về cho client sau khi đăng ký thành công
export interface IUserResponseDTO {
  // Định danh duy nhất của tài khoản
  id: number;
  // Họ và tên người dùng
  fullName: string;
  // Địa chỉ email của tài khoản
  email: string;
  // Vai trò của tài khoản trong hệ thống (mặc định là 'student')
  role: string;
}

// Interface đại diện cho dữ liệu đầu vào khi người dùng gửi yêu cầu đăng nhập
export interface ILoginDTO {
  // Địa chỉ email của tài khoản đăng nhập
  email: string;
  // Mật khẩu dạng rõ do client gửi lên để đối chiếu
  password: string;
}

// Interface đại diện cho cấu trúc dữ liệu phản hồi khi đăng nhập thành công
export interface ILoginResponseDTO {
  // Chuỗi Access Token dạng JSON Web Token (JWT) được cấp
  accessToken: string;
  // Loại token xác thực (luôn là 'Bearer')
  tokenType: string;
  // Thời gian sống của token tính bằng giây (3600 tương ứng 1 giờ)
  expiresIn: number;
}
