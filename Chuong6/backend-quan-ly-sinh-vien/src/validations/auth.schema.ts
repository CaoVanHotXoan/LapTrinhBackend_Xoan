// Import thư viện 'z' từ package 'zod' để định nghĩa và xác thực schema dữ liệu
import { z } from 'zod';

// Định nghĩa schema kiểm thực dữ liệu cho API đăng ký tài khoản (POST /api/auth/register)
export const registerSchema = z
  // z.object: Định nghĩa đối tượng chứa các thuộc tính đầu vào cần kiểm tra
  .object({
    // fullName: Bắt buộc là chuỗi ký tự
    fullName: z
      // Kiểu chuỗi ký tự
      .string()
      // Tự động cắt bỏ các khoảng trắng thừa ở hai đầu họ tên
      .trim()
      // Độ dài tối thiểu 1 ký tự, không được để rỗng
      .min(1, 'Họ tên không được để rỗng')
      // Độ dài tối đa 150 ký tự theo đúng kích thước cột NVARCHAR(150) trong CSDL
      .max(150, 'Họ tên không được vượt quá 150 ký tự'),

    // email: Bắt buộc là chuỗi ký tự email hợp lệ
    email: z
      // Kiểu chuỗi ký tự
      .string()
      // Tự động cắt bỏ khoảng trắng hai đầu chuỗi email
      .trim()
      // Kiểm tra đúng định dạng email tiêu chuẩn RFC kèm thông điệp báo lỗi
      .email('Email không đúng định dạng')
      // Độ dài tối đa 254 ký tự theo chuẩn NVARCHAR(254) trong CSDL
      .max(254, 'Email không được vượt quá 254 ký tự'),

    // password: Mật khẩu của tài khoản người dùng
    password: z
      // Kiểu chuỗi ký tự
      .string()
      // Độ dài tối thiểu 6 ký tự để đảm bảo độ an toàn mật khẩu
      .min(6, 'Mật khẩu phải có độ dài tối thiểu 6 ký tự')
      // Độ dài tối đa 100 ký tự để tránh các cuộc tấn công DoS tính toán hash
      .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
  })
  // .strict(): Từ chối mọi trường lạ ngoài schema (ví dụ: client cố tình truyền role sẽ bị chặn trả về 400)
  .strict();

// Xuất kiểu dữ liệu TypeScript suy diễn tự động từ registerSchema để sử dụng ở tầng Service và Controller
export type RegisterInput = z.infer<typeof registerSchema>;

// Định nghĩa schema kiểm thực dữ liệu cho API đăng nhập (POST /api/auth/login)
export const loginSchema = z
  // z.object: Định nghĩa đối tượng chứa các trường thông tin đăng nhập
  .object({
    // email: Bắt buộc là chuỗi ký tự theo đúng định dạng email
    email: z
      // Kiểu chuỗi ký tự
      .string()
      // Tự động cắt bỏ khoảng trắng hai đầu
      .trim()
      // Kiểm tra định dạng email hợp lệ
      .email('Email không đúng định dạng')
      // Giới hạn độ dài tối đa 254 ký tự
      .max(254, 'Email không được vượt quá 254 ký tự'),

    // password: Mật khẩu người dùng nhập vào
    password: z
      // Kiểu chuỗi ký tự
      .string()
      // Yêu cầu mật khẩu không được để rỗng
      .min(1, 'Mật khẩu không được để rỗng')
      // Giới hạn độ dài tối đa 100 ký tự
      .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
  })
  // .strict(): Từ chối các trường lạ ngoài email và password
  .strict();

// Xuất kiểu dữ liệu TypeScript suy diễn tự động từ loginSchema
export type LoginInput = z.infer<typeof loginSchema>;
