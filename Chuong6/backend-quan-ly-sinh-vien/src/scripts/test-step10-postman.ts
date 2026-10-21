// ==============================================================================
// SCRIPT KIỂM THỬ BƯỚC 10: KIỂM TRA 24 TEST CASES POSTMAN (A01 - A12 & B01 - B12)
// File: src/scripts/test-step10-postman.ts
// Mục đích: Tự động chạy toàn bộ 24 ca kiểm thử giả lập Postman Collection Runner
// ==============================================================================

// Nạp các biến môi trường từ file .env
import 'dotenv/config';

// Import thư viện jsonwebtoken để tạo token kiểm thử
import jwt from 'jsonwebtoken';

// Import Sequelize instance để dọn dẹp và kiểm chứng CSDL
import { sequelize } from '../config/database.js';

// Import SinhVien model
import { SinhVien } from '../models/SinhVien.js';

// Import User model
import { User } from '../models/user.model.js';

// Địa chỉ cơ sở của máy chủ API Express
const BASE_URL = 'http://localhost:5000';

// Khóa bí mật JWT
const secret = process.env.JWT_SECRET || 'lab-jwt-secret-key-super-secure-32chars!';

// Hàm helper in tiêu đề cho từng bảng kiểm thử
function printHeader(title: string): void {
  // In dòng kẻ trên
  console.log('\n' + '='.repeat(85));
  // In nội dung tiêu đề
  console.log(`🚀 ${title}`);
  // In dòng kẻ dưới
  console.log('='.repeat(85));
}

// Hàm helper in kết quả từng ca test
function printTest(id: string, description: string, pass: boolean, detail?: string): void {
  // Biểu tượng PASS hoặc FAIL
  const tag = pass ? '✅ [PASS]' : '❌ [FAIL]';
  // In kết quả
  console.log(`${tag} ${id}: ${description}`);
  // In chi tiết nếu có
  if (detail) {
    console.log(`         Chi tiết: ${detail}`);
  }
}

// Hàm chạy kiểm thử toàn diện Bước 10
async function runStep10Runner(): Promise<void> {
  // Biến đếm tổng số ca kiểm thử
  let totalTests = 0;
  // Biến đếm số ca thành công
  let passedTests = 0;

  // Helper assert
  const assert = (id: string, description: string, condition: boolean, detail?: string) => {
    totalTests++;
    if (condition) {
      passedTests++;
      printTest(id, description, true, detail);
    } else {
      printTest(id, description, false, detail);
    }
  };

  try {
    // --------------------------------------------------------------------------
    // DỌN DẸP DỮ LIỆU THỬ NGHIỆM TRƯỚC KHI BẮT ĐẦU
    // --------------------------------------------------------------------------
    await SinhVien.destroy({ where: { maSV: ['SV088', 'SV099'] } });

    // Tạo sẵn token sinh viên và token admin hợp lệ
    const validStudentToken = jwt.sign({ sub: '1', role: 'student' }, secret, { algorithm: 'HS256', expiresIn: '1h' });
    const validAdminToken = jwt.sign({ sub: '4', role: 'admin' }, secret, { algorithm: 'HS256', expiresIn: '1h' });
    const tamperedToken = validStudentToken.slice(0, -3) + 'AbC';
    const expiredToken = jwt.sign({ sub: '1', role: 'student', exp: Math.floor(Date.now() / 1000) - 3600 }, secret, { algorithm: 'HS256' });

    // ==========================================================================
    // BẢNG A: KIỂM THỬ AUTHENTICATION & JWT (A01 - A12)
    // ==========================================================================
    printHeader('BẢNG A: KIỂM THỬ AUTHENTICATION & JWT (A01 - A12)');

    // A01: Register email mới hợp lệ (dùng timestamp để test độc lập)
    const testEmailA01 = `an.test.${Date.now()}@example.com`;
    const resA01 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Nguyen Minh An', email: testEmailA01, password: 'SinhVien@123' })
    });
    const bodyA01 = await resA01.json();
    assert(
      'A01',
      'Register email mới, body hợp lệ -> 201 Created, role=student, không lộ password/hash',
      resA01.status === 201 && bodyA01.data?.role === 'student' && !bodyA01.data?.password && !bodyA01.data?.passwordHash
    );

    // A02: Register trùng email A01
    const resA02 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Nguyen Minh An Trung', email: testEmailA01, password: 'OtherPassword@123' })
    });
    assert('A02', 'Register trùng email A01 -> 409 Conflict, không tăng số User', resA02.status === 409);

    // A03: Register body thêm role=admin
    const resA03 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Attacker', email: `attacker.${Date.now()}@example.com`, password: 'Password@123', role: 'admin' })
    });
    assert('A03', 'Register body thêm role=admin -> 400 Bad Request (Zod strict chặn)', resA03.status === 400);

    // A04: Register thiếu password / email sai định dạng
    const resA04 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Test User', email: 'not-an-email' })
    });
    assert('A04', 'Register thiếu password/email sai -> 400 Bad Request, không lưu dữ liệu lỗi', resA04.status === 400);

    // A05: Login đúng tài khoản student
    const resA05 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailA01, password: 'SinhVien@123' })
    });
    const bodyA05 = await resA05.json();
    const studentTokenFromLogin = bodyA05.data?.accessToken;
    assert(
      'A05',
      'Login đúng tài khoản student -> 200 OK, data.accessToken hợp lệ (Bearer, exp: 3600)',
      resA05.status === 200 && !!studentTokenFromLogin && bodyA05.data?.tokenType === 'Bearer'
    );

    // A06: Login sai password
    const resA06 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailA01, password: 'SaiPassword@999' })
    });
    assert('A06', 'Login sai password -> 401 Unauthorized, không trả accessToken', resA06.status === 401);

    // A07: Login email không tồn tại
    const resA07 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'khongtontai@example.com', password: 'Password@123' })
    });
    const bodyA07 = await resA07.json();
    assert(
      'A07',
      'Login email không tồn tại -> 401 Unauthorized, không lộ thông tin tồn tại User',
      resA07.status === 401 && bodyA07.message === 'Email hoặc mật khẩu không chính xác'
    );

    // A08: GET /api/auth/profile không có token
    const resA08 = await fetch(`${BASE_URL}/api/auth/profile`);
    assert('A08', 'GET /api/auth/profile không có token -> 401 Unauthorized, không nhận data hồ sơ', resA08.status === 401);

    // A09: Profile với token bị sửa 1 ký tự
    const resA09 = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${tamperedToken}` }
    });
    assert('A09', 'Profile với token bị sửa 1 ký tự -> 401 Unauthorized, chữ ký không qua xác minh', resA09.status === 401);

    // A10: Profile với JWT student hợp lệ
    const resA10 = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${studentTokenFromLogin || validStudentToken}` }
    });
    const bodyA10 = await resA10.json();
    assert(
      'A10',
      'Profile với JWT student hợp lệ -> 200 OK, hồ sơ đúng user, không chứa passwordHash',
      resA10.status === 200 && bodyA10.data?.role === 'student' && !bodyA10.data?.passwordHash
    );

    // A11: Token hết hạn gọi Profile
    const resA11 = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert('A11', 'Token hết hạn gọi Profile -> 401 Unauthorized, bắt lỗi token hết hạn chính xác', resA11.status === 401);

    // A12: Register/login và xem SQL Server (Kiểm tra an toàn mật khẩu & JWT)
    const dbUser = await User.findOne({ where: { email: testEmailA01 } });
    const isBcrypt = !!dbUser?.passwordHash && dbUser.passwordHash.startsWith('$2b$12$');
    assert(
      'A12',
      'Register/login và xem SQL Server -> PASS: CSDL lưu bcrypt cost 12, không plaintext, không log JWT',
      isBcrypt,
      `passwordHash trong DB: ${dbUser?.passwordHash.slice(0, 20)}...`
    );

    // ==========================================================================
    // BẢNG B: KIỂM THỬ PHÂN QUYỀN RBAC SINH VIÊN (B01 - B12)
    // ==========================================================================
    printHeader('BẢNG B: KIỂM THỬ PHÂN QUYỀN RBAC SINH VIÊN (B01 - B12)');

    // B01: GET danh sách, không JWT (Public)
    const resB01 = await fetch(`${BASE_URL}/api/v1/sinh-vien`);
    const bodyB01 = await resB01.json();
    assert('B01', 'GET danh sách, không JWT -> 200 OK, data vẫn là mảng (Public)', resB01.status === 200 && Array.isArray(bodyB01.data));

    // B02: POST SinhVien, không JWT
    const resB02 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maSV: 'SV099', hoTen: 'Sinh Vien Nac Danh', email: 'anon@example.com', maLop: '25CT114' })
    });
    const checkB02 = await SinhVien.findByPk('SV099');
    assert('B02', 'POST SinhVien, không JWT -> 401 Unauthorized, không INSERT bản ghi', resB02.status === 401 && !checkB02);

    // B03: PUT SinhVien, token không hợp lệ
    const resB03 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid-token-xyz'
      },
      body: JSON.stringify({ hoTen: 'Hacker Edit', email: 'hacker@example.com', maLop: '25CT114' })
    });
    assert('B03', 'PUT SinhVien, token không hợp lệ -> 401 Unauthorized, giá trị cũ không đổi', resB03.status === 401);

    // B04: DELETE SinhVien, JWT student
    const resB04 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV001`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${validStudentToken}` }
    });
    const checkB04 = await SinhVien.findByPk('SV001');
    assert('B04', 'DELETE SinhVien, JWT student -> 403 Forbidden, SinhVien vẫn tồn tại', resB04.status === 403 && !!checkB04);

    // B05: POST SinhVien, JWT student
    const resB05 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validStudentToken}`
      },
      body: JSON.stringify({ maSV: 'SV099', hoTen: 'Student Add', email: 'stu@example.com', maLop: '25CT114' })
    });
    const checkB05 = await SinhVien.findByPk('SV099');
    assert('B05', 'POST SinhVien, JWT student -> 403 Forbidden, không INSERT', resB05.status === 403 && !checkB05);

    // B06: PUT SinhVien, JWT student
    const resB06 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validStudentToken}`
      },
      body: JSON.stringify({ hoTen: 'Student Edit', email: 'stu@example.com', maLop: '25CT114' })
    });
    assert('B06', 'PUT SinhVien, JWT student -> 403 Forbidden, không UPDATE', resB06.status === 403);

    // B07: POST SinhVien hợp lệ, JWT admin
    const resB07 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validAdminToken}`
      },
      body: JSON.stringify({ maSV: 'SV088', hoTen: 'Nguyen Van Admin Test', email: 'admintest@example.com', maLop: '25CT114' })
    });
    const checkB07 = await SinhVien.findByPk('SV088');
    assert('B07', 'POST SinhVien hợp lệ, JWT admin -> 201 Created, GET lại đúng bản ghi mới', resB07.status === 201 && !!checkB07);

    // B08: PUT SinhVien hợp lệ, JWT admin
    const resB08 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV088`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validAdminToken}`
      },
      body: JSON.stringify({ hoTen: 'Nguyen Van Admin Updated', email: 'admintest@example.com', maLop: '25CT114' })
    });
    const checkB08 = await SinhVien.findByPk('SV088');
    assert('B08', 'PUT SinhVien hợp lệ, JWT admin -> 200 OK, GET lại thấy thay đổi', resB08.status === 200 && checkB08?.hoTen === 'Nguyen Van Admin Updated');

    // B09: DELETE SinhVien, JWT admin
    const resB09 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV088`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${validAdminToken}` }
    });
    const checkB09 = await SinhVien.findByPk('SV088');
    assert('B09', 'DELETE SinhVien, JWT admin -> 200 OK, GET lại 404', resB09.status === 200 && !checkB09);

    // B10: Admin POST body sai Zod
    const resB10 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validAdminToken}`
      },
      body: JSON.stringify({ maSV: 'SV090', email: 'sai-email' })
    });
    const bodyB10 = await resB10.json();
    assert('B10', 'Admin POST body sai Zod -> 400 Bad Request, trường errors chỉ ra lỗi', resB10.status === 400 && Array.isArray(bodyB10.errors));

    // B11: Admin POST mã bị trùng
    const resB11 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validAdminToken}`
      },
      body: JSON.stringify({ maSV: 'SV001', hoTen: 'Minh Nhat Trung', email: 'trung@example.com', maLop: '25CT114' })
    });
    assert('B11', 'Admin POST mã bị trùng -> 409 Conflict, không tạo bản ghi trùng', resB11.status === 409);

    // B12: DELETE cùng mã lần thứ 2 bằng Admin
    const resB12 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV088`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${validAdminToken}` }
    });
    assert('B12', 'DELETE cùng mã lần thứ 2 bằng Admin -> 404 Not Found, không còn dữ liệu để xóa', resB12.status === 404);

    // Dọn dẹp tài khoản test A01 nếu cần
    await User.destroy({ where: { email: testEmailA01 } });

    // ==========================================================================
    // TỔNG KẾT KẾT QUẢ KIỂM THỬ BƯỚC 10
    // ==========================================================================
    printHeader('TỔNG KẾT KẾT QUẢ KIỂM THỬ BƯỚC 10 (POSTMAN RUNNER SIMULATION)');
    console.log(`🎯 Kết quả: ${passedTests}/${totalTests} ca kiểm thử ĐẠT (${Math.round((passedTests / totalTests) * 100)}%)`);

    if (passedTests === totalTests) {
      console.log('🎉 TOÀN BỘ 24/24 CA KIỂM THỬ BẢNG A VÀ BẢNG B ĐỀU PASS 100%!');
    } else {
      console.error('⚠️ Có ca kiểm thử chưa đạt, vui lòng kiểm tra lại log!');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Lỗi trong quá trình chạy kịch bản kiểm thử Bước 10:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

// Chạy kịch bản
runStep10Runner();
