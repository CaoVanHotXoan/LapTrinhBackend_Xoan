// ==============================================================================
// SCRIPT XÁC MINH CẤU TRÚC BẢNG DBO.USERS VÀ HOẠT ĐỘNG CỦA USER MODEL
// File: src/scripts/verify-user-model.ts
// ==============================================================================

// Import đối tượng kết nối sequelize
import { sequelize } from '../config/database.js';

// Import User model vừa tạo
import { User } from '../models/user.model.js';

// Hàm chính thực thi việc xác minh
async function main(): Promise<void> {
  try {
    // 1. Kiểm tra kết nối tới Database
    await sequelize.authenticate();
    console.log('1. Kết nối Database thành công.');

    // 2. Kiểm tra truy vấn bảng dbo.Users thông qua Sequelize User model
    const userCount = await User.count();
    console.log(`2. User model hoạt động tốt! Tổng số user hiện có trong dbo.Users: ${userCount}`);

    // 3. Truy vấn metadata cấu trúc cột của bảng Users trong INFORMATION_SCHEMA
    const [columns] = await sequelize.query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        CHARACTER_MAXIMUM_LENGTH, 
        IS_NULLABLE, 
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Users'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('3. Cấu trúc các cột của bảng dbo.Users:', columns);

    // 4. Truy vấn các ràng buộc (Constraints: PK, UNIQUE, CHECK, DEFAULT)
    const [constraints] = await sequelize.query(`
      SELECT 
        tc.CONSTRAINT_NAME, 
        tc.CONSTRAINT_TYPE
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      WHERE tc.TABLE_SCHEMA = 'dbo' AND tc.TABLE_NAME = 'Users'
    `);
    console.log('4. Các ràng buộc bảo vệ tính toàn vẹn:', constraints);
  } catch (error) {
    // Bắt lỗi nếu có phát sinh trong quá trình kiểm tra
    console.error('Lỗi khi xác minh User Model:', error);
    process.exitCode = 1;
  } finally {
    // Luôn giải phóng kết nối sau khi hoàn thành kiểm tra
    await sequelize.close();
  }
}

// Gọi thực thi hàm main
main();
