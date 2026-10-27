// ==============================================================================
// CONTROLLER QUẢN LÝ SINH VIÊN (CHƯƠNG 08 - LAB 2 - BƯỚC 9)
// File: src/controllers/sinhVien.controller.ts
// Mục đích: Tận dụng cơ chế xử lý lỗi bất đồng bộ gốc của Express 5 (Async Error Flow).
// Loại bỏ try/catch lặp máy móc, ném lỗi nghiệp vụ qua AppError, đảm bảo tách bạch 3 tầng.
// ==============================================================================

// 1. Import các kiểu dữ liệu Request, Response từ Express (không cần NextFunction nếu không tự gọi next)
import type { Request, Response } from 'express';

// 2. Import class AppError để ném ra các lỗi nghiệp vụ chuẩn hóa (lưu ý đuôi .js)
import { AppError } from '../utils/AppError.js';

// 3. Import các hàm xử lý nghiệp vụ bất đồng bộ từ tầng Service (lưu ý đuôi .js)
import {
  layDanhSachSinhVien,
  timSinhVienTheoMa,
  themSinhVien,
  capNhatSinhVien as serviceCapNhatSinhVien,
  xoaSinhVien as serviceXoaSinhVien
} from '../services/sinhVien.service.js';

// Controller 1: Lấy danh sách sinh viên có phân trang và tìm kiếm (GET /api/v1/sinh-vien)
// Express 5 tự động bắt lỗi từ Promise bị reject nếu tầng Service gặp lỗi
export async function getDanhSachSinhVien(req: Request, res: Response): Promise<void> {
  // 1. Lấy các tham số query đã được middleware validateQuery xác thực và ép kiểu
  const { page, limit, search } = req.query as unknown as {
    page?: number;
    limit?: number;
    search?: string;
  };

  // 2. Gọi tầng Service thực hiện truy vấn phân trang thật findAndCountAll từ SQL Server
  const result = await layDanhSachSinhVien({ page, limit, search });

  // 3. Phản hồi HTTP 200 kèm mảng sinh viên (data) và metadata phân trang (pagination) ở cấp cao nhất
  res.status(200).json({
    success: true,
    message: 'Lấy danh sách sinh viên thành công',
    data: result.data,
    pagination: result.pagination
  });
}

// Controller 2: Tìm kiếm thông tin sinh viên theo mã số (GET /api/v1/sinh-vien/:maSV)
export async function getSinhVienTheoMa(req: Request, res: Response): Promise<void> {
  // 1. Lấy mã sinh viên từ param URL
  const { maSV } = req.params;

  // 2. Gọi Service tìm kiếm sinh viên trong CSDL
  const sinhVien = await timSinhVienTheoMa(String(maSV));

  // 3. Nếu không tìm thấy bản ghi, ném lỗi AppError với mã HTTP 404
  // Express 5 sẽ tự động chuyển lỗi này tới errorMiddleware để trả về JSON chuẩn
  if (!sinhVien) {
    throw new AppError(404, 'Không tìm thấy sinh viên');
  }

  // 4. Nếu tìm thấy, trả về HTTP 200 kèm thông tin sinh viên
  res.status(200).json({
    success: true,
    message: 'Tìm sinh viên thành công',
    data: sinhVien
  });
}

// Controller 3: Thêm mới một sinh viên từ Body (POST /api/v1/sinh-vien)
export async function taoSinhVien(req: Request, res: Response): Promise<void> {
  // 1. Chờ Service kiểm tra tính hợp lệ và thêm sinh viên vào CSDL
  // Nếu dữ liệu sai hoặc trùng mã, Service sẽ ném AppError và Express 5 tự chuyển đến errorMiddleware
  const sinhVienMoi = await themSinhVien(req.body);

  // 2. Trả về mã HTTP 201 Created khi tạo mới thành công
  res.status(201).json({
    success: true,
    message: 'Thêm sinh viên thành công',
    data: sinhVienMoi
  });
}

// Controller 4: Cập nhật thông tin sinh viên (PUT /api/v1/sinh-vien/:maSV)
export async function capNhatSinhVien(req: Request, res: Response): Promise<void> {
  // 1. Lấy mã sinh viên từ param URL
  const { maSV } = req.params;

  // 2. Gọi Service thực hiện cập nhật bản ghi
  const sinhVienCapNhat = await serviceCapNhatSinhVien(String(maSV), req.body);

  // 3. Trả về mã HTTP 200 kèm dữ liệu sau khi cập nhật thành công
  res.status(200).json({
    success: true,
    message: 'Cập nhật sinh viên thành công',
    data: sinhVienCapNhat
  });
}

// Controller 5: Xóa sinh viên theo mã số (DELETE /api/v1/sinh-vien/:maSV)
export async function xoaSinhVien(req: Request, res: Response): Promise<void> {
  // 1. Lấy mã sinh viên từ param URL
  const { maSV } = req.params;

  // 2. Gọi Service thực hiện xóa bản ghi khỏi SQL Server
  await serviceXoaSinhVien(String(maSV));

  // 3. Trả về HTTP 200 với thông báo thành công
  res.status(200).json({
    success: true,
    message: 'Xóa sinh viên thành công'
  });
}
