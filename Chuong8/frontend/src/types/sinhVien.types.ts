// ==============================================================================
// ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU SINH VIÊN VÀ API RESPONSE (CHƯƠNG 07 - BƯỚC 7)
// File: frontend/src/types/sinhVien.types.ts
// Mục đích: Cung cấp Type Safety cho dữ liệu sinh viên và cấu trúc phản hồi từ Backend
// ==============================================================================

// Interface đại diện cho thực thể SinhVien nhận từ API GET /api/v1/sinh-vien
export interface ISinhVien {
  // Mã số sinh viên (Khóa chính, ví dụ: SV001)
  maSV: string;
  // Họ và tên đầy đủ của sinh viên
  hoTen: string;
  // Địa chỉ email sinh viên
  email: string;
  // Mã lớp học của sinh viên
  maLop: string;
}

// Interface định nghĩa metadata phân trang trả về từ Backend (Chương 08)
export interface IPaginationMeta {
  // Số thứ tự trang hiện tại
  page: number;
  // Số bản ghi tối đa trên một trang
  limit: number;
  // Tổng số bản ghi thỏa điều kiện lọc trong CSDL
  totalItems: number;
  // Tổng số trang tính được
  totalPages: number;
}

// Interface định dạng phản hồi chuẩn thống nhất của hệ thống Backend { success, message, data, pagination }
export interface IApiResponse<T> {
  // Cờ báo hiệu trạng thái thành công (true/false)
  success: boolean;
  // Thông điệp phản hồi từ máy chủ
  message: string;
  // Dữ liệu thực tế đi kèm (đối với danh sách sinh viên thì T là ISinhVien[])
  data: T;
  // Metadata phân trang đi kèm danh sách (Chương 08)
  pagination?: IPaginationMeta;
}
