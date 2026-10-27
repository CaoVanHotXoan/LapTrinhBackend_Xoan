// ==============================================================================
// FILE KHỞI ĐỘNG VÀ ĐIỀU PHỐI CHÍNH CỦA SERVER EXPRESS
// File: src/server.ts
// Mục đích: Khởi tạo kết nối SQL Server và lắng nghe cổng HTTP (Port Listener)
// ==============================================================================

// Nạp cấu hình các biến môi trường từ file .env vào biến toàn cục process.env
import 'dotenv/config';

// Import ứng dụng Express đã cấu hình đầy đủ middleware và routes từ app.ts
import { app } from './app.js';

// Import instance sequelize từ thư mục config để xác thực kết nối CSDL (lưu ý đuôi .js cho ESM)
import { sequelize } from './config/database.js';

// Lấy giá trị cổng PORT từ biến môi trường .env, nếu chưa khai báo thì mặc định là 5000
const PORT = Number(process.env.PORT ?? 5000);

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

// Thực thi khởi động ứng dụng máy chủ
startServer();
