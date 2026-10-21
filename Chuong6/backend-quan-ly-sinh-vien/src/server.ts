// ==============================================================================
// FILE KHỞI ĐỘNG VÀ ĐIỀU PHỐI CHÍNH CỦA SERVER EXPRESS
// File: src/server.ts
// ==============================================================================

// Nạp cấu hình các biến môi trường từ file .env vào biến toàn cục process.env
import 'dotenv/config';

// Import framework Express để tạo ứng dụng Web Server
import express from 'express';

// Import thư viện CORS để cho phép các client từ domain/port khác gọi API
import cors from 'cors';

// Import thư viện Helmet giúp thiết lập các HTTP Header bảo mật tự động
import helmet from 'helmet';

// Import instance sequelize từ thư mục config (lưu ý đuôi .js cho ESM/NodeNext)
import { sequelize } from './config/database.js';

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

// Khởi tạo một instance ứng dụng Express
const app = express();

// Lấy giá trị cổng PORT từ biến môi trường .env, nếu chưa khai báo thì mặc định là 5000
const PORT = Number(process.env.PORT ?? 5000);

// ------------------------------------------------------------------------------
// PIPELINE MIDDLEWARE CỦA EXPRESS (Thứ tự thực thi từ trên xuống dưới)
// ------------------------------------------------------------------------------

// 1. Gắn loggerMiddleware để in log trực tiếp ra màn hình console của server
app.use(loggerMiddleware);

// 2. Gắn accessLogger (Morgan) để tự động ghi nối tiếp (append) thông tin HTTP request vào logs/access.log
app.use(accessLogger);

// 2. Sử dụng middleware Helmet để thiết lập các HTTP Header bảo mật
app.use(helmet());

// 3. Sử dụng middleware CORS để xử lý chia sẻ tài nguyên giữa các domain/port khác nhau
app.use(cors());

// 4. Sử dụng middleware express.json để tự động parse body request dạng JSON thành object
app.use(express.json());

// 5. Định nghĩa route GET cho đường dẫn gốc ("/") để kiểm tra trạng thái hoạt động của server (Health Check)
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend quản lý sinh viên đang hoạt động'
  });
});

// 6. Gắn giao diện Swagger UI tại đường dẫn '/api-docs' (sử dụng đặc tả từ docs/openapi.yaml)
// Lưu ý: Đặt Swagger UI trước router sinh viên và trước middleware bắt lỗi 404
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 7. Gắn các route của SinhVien vào ứng dụng với tiền tố đường dẫn '/api/v1/sinh-vien'
app.use('/api/v1/sinh-vien', sinhVienRouter);

// 8. Gắn các route của Xác thực vào ứng dụng với tiền tố đường dẫn '/api/auth'
app.use('/api/auth', authRouter);

// 9. Middleware xử lý lỗi 404 cho các đường dẫn hoặc phương thức không tồn tại trong hệ thống
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy đường dẫn'
  });
});

// 9. Gắn errorMiddleware ở cuối cùng để hứng và xử lý tất cả các lỗi được chuyển tiếp qua next(error)
app.use(errorMiddleware);

// ------------------------------------------------------------------------------
// HÀM KHỞI ĐỘNG VÀ LẮNG NGHE KẾT NỐI SERVER
// ------------------------------------------------------------------------------
async function startServer(): Promise<void> {
  try {
    // 1. Xác thực kết nối tới SQL Server thành công trước khi mở cổng lắng nghe HTTP
    await sequelize.authenticate();
    console.log(`Đã kết nối thành công tới Database: ${process.env.DB_NAME ?? 'QuanLySinhVienDB'}`);

    // 2. Bắt đầu lắng nghe các kết nối gửi tới cổng PORT đã chỉ định
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
      console.log(`Tài liệu Swagger UI sẵn sàng tại http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    // Ghi log chẩn đoán lỗi kết nối Database nhưng không làm lộ thông tin mật khẩu
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Không thể khởi động server do lỗi kết nối Database:', errorMessage);

    // Đóng kết nối nếu có và dừng tiến trình với mã lỗi thoát 1
    await sequelize.close();
    process.exit(1);
  }
}

// Thực thi khởi động ứng dụng
startServer();
