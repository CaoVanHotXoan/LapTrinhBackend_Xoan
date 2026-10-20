// Import hàm Router từ framework Express
import { Router } from 'express';

// Import các controller xử lý tương ứng từ tầng Controller (lưu ý đuôi .js theo chuẩn ESM)
import {
  getDanhSachSinhVien,
  getSinhVienTheoMa,
  taoSinhVien,
  capNhatSinhVien,
  xoaSinhVien
} from '../controllers/sinhVien.controller.js';

// Import middleware kiểm thực dữ liệu dùng chung (validate) từ tầng middlewares
import { validate } from '../middlewares/validate.middleware.js';

// Import các Schema Zod định nghĩa cấu trúc dữ liệu cho hành động tạo mới và cập nhật
import {
  createSinhVienSchema,
  updateSinhVienSchema
} from '../validations/sinhVien.schema.js';

// Khởi tạo router riêng biệt cho các API liên quan đến SinhVien
const router = Router();

// 1. Định nghĩa route GET /api/v1/sinh-vien để lấy toàn bộ danh sách sinh viên (giữ nguyên không qua validate)
router.get('/', getDanhSachSinhVien);

// 2. Định nghĩa route GET /api/v1/sinh-vien/:maSV để lấy thông tin chi tiết một sinh viên theo mã số (giữ nguyên)
router.get('/:maSV', getSinhVienTheoMa);

// 3. Định nghĩa route POST /api/v1/sinh-vien: Dữ liệu body phải vượt qua createSinhVienSchema trước khi vào taoSinhVien
router.post('/', validate(createSinhVienSchema), taoSinhVien);

// 4. Định nghĩa route PUT /api/v1/sinh-vien/:maSV: Dữ liệu body phải vượt qua updateSinhVienSchema trước khi vào capNhatSinhVien
router.put('/:maSV', validate(updateSinhVienSchema), capNhatSinhVien);

// 5. Định nghĩa route DELETE /api/v1/sinh-vien/:maSV để xóa một sinh viên khỏi hệ thống (giữ nguyên)
router.delete('/:maSV', xoaSinhVien);

// Export router làm mặc định để server.ts có thể nạp vào hệ thống
export default router;

