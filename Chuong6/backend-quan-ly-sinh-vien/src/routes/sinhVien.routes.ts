// ==============================================================================
// BỘ ĐỊNH TUYẾN QUẢN LÝ SINH VIÊN VỚI BẢO VỆ PHÂN QUYỀN RBAC (JWT + ISADMIN)
// File: src/routes/sinhVien.routes.ts
// Mục đích: Bảo vệ các thao tác ghi (POST/PUT/DELETE) chỉ cho phép Admin, giữ GET public
// ==============================================================================

// Import hàm Router từ framework Express
import { Router } from 'express';

// Import các controller xử lý nghiệp vụ sinh viên từ tầng Controller (lưu ý đuôi .js)
import {
  getDanhSachSinhVien,
  getSinhVienTheoMa,
  taoSinhVien,
  capNhatSinhVien,
  xoaSinhVien
} from '../controllers/sinhVien.controller.js';

// Import middleware xác thực danh tính Bearer Token (isAuth)
import { isAuth } from '../middlewares/isAuth.js';

// Import middleware phân quyền vai trò quản trị viên (isAdmin)
import { isAdmin } from '../middlewares/isAdmin.js';

// Import middleware kiểm thực dữ liệu Zod dùng chung (validate)
import { validate } from '../middlewares/validate.middleware.js';

// Import các Schema Zod định nghĩa cấu trúc dữ liệu cho hành động tạo mới và cập nhật
import {
  createSinhVienSchema,
  updateSinhVienSchema
} from '../validations/sinhVien.schema.js';

// Khởi tạo router riêng biệt cho các API liên quan đến SinhVien
const router = Router();

// 1. Route GET /: Lấy toàn bộ danh sách sinh viên - Giữ PUBLIC cho mọi người dùng
router.get('/', getDanhSachSinhVien);

// 2. Route GET /:maSV: Lấy chi tiết thông tin sinh viên theo mã số - Giữ PUBLIC
router.get('/:maSV', getSinhVienTheoMa);

// 3. Route POST /: Thêm mới sinh viên - Chuỗi kiểm soát: isAuth -> isAdmin -> validate -> controller
router.post(
  // Đường dẫn gốc của resource sinh viên
  '/',
  // Lớp 1: Xác thực danh tính người gọi bằng JWT Bearer Token
  isAuth,
  // Lớp 2: Kiểm tra vai trò bắt buộc phải là 'admin' (chặn 403 đối với student)
  isAdmin,
  // Lớp 3: Kiểm tra tính hợp lệ của dữ liệu body bằng Zod Schema
  validate(createSinhVienSchema),
  // Lớp 4: Thực thi controller thêm mới sinh viên khi đã vượt qua toàn bộ middleware
  taoSinhVien
);

// 4. Route PUT /:maSV: Cập nhật thông tin sinh viên - Chuỗi kiểm soát: isAuth -> isAdmin -> validate -> controller
router.put(
  // Đường dẫn kèm tham số mã sinh viên trên URL
  '/:maSV',
  // Lớp 1: Xác thực danh tính người gọi bằng JWT Bearer Token
  isAuth,
  // Lớp 2: Kiểm tra vai trò bắt buộc phải là 'admin' (chặn 403 đối với student)
  isAdmin,
  // Lớp 3: Kiểm tra tính hợp lệ của dữ liệu cập nhật bằng Zod Schema
  validate(updateSinhVienSchema),
  // Lớp 4: Thực thi controller cập nhật sinh viên
  capNhatSinhVien
);

// 5. Route DELETE /:maSV: Xóa sinh viên - Chuỗi kiểm soát: isAuth -> isAdmin -> controller
router.delete(
  // Đường dẫn kèm tham số mã sinh viên cần xóa
  '/:maSV',
  // Lớp 1: Xác thực danh tính người gọi bằng JWT Bearer Token
  isAuth,
  // Lớp 2: Kiểm tra vai trò bắt buộc phải là 'admin' (chặn 403 đối với student)
  isAdmin,
  // Lớp 3: Thực thi controller xóa sinh viên
  xoaSinhVien
);

// Xuất router làm mặc định để server.ts có thể nạp vào hệ thống
export default router;
