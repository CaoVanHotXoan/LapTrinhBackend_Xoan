// ==============================================================================
// KHỞI TẠO VÀ CẤU HÌNH ỨNG DỤNG EXPRESS (CHƯƠNG 09 - LAB 1)
// File: src/app.ts
// Mục đích: Tách riêng instance Express app để Supertest kiểm thử HTTP mà không mở port
// ==============================================================================

// Nạp cấu hình các biến môi trường từ file .env vào biến toàn cục process.env
import 'dotenv/config';

// Import framework Express để tạo ứng dụng Web Server
import express from 'express';

// Import thư viện CORS để cho phép các client từ domain/port khác gọi API
import cors from 'cors';

// Import thư viện Helmet giúp thiết lập các HTTP Header bảo mật tự động
import helmet from 'helmet';

// Import logger middleware để ghi log các request đi vào hệ thống ra console
import { loggerMiddleware } from './middlewares/logger.middleware.js';

// Import accessLogger middleware sử dụng Morgan để ghi nhật ký request vào file logs/access.log
import { accessLogger } from './middlewares/access-log.middleware.js';

// Import error middleware để xử lý lỗi tập trung toàn hệ thống
import { errorMiddleware } from './middlewares/error.middleware.js';

// Import thư viện Swagger UI Express để render giao diện tài liệu API trên web
import swaggerUi from 'swagger-ui-express';

// Import cấu hình đặc tả Swagger OpenAPI đã nạp từ file docs/openapi.yaml
import { swaggerSpec } from './config/swagger.config.js';

// Import router quản lý toàn bộ các route liên quan đến SinhVien
import sinhVienRouter from './routes/sinhVien.routes.js';

// Import router quản lý toàn bộ các route liên quan đến Xác thực (Auth)
import authRouter from './routes/auth.routes.js';

// Khởi tạo một instance ứng dụng Express duy nhất
const app = express();

// ------------------------------------------------------------------------------
// PIPELINE MIDDLEWARE CỦA EXPRESS (Thứ tự thực thi từ trên xuống dưới)
// ------------------------------------------------------------------------------

// 1. Gắn loggerMiddleware để in log trực tiếp ra màn hình console của server
app.use(loggerMiddleware);

// 2. Gắn accessLogger (Morgan) để tự động ghi nối tiếp (append) thông tin HTTP request vào logs/access.log
app.use(accessLogger);

// 3. Sử dụng middleware Helmet để thiết lập các HTTP Header bảo mật (cho phép tải ảnh tĩnh cross-origin)
app.use(
  helmet({
    // Cấu hình chính sách chia sẻ tài nguyên cho phép Frontend (Vite) hiển thị ảnh tĩnh từ Backend
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// 4. Sử dụng middleware CORS theo allowlist chặt chẽ: chỉ cho phép Origin của Vite đang chạy
app.use(
  cors({
    // Chỉ định chính xác nguồn gốc (Origin) của ứng dụng Frontend Vite theo quy định giáo trình
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    // Cho phép gửi kèm thông tin xác thực (Credentials)
    credentials: true
  })
);

// 5. Sử dụng middleware express.json để tự động parse body request dạng JSON thành JavaScript Object
app.use(express.json());

// 6. Phục vụ ảnh tĩnh (static files) từ thư mục public/uploads tại URL /uploads theo đúng yêu cầu đề bài
app.use('/uploads', express.static('public/uploads'));

// Import kết nối sequelize để kiểm tra trạng thái sẵn sàng của Database
import { sequelize } from './config/database.js';

// 7. Định nghĩa route GET cho đường dẫn gốc ("/") để kiểm tra trạng thái hoạt động của server (D01: Backend container)
app.get('/', (_req, res) => {
  res.status(200).json({
    // Trạng thái thành công
    success: true,
    // Thông báo máy chủ đang hoạt động bình thường
    message: 'Backend quản lý sinh viên đang hoạt động'
  });
});

// 7.1. Định nghĩa route GET '/api/health' để kiểm tra kết nối Database (D02: SQL Server container sẵn sàng)
app.get('/api/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      success: true,
      message: 'Cơ sở dữ liệu SQL Server sẵn sàng',
      status: 'DB sẵn sàng',
      database: 'connected'
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      message: 'Cơ sở dữ liệu SQL Server chưa sẵn sàng',
      error: error?.message
    });
  }
});

// 8. Gắn giao diện Swagger UI tại đường dẫn '/api-docs' (sử dụng đặc tả từ docs/openapi.yaml)
// Lưu ý: Đặt Swagger UI trước router sinh viên và trước middleware bắt lỗi 404
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 9. Gắn các route của SinhVien vào ứng dụng với tiền tố đường dẫn '/api/v1/sinh-vien'
app.use('/api/v1/sinh-vien', sinhVienRouter);

// 10. Gắn các route của Xác thực vào ứng dụng với tiền tố đường dẫn '/api/auth'
app.use('/api/auth', authRouter);

// 11. Route tạm kiểm thử an toàn lỗi 500 (Theo hướng dẫn thực hành Chương 08 & 09 - A07)
// Route này ném ra lỗi hệ thống giả lập để kiểm chứng lỗi 500 không bị lộ SQL, .env hay password
app.get('/api/test-500-error', (_req, _res) => {
  throw new Error('Mô phỏng lỗi hệ thống nội bộ để kiểm thử bảo mật Error Middleware');
});

// 12. Middleware xử lý lỗi 404 cho các đường dẫn hoặc phương thức không tồn tại trong hệ thống
app.use((_req, res) => {
  // Trả về định dạng lỗi chuẩn hóa thống nhất theo Chương 08 & 09
  res.status(404).json({
    // Trạng thái thất bại
    success: false,
    // Mã HTTP 404 Not Found
    status: 404,
    // Thông báo lỗi rõ ràng
    message: 'Không tìm thấy đường dẫn',
    // Dữ liệu null
    data: null
  });
});

// 13. Gắn errorMiddleware ở cuối cùng để hứng và xử lý tất cả các lỗi được chuyển tiếp qua next(error)
app.use(errorMiddleware);

// Xuất mặc định app để server.ts chạy thực tế và Supertest import vào kiểm thử
export default app;
export { app };
