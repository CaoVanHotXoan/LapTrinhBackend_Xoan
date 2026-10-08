// Import các kiểu dữ liệu Request, Response, NextFunction từ framework Express
import type { Request, Response, NextFunction } from 'express';

// Import các hàm xử lý nghiệp vụ bất đồng bộ từ tầng Service (lưu ý đuôi .js)
import {
  layDanhSachSinhVien,
  timSinhVienTheoMa,
  themSinhVien
} from '../services/sinhVien.service.js';

// Controller 1: Xử lý yêu cầu lấy danh sách toàn bộ sinh viên
export async function getDanhSachSinhVien(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Chờ Service lấy danh sách từ SQL Server
    const danhSach = await layDanhSachSinhVien();

    // Trả về mã HTTP 200 (OK) cùng dữ liệu danh sách
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách sinh viên thành công',
      data: danhSach
    });
  } catch (error) {
    // Chuyển tiếp lỗi cho errorMiddleware xử lý
    next(error);
  }
}

// Controller 2: Xử lý yêu cầu tìm kiếm thông tin sinh viên theo mã số (maSV)
export async function getSinhVienTheoMa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Lấy giá trị tham số maSV từ đường dẫn URL (req.params)
    const { maSV } = req.params;

    // Chờ Service tìm kiếm sinh viên theo mã
    const sinhVien = await timSinhVienTheoMa(String(maSV));

    // Nếu không tìm thấy sinh viên nào trong CSDL
    if (!sinhVien) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
      return;
    }

    // Nếu tìm thấy, trả về mã HTTP 200 (OK) cùng thông tin sinh viên
    res.status(200).json({
      success: true,
      message: 'Tìm sinh viên thành công',
      data: sinhVien
    });
  } catch (error) {
    // Chuyển tiếp lỗi cho errorMiddleware
    next(error);
  }
}

// Controller 3: Xử lý yêu cầu thêm mới một sinh viên từ dữ liệu Body
export async function taoSinhVien(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Chờ Service kiểm tra và thêm sinh viên vào CSDL
    const sinhVienMoi = await themSinhVien(req.body);

    // Trả về mã HTTP 201 (Created) khi tạo mới thành công
    res.status(201).json({
      success: true,
      message: 'Thêm sinh viên thành công',
      data: sinhVienMoi
    });
  } catch (error) {
    // Bắt và chuyển tiếp lỗi (AppError hoặc lỗi hệ thống) cho errorMiddleware
    next(error);
  }
}
