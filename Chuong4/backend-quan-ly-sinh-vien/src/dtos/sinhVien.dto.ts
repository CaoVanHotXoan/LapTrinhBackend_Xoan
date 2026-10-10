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

// Định nghĩa interface ISinhVienUpdateDTO cho dữ liệu body khi thực hiện PUT cập nhật (không chứa maSV vì maSV lấy từ URL)
export interface ISinhVienUpdateDTO {
  // Họ và tên cập nhật mới của sinh viên
  hoTen: string;

  // Địa chỉ email cập nhật mới của sinh viên
  email: string;

  // Mã lớp cập nhật mới của sinh viên
  maLop: string;
}

