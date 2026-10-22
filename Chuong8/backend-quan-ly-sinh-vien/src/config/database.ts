// Nạp các biến môi trường từ file .env
import 'dotenv/config';

// Import class Sequelize từ thư viện Sequelize 6
import { Sequelize } from 'sequelize';

// Đọc và kiểm tra các biến môi trường bắt buộc
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST ?? '127.0.0.1';
const dbPortRaw = process.env.DB_PORT ?? '1433';

// Kiểm tra sự tồn tại của các biến cấu hình cần thiết
if (!DB_NAME) {
  throw new Error('Thiếu biến môi trường DB_NAME trong file .env');
}
if (!DB_USER) {
  throw new Error('Thiếu biến môi trường DB_USER trong file .env');
}
if (!DB_PASSWORD) {
  throw new Error('Thiếu biến môi trường DB_PASSWORD trong file .env');
}

// Chuyển đổi và kiểm tra dải giá trị hợp lệ của DB_PORT (1..65535)
const DB_PORT = parseInt(dbPortRaw, 10);
if (Number.isNaN(DB_PORT) || DB_PORT < 1 || DB_PORT > 65535) {
  throw new Error(`Giá trị DB_PORT="${dbPortRaw}" không hợp lệ (phải là số nguyên từ 1 đến 65535)`);
}

// Xử lý các boolean options của Tedious
const isEncrypt = process.env.DB_ENCRYPT !== 'false';
const isTrustServerCertificate = process.env.DB_TRUST_CERT === 'true';

// Khởi tạo instance Sequelize kết nối tới SQL Server
export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mssql',
  logging: console.log,
  dialectOptions: {
    options: {
      encrypt: isEncrypt,
      trustServerCertificate: isTrustServerCertificate
    }
  }
});
