// Import kiểu ISinhVienDTO từ thư mục dtos (lưu ý dùng đuôi .js để khớp với chuẩn ESM/NodeNext)
import type { ISinhVienDTO } from '../dtos/sinhVien.dto.js';

// Import Model SinhVien từ thư mục models (lưu ý đuôi .js)
import { SinhVien } from '../models/SinhVien.js';

// Import Op và WhereOptions từ Sequelize để phục vụ tìm kiếm LIKE và phân trang tại SQL Server
import { Op, type WhereOptions } from 'sequelize';

// 1. Interface ISinhVienRepository: Quy định các phương thức truy xuất dữ liệu bất đồng bộ (async)
export interface ISinhVienRepository {
  // Lấy toàn bộ danh sách sinh viên sắp xếp theo maSV tăng dần
  findAll(): Promise<ISinhVienDTO[]>;

  // Phân trang và tìm kiếm sinh viên trực tiếp tại SQL Server bằng findAndCountAll (Chương 08 - Bước 3)
  findAndCountAll(options: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{ rows: ISinhVienDTO[]; count: number }>;

  // Tìm một sinh viên theo mã số sinh viên (trả về DTO hoặc undefined nếu không tìm thấy)
  findByMaSV(maSV: string): Promise<ISinhVienDTO | undefined>;

  // Lưu một sinh viên mới vào cơ sở dữ liệu
  create(sinhVien: ISinhVienDTO): Promise<ISinhVienDTO>;

  // Cập nhật thông tin sinh viên theo maSV (trả về DTO sau khi cập nhật hoặc undefined nếu không tìm thấy)
  update(maSV: string, updateData: { hoTen: string; email: string; maLop: string }): Promise<ISinhVienDTO | undefined>;

  // Xóa một sinh viên khỏi cơ sở dữ liệu theo mã số maSV (trả về true nếu xóa thành công, false nếu không tìm thấy)
  delete(maSV: string): Promise<boolean>;
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

  // Triển khai findAndCountAll trực tiếp trên SQL Server với limit, offset và where
  public async findAndCountAll(options: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{ rows: ISinhVienDTO[]; count: number }> {
    // 1. Trích xuất các tham số phân trang và tìm kiếm
    const { page, limit, search } = options;

    // 2. Tính toán offset: số lượng bản ghi cần bỏ qua trên SQL Server
    const offset = (page - 1) * limit;

    // 3. Khởi tạo mệnh đề điều kiện WHERE cho Sequelize
    const whereClause: WhereOptions = {};

    // Nếu người dùng có truyền từ khóa search (khác rỗng)
    if (search && search.trim() !== '') {
      // Áp dụng toán tử LIKE tìm kiếm theo cột họ và tên (hoTen)
      whereClause.hoTen = {
        [Op.like]: `%${search.trim()}%`
      };
    }

    // 4. Thực thi truy vấn findAndCountAll tại SQL Server:
    //    - WHERE: Áp dụng điều kiện lọc trước khi đếm và phân trang
    //    - limit: Giới hạn số lượng bản ghi trả về cho một trang
    //    - offset: Số bản ghi bỏ qua
    //    - order: Luôn sắp xếp cố định theo mã sinh viên tăng dần (maSV ASC)
    const { rows, count } = await SinhVien.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['maSV', 'ASC']]
    });

    // 5. Chuyển đổi Model instance thành mảng DTO sạch (chỉ gồm 4 trường theo hợp đồng)
    const dtos: ISinhVienDTO[] = rows.map((record) => ({
      maSV: record.maSV,
      hoTen: record.hoTen,
      email: record.email,
      maLop: record.maLop
    }));

    // 6. Trả về cả mảng sinh viên của trang (rows) và tổng số bản ghi phù hợp (count)
    return {
      rows: dtos,
      count
    };
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

  // Cập nhật thông tin sinh viên theo maSV trong SQL Server
  public async update(
    maSV: string,
    updateData: { hoTen: string; email: string; maLop: string }
  ): Promise<ISinhVienDTO | undefined> {
    // 1. Tìm bản ghi sinh viên theo mã Primary Key
    const record = await SinhVien.findByPk(maSV);
    if (!record) {
      return undefined;
    }

    // 2. Thực hiện cập nhật các trường mới vào cơ sở dữ liệu
    await record.update({
      hoTen: updateData.hoTen,
      email: updateData.email,
      maLop: updateData.maLop
    });

    // 3. Trả về DTO mới nhất sau khi cập nhật thành công
    return {
      maSV: record.maSV,
      hoTen: record.hoTen,
      email: record.email,
      maLop: record.maLop
    };
  }

  // Xóa bản ghi sinh viên khỏi cơ sở dữ liệu SQL Server theo maSV
  public async delete(maSV: string): Promise<boolean> {
    // 1. Tìm bản ghi sinh viên theo khóa chính maSV
    const record = await SinhVien.findByPk(maSV);
    if (!record) {
      // Không tìm thấy bản ghi để xóa
      return false;
    }

    // 2. Thực hiện xóa bản ghi khỏi CSDL
    await record.destroy();
    return true;
  }
}

// Export một instance mặc định duy nhất (Singleton)
export const sinhVienRepository = new SequelizeSinhVienRepository();
