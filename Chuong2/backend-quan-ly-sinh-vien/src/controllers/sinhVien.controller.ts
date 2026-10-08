// Import các kiểu dữ liệu Request, Response, NextFunction từ framework Express
import type { Request, Response, NextFunction } from 'express';

// Import các hàm xử lý nghiệp vụ từ tầng Service (lưu ý đuôi .js)
import {
  layDanhSachSinhVien,
  timSinhVienTheoMa,
  themSinhVien
} from '../services/sinhVien.service.js';

// Controller 1: Xử lý yêu cầu lấy danh sách toàn bộ sinh viên
export function getDanhSachSinhVien(_req: Request, res: Response, next: NextFunction): void {
  try {
    // Gọi Service để lấy toàn bộ danh sách sinh viên
    const danhSach = layDanhSachSinhVien();

    // Trả về mã HTTP 200 (OK) cùng dữ liệu danh sách
    res.status(200).json({
      // Báo hiệu yêu cầu thành công
      success: true,
      // Thông điệp kết quả
      message: 'Lấy danh sách sinh viên thành công',
      // Mảng sinh viên
      data: danhSach
    });
  } catch (error) {
    // Chuyển tiếp lỗi cho errorMiddleware xử lý
    next(error);
  }
}

// Controller 2: Xử lý yêu cầu tìm kiếm thông tin sinh viên theo mã số (maSV)
export function getSinhVienTheoMa(req: Request, res: Response, next: NextFunction): void {
  try {
    // Lấy giá trị tham số maSV từ đường dẫn URL (req.params)
    const { maSV } = req.params;

    // Gọi Service để tìm sinh viên có mã tương ứng
    const sinhVien = timSinhVienTheoMa(String(maSV));

    // Nếu không tìm thấy sinh viên nào trong danh sách
    if (!sinhVien) {
      // Trả về mã HTTP 404 (Not Found)
      res.status(404).json({
        // Đánh dấu yêu cầu thất bại
        success: false,
        // Thông báo không tìm thấy
        message: 'Không tìm thấy sinh viên'
      });
      return;
    }

    // Nếu tìm thấy, trả về mã HTTP 200 (OK) cùng thông tin chi tiết của sinh viên
    res.status(200).json({
      // Báo hiệu thành công
      success: true,
      // Thông điệp kết quả
      message: 'Tìm sinh viên thành công',
      // Dữ liệu đối tượng sinh viên tìm được
      data: sinhVien
    });
  } catch (error) {
    // Chuyển tiếp lỗi cho errorMiddleware
    next(error);
  }
}

// Controller 3: Xử lý yêu cầu thêm mới một sinh viên từ dữ liệu Body
export function taoSinhVien(req: Request, res: Response, next: NextFunction): void {
  try {
    // Truyền dữ liệu body của request vào hàm Service để kiểm tra và thêm mới
    const sinhVienMoi = themSinhVien(req.body);

    // Trả về mã HTTP 201 (Created) khi tạo mới thành công
    res.status(201).json({
      // Báo hiệu thành công
      success: true,
      // Thông điệp tạo mới thành công
      message: 'Thêm sinh viên thành công',
      // Dữ liệu sinh viên mới vừa được tạo
      data: sinhVienMoi
    });
  } catch (error) {
    // Bắt và chuyển tiếp lỗi (ví dụ AppError 400 hoặc 409) cho errorMiddleware xử lý
    next(error);
  }
}
