// ==============================================================================
// SCRIPT KHỞI TẠO TÀI KHOẢN SINH VIÊN (SEED STUDENT CHO MÔI TRƯỜNG DEV/LAB)
// File: src/scripts/seed-student.ts
// Mục đích: Khởi tạo tài khoản Sinh viên (Student) chuẩn mực để đăng nhập trên giao diện React
// ==============================================================================

// Nạp các cấu hình biến môi trường từ file .env
import 'dotenv/config';

// Import thư viện bcrypt để băm mật khẩu an toàn theo chuẩn chi phí 12
import bcrypt from 'bcrypt';

// Import đối tượng kết nối Sequelize từ module config
import { sequelize } from '../config/database.js';

// Import User model để tương tác với bảng dbo.Users
import { User } from '../models/user.model.js';

// Định nghĩa số vòng băm mật khẩu chuẩn của bài lab là 12
const BCRYPT_SALT_ROUNDS = 12;

// Hàm chính điều phối việc khởi tạo tài khoản sinh viên
async function seedStudent(): Promise<void> {
  try {
    // 1. Kiểm tra và xác thực kết nối cơ sở dữ liệu SQL Server
    await sequelize.authenticate();
    console.log('1. Đã kết nối cơ sở dữ liệu SQL Server thành công.\n');

    // 2. Khai báo thông tin tài khoản sinh viên chuẩn mực
    const studentEmail = (process.env.STUDENT_SEED_EMAIL ?? 'student.lab@example.com').trim().toLowerCase();
    const studentFullName = process.env.STUDENT_SEED_NAME ?? 'Nguyễn Văn Sinh Viên';
    const rawPassword = process.env.STUDENT_SEED_PASSWORD ?? process.argv[2] ?? 'Student@123456';

    // 3. Kiểm tra nếu có cờ dòng lệnh --clean hoặc --delete để xóa tài khoản
    if (process.argv.includes('--delete') || process.argv.includes('--clean')) {
      const deletedCount = await User.destroy({ where: { email: studentEmail } });
      console.log(`🧹 Đã dọn dẹp: Xóa ${deletedCount} tài khoản với email "${studentEmail}".`);
      return;
    }

    // 4. Kiểm tra tài khoản đã tồn tại trong CSDL hay chưa
    const existingUser = await User.findOne({
      where: { email: studentEmail }
    });

    // 5. Nếu tài khoản đã tồn tại thì cập nhật lại mật khẩu và role student
    if (existingUser) {
      console.log(`ℹ️ Tài khoản "${studentEmail}" đã tồn tại trong hệ thống (ID: ${existingUser.id}).`);
      // Băm lại mật khẩu mới để đảm bảo người dùng có thể đăng nhập được
      const newHash = await bcrypt.hash(rawPassword, BCRYPT_SALT_ROUNDS);
      existingUser.passwordHash = newHash;
      existingUser.role = 'student';
      existingUser.fullName = studentFullName;
      await existingUser.save();
      console.log('✅ Đã cập nhật lại thông tin và mật khẩu cho tài khoản sinh viên thành công!');
    } else {
      // 6. Nếu tài khoản chưa tồn tại thì tiến hành tạo mới
      const passwordHash = await bcrypt.hash(rawPassword, BCRYPT_SALT_ROUNDS);
      const newUser = await User.create({
        fullName: studentFullName,
        email: studentEmail,
        passwordHash: passwordHash,
        role: 'student',
        avatarUrl: null
      });
      console.log(`🎉 ĐÃ TẠO MỚI TÀI KHOẢN SINH VIÊN THÀNH CÔNG! (ID: ${newUser.id})`);
    }

    // In thông tin tài khoản rõ ràng ra màn hình để người dùng sử dụng
    console.log('\n================================================================================');
    console.log('📋 THÔNG TIN ĐĂNG NHẬP TÀI KHOẢN SINH VIÊN (DÙNG TRÊN GIAO DIỆN REACT):');
    console.log('================================================================================');
    console.log(`📧 Email đăng nhập : ${studentEmail}`);
    console.log(`🔑 Mật khẩu dạng rõ: ${rawPassword}`);
    console.log(`👤 Họ và tên       : ${studentFullName}`);
    console.log(`🛡️ Vai trò (Role)   : student`);
    console.log('================================================================================\n');

  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo tài khoản sinh viên:', error);
    process.exit(1);
  } finally {
    // Đóng kết nối CSDL an toàn
    await sequelize.close();
  }
}

// Thực thi hàm tạo tài khoản
seedStudent();
