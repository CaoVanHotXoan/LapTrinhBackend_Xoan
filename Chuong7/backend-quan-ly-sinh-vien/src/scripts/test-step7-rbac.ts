// ==============================================================================
// SCRIPT TỰ ĐỘNG KIỂM THỬ BƯỚC 7: MA TRẬN PHÂN QUYỀN RBAC (12 CA TEST B01 - B12)
// File: src/scripts/test-step7-rbac.ts
// Mục đích: Kiểm chứng toàn diện việc bảo vệ các Route SinhVien bằng isAuth và isAdmin
// ==============================================================================

// Nạp các biến môi trường từ file .env
import 'dotenv/config';

// Import framework express để dựng test server
import express from 'express';

// Import middleware helmet bảo mật
import helmet from 'helmet';

// Import middleware cors
import cors from 'cors';

// Import đối tượng sequelize để kết nối CSDL
import { sequelize } from '../config/database.js';

// Import router quản lý sinh viên đã được gắn isAuth và isAdmin
import sinhVienRouter from '../routes/sinhVien.routes.js';

// Import middleware xử lý lỗi tập trung
import { errorMiddleware } from '../middlewares/error.middleware.js';

// Import model SinhVien để truy vấn trực tiếp kiểm chứng CSDL
import { SinhVien } from '../models/SinhVien.js';

// Import hàm tạo token để sinh JWT student và admin
import { generateToken } from '../utils/jwt.js';

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

// Gắn sinhVienRouter tại đường dẫn /api/v1/sinh-vien
app.use('/api/v1/sinh-vien', sinhVienRouter);

// Gắn middleware xử lý lỗi tập trung
app.use(errorMiddleware);

// Cấu hình cổng kiểm thử riêng biệt
const TEST_PORT = 5007;

// Địa chỉ URL cơ sở
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Hàm in kết quả kiểm thử trực quan kèm chi tiết
function printResult(code: string, desc: string, pass: boolean, detail: string): void {
  // Biểu tượng đánh dấu kết quả
  const icon = pass ? '✅ [PASS]' : '❌ [FAIL]';
  // In mã ca test và mô tả
  console.log(`${icon} ${code}: ${desc}`);
  // In chi tiết thực tế
  console.log(`   └─> ${detail}\n`);
}

// Hàm chính điều phối quá trình kiểm thử 12 ca B01 - B12
async function runStep7Tests(): Promise<void> {
  // Biến lưu tham chiếu đến HTTP Server
  let server: Server | null = null;

  try {
    // 1. Kiểm tra kết nối tới cơ sở dữ liệu SQL Server
    await sequelize.authenticate();
    // In thông báo kết nối thành công
    console.log('===============================================================');
    console.log('🚀 BẮT ĐẦU KIỂM THỬ BƯỚC 7: MA TRẬN PHÂN QUYỀN B01 - B12');
    console.log('===============================================================\n');

    // 2. Chuẩn bị token kiểm thử
    const studentToken = generateToken({ id: 101, role: 'student' });
    const adminToken = generateToken({ id: 1, role: 'admin' });

    // Header cho các quyền tương ứng
    const studentHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    };
    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };

    // 3. Chuẩn bị dữ liệu mẫu trong DB: đảm bảo SV001 tồn tại và dọn dẹp SV088, SV099
    await SinhVien.destroy({ where: { maSV: ['SV088', 'SV099'] } });
    const sv001Exists = await SinhVien.findByPk('SV001');
    if (!sv001Exists) {
      await SinhVien.create({
        maSV: 'SV001',
        hoTen: 'Nguyen Van A',
        email: 'nguyenvana@example.com',
        maLop: '25CT114'
      });
    }

    // 4. Khởi động server kiểm thử
    await new Promise<void>((resolve) => {
      server = app.listen(TEST_PORT, () => {
        resolve();
      });
    });

    // --------------------------------------------------------------------------
    // B01: GET danh sách sinh viên, không JWT (Kỳ vọng: 200 OK, data là mảng)
    // --------------------------------------------------------------------------
    const resB01 = await fetch(`${BASE_URL}/api/v1/sinh-vien`);
    const dataB01 = await resB01.json() as { success: boolean; data: unknown[] };
    const passB01 = resB01.status === 200 && Array.isArray(dataB01.data);
    printResult(
      'B01',
      'GET danh sách không cần JWT -> Giữ PUBLIC 200 OK, data là mảng',
      passB01,
      `Status: ${resB01.status} | Số lượng sinh viên: ${dataB01.data?.length}`
    );

    // --------------------------------------------------------------------------
    // B02: POST SinhVien không có JWT (Kỳ vọng: 401 Unauthorized, không INSERT)
    // --------------------------------------------------------------------------
    const resB02 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maSV: 'SV099', hoTen: 'Test', email: 'test@example.com', maLop: '25CT114' })
    });
    const sv099InDbB02 = await SinhVien.findByPk('SV099');
    const passB02 = resB02.status === 401 && sv099InDbB02 === null;
    printResult(
      'B02',
      'POST SinhVien không có JWT -> Bị chặn 401, không INSERT vào DB',
      passB02,
      `Status: ${resB02.status} | Kiểm chứng DB: Bản ghi SV099 không tồn tại`
    );

    // --------------------------------------------------------------------------
    // B03: PUT SinhVien với token không hợp lệ (Kỳ vọng: 401 Unauthorized, giá trị cũ không đổi)
    // --------------------------------------------------------------------------
    const sv001BeforeB03 = await SinhVien.findByPk('SV001');
    const resB03 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token-sai-dinh-dang'
      },
      body: JSON.stringify({ hoTen: 'Ten Bi Sua Trai Phep', email: 'nguyenvana@example.com', maLop: '25CT114' })
    });
    const sv001AfterB03 = await SinhVien.findByPk('SV001');
    const passB03 = resB03.status === 401 && sv001BeforeB03?.hoTen === sv001AfterB03?.hoTen;
    printResult(
      'B03',
      'PUT SinhVien với token sai -> Bị chặn 401, dữ liệu cũ giữ nguyên vẹn',
      passB03,
      `Status: ${resB03.status} | Họ tên trong DB vẫn là: "${sv001AfterB03?.hoTen}"`
    );

    // --------------------------------------------------------------------------
    // B04: DELETE SinhVien với JWT student (Kỳ vọng: 403 Forbidden, SinhVien vẫn tồn tại)
    // --------------------------------------------------------------------------
    const resB04 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV001`, {
      method: 'DELETE',
      headers: studentHeaders
    });
    const sv001AfterB04 = await SinhVien.findByPk('SV001');
    const passB04 = resB04.status === 403 && sv001AfterB04 !== null;
    printResult(
      'B04',
      'DELETE SinhVien bằng tài khoản student -> Bị chặn 403, bản ghi vẫn tồn tại',
      passB04,
      `Status: ${resB04.status} | Kiểm chứng DB: SV001 vẫn tồn tại nguyên vẹn`
    );

    // --------------------------------------------------------------------------
    // B05: POST SinhVien với JWT student (Kỳ vọng: 403 Forbidden, không INSERT)
    // --------------------------------------------------------------------------
    const resB05 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ maSV: 'SV099', hoTen: 'Student Added', email: 'stu@example.com', maLop: '25CT114' })
    });
    const sv099AfterB05 = await SinhVien.findByPk('SV099');
    const passB05 = resB05.status === 403 && sv099AfterB05 === null;
    printResult(
      'B05',
      'POST SinhVien bằng tài khoản student -> Bị chặn 403, không INSERT',
      passB05,
      `Status: ${resB05.status} | Kiểm chứng DB: Không có bản ghi SV099 nào được tạo`
    );

    // --------------------------------------------------------------------------
    // B06: PUT SinhVien với JWT student (Kỳ vọng: 403 Forbidden, không UPDATE)
    // --------------------------------------------------------------------------
    const sv001BeforeB06 = await SinhVien.findByPk('SV001');
    const resB06 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV001`, {
      method: 'PUT',
      headers: studentHeaders,
      body: JSON.stringify({ hoTen: 'Hacked By Student', email: 'hacked@example.com', maLop: '25CT114' })
    });
    const sv001AfterB06 = await SinhVien.findByPk('SV001');
    const passB06 = resB06.status === 403 && sv001BeforeB06?.hoTen === sv001AfterB06?.hoTen;
    printResult(
      'B06',
      'PUT SinhVien bằng tài khoản student -> Bị chặn 403, không UPDATE',
      passB06,
      `Status: ${resB06.status} | Dữ liệu DB không hề bị thay đổi`
    );

    // --------------------------------------------------------------------------
    // B07: POST SinhVien hợp lệ với JWT admin (Kỳ vọng: 201 Created, GET lại thấy bản ghi mới)
    // --------------------------------------------------------------------------
    const resB07 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ maSV: 'SV088', hoTen: 'Nguyen Admin Test', email: 'admintest@example.com', maLop: '25CT114' })
    });
    const sv088InDbB07 = await SinhVien.findByPk('SV088');
    const passB07 = resB07.status === 201 && sv088InDbB07 !== null;
    printResult(
      'B07',
      'POST SinhVien bằng tài khoản admin -> Thành công 201 Created, ghi thật vào DB',
      passB07,
      `Status: ${resB07.status} | Kiểm chứng DB: Tìm thấy SV088 vừa tạo`
    );

    // --------------------------------------------------------------------------
    // B08: PUT SinhVien hợp lệ với JWT admin (Kỳ vọng: 200 OK, GET lại thấy thay đổi)
    // --------------------------------------------------------------------------
    const resB08 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV088`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ hoTen: 'Nguyen Admin Updated', email: 'admintest@example.com', maLop: '25CT114' })
    });
    const sv088InDbB08 = await SinhVien.findByPk('SV088');
    const passB08 = resB08.status === 200 && sv088InDbB08?.hoTen === 'Nguyen Admin Updated';
    printResult(
      'B08',
      'PUT SinhVien bằng tài khoản admin -> Thành công 200 OK, cập nhật thật vào DB',
      passB08,
      `Status: ${resB08.status} | Họ tên mới trong DB: "${sv088InDbB08?.hoTen}"`
    );

    // --------------------------------------------------------------------------
    // B09: DELETE SinhVien với JWT admin (Kỳ vọng: 200 OK, GET lại trả 404)
    // --------------------------------------------------------------------------
    const resB09 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV088`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    const sv088InDbB09 = await SinhVien.findByPk('SV088');
    const passB09 = resB09.status === 200 && sv088InDbB09 === null;
    printResult(
      'B09',
      'DELETE SinhVien bằng tài khoản admin -> Thành công 200 OK, bản ghi bị xóa thật khỏi DB',
      passB09,
      `Status: ${resB09.status} | Kiểm chứng DB: SV088 không còn tồn tại`
    );

    // --------------------------------------------------------------------------
    // B10: Admin POST body sai Zod (Kỳ vọng: 400 Bad Request, errors chỉ ra lỗi)
    // --------------------------------------------------------------------------
    const resB10 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ maSV: 'SV099', hoTen: '', email: 'email-sai', maLop: '25CT114' })
    });
    const dataB10 = await resB10.json() as { success: boolean; errors?: { field: string }[] };
    const passB10 = resB10.status === 400 && Array.isArray(dataB10.errors) && dataB10.errors.length > 0;
    printResult(
      'B10',
      'Admin POST body sai định dạng Zod -> Bị chặn 400 Bad Request kèm mảng errors',
      passB10,
      `Status: ${resB10.status} | Zod validation vẫn hoạt động chính xác cho Admin`
    );

    // --------------------------------------------------------------------------
    // B11: Admin POST mã bị trùng khóa chính (Kỳ vọng: 409 Conflict)
    // --------------------------------------------------------------------------
    const resB11 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ maSV: 'SV001', hoTen: 'Trùng Khóa Chính', email: 'trung@example.com', maLop: '25CT114' })
    });
    const passB11 = resB11.status === 409;
    printResult(
      'B11',
      'Admin POST mã SV001 đã tồn tại -> Báo lỗi 409 Conflict, không tạo trùng lặp',
      passB11,
      `Status: ${resB11.status} | Quy tắc dữ liệu cũ được bảo toàn`
    );

    // --------------------------------------------------------------------------
    // B12: DELETE cùng mã lần thứ 2 bằng Admin (Kỳ vọng: 404 Not Found)
    // --------------------------------------------------------------------------
    const resB12 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV088`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    const passB12 = resB12.status === 404;
    printResult(
      'B12',
      'DELETE cùng mã SV088 lần thứ 2 bằng Admin -> Báo lỗi 404 Not Found',
      passB12,
      `Status: ${resB12.status} | Đúng chuẩn RESTful (Không còn dữ liệu để xóa)`
    );

    // --------------------------------------------------------------------------
    // Tổng kết kiểm thử Bước 7
    // --------------------------------------------------------------------------
    if (
      passB01 && passB02 && passB03 && passB04 && passB05 && passB06 &&
      passB07 && passB08 && passB09 && passB10 && passB11 && passB12
    ) {
      console.log('===============================================================');
      console.log('🎉 TẤT CẢ 12 CA TEST PHÂN QUYỀN (B01 - B12) ĐÃ PASS 100%!');
      console.log('===============================================================');
    } else {
      console.error('⚠️ Có ca kiểm thử chưa đạt yêu cầu của Bước 7!');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Lỗi khi chạy kiểm thử Bước 7:', error);
  } finally {
    if (server) {
      (server as Server).close();
    }
    await sequelize.close();
  }
}

// Thực thi kiểm thử Bước 7
runStep7Tests();
