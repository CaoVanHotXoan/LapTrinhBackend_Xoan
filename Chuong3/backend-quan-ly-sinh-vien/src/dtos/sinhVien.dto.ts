// Định nghĩa interface ISinhVienDTO (Data Transfer Object) để quy định cấu trúc dữ liệu chuẩn của một sinh viên
export interface ISinhVienDTO {
  // Mã số sinh viên (ví dụ: "SV001"), bắt buộc phải là kiểu chuỗi ký tự (string)
  maSV: string;

  // Họ và tên đầy đủ của sinh viên (ví dụ: "Minh Nhật"), bắt buộc là kiểu chuỗi (string)
  hoTen: string;

  // Địa chỉ email liên lạc của sinh viên (ví dụ: "minhnhat@example.com"), kiểu chuỗi (string)
  email: string;

  // Mã lớp học mà sinh viên đang theo học (ví dụ: "25CT114"), kiểu chuỗi (string)
  maLop: string;
}
