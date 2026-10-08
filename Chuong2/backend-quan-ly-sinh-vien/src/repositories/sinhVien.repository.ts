// Import kiểu ISinhVienDTO từ thư mục dtos (lưu ý dùng đuôi .js để khớp với chuẩn ESM/NodeNext)
import type { ISinhVienDTO } from '../dtos/sinhVien.dto.js';

// 1. Interface ISinhVienRepository: Đóng vai trò là "hợp đồng trừu tượng" quy định các phương thức truy xuất dữ liệu
export interface ISinhVienRepository {
  // Lấy toàn bộ danh sách sinh viên
  findAll(): ISinhVienDTO[];

  // Tìm một sinh viên theo mã số sinh viên (trả về sinh viên hoặc undefined nếu không tìm thấy)
  findByMaSV(maSV: string): ISinhVienDTO | undefined;

  // Lưu một sinh viên mới vào nơi lưu trữ dữ liệu
  create(sinhVien: ISinhVienDTO): ISinhVienDTO;
}

// 2. Class MemorySinhVienRepository: Triển khai cụ thể của interface lưu trữ dữ liệu trong bộ nhớ RAM
export class MemorySinhVienRepository implements ISinhVienRepository {
  // Mảng nội bộ dùng để lưu trữ danh sách sinh viên mẫu trong RAM
  private sinhVienList: ISinhVienDTO[] = [
    {
      // Mã số sinh viên thứ nhất
      maSV: 'SV001',
      // Họ và tên của sinh viên thứ nhất
      hoTen: 'Minh Nhật',
      // Địa chỉ email của sinh viên thứ nhất
      email: 'minhnhat@example.com',
      // Mã lớp của sinh viên thứ nhất
      maLop: '25CT114'
    },
    {
      // Mã số sinh viên thứ hai
      maSV: 'SV002',
      // Họ và tên của sinh viên thứ hai
      hoTen: 'Lan Anh',
      // Địa chỉ email của sinh viên thứ hai
      email: 'lananh@example.com',
      // Mã lớp của sinh viên thứ hai
      maLop: '25CT114'
    }
  ];

  // Triển khai phương thức lấy toàn bộ danh sách sinh viên
  public findAll(): ISinhVienDTO[] {
    // Trả về bản sao của mảng sinh viên để tránh việc bên ngoài chỉnh sửa trực tiếp mảng nội bộ
    return [...this.sinhVienList];
  }

  // Triển khai phương thức tìm kiếm sinh viên theo mã
  public findByMaSV(maSV: string): ISinhVienDTO | undefined {
    // Tìm phần tử trong mảng có mã maSV trùng khớp
    return this.sinhVienList.find((sv) => sv.maSV === maSV);
  }

  // Triển khai phương thức thêm sinh viên mới
  public create(sinhVien: ISinhVienDTO): ISinhVienDTO {
    // Đẩy sinh viên mới vào cuối mảng danh sách
    this.sinhVienList.push(sinhVien);
    // Trả về đối tượng sinh viên vừa được lưu
    return sinhVien;
  }
}

// Export một instance mặc định duy nhất (Singleton) để tái sử dụng xuyên suốt ứng dụng
export const sinhVienRepository = new MemorySinhVienRepository();
