// ==============================================================================
// SCRIPT TỰ ĐỘNG KIỂM THỬ BƯỚC 2: API ĐĂNG KÝ VÀ BĂM MẬT KHẨU BCRYPT
// File: src/scripts/test-step2-register.ts
// Mục đích: Xác minh điểm dừng Bước 2 và các test cases A01 - A04
// ==============================================================================

// Nạp các biến môi trường từ .env
import 'dotenv/config';

// Import framework express để dựng test server tạm thời
import express from 'express';

// Import middleware helmet bảo mật
import helmet from 'helmet';

// Import middleware cors
import cors from 'cors';

// Import đối tượng sequelize để kết nối và truy vấn CSDL
import { sequelize } from '../config/database.js';

// Import router auth
import authRouter from '../routes/auth.routes.js';

// Import middleware xử lý lỗi tập trung
import { errorMiddleware } from '../middlewares/error.middleware.js';

// Import User model để trực tiếp SELECT kiểm tra CSDL
import { User } from '../models/user.model.js';

// Import kiểu Server từ thư viện node:http
import type { Server } from 'node:http';

// Khởi tạo app express dành riêng cho kiểm thử
const app = express();

// Gắn middleware bảo mật helmet
app.use(helmet());

// Gắn middleware cors
app.use(cors());

// Gắn middleware parse JSON body
app.use(express.json());

// Gắn auth router tại tiền tố /api/auth
app.use('/api/auth', authRouter);

// Gắn middleware xử lý lỗi
app.use(errorMiddleware);

// Cấu hình cổng test riêng biệt để tránh xung đột
const TEST_PORT = 5002;

// Địa chỉ URL cơ sở của test server
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Hàm in kết quả từng ca kiểm thử với biểu tượng trực quan
function printResult(code: string, desc: string, pass: boolean, detail: string): void {
  // Biểu tượng đánh dấu kết quả đạt hay không đạt
  const icon = pass ? '✅ [PASS]' : '❌ [FAIL]';
  // In mã ca test và mô tả
  console.log(`${icon} ${code}: ${desc}`);
  // In chi tiết kết quả thực tế
  console.log(`   └─> ${detail}\n`);
}

// Hàm chính điều phối quy trình kiểm thử Bước 2
async function runStep2Tests(): Promise<void> {
  // Biến lưu tham chiếu đến HTTP Server
  let server: Server | null = null;

  try {
    // 1. Kiểm tra kết nối tới SQL Server
    await sequelize.authenticate();
    // In thông báo kết nối thành công
    console.log('Đã kết nối CSDL thành công cho quá trình kiểm thử.\n');

    // 2. Dọn dẹp dữ liệu kiểm thử cũ nếu có (email thử nghiệm: an.lab@example.com)
    await User.destroy({ where: { email: 'an.lab@example.com' } });

    // 3. Khởi động server trên cổng kiểm thử
    await new Promise<void>((resolve) => {
      // Bắt đầu lắng nghe kết nối
      server = app.listen(TEST_PORT, () => {
        // In tiêu đề kiểm thử
        console.log(`Test Server đang chạy trên cổng ${TEST_PORT}...\n`);
        // Giải phóng Promise để tiếp tục
        resolve();
      });
    });

    // --------------------------------------------------------------------------
    // Ca A01: Register email mới, body hợp lệ (Kỳ vọng: 201 Created)
    // --------------------------------------------------------------------------
    const resA01 = await fetch(`${BASE_URL}/api/auth/register`, {
      // Phương thức POST
      method: 'POST',
      // Header định dạng JSON
      headers: { 'Content-Type': 'application/json' },
      // Dữ liệu hợp lệ theo đề bài
      body: JSON.stringify({
        fullName: 'Nguyen Minh An',
        email: 'an.lab@example.com',
        password: 'SinhVien@123'
      })
    });

    // Parse body phản hồi từ server
    const dataA01 = await resA01.json() as { success: boolean; data?: { id: number; fullName: string; email: string; role: string; password?: string; passwordHash?: string } };

    // Truy vấn trực tiếp từ bảng dbo.Users trong SQL Server để kiểm tra chuỗi băm
    const userInDb = await User.findOne({ where: { email: 'an.lab@example.com' } });

    // Kiểm tra điều kiện: HTTP 201, User có trong DB, passwordHash khác mật khẩu gốc, response không chứa password/passwordHash
    const passA01 =
      resA01.status === 201 &&
      userInDb !== null &&
      userInDb.role === 'student' &&
      userInDb.passwordHash !== 'SinhVien@123' &&
      userInDb.passwordHash.startsWith('$2') &&
      dataA01.data?.password === undefined &&
      dataA01.data?.passwordHash === undefined;

    // In kết quả ca A01
    printResult(
      'A01',
      'Đăng ký tài khoản mới hợp lệ (201 Created, băm bcrypt, role student)',
      passA01,
      `Status: ${resA01.status} | DB passwordHash: ${userInDb?.passwordHash.substring(0, 20)}... (Đã băm an toàn, không lưu plaintext) | role: ${userInDb?.role}`
    );

    // --------------------------------------------------------------------------
    // Ca A02: Register trùng email A01 (Kỳ vọng: 409 Conflict)
    // --------------------------------------------------------------------------
    const countBeforeA02 = await User.count();
    const resA02 = await fetch(`${BASE_URL}/api/auth/register`, {
      // Phương thức POST
      method: 'POST',
      // Header JSON
      headers: { 'Content-Type': 'application/json' },
      // Gửi lại chính xác email vừa đăng ký
      body: JSON.stringify({
        fullName: 'Nguyen Minh An Duplicate',
        email: 'an.lab@example.com',
        password: 'OtherPassword@123'
      })
    });

    // Đếm lại số lượng User sau khi gửi trùng email
    const countAfterA02 = await User.count();
    // Phản hồi body
    const dataA02 = await resA02.json() as { success: boolean; message: string };

    // Điều kiện đạt: HTTP 409 và số lượng bản ghi trong DB không tăng
    const passA02 = resA02.status === 409 && countBeforeA02 === countAfterA02;

    // In kết quả ca A02
    printResult(
      'A02',
      'Đăng ký trùng email đã tồn tại (409 Conflict, không tăng số lượng user)',
      passA02,
      `Status: ${resA02.status} | Message: "${dataA02.message}" | Số user trước/sau: ${countBeforeA02}/${countAfterA02}`
    );

    // --------------------------------------------------------------------------
    // Ca A03: Register body cố tình kèm role=admin (Kỳ vọng: 400 Bad Request do Zod strict chặn)
    // --------------------------------------------------------------------------
    const resA03 = await fetch(`${BASE_URL}/api/auth/register`, {
      // Phương thức POST
      method: 'POST',
      // Header JSON
      headers: { 'Content-Type': 'application/json' },
      // Body cố tình truyền role admin trái phép
      body: JSON.stringify({
        fullName: 'Attacker Admin',
        email: 'attacker@example.com',
        password: 'Password@123',
        role: 'admin'
      })
    });

    // Điều kiện đạt: Phải bị chặn với HTTP 400, không được tạo tài khoản
    const passA03 = resA03.status === 400;

    // In kết quả ca A03
    printResult(
      'A03',
      'Đăng ký kèm trường role=admin bị từ chối (400 Bad Request, Zod strict)',
      passA03,
      `Status: ${resA03.status} | Đã chặn thành công trường lạ, ngăn chặn leo thang quyền`
    );

    // --------------------------------------------------------------------------
    // Ca A04: Register thiếu password hoặc email sai định dạng (Kỳ vọng: 400 Bad Request)
    // --------------------------------------------------------------------------
    const resA04 = await fetch(`${BASE_URL}/api/auth/register`, {
      // Phương thức POST
      method: 'POST',
      // Header JSON
      headers: { 'Content-Type': 'application/json' },
      // Body thiếu trường password và email không hợp lệ
      body: JSON.stringify({
        fullName: 'Invalid User',
        email: 'not-an-email'
      })
    });

    // Điều kiện đạt: Bị từ chối với HTTP 400
    const passA04 = resA04.status === 400;

    // In kết quả ca A04
    printResult(
      'A04',
      'Đăng ký thiếu mật khẩu và sai định dạng email (400 Bad Request)',
      passA04,
      `Status: ${resA04.status} | Zod schema bắt lỗi định dạng thành công`
    );

    // --------------------------------------------------------------------------
    // Tổng kết kiểm thử Bước 2
    // --------------------------------------------------------------------------
    if (passA01 && passA02 && passA03 && passA04) {
      console.log('===============================================================');
      console.log('🎉 TẤT CẢ CÁC ĐIỀU KIỆN VÀ TEST CASES BƯỚC 2 ĐÃ ĐẠT 100%!');
      console.log('===============================================================');
    } else {
      console.error('⚠️ Có ca test chưa đạt yêu cầu, vui lòng kiểm tra lại!');
    }
  } catch (error) {
    // Bắt lỗi phát sinh ngoài dự kiến
    console.error('Lỗi khi chạy kiểm thử Bước 2:', error);
  } finally {
    // Đóng server kiểm thử nếu đang mở
    if (server) {
      (server as Server).close();
    }
    // Đóng kết nối cơ sở dữ liệu
    await sequelize.close();
  }
}

// Thực thi hàm kiểm thử
runStep2Tests();
