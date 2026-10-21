// ==============================================================================
// SCRIPT DỌN DẸP TÀI KHOẢN TEST TRONG CSDL (dbo.Users)
// File: src/scripts/clean-test-user.ts
// Mục đích: Xóa user an.lab@example.com để test lại A01 từ đầu trên Postman
// ==============================================================================

// Nạp các biến môi trường
import 'dotenv/config';

// Import Sequelize instance
import { sequelize } from '../config/database.js';

// Import User model
import { User } from '../models/user.model.js';

async function cleanTestUser() {
  try {
    const deletedCount = await User.destroy({
      where: {
        email: 'an.lab@example.com'
      }
    });
    console.log(`✅ Đã xóa ${deletedCount} bản ghi 'an.lab@example.com' khỏi bảng dbo.Users.`);
    console.log(`👉 Bây giờ bạn có thể bấm Send request A01 trên Postman, server sẽ trả về 201 Created!`);
  } catch (error) {
    console.error('Lỗi khi dọn dẹp:', error);
  } finally {
    await sequelize.close();
  }
}

cleanTestUser();
