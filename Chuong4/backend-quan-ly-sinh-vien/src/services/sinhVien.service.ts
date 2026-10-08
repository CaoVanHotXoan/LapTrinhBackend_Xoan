// Import kiểu dữ liệu DTO từ thư mục dtos (lưu ý đuôi .js)
import type { ISinhVienDTO } from '../dtos/sinhVien.dto.js';

// Import class AppError để ném ra các lỗi nghiệp vụ kèm HTTP status code
import { AppError } from '../utils/AppError.js';

// Import UniqueConstraintError từ Sequelize để bắt lỗi trùng khóa chính khi tạo đồng thời
import { UniqueConstraintError } from 'sequelize';

// Import interface và instance của Repository từ tầng repositories (lưu ý đuôi .js)
import {
  type ISinhVienRepository,
  sinhVienRepository as defaultRepo
} from '../repositories/sinhVien.repository.js';

// Định nghĩa Service Class xử lý nghiệp vụ
export class SinhVienService {
  private repo: ISinhVienRepository;

  // Constructor cho phép Dependency Injection
  constructor(repo: ISinhVienRepository = defaultRepo) {
    this.repo = repo;
  }

  // 1. Nghiệp vụ: Lấy danh sách toàn bộ sinh viên (bất đồng bộ)
  public async layDanhSachSinhVien(): Promise<ISinhVienDTO[]> {
    return await this.repo.findAll();
  }

  // 2. Nghiệp vụ: Tìm kiếm sinh viên theo mã số sinh viên (bất đồng bộ)
  public async timSinhVienTheoMa(maSV: string): Promise<ISinhVienDTO | undefined> {
    return await this.repo.findByMaSV(maSV);
  }

  // 3. Nghiệp vụ: Kiểm tra tính hợp lệ và thêm sinh viên mới (bất đồng bộ)
  public async themSinhVien(input: unknown): Promise<ISinhVienDTO> {
    // Bước 1: Kiểm tra dữ liệu đầu vào phải là một đối tượng JSON hợp lệ
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new AppError(400, 'Dữ liệu sinh viên phải là một đối tượng JSON hợp lệ');
    }

    // Ép kiểu tạm thời an toàn
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

    // Bước 3: Kiểm tra định dạng mã sinh viên: SV kèm đúng 3 chữ số
    const maSVRegex = /^SV[0-9]{3}$/;
    if (!maSVRegex.test(maSV)) {
      throw new AppError(400, 'Mã sinh viên phải có định dạng SV kèm 3 chữ số (ví dụ: SV003)');
    }

    // Bước 4: Kiểm tra họ tên và mã lớp không được để rỗng
    if (hoTen.length === 0 || maLop.length === 0) {
      throw new AppError(400, 'Họ tên và mã lớp không được để trống');
    }

    // Bước 5: Kiểm tra định dạng cơ bản của email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError(400, 'Địa chỉ email không đúng định dạng');
    }

    // Bước 6: Kiểm tra giới hạn độ dài theo kích thước cột trong cơ sở dữ liệu
    if (hoTen.length > 150) {
      throw new AppError(400, 'Họ tên không được vượt quá 150 ký tự');
    }
    if (email.length > 254) {
      throw new AppError(400, 'Email không được vượt quá 254 ký tự');
    }
    if (maLop.length > 50) {
      throw new AppError(400, 'Mã lớp không được vượt quá 50 ký tự');
    }

    // Bước 7: Kiểm tra trùng mã sinh viên trước khi ghi
    const svTonTai = await this.repo.findByMaSV(maSV);
    if (svTonTai) {
      throw new AppError(409, 'Mã sinh viên đã tồn tại');
    }

    // Bước 8: Tạo DTO chuẩn chỉ gồm 4 trường cần thiết
    const sinhVienMoi: ISinhVienDTO = {
      maSV,
      hoTen,
      email,
      maLop
    };

    // Bước 9: Gọi Repository để lưu vào SQL Server (có bắt lỗi UniqueConstraintError)
    try {
      return await this.repo.create(sinhVienMoi);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new AppError(409, 'Mã sinh viên đã tồn tại');
      }
      throw error;
    }
  }
}

// Khởi tạo một instance mặc định của Service
export const sinhVienService = new SinhVienService();

// Giữ lại các hàm export trực tiếp để đảm bảo tính tương thích với Controller
export async function layDanhSachSinhVien(): Promise<ISinhVienDTO[]> {
  return await sinhVienService.layDanhSachSinhVien();
}

export async function timSinhVienTheoMa(maSV: string): Promise<ISinhVienDTO | undefined> {
  return await sinhVienService.timSinhVienTheoMa(maSV);
}

export async function themSinhVien(input: unknown): Promise<ISinhVienDTO> {
  return await sinhVienService.themSinhVien(input);
}
