// Import kiểu ISinhVienDTO từ thư mục dtos (lưu ý dùng đuôi .js để khớp với chuẩn ESM/NodeNext)
import type { ISinhVienDTO } from '../dtos/sinhVien.dto.js';

// Import Model SinhVien từ thư mục models (lưu ý đuôi .js)
import { SinhVien } from '../models/SinhVien.js';

// 1. Interface ISinhVienRepository: Quy định các phương thức truy xuất dữ liệu bất đồng bộ (async)
export interface ISinhVienRepository {
  // Lấy toàn bộ danh sách sinh viên sắp xếp theo maSV tăng dần
  findAll(): Promise<ISinhVienDTO[]>;

  // Tìm một sinh viên theo mã số sinh viên (trả về DTO hoặc undefined nếu không tìm thấy)
  findByMaSV(maSV: string): Promise<ISinhVienDTO | undefined>;

  // Lưu một sinh viên mới vào cơ sở dữ liệu
  create(sinhVien: ISinhVienDTO): Promise<ISinhVienDTO>;
}

// 2. Class SequelizeSinhVienRepository: Triển khai interface tương tác trực tiếp với SQL Server qua Sequelize
export class SequelizeSinhVienRepository implements ISinhVienRepository {
  // Lấy danh sách tất cả sinh viên từ bảng dbo.SinhVien
  public async findAll(): Promise<ISinhVienDTO[]> {
    const records = await SinhVien.findAll({
      order: [['maSV', 'ASC']]
    });

    // Chuyển đổi Model instance thành plain DTO chỉ chứa 4 trường
    return records.map((record) => ({
      maSV: record.maSV,
      hoTen: record.hoTen,
      email: record.email,
      maLop: record.maLop
    }));
  }

  // Tìm kiếm sinh viên theo Primary Key (maSV)
  public async findByMaSV(maSV: string): Promise<ISinhVienDTO | undefined> {
    const record = await SinhVien.findByPk(maSV);
    if (!record) {
      return undefined;
    }

    // Chuyển đổi Model instance thành plain DTO
    return {
      maSV: record.maSV,
      hoTen: record.hoTen,
      email: record.email,
      maLop: record.maLop
    };
  }

  // Tạo mới một bản ghi sinh viên trong SQL Server
  public async create(sinhVien: ISinhVienDTO): Promise<ISinhVienDTO> {
    const created = await SinhVien.create({
      maSV: sinhVien.maSV,
      hoTen: sinhVien.hoTen,
      email: sinhVien.email,
      maLop: sinhVien.maLop
    });

    return {
      maSV: created.maSV,
      hoTen: created.hoTen,
      email: created.email,
      maLop: created.maLop
    };
  }
}

// Export một instance mặc định duy nhất (Singleton)
export const sinhVienRepository = new SequelizeSinhVienRepository();
