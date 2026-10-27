// ==============================================================================
// BỘ ĐỊNH TUYẾN ROUTER XÁC THỰC VÀ TÀI KHOẢN (CHƯƠNG 09 - LAB 2)
// File: src/routes/auth.routes.ts
// Mục đích: Định tuyến các API xác thực tài khoản và tải lên ảnh đại diện cá nhân
// ==============================================================================

// 1. Import hàm Router từ framework Express để khởi tạo bộ định tuyến độc lập
import { Router } from 'express';

// 2. Import các controller xử lý đăng ký, đăng nhập, lấy hồ sơ và upload avatar
import { register, login, getProfile, uploadAvatar } from '../controllers/auth.controller.js';

// 3. Import middleware kiểm thực dữ liệu Zod dùng chung của hệ thống
import { validate } from '../middlewares/validate.middleware.js';

// 4. Import middleware xác thực JWT Bearer Token (lưu ý đuôi .js cho ESM)
import { isAuth } from '../middlewares/isAuth.js';

// 5. Import middleware upload avatar bằng Multer đã kiểm tra chữ ký an toàn
import { avatarUploadMiddleware } from '../middlewares/upload.middleware.js';

// 6. Import middleware rate limit giới hạn tần suất đăng nhập (Chương 09 - Lab 2)
import { loginLimiter } from '../middlewares/rate-limit.middleware.js';

// 7. Import các schema định nghĩa cấu trúc dữ liệu hợp lệ từ tầng Validations
import { registerSchema, loginSchema } from '../validations/auth.schema.js';

// 8. Khởi tạo instance router mới chuyên trách các API xác thực (Authentication)
const router = Router();

// 9. Route POST /register: Dữ liệu qua validate(registerSchema) rồi mới đến controller register
router.post('/register', validate(registerSchema), register);

// 10. Route POST /login (Lab 2): Thứ tự bảo vệ: loginLimiter (429) -> validate(loginSchema) (400) -> controller login (200/401)
router.post('/login', loginLimiter, validate(loginSchema), login);

// 11. Route GET /profile: Yêu cầu xác thực qua middleware isAuth trước khi vào controller getProfile
router.get('/profile', isAuth, getProfile);

// 12. Route POST /me/avatar: Thứ tự bảo mật isAuth chạy trước, rồi Multer bóc tách file, sau đó đến Controller
router.post('/me/avatar', isAuth, avatarUploadMiddleware, uploadAvatar);

// 13. Xuất bộ định tuyến auth router làm mặc định để nạp vào app.ts
export default router;
