// ==============================================================================
// SCHEMA KIỂM THỰC QUERY STRING CHO API SINH VIÊN (CHƯƠNG 08 - BƯỚC 2)
// File: src/validations/sinhVien.query.ts
// Mục đích: Xác thực và chuẩn hóa chặt chẽ các tham số page, limit, search trước khi truy vấn SQL Server
// ==============================================================================

// 1. Import thư viện 'z' từ package 'zod' để định nghĩa schema và ép kiểu dữ liệu an toàn
import { z } from 'zod';

// 2. Biểu thức chính quy (Regex) kiểm tra số nguyên dương:
//    - ^: Bắt đầu chuỗi
//    - [1-9]: Chữ số đầu tiên bắt buộc phải từ 1 đến 9 (không cho phép số 0 ở đầu hoặc số 0 đơn lẻ)
//    - \d*: Các chữ số tiếp theo từ 0 đến 9 (nếu có)
//    - $: Kết thúc chuỗi
//    => Chặn hoàn toàn: số âm (-1), số thập phân (1.5), số 0, chuỗi chữ cái ('abc', '2abc'), khoảng trắng rỗng (' ')
const positiveIntRegex = /^[1-9]\d*$/;

// 3. Định nghĩa schema kiểm thực query string cho danh sách sinh viên
export const sinhVienQuerySchema = z.object({
  // --- THAM SỐ 1: page (Số thứ tự trang) ---
  // Yêu cầu: Số nguyên >= 1, mặc định là 1; không hợp lệ báo lỗi 400
  page: z
    // z.preprocess: Tiền xử lý dữ liệu thô nhận được từ req.query trước khi qua Zod validate
    .preprocess((val) => {
      // Nếu client không truyền hoặc truyền chuỗi rỗng thì lấy mặc định là '1'
      if (val === undefined || val === null || val === '') {
        return '1';
      }
      // Nếu truyền kiểu chuỗi, loại bỏ khoảng trắng hai đầu
      return typeof val === 'string' ? val.trim() : String(val);
    }, z.string())
    // refine 1: Kiểm tra chuỗi phải khớp định dạng số nguyên dương >= 1
    .refine((val) => positiveIntRegex.test(val), {
      message: 'Tham số page phải là số nguyên dương lớn hơn hoặc bằng 1'
    })
    // transform: Chuyển đổi an toàn từ chuỗi hợp lệ sang kiểu number (cơ số 10)
    .transform((val) => parseInt(val, 10)),

  // --- THAM SỐ 2: limit (Số bản ghi tối đa trên một trang) ---
  // Yêu cầu: Số nguyên từ 1 đến 50, mặc định là 10; vượt giới hạn báo lỗi 400
  limit: z
    // Tiền xử lý dữ liệu thô
    .preprocess((val) => {
      // Nếu không truyền hoặc truyền chuỗi rỗng thì lấy mặc định là '10'
      if (val === undefined || val === null || val === '') {
        return '10';
      }
      return typeof val === 'string' ? val.trim() : String(val);
    }, z.string())
    // refine 1: Kiểm tra phải là số nguyên dương (không cho chữ, không cho số âm/thập phân)
    .refine((val) => positiveIntRegex.test(val), {
      message: 'Tham số limit phải là số nguyên dương'
    })
    // transform: Ép kiểu chuỗi sang số nguyên
    .transform((val) => parseInt(val, 10))
    // refine 2: Giới hạn nghiêm ngặt trong khoảng từ 1 đến 50 theo quy định bài lab
    .refine((num) => num >= 1 && num <= 50, {
      message: 'Tham số limit phải nằm trong khoảng từ 1 đến 50'
    }),

  // --- THAM SỐ 3: search (Từ khóa tìm kiếm theo họ tên) ---
  // Yêu cầu: Chuỗi tùy chọn, tự động trim, tối đa 80 ký tự; vượt quá báo lỗi 400
  search: z
    .preprocess((val) => {
      // Nếu không truyền hoặc giá trị null thì coi như chuỗi rỗng
      if (val === undefined || val === null) {
        return '';
      }
      // Loại bỏ khoảng trắng hai đầu (ví dụ '%20Anh%20' giải mã thành '  Anh  ' sẽ được trim thành 'Anh')
      return typeof val === 'string' ? val.trim() : String(val).trim();
    }, z.string().max(80, 'Từ khóa tìm kiếm không được vượt quá 80 ký tự'))
});

// 4. Suy diễn kiểu dữ liệu TypeScript từ Schema (tự động nhận kiểu { page: number; limit: number; search: string })
export type SinhVienQueryInput = z.infer<typeof sinhVienQuerySchema>;
