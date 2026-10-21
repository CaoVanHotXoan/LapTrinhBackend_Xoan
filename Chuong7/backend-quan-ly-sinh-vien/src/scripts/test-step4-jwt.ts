// ==============================================================================
// SCRIPT TỰ ĐỘNG KIỂM THỬ BƯỚC 4: MODULE JWT UTILITY (KÝ VÀ XÁC MINH TOKEN)
// File: src/scripts/test-step4-jwt.ts
// Mục đích: Xác minh điểm dừng Bước 4 và kiểm tra tính toàn vẹn của mã hóa JWT
// ==============================================================================

// Nạp các biến môi trường từ file .env
import 'dotenv/config';

// Import các hàm và interface từ module utils/jwt.js
import { generateToken, verifyToken } from '../utils/jwt.js';

// Import thư viện jsonwebtoken để kiểm tra chi tiết các lớp lỗi
import jwt from 'jsonwebtoken';

// Hàm in kết quả kiểm thử trực quan kèm biểu tượng
function printResult(code: string, desc: string, pass: boolean, detail: string): void {
  // Biểu tượng đánh dấu kết quả kiểm tra
  const icon = pass ? '✅ [PASS]' : '❌ [FAIL]';
  // In mã ca kiểm tra và mô tả
  console.log(`${icon} ${code}: ${desc}`);
  // In chi tiết kết quả thực tế
  console.log(`   └─> ${detail}\n`);
}

// Hàm chính thực thi toàn bộ các ca kiểm thử cho Bước 4
function runStep4Tests(): void {
  // In tiêu đề bắt đầu kiểm thử
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ BƯỚC 4: MODULE JWT UTILITY (SRC/UTILS/JWT.TS)');
  console.log('===============================================================\n');

  // --------------------------------------------------------------------------
  // Ca 1: Tạo token hợp lệ và kiểm tra định dạng 3 phần (header.payload.signature)
  // --------------------------------------------------------------------------
  // Gọi hàm generateToken với đối tượng đầu vào
  const token = generateToken({ id: 10, role: 'student' });
  // Tách token thành các phần dựa trên dấu chấm
  const parts = token.split('.');
  // Kiểm tra điều kiện: token phải có chính xác 3 phần
  const passCa1 = parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0;
  // In kết quả ca 1
  printResult(
    'JWT-01',
    'Tạo token hợp lệ có cấu trúc chuẩn 3 phần (header.payload.signature)',
    passCa1,
    `Token: ${token.substring(0, 30)}... | Số phần tách bởi dấu chấm: ${parts.length}`
  );

  // --------------------------------------------------------------------------
  // Ca 2: Xác minh token nguyên bản bằng verifyToken
  // --------------------------------------------------------------------------
  // Khai báo biến lưu payload sau giải mã
  let decodedPayload: { sub: string; role: string } | null = null;
  // Khai báo biến cờ trạng thái ca 2
  let passCa2 = false;
  try {
    // Gọi hàm verifyToken để giải mã
    decodedPayload = verifyToken(token);
    // Kiểm tra sub trùng với id (dạng chuỗi) và role là student
    passCa2 = decodedPayload.sub === '10' && decodedPayload.role === 'student';
  } catch (error) {
    // Đánh dấu thất bại nếu xảy ra lỗi giải mã
    passCa2 = false;
  }
  // In kết quả ca 2
  printResult(
    'JWT-02',
    'Xác minh token nguyên bản hợp lệ (verifyToken)',
    passCa2,
    `sub: ${decodedPayload?.sub} | role: ${decodedPayload?.role} | Chữ ký hợp lệ 100%`
  );

  // --------------------------------------------------------------------------
  // Ca 3: Điểm dừng Bước 4 - Thay đổi 1 ký tự trong token rồi xác minh phải thất bại
  // --------------------------------------------------------------------------
  // Lấy ký tự cuối cùng của chuỗi chữ ký
  const lastChar = token.slice(-1);
  // Thay thế ký tự cuối bằng một ký tự khác ('A' hoặc 'B')
  const newLastChar = lastChar === 'A' ? 'B' : 'A';
  // Tạo token đã bị sửa đổi chữ ký
  const tamperedToken = token.slice(0, -1) + newLastChar;
  // Khai báo cờ trạng thái ca 3
  let passCa3 = false;
  // Khai báo thông điệp lỗi bắt được
  let errorMessageCa3 = '';
  try {
    // Cố tình xác minh token đã bị sửa
    verifyToken(tamperedToken);
    // Nếu không ném lỗi tức là bảo mật thất bại
    passCa3 = false;
  } catch (error) {
    // Bắt được lỗi chữ ký không hợp lệ từ jsonwebtoken
    passCa3 = error instanceof jwt.JsonWebTokenError;
    // Lưu lại thông báo lỗi
    errorMessageCa3 = (error as Error).message;
  }
  // In kết quả ca 3 (Điểm dừng then chốt của Bước 4)
  printResult(
    'JWT-03 [ĐIỂM DỪNG]',
    'Thay đổi 1 ký tự trong token -> Xác minh PHẢI THẤT BẠI',
    passCa3,
    `Đã chặn thành công token bị sửa! Báo lỗi: "${errorMessageCa3}"`
  );

  // --------------------------------------------------------------------------
  // Ca 4: Thử nghiệm sửa đổi payload (giả mạo role từ student thành admin)
  // --------------------------------------------------------------------------
  // Khai báo cờ trạng thái ca 4
  let passCa4 = false;
  // Khai báo thông báo lỗi bắt được
  let errorMessageCa4 = '';
  // Giải mã chuỗi payload base64url thành object JavaScript
  const payloadObj = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { sub: string; role: string };
  // Cố tình sửa đổi vai trò từ student thành admin nhằm leo thang đặc quyền
  payloadObj.role = 'admin';
  // Mã hóa ngược lại payload đã bị sửa thành chuỗi base64url
  const tamperedPayloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  // Ghép lại thành token giả mạo với chữ ký cũ
  const tamperedPayloadToken = `${parts[0]}.${tamperedPayloadB64}.${parts[2]}`;
  try {
    // Xác minh token bị giả mạo payload
    verifyToken(tamperedPayloadToken);
    // Nếu lọt qua là lỗi bảo mật nghiêm trọng
    passCa4 = false;
  } catch (error) {
    // Bắt được lỗi chữ ký không khớp do payload bị thay đổi
    passCa4 = error instanceof jwt.JsonWebTokenError;
    // Lưu lại thông điệp lỗi
    errorMessageCa4 = (error as Error).message;
  }
  // In kết quả ca 4
  printResult(
    'JWT-04',
    'Giả mạo dữ liệu trong payload -> verifyToken phát hiện vi phạm tính toàn vẹn',
    passCa4,
    `Chống giả mạo vai trò thành công! Báo lỗi: "${errorMessageCa4}"`
  );

  // --------------------------------------------------------------------------
  // Ca 5: Kiểm tra overload thứ 2 của hàm generateToken(id, role)
  // --------------------------------------------------------------------------
  // Gọi hàm generateToken theo cú pháp truyền 2 tham số
  const tokenOverload = generateToken(99, 'admin');
  // Giải mã token vừa tạo
  const decodedOverload = verifyToken(tokenOverload);
  // Kiểm tra kết quả giải mã
  const passCa5 = decodedOverload.sub === '99' && decodedOverload.role === 'admin';
  // In kết quả ca 5
  printResult(
    'JWT-05',
    'Kiểm tra tính linh hoạt của overload generateToken(id, role)',
    passCa5,
    `sub: ${decodedOverload.sub} | role: ${decodedOverload.role}`
  );

  // --------------------------------------------------------------------------
  // Tổng kết kiểm thử Bước 4
  // --------------------------------------------------------------------------
  if (passCa1 && passCa2 && passCa3 && passCa4 && passCa5) {
    console.log('===============================================================');
    console.log('🎉 TẤT CẢ CÁC ĐIỀU KIỆN VÀ ĐIỂM DỪNG BƯỚC 4 ĐÃ ĐẠT 100%!');
    console.log('===============================================================');
  } else {
    console.error('⚠️ Có ca kiểm thử chưa đạt yêu cầu của Bước 4!');
    process.exitCode = 1;
  }
}

// Chạy hàm kiểm thử Bước 4
runStep4Tests();
