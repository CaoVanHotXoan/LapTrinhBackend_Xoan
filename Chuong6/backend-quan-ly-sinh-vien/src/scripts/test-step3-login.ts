// ==============================================================================
// SCRIPT TỰ ĐỘNG KIỂM THỬ BƯỚC 3: API ĐĂNG NHẬP VÀ XÁC THỰC MẬT KHẨU BCRYPT
// File: src/scripts/test-step3-login.ts
// Mục đích: Xác minh điểm dừng Bước 3 và các test cases A05, A06, A07
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

// Import User model để chuẩn bị dữ liệu tài khoản thử nghiệm
import { User } from '../models/user.model.js';

// Import hàm verifyToken để kiểm tra cấu trúc mã JWT được cấp phát
import { verifyToken } from '../utils/jwt.js';

// Import thư viện bcrypt để chuẩn bị mật khẩu băm mẫu
import bcrypt from 'bcrypt';

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

// Gắn middleware xử lý lỗi tập trung
app.use(errorMiddleware);

// Cấu hình cổng test riêng biệt để tránh xung đột
const TEST_PORT = 5003;

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

// Hàm chính điều phối quy trình kiểm thử Bước 3
async function runStep3Tests(): Promise<void> {
  // Biến lưu tham chiếu đến HTTP Server
  let server: Server | null = null;

  try {
    // 1. Kiểm tra kết nối tới SQL Server
    await sequelize.authenticate();
    // In thông báo kết nối thành công
    console.log('Đã kết nối CSDL thành công cho quá trình kiểm thử Bước 3.\n');

    // 2. Dọn dẹp và chuẩn bị tài khoản sinh viên mẫu: an.lab@example.com / SinhVien@123
    await User.destroy({ where: { email: 'an.lab@example.com' } });
    // Băm mật khẩu với cost 12
    const passwordHash = await bcrypt.hash('SinhVien@123', 12);
    // Tạo tài khoản student mẫu trong SQL Server
    const createdStudent = await User.create({
      fullName: 'Nguyen Minh An',
      email: 'an.lab@example.com',
      passwordHash: passwordHash,
      role: 'student'
    });

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
    // Ca A05: Login đúng tài khoản student (Kỳ vọng: 200 OK + accessToken hợp lệ)
    // --------------------------------------------------------------------------
    const resA05 = await fetch(`${BASE_URL}/api/auth/login`, {
      // Phương thức POST
      method: 'POST',
      // Header định dạng JSON
      headers: { 'Content-Type': 'application/json' },
      // Dữ liệu đăng nhập đúng
      body: JSON.stringify({
        email: 'an.lab@example.com',
        password: 'SinhVien@123'
      })
    });

    // Parse body phản hồi từ server
    const dataA05 = await resA05.json() as {
      success: boolean;
      message: string;
      data?: { accessToken: string; tokenType: string; expiresIn: number };
    };

    // Kiểm tra cấu trúc JWT: gồm đúng 3 phần phân tách bởi 2 dấu chấm
    const tokenParts = (dataA05.data?.accessToken ?? '').split('.');
    // Giải mã và xác thực token bằng verifyToken
    const decodedToken = dataA05.data?.accessToken ? verifyToken(dataA05.data.accessToken) : null;

    // Điều kiện đạt ca A05:
    // 1. Status 200 OK
    // 2. data.tokenType === 'Bearer'
    // 3. data.expiresIn === 3600
    // 4. Token có đúng 3 phần header.payload.signature
    // 5. sub trùng khớp với id của user và role là student
    const passA05 =
      resA05.status === 200 &&
      dataA05.success === true &&
      dataA05.data?.tokenType === 'Bearer' &&
      dataA05.data?.expiresIn === 3600 &&
      tokenParts.length === 3 &&
      decodedToken?.sub === String(createdStudent.id) &&
      decodedToken?.role === 'student';

    // In kết quả ca A05
    printResult(
      'A05',
      'Đăng nhập tài khoản student đúng mật khẩu (200 OK + cấp JWT hợp lệ)',
      passA05,
      `Status: ${resA05.status} | Token: ${tokenParts[0]?.substring(0, 10)}... (Đủ 3 phần) | sub=${decodedToken?.sub}, role=${decodedToken?.role}`
    );

    // --------------------------------------------------------------------------
    // Ca A06: Login sai mật khẩu (Kỳ vọng: 401 Unauthorized, không cấp token)
    // --------------------------------------------------------------------------
    const resA06 = await fetch(`${BASE_URL}/api/auth/login`, {
      // Phương thức POST
      method: 'POST',
      // Header định dạng JSON
      headers: { 'Content-Type': 'application/json' },
      // Email đúng nhưng mật khẩu sai
      body: JSON.stringify({
        email: 'an.lab@example.com',
        password: 'SaiMatKhau@999'
      })
    });

    // Parse body phản hồi từ server
    const dataA06 = await resA06.json() as { success: boolean; message: string; data?: unknown };

    // Điều kiện đạt ca A06: Status 401, không có token
    const passA06 =
      resA06.status === 401 &&
      dataA06.success === false &&
      dataA06.data === undefined;

    // In kết quả ca A06
    printResult(
      'A06',
      'Đăng nhập sai mật khẩu (401 Unauthorized, từ chối cấp token)',
      passA06,
      `Status: ${resA06.status} | Message: "${dataA06.message}" | Không có accessToken trong response`
    );

    // --------------------------------------------------------------------------
    // Ca A07: Login email không tồn tại (Kỳ vọng: 401 Unauthorized, thông báo chung)
    // --------------------------------------------------------------------------
    const resA07 = await fetch(`${BASE_URL}/api/auth/login`, {
      // Phương thức POST
      method: 'POST',
      // Header định dạng JSON
      headers: { 'Content-Type': 'application/json' },
      // Email không hề tồn tại trong CSDL
      body: JSON.stringify({
        email: 'khongtontai@example.com',
        password: 'BatKyPassword@123'
      })
    });

    // Parse body phản hồi từ server
    const dataA07 = await resA07.json() as { success: boolean; message: string; data?: unknown };

    // Điều kiện đạt ca A07:
    // Status 401, thông báo lỗi giống hệt ca A06 để không lộ thông tin người dùng (chống User Enumeration)
    const passA07 =
      resA07.status === 401 &&
      dataA07.success === false &&
      dataA07.message === dataA06.message;

    // In kết quả ca A07
    printResult(
      'A07',
      'Đăng nhập email không tồn tại (401 Unauthorized, thông điệp bảo mật chung)',
      passA07,
      `Status: ${resA07.status} | Message: "${dataA07.message}" (Trùng khớp thông báo lỗi của A06)`
    );

    // --------------------------------------------------------------------------
    // Tổng kết kiểm thử Bước 3
    // --------------------------------------------------------------------------
    if (passA05 && passA06 && passA07) {
      console.log('===============================================================');
      console.log('🎉 TẤT CẢ CÁC ĐIỀU KIỆN VÀ TEST CASES BƯỚC 3 ĐÃ ĐẠT 100%!');
      console.log('===============================================================');
    } else {
      console.error('⚠️ Có ca test chưa đạt yêu cầu, vui lòng kiểm tra lại!');
    }
  } catch (error) {
    // Bắt lỗi phát sinh ngoài dự kiến
    console.error('Lỗi khi chạy kiểm thử Bước 3:', error);
  } finally {
    // Đóng server kiểm thử nếu đang mở
    if (server) {
      (server as Server).close();
    }
    // Đóng kết nối cơ sở dữ liệu
    await sequelize.close();
  }
}

// Thực thi hàm kiểm thử Bước 3
runStep3Tests();
