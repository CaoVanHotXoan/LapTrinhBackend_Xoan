// ==============================================================================
// SCRIPT KHỞI TẠO TÀI KHOẢN ADMIN NỘI BỘ (SEED ADMIN CHO MÔI TRƯỜNG DEV/LAB)
// File: src/scripts/seed-admin.ts
// Mục đích: Khởi tạo an toàn tài khoản Quản trị viên phục vụ kiểm thử phân quyền RBAC
// ==============================================================================

// Nạp các cấu hình biến môi trường từ file .env
import 'dotenv/config';

// Import thư viện bcrypt để băm mật khẩu một chiều an toàn
import bcrypt from 'bcrypt';

// Import đối tượng kết nối Sequelize từ module config (lưu ý đuôi .js)
import { sequelize } from '../config/database.js';

// Import User model để trực tiếp tương tác với bảng dbo.Users
import { User } from '../models/user.model.js';

// Định nghĩa số vòng băm mật khẩu chuẩn của đề bài là 12
const BCRYPT_SALT_ROUNDS = 12;

// Hàm chính điều phối việc seed tài khoản admin an toàn
async function seedAdmin(): Promise<void> {
  try {
    // 1. Kiểm tra và xác thực kết nối cơ sở dữ liệu SQL Server
    await sequelize.authenticate();
    // In thông báo kết nối DB thành công
    console.log('1. Đã kết nối cơ sở dữ liệu SQL Server thành công.\n');

    // 2. Lấy thông tin tài khoản admin từ biến môi trường hoặc tham số dòng lệnh CLI
    // Email admin kiểm thử mặc định cho bài lab (có thể ghi đè qua biến ADMIN_SEED_EMAIL)
    const adminEmail = (process.env.ADMIN_SEED_EMAIL ?? 'admin.lab@example.com').trim().toLowerCase();

    // Họ tên hiển thị của tài khoản Admin
    const adminFullName = process.env.ADMIN_SEED_NAME ?? 'Quản Trị Viên Hệ Thống';

    // Mật khẩu lấy an toàn từ biến môi trường, tham số CLI hoặc mật khẩu lab mẫu
    const rawPassword = process.env.ADMIN_SEED_PASSWORD ?? process.argv[2] ?? 'Admin@123456';

    // 3. Kiểm tra cờ tham số dòng lệnh nếu người dùng muốn dọn dẹp / xóa tài khoản test
    if (process.argv.includes('--delete') || process.argv.includes('--clean')) {
      // Thực hiện xóa tài khoản test khỏi bảng dbo.Users
      const deletedCount = await User.destroy({ where: { email: adminEmail } });
      // In thông báo kết quả dọn dẹp
      console.log(`🧹 Đã dọn dẹp an toàn: Xóa ${deletedCount} tài khoản với email "${adminEmail}".`);
      // Kết thúc tiến trình thành công
      return;
    }

    // 4. Kiểm tra tài khoản đã tồn tại trong CSDL hay chưa
    const existingUser = await User.findOne({
      // Điều kiện tìm kiếm theo email đã chuẩn hóa
      where: { email: adminEmail }
    });

    // 5. Nguyên tắc an toàn cốt lõi: Nếu tài khoản đã tồn tại, tuyệt đối KHÔNG tự ý nâng quyền
    if (existingUser) {
      // In cảnh báo người dùng đã tồn tại
      console.log(`⚠️ Tài khoản với email "${adminEmail}" ĐÃ TỒN TẠI trong hệ thống!`);
      // In thông tin tài khoản hiện tại
      console.log(`   - ID: ${existingUser.id}`);
      console.log(`   - Họ tên: ${existingUser.fullName}`);
      console.log(`   - Vai trò hiện tại (Role): ${existingUser.role}`);
      // Nhắc nhở quy tắc bảo mật
      console.log(`   - Lưu ý an toàn: Không tự ý ghi đè hoặc nâng quyền tài khoản sẵn có.`);
      console.log(`   - Nếu muốn tạo lại từ đầu, hãy chạy lệnh với cờ: pnpm seed:admin --clean\n`);
      // Dừng lại mà không sửa đổi dữ liệu
      return;
    }

    // 6. Thực hiện băm mật khẩu bằng thuật toán bcrypt với chi phí tính toán cost = 12
    console.log(`2. Đang băm mật khẩu an toàn với bcrypt (cost factor: ${BCRYPT_SALT_ROUNDS})...`);
    // Gọi hàm bcrypt.hash
    const passwordHash = await bcrypt.hash(rawPassword, BCRYPT_SALT_ROUNDS);

    // 7. Tạo mới tài khoản admin trực tiếp vào bảng dbo.Users
    const newAdmin = await User.create({
      // Họ và tên quản trị viên
      fullName: adminFullName,
      // Địa chỉ email đã chuẩn hóa
      email: adminEmail,
      // Chuỗi băm mật khẩu bảo mật (tuyệt đối không lưu mật khẩu rõ)
      passwordHash: passwordHash,
      // Gán vai trò quản trị viên cao nhất
      role: 'admin'
    });

    // 8. In kết quả khởi tạo thành công và hướng dẫn sử dụng
    console.log('\n===============================================================');
    console.log('🎉 KHỞI TẠO TÀI KHOẢN ADMIN THÀNH CÔNG CHO MÔI TRƯỜNG LAB!');
    console.log('===============================================================');
    console.log(`   - ID: ${newAdmin.id}`);
    console.log(`   - Họ tên: ${newAdmin.fullName}`);
    console.log(`   - Email đăng nhập: ${newAdmin.email}`);
    console.log(`   - Vai trò: ${newAdmin.role}`);
    console.log(`   - Chuỗi băm (Hash): ${newAdmin.passwordHash.substring(0, 25)}... (Đã mã hóa an toàn)`);
    console.log('---------------------------------------------------------------');
    console.log('📋 HƯỚNG DẪN KIỂM THỬ:');
    console.log(`1. Đăng nhập: POST /api/auth/login với body:`);
    console.log(`   { "email": "${adminEmail}", "password": "${rawPassword}" }`);
    console.log(`2. Lấy Access Token nhận được để gắn vào header Authorization: Bearer <token>`);
    console.log(`3. Thao tác các Route ghi dữ liệu (POST, PUT, DELETE SinhVien)`);
    console.log(`4. Câu lệnh SQL xác minh trong SSMS:`);
    console.log(`   SELECT id, fullName, email, role, passwordHash FROM dbo.Users WHERE email = '${adminEmail}';`);
    console.log(`5. Câu lệnh dọn dẹp sau khi kiểm thử:`);
    console.log(`   pnpm seed:admin --clean`);
    console.log('===============================================================\n');
  } catch (error) {
    // Bắt và in lỗi nếu có phát sinh (ví dụ lỗi quyền hạn kết nối DB)
    console.error('❌ Lỗi trong quá trình seed tài khoản Admin:', error);
    // Thiết lập exit code báo lỗi
    process.exitCode = 1;
  } finally {
    // Luôn giải phóng kết nối cơ sở dữ liệu
    await sequelize.close();
  }
}

// Thực thi hàm seed
seedAdmin();
