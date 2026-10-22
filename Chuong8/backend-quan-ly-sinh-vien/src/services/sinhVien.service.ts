// Import kiểu dữ liệu DTO từ thư mục dtos (lưu ý đuôi .js)
import type { ISinhVienDTO } from '../dtos/sinhVien.dto.js';

// Định nghĩa interface chứa thông tin phân trang (pagination metadata) chuẩn Chương 08
export interface IPaginationMeta {
  // Số trang hiện tại
  page: number;
  // Số bản ghi tối đa trên một trang
  limit: number;
  // Tổng số bản ghi thỏa điều kiện lọc trong CSDL
  totalItems: number;
  // Tổng số trang tính được
  totalPages: number;
}

// Định nghĩa interface kết quả trả về của API danh sách sinh viên gồm mảng data và object pagination
export interface IPaginatedSinhVienResult {
  data: ISinhVienDTO[];
  pagination: IPaginationMeta;
}

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

  // 1. Nghiệp vụ: Lấy danh sách sinh viên có phân trang thật tại SQL Server và tìm kiếm theo họ tên (Chương 08 - Bước 3)
  public async layDanhSachSinhVien(query?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<IPaginatedSinhVienResult> {
    // 1. Chuẩn hóa các tham số với giá trị mặc định an toàn:
    //    - page: mặc định là 1 nếu không truyền
    //    - limit: mặc định là 10 nếu không truyền
    //    - search: mặc định là chuỗi rỗng ''
    const page = query?.page && query.page >= 1 ? Number(query.page) : 1;
    const limit = query?.limit && query.limit >= 1 ? Number(query.limit) : 10;
    const search = typeof query?.search === 'string' ? query.search.trim() : '';

    // 2. Gọi Repository thực thi findAndCountAll trên SQL Server (bỏ qua offset dòng và chỉ đọc limit dòng)
    const { rows, count } = await this.repo.findAndCountAll({
      page,
      limit,
      search
    });

    // 3. Tính toán tổng số trang (totalPages) theo quy ước Chương 08:
    //    - Nếu không có bản ghi nào (count === 0): totalPages = 0 (trả về data=[])
    //    - Nếu có bản ghi (count > 0): totalPages = Math.ceil(count / limit)
    const totalPages = count === 0 ? 0 : Math.ceil(count / limit);

    // 4. Trả về đối tượng chuẩn gồm mảng dữ liệu data và object pagination ở cấp cao nhất
    return {
      data: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages
      }
    };
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

  // 4. Nghiệp vụ: Cập nhật thông tin sinh viên theo mã số maSV (bất đồng bộ)
  public async capNhatSinhVien(maSVParam: string, input: unknown): Promise<ISinhVienDTO> {
    // Bước 1: Kiểm tra tham số maSV từ URL có hợp lệ không
    if (!maSVParam || typeof maSVParam !== 'string') {
      throw new AppError(400, 'Mã sinh viên trên URL không hợp lệ');
    }
    const maSV = maSVParam.trim();
    if (maSV.length === 0) {
      throw new AppError(400, 'Mã sinh viên không được để trống');
    }

    // Bước 2: Kiểm tra dữ liệu Body gửi lên phải là một đối tượng JSON
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new AppError(400, 'Dữ liệu cập nhật phải là một đối tượng JSON hợp lệ');
    }

    const data = input as Record<string, unknown>;

    // Bước 3: Kiểm tra không được truyền các trường ngoài hợp đồng (chỉ cho phép hoTen, email, maLop)
    const allowedFields = ['hoTen', 'email', 'maLop'];
    const extraFields = Object.keys(data).filter((key) => !allowedFields.includes(key));
    if (extraFields.length > 0) {
      throw new AppError(400, `Không cho phép trường ngoài hợp đồng: ${extraFields.join(', ')}`);
    }

    // Bước 4: Kiểm tra bắt buộc phải đủ cả 3 trường chuỗi (hoTen, email, maLop)
    if (
      typeof data.hoTen !== 'string' ||
      typeof data.email !== 'string' ||
      typeof data.maLop !== 'string'
    ) {
      throw new AppError(400, 'Dữ liệu cập nhật phải có đủ 3 trường kiểu chuỗi: hoTen, email, maLop');
    }

    // Chuẩn hóa loại bỏ khoảng trắng ở hai đầu
    const hoTen = data.hoTen.trim();
    const email = data.email.trim();
    const maLop = data.maLop.trim();

    // Bước 5: Kiểm tra dữ liệu không được để chuỗi rỗng sau khi trim
    if (hoTen.length === 0 || maLop.length === 0) {
      throw new AppError(400, 'Họ tên và mã lớp không được để trống');
    }

    // Bước 6: Kiểm tra định dạng cơ bản của email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError(400, 'Địa chỉ email không đúng định dạng');
    }

    // Bước 7: Kiểm tra giới hạn độ dài ký tự theo cấu trúc bảng DB
    if (hoTen.length > 150) {
      throw new AppError(400, 'Họ tên không được vượt quá 150 ký tự');
    }
    if (email.length > 254) {
      throw new AppError(400, 'Email không được vượt quá 254 ký tự');
    }
    if (maLop.length > 50) {
      throw new AppError(400, 'Mã lớp không được vượt quá 50 ký tự');
    }

    // Bước 8: Kiểm tra xem sinh viên có tồn tại trong CSDL hay không (trả về 404 nếu không tìm thấy)
    const svTonTai = await this.repo.findByMaSV(maSV);
    if (!svTonTai) {
      throw new AppError(404, 'Không tìm thấy sinh viên');
    }

    // Bước 9: Gọi Repository để cập nhật dữ liệu vào SQL Server
    const ketQua = await this.repo.update(maSV, { hoTen, email, maLop });
    if (!ketQua) {
      throw new AppError(404, 'Không tìm thấy sinh viên để cập nhật');
    }

    return ketQua;
  }

  // 5. Nghiệp vụ: Xóa sinh viên theo mã số maSV (bất đồng bộ)
  public async xoaSinhVien(maSVParam: string): Promise<void> {
    // Bước 1: Kiểm tra tham số maSV từ URL có hợp lệ không
    if (!maSVParam || typeof maSVParam !== 'string') {
      throw new AppError(400, 'Mã sinh viên trên URL không hợp lệ');
    }
    const maSV = maSVParam.trim();
    if (maSV.length === 0) {
      throw new AppError(400, 'Mã sinh viên không được để trống');
    }

    // Bước 2: Kiểm tra sự tồn tại của sinh viên trong CSDL trước khi thực hiện xóa
    const svTonTai = await this.repo.findByMaSV(maSV);
    if (!svTonTai) {
      // Nếu không tìm thấy mã sinh viên này trong DB -> Trả về mã lỗi HTTP 404
      throw new AppError(404, 'Không tìm thấy sinh viên');
    }

    // Bước 3: Gọi Repository để thực hiện xóa bản ghi khỏi SQL Server
    const daXoa = await this.repo.delete(maSV);
    if (!daXoa) {
      // Trường hợp xóa không thành công hoặc bản ghi đã bị xóa bởi tiến trình khác
      throw new AppError(404, 'Không tìm thấy sinh viên');
    }
  }
}

// Khởi tạo một instance mặc định của Service
export const sinhVienService = new SinhVienService();

// Giữ lại các hàm export trực tiếp để đảm bảo tính tương thích với Controller
export async function layDanhSachSinhVien(query?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<IPaginatedSinhVienResult> {
  return await sinhVienService.layDanhSachSinhVien(query);
}

export async function timSinhVienTheoMa(maSV: string): Promise<ISinhVienDTO | undefined> {
  return await sinhVienService.timSinhVienTheoMa(maSV);
}

export async function themSinhVien(input: unknown): Promise<ISinhVienDTO> {
  return await sinhVienService.themSinhVien(input);
}

export async function capNhatSinhVien(maSV: string, input: unknown): Promise<ISinhVienDTO> {
  return await sinhVienService.capNhatSinhVien(maSV, input);
}

export async function xoaSinhVien(maSV: string): Promise<void> {
  return await sinhVienService.xoaSinhVien(maSV);
}
