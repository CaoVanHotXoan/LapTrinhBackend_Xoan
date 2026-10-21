// Import hàm Router từ framework Express để khởi tạo bộ định tuyến độc lập
import { Router } from 'express';

// Import controller xử lý đăng ký, đăng nhập và hồ sơ từ tầng Controller (lưu ý đuôi .js theo chuẩn ESM)
import { register, login, getProfile } from '../controllers/auth.controller.js';

// Import middleware kiểm thực dữ liệu Zod dùng chung của hệ thống
import { validate } from '../middlewares/validate.middleware.js';

// Import middleware xác thực JWT Bearer Token (lưu ý đuôi .js)
import { isAuth } from '../middlewares/isAuth.js';

// Import các schema định nghĩa cấu trúc dữ liệu hợp lệ từ tầng Validations
import { registerSchema, loginSchema } from '../validations/auth.schema.js';

// Khởi tạo instance router mới chuyên trách các API xác thực (Authentication)
const router = Router();

// 1. Định nghĩa route POST /register: Yêu cầu dữ liệu body phải qua validate(registerSchema) trước khi đến controller register
router.post('/register', validate(registerSchema), register);

// 2. Định nghĩa route POST /login: Yêu cầu dữ liệu body phải qua validate(loginSchema) trước khi đến controller login
router.post('/login', validate(loginSchema), login);

// 3. Định nghĩa route GET /profile: Yêu cầu xác thực qua middleware isAuth trước khi vào controller getProfile
router.get('/profile', isAuth, getProfile);

// Xuất bộ định tuyến auth router làm mặc định để server.ts có thể nạp vào hệ thống
export default router;
