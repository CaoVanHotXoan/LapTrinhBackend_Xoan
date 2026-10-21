// ==============================================================================
// SCRIPT TỰ ĐỘNG KIỂM THỬ BƯỚC 5: MIDDLEWARE ISAUTH VÀ API /API/AUTH/PROFILE
// File: src/scripts/test-step5-isauth.ts
// Mục đích: Xác minh các ca kiểm thử A08, A09, A10, A11 và cơ chế xác thực JWT
// ==============================================================================

// Nạp các biến môi trường từ file .env
import 'dotenv/config';

// Import framework express để dựng test server tạm thời
import express from 'express';

// Import middleware helmet bảo mật
import helmet from 'helmet';

// Import middleware cors
import cors from 'cors';

// Import đối tượng sequelize để kết nối và truy vấn CSDL
import { sequelize } from '../config/database.js';

// Import router auth chứa route /profile
import authRouter from '../routes/auth.routes.js';

// Import middleware xử lý lỗi tập trung
import { errorMiddleware } from '../middlewares/error.middleware.js';

// Import User model để chuẩn bị tài khoản kiểm thử
import { User } from '../models/user.model.js';

// Import hàm tạo token và lấy secret
import { generateToken, getJwtSecret } from '../utils/jwt.js';

// Import thư viện jwt để ký token có thời hạn cực ngắn cho ca A11
import jwt from 'jsonwebtoken';

// Import kiểu Server từ thư viện chuẩn node:http
import type { Server } from 'node:http';

// Khởi tạo app express phục vụ kiểm thử
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

// Cấu hình cổng kiểm thử riêng biệt để tránh xung đột
const TEST_PORT = 5005;

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

// Hàm chính điều phối quy trình kiểm thử Bước 5
async function runStep5Tests(): Promise<void> {
  // Biến lưu tham chiếu đến HTTP Server
  let server: Server | null = null;

  try {
    // 1. Kiểm tra kết nối tới SQL Server
    await sequelize.authenticate();
    // In thông báo kết nối DB thành công
    console.log('Đã kết nối CSDL thành công cho quá trình kiểm thử Bước 5.\n');

    // 2. Tìm hoặc tạo người dùng mẫu student
    let testUser = await User.findOne({ where: { email: 'an.lab@example.com' } });
    // Nếu chưa tồn tại thì tạo mới
    if (!testUser) {
      testUser = await User.create({
        fullName: 'Nguyen Minh An',
        email: 'an.lab@example.com',
        passwordHash: '$2b$12$e0X7g25XpSZbK6Jj5VnJxe5G45P6h7m8n9q0r1s2t3u4v5w6x7y8z',
        role: 'student'
      });
    }

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
    // Ca A08: GET /api/auth/profile không có token (Kỳ vọng: 401 Unauthorized)
    // --------------------------------------------------------------------------
    const resA08 = await fetch(`${BASE_URL}/api/auth/profile`, {
      // Phương thức GET
      method: 'GET'
      // Cố tình KHÔNG gửi header Authorization
    });
    // Parse response body
    const dataA08 = await resA08.json() as { success: boolean; message: string; data?: unknown };
    // Điều kiện đạt: Status 401 và không có dữ liệu hồ sơ
    const passA08 = resA08.status === 401 && dataA08.success === false && dataA08.data === undefined;
    // In kết quả ca A08
    printResult(
      'A08',
      'GET /api/auth/profile không có token -> Bị chặn 401 Unauthorized',
      passA08,
      `Status: ${resA08.status} | Message: "${dataA08.message}" | Không nhận data hồ sơ`
    );

    // --------------------------------------------------------------------------
    // Ca A09: Profile với token bị sửa 1 ký tự (Kỳ vọng: 401 Unauthorized)
    // --------------------------------------------------------------------------
    // Tạo token hợp lệ
    const validToken = generateToken({ id: testUser.id, role: testUser.role });
    // Thay đổi 1 ký tự ở cuối token
    const lastChar = validToken.slice(-1);
    const tamperedToken = validToken.slice(0, -1) + (lastChar === 'X' ? 'Y' : 'X');
    // Gửi request với token bị sửa
    const resA09 = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tamperedToken}`
      }
    });
    // Parse response body
    const dataA09 = await resA09.json() as { success: boolean; message: string };
    // Điều kiện đạt: Status 401
    const passA09 = resA09.status === 401 && dataA09.success === false;
    // In kết quả ca A09
    printResult(
      'A09',
      'GET /api/auth/profile với token bị sửa 1 ký tự -> Bị chặn 401 (Sai chữ ký)',
      passA09,
      `Status: ${resA09.status} | Message: "${dataA09.message}" | Chữ ký không qua xác minh`
    );

    // --------------------------------------------------------------------------
    // Ca A10: Profile với JWT student hợp lệ (Kỳ vọng: 200 OK + Hồ sơ đúng user)
    // --------------------------------------------------------------------------
    const resA10 = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${validToken}`
      }
    });
    // Parse response body
    const dataA10 = await resA10.json() as {
      success: boolean;
      message: string;
      data?: { id: number; fullName: string; email: string; role: string; password?: string; passwordHash?: string };
    };
    // Điều kiện đạt: Status 200, đúng user, KHÔNG chứa password hay passwordHash
    const passA10 =
      resA10.status === 200 &&
      dataA10.success === true &&
      dataA10.data?.id === testUser.id &&
      dataA10.data?.email === testUser.email &&
      dataA10.data?.password === undefined &&
      dataA10.data?.passwordHash === undefined;
    // In kết quả ca A10
    printResult(
      'A10',
      'GET /api/auth/profile với JWT hợp lệ -> Trả 200 OK (Đúng user, không lộ hash)',
      passA10,
      `Status: ${resA10.status} | User: ${dataA10.data?.fullName} (${dataA10.data?.email}) | role: ${dataA10.data?.role}`
    );

    // --------------------------------------------------------------------------
    // Ca A11: Token hết hạn gọi Profile (Kỳ vọng: 401 Unauthorized)
    // --------------------------------------------------------------------------
    // Lấy secret key từ utils
    const secret = getJwtSecret();
    // Ký token có thời hạn 1 mili-giây
    const expiredToken = jwt.sign(
      { sub: String(testUser.id), role: testUser.role },
      secret,
      { expiresIn: '1ms', algorithm: 'HS256' }
    );
    // Chờ 20ms để token chắc chắn hết hạn
    await new Promise((r) => setTimeout(r, 20));
    // Gửi request với token đã hết hạn
    const resA11 = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${expiredToken}`
      }
    });
    // Parse response body
    const dataA11 = await resA11.json() as { success: boolean; message: string };
    // Điều kiện đạt: Status 401
    const passA11 = resA11.status === 401 && dataA11.success === false;
    // In kết quả ca A11
    printResult(
      'A11',
      'GET /api/auth/profile với Token đã hết hạn -> Bị chặn 401 Unauthorized',
      passA11,
      `Status: ${resA11.status} | Message: "${dataA11.message}" | isAuth bắt lỗi hết hạn chính xác`
    );

    // --------------------------------------------------------------------------
    // Tổng kết kiểm thử Bước 5
    // --------------------------------------------------------------------------
    if (passA08 && passA09 && passA10 && passA11) {
      console.log('===============================================================');
      console.log('🎉 TẤT CẢ CÁC ĐIỀU KIỆN VÀ TEST CASES BƯỚC 5 ĐÃ ĐẠT 100%!');
      console.log('===============================================================');
    } else {
      console.error('⚠️ Có ca kiểm thử chưa đạt yêu cầu của Bước 5!');
      process.exitCode = 1;
    }
  } catch (error) {
    // Bắt lỗi phát sinh ngoài dự kiến
    console.error('Lỗi khi chạy kiểm thử Bước 5:', error);
  } finally {
    // Đóng server kiểm thử nếu đang mở
    if (server) {
      (server as Server).close();
    }
    // Đóng kết nối cơ sở dữ liệu
    await sequelize.close();
  }
}

// Thực thi kiểm thử Bước 5
runStep5Tests();
