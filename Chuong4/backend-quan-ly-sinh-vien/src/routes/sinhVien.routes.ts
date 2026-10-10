// Import hàm Router từ framework Express
import { Router } from 'express';

// Import các controller xử lý tương ứng từ tầng Controller (lưu ý đuôi .js)
import {
  getDanhSachSinhVien,
  getSinhVienTheoMa,
  taoSinhVien,
  capNhatSinhVien,
  xoaSinhVien
} from '../controllers/sinhVien.controller.js';

// Khởi tạo router riêng biệt cho các API liên quan đến SinhVien
const router = Router();

// 1. Định nghĩa route GET /api/v1/sinh-vien để lấy toàn bộ danh sách sinh viên
router.get('/', getDanhSachSinhVien);

// 2. Định nghĩa route GET /api/v1/sinh-vien/:maSV để lấy thông tin chi tiết một sinh viên theo mã số
router.get('/:maSV', getSinhVienTheoMa);

// 3. Định nghĩa route POST /api/v1/sinh-vien để thêm mới một sinh viên
router.post('/', taoSinhVien);

// 4. Định nghĩa route PUT /api/v1/sinh-vien/:maSV để cập nhật thông tin sinh viên hiện có
router.put('/:maSV', capNhatSinhVien);

// 5. Định nghĩa route DELETE /api/v1/sinh-vien/:maSV để xóa một sinh viên khỏi hệ thống
router.delete('/:maSV', xoaSinhVien);

// Export router làm mặc định để server.ts có thể nạp vào hệ thống
export default router;
