// ==============================================================================
// SCRIPT THỰC THI BẢN VÁ BƯỚC 1: BỔ SUNG CỘT avatarUrl VÀO BẢNG dbo.Users
// File: src/scripts/run-step1-patch.ts
// Mục đích: Thực thi bản vá an toàn trên SQL Server và kiểm chứng theo yêu cầu Bước 1
// ==============================================================================

// Import đối tượng kết nối Sequelize từ file cấu hình database
import { sequelize } from '../config/database.js';

// Import User model để kiểm tra truy vấn thực thể sau khi nâng cấp
import { User } from '../models/user.model.js';

// Khai báo hàm chính thực hiện quy trình cập nhật
async function main(): Promise<void> {
  try {
    // 1. Kiểm tra và xác thực kết nối đến SQL Server
    await sequelize.authenticate();
    console.log('==> [1/4] Kết nối cơ sở dữ liệu SQL Server thành công.');

    // 2. Ghi nhận số lượng người dùng hiện tại trước khi thực hiện bản vá
    const initialUserCount = await User.count();
    console.log(`==> [2/4] Số lượng User hiện tại trong dbo.Users: ${initialUserCount}`);

    // 3. Thực thi khối lệnh SQL kiểm tra và bổ sung cột avatarUrl một cách an toàn
    const alterQuery = `
      IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
      BEGIN
        THROW 50001, N'Chưa có bảng dbo.Users', 1;
      END;

      IF COL_LENGTH('dbo.Users', 'avatarUrl') IS NULL
      BEGIN
        ALTER TABLE dbo.Users
        ADD avatarUrl NVARCHAR(255) NULL;
        PRINT 'Đã thêm cột avatarUrl vào dbo.Users';
      END;
    `;
    // Thực thi câu lệnh SQL trực tiếp trên instance sequelize
    await sequelize.query(alterQuery);
    console.log('==> [3/4] Đã thực thi xong bản vá ALTER TABLE dbo.Users ADD avatarUrl.');

    // 4. Lấy thông tin metadata cột avatarUrl từ INFORMATION_SCHEMA để xác minh
    const [columnMeta] = await sequelize.query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        CHARACTER_MAXIMUM_LENGTH, 
        IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo' 
        AND TABLE_NAME = 'Users' 
        AND COLUMN_NAME = 'avatarUrl'
    `);
    console.log('==> [4/4] Xác minh cấu trúc cột avatarUrl trong INFORMATION_SCHEMA:', columnMeta);

    // 5. Kiểm tra lại số lượng User sau bản vá để chứng minh không làm mất dữ liệu
    const finalUserCount = await User.count();
    console.log(`==> Kiểm tra số lượng User sau bản vá: ${finalUserCount} (Trước: ${initialUserCount})`);

    // 6. Truy vấn thử danh sách người dùng với cột mới avatarUrl
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'email', 'role', 'avatarUrl']
    });
    console.log('==> Danh sách Users truy vấn qua Model (kèm avatarUrl):', JSON.stringify(users, null, 2));

  } catch (error) {
    // Bắt và in chi tiết lỗi nếu có sự cố xảy ra
    console.error('Lỗi khi thực thi bản vá Bước 1:', error);
    process.exitCode = 1;
  } finally {
    // Luôn đóng kết nối cơ sở dữ liệu sau khi hoàn thành
    await sequelize.close();
  }
}

// Thực thi hàm main
main();
