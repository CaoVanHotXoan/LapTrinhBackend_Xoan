// Nạp cấu hình các biến môi trường từ file .env vào biến toàn cục process.env
import 'dotenv/config';

// Import framework Express để tạo ứng dụng Web Server
import express from 'express';

// Import thư viện CORS để cho phép các client từ domain/port khác gọi API
import cors from 'cors';

// Import thư viện Helmet giúp thiết lập các HTTP Header bảo mật tự động
import helmet from 'helmet';

// Import logger middleware để ghi log các request (lưu ý đuôi .js)
import { loggerMiddleware } from './middlewares/logger.middleware.js';

// Import error middleware để xử lý lỗi tập trung (lưu ý đuôi .js)
import { errorMiddleware } from './middlewares/error.middleware.js';

// Import router quản lý các route của SinhVien (lưu ý đuôi .js)
import sinhVienRouter from './routes/sinhVien.routes.js';

// Khởi tạo một instance ứng dụng Express
const app = express();

// Lấy giá trị cổng PORT từ biến môi trường .env, nếu chưa khai báo thì mặc định là 5000
const PORT = Number(process.env.PORT ?? 5000);

// 1. Gắn loggerMiddleware đầu tiên để ghi nhận mọi request đi vào server
app.use(loggerMiddleware);

// 2. Sử dụng middleware Helmet để tăng tính bảo mật cho ứng dụng
app.use(helmet());

// 3. Sử dụng middleware CORS để xử lý chia sẻ tài nguyên giữa các nguồn khác nhau
app.use(cors());

// 4. Sử dụng middleware express.json để tự động parse body của request dạng JSON thành object
app.use(express.json());

// 5. Định nghĩa route GET cho đường dẫn gốc ("/") để kiểm tra trạng thái hoạt động của server
app.get('/', (_req, res) => {
  // Trả về mã trạng thái HTTP 200 (OK) cùng dữ liệu JSON thông báo server đang chạy
  res.status(200).json({
    // Trạng thái thành công của yêu cầu
    success: true,
    // Thông điệp phản hồi cho người gọi API
    message: 'Backend quản lý sinh viên đang hoạt động'
  });
});

// 6. Gắn route của SinhVien vào ứng dụng với tiền tố đường dẫn '/api/v1/sinh-vien'
app.use('/api/v1/sinh-vien', sinhVienRouter);

// 7. Middleware xử lý 404 cho các đường dẫn không tồn tại trong hệ thống
app.use((_req, res) => {
  // Trả về mã HTTP 404 (Not Found) nếu không khớp bất kỳ route nào phía trên
  res.status(404).json({
    // Đánh dấu yêu cầu thất bại
    success: false,
    // Thông báo đường dẫn không tồn tại
    message: 'Không tìm thấy đường dẫn'
  });
});

// 8. Gắn errorMiddleware ở cuối cùng để hứng tất cả các lỗi được chuyển qua hàm next(error)
app.use(errorMiddleware);

// Bắt đầu lắng nghe các kết nối gửi tới cổng đã được chỉ định
app.listen(PORT, () => {
  // In thông báo ra màn hình console khi server đã khởi động thành công
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
