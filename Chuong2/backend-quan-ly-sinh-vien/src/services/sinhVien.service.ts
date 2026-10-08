// Import kiểu dữ liệu DTO từ thư mục dtos (lưu ý đuôi .js)
import type { ISinhVienDTO } from '../dtos/sinhVien.dto.js';

// Import class AppError để ném ra các lỗi nghiệp vụ kèm HTTP status code
import { AppError } from '../utils/AppError.js';

// Import interface và instance của Repository từ tầng repositories (lưu ý đuôi .js)
import {
  type ISinhVienRepository,
  sinhVienRepository as defaultRepo
} from '../repositories/sinhVien.repository.js';

// Định nghĩa Service Class hoặc các hàm nghiệp vụ làm việc thông qua Repository
export class SinhVienService {
  // Khai báo repository trừu tượng theo interface ISinhVienRepository
  private repo: ISinhVienRepository;

  // Constructor cho phép Dependency Injection (truyền repository từ ngoài vào, mặc định là defaultRepo)
  constructor(repo: ISinhVienRepository = defaultRepo) {
    this.repo = repo;
  }

  // 1. Nghiệp vụ: Lấy danh sách toàn bộ sinh viên
  public layDanhSachSinhVien(): ISinhVienDTO[] {
    // Ủy thác việc lấy dữ liệu cho tầng Repository
    return this.repo.findAll();
  }

  // 2. Nghiệp vụ: Tìm kiếm sinh viên theo mã số sinh viên
  public timSinhVienTheoMa(maSV: string): ISinhVienDTO | undefined {
    // Ủy thác việc tìm kiếm theo mã cho tầng Repository
    return this.repo.findByMaSV(maSV);
  }

  // 3. Nghiệp vụ: Kiểm tra tính hợp lệ và thêm sinh viên mới
  public themSinhVien(input: unknown): ISinhVienDTO {
    // Bước 1: Kiểm tra dữ liệu đầu vào phải là một đối tượng JSON hợp lệ
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new AppError(400, 'Dữ liệu sinh viên phải là một đối tượng JSON hợp lệ');
    }

    // Ép kiểu tạm thời để truy xuất các trường động
    const data = input as Record<string, unknown>;

    // Bước 2: Kiểm tra đầy đủ 4 trường bắt buộc kiểu chuỗi
    if (
      typeof data.maSV !== 'string' ||
      typeof data.hoTen !== 'string' ||
      typeof data.email !== 'string' ||
      typeof data.maLop !== 'string'
    ) {
      throw new AppError(400, 'Các trường maSV, hoTen, email, maLop đều là chuỗi bắt buộc');
    }

    // Loại bỏ khoảng trắng thừa ở hai đầu chuỗi
    const maSV = data.maSV.trim();
    const hoTen = data.hoTen.trim();
    const email = data.email.trim();
    const maLop = data.maLop.trim();

    // Bước 3: Kiểm tra định dạng mã sinh viên: SV kèm 3 chữ số
    const maSVRegex = /^SV[0-9]{3}$/;
    if (!maSVRegex.test(maSV)) {
      throw new AppError(400, 'Mã sinh viên phải có định dạng SV kèm 3 chữ số (ví dụ: SV003)');
    }

    // Bước 4: Kiểm tra họ tên và mã lớp không được là chuỗi rỗng
    if (hoTen.length === 0 || maLop.length === 0) {
      throw new AppError(400, 'Họ tên và mã lớp không được để trống');
    }

    // Bước 5: Kiểm tra định dạng cơ bản của email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError(400, 'Địa chỉ email không đúng định dạng');
    }

    // Bước 6: Kiểm tra trùng mã sinh viên bằng cách gọi qua Repository
    const svTonTai = this.repo.findByMaSV(maSV);
    if (svTonTai) {
      throw new AppError(409, 'Mã sinh viên đã tồn tại');
    }

    // Bước 7: Tạo DTO chuẩn chỉ gồm 4 trường cần thiết
    const sinhVienMoi: ISinhVienDTO = {
      maSV,
      hoTen,
      email,
      maLop
    };

    // Gọi Repository để lưu sinh viên mới vào nơi lưu trữ
    return this.repo.create(sinhVienMoi);
  }
}

// Khởi tạo một instance mặc định của Service
export const sinhVienService = new SinhVienService();

// Giữ lại các hàm export trực tiếp để đảm bảo tính tương thích 100% với Controller hiện tại
export function layDanhSachSinhVien(): ISinhVienDTO[] {
  return sinhVienService.layDanhSachSinhVien();
}

export function timSinhVienTheoMa(maSV: string): ISinhVienDTO | undefined {
  return sinhVienService.timSinhVienTheoMa(maSV);
}

export function themSinhVien(input: unknown): ISinhVienDTO {
  return sinhVienService.themSinhVien(input);
}
