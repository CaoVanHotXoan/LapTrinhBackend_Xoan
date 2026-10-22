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

// Interface định dạng phản hồi chuẩn thống nhất của hệ thống Backend { success, message, data }
export interface IApiResponse<T> {
  // Cờ báo hiệu trạng thái thành công (true/false)
  success: boolean;
  // Thông điệp phản hồi từ máy chủ
  message: string;
  // Dữ liệu thực tế đi kèm (đối với danh sách sinh viên thì T là ISinhVien[])
  data: T;
}
