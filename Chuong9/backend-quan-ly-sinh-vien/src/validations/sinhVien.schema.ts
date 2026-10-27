// Import thư viện 'z' từ package 'zod' để định nghĩa và xác thực schema dữ liệu
import { z } from 'zod';

// Tập hợp các trường thông tin sinh viên được phép chỉnh sửa dùng chung cho cả Create (POST) và Update (PUT)
const editableFields = {
  // hoTen: Bắt buộc là chuỗi ký tự (z.string())
  // .trim(): Tự động loại bỏ các khoảng trắng thừa ở hai đầu chuỗi
  // .min(1, ...): Độ dài tối thiểu 1 ký tự, không cho phép chuỗi rỗng kèm thông báo lỗi
  hoTen: z.string().trim().min(1, 'Họ tên không được rỗng'),

  // email: Bắt buộc là chuỗi ký tự (z.string())
  // .trim(): Cắt bỏ khoảng trắng hai đầu chuỗi email
  // .email(...): Kiểm tra đúng định dạng email tiêu chuẩn kèm thông báo lỗi tương ứng
  email: z.string().trim().email('Email không hợp lệ'),

  // maLop: Bắt buộc là chuỗi ký tự (z.string())
  // .trim(): Cắt bỏ khoảng trắng hai đầu chuỗi mã lớp
  // .min(1, ...): Độ dài tối thiểu 1 ký tự, không cho phép để trống mã lớp kèm thông báo lỗi
  maLop: z.string().trim().min(1, 'Mã lớp không được rỗng'),
};

// Schema kiểm thực dữ liệu cho API tạo mới sinh viên (POST /api/v1/sinh-vien)
export const createSinhVienSchema = z
  // z.object: Định nghĩa đối tượng chứa các thuộc tính cần kiểm tra
  .object({
    // maSV: Bắt buộc là chuỗi ký tự
    // .trim(): Loại bỏ khoảng trắng ở hai đầu mã sinh viên
    // .min(1, ...): Mã sinh viên không được rỗng kèm thông báo lỗi
    maSV: z.string().trim().min(1, 'Mã SV không được rỗng'),
    // Kế thừa lại các trường được phép nhập liệu từ editableFields (hoTen, email, maLop)
    ...editableFields,
  })
  // .strict(): Chặn mọi thuộc tính không được khai báo trong schema (chống gửi trường lạ)
  .strict();

// Schema kiểm thực dữ liệu cho API cập nhật sinh viên (PUT /api/v1/sinh-vien/:maSV)
export const updateSinhVienSchema = z
  // z.object: Định nghĩa đối tượng cho body cập nhật
  .object({
    // Chỉ gồm các trường có thể sửa đổi: hoTen, email, maLop (không cho phép sửa maSV trong body)
    ...editableFields,
  })
  // .strict(): Từ chối request nếu body chứa thuộc tính ngoài danh sách được phép
  .strict();

// Xuất kiểu dữ liệu TypeScript suy diễn tự động từ createSinhVienSchema
export type CreateSinhVienInput = z.infer<typeof createSinhVienSchema>;

// Xuất kiểu dữ liệu TypeScript suy diễn tự động từ updateSinhVienSchema
export type UpdateSinhVienInput = z.infer<typeof updateSinhVienSchema>;
