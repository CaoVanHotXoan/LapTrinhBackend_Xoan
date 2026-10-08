// Import instance sequelize từ file database config (lưu ý đuôi .js cho ESM)
import { sequelize } from '../config/database.js';

// Hàm kiểm tra kết nối độc lập tới Database
async function main(): Promise<void> {
  try {
    // Thử xác thực kết nối đến cơ sở dữ liệu
    await sequelize.authenticate();
    console.log(`DB connected: ${process.env.DB_NAME ?? 'QuanLySinhVienDB'}`);
  } catch (error) {
    // Báo lỗi chẩn đoán nhưng không làm lộ mật khẩu
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Lỗi khi kiểm tra kết nối Database:', errorMessage);
    process.exitCode = 1;
  } finally {
    // Luôn đóng kết nối sau khi kiểm tra xong để giải phóng tài nguyên
    await sequelize.close();
  }
}

// Chạy hàm main
main();
