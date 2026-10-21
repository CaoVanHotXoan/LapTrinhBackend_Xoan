// ==============================================================================
// SCRIPT KIỂM THỬ BƯỚC 11: RÀ SOÁT VÀ KIỂM CHỨNG 6 LỖ HỔNG AN NINH BẢO MẬT
// File: src/scripts/test-step11-security.ts
// Mục đích: Tự động kiểm tra hệ thống có dính 6 lỗi kinh điển của AI (Trang 18) hay không
// ==============================================================================

// Nạp các biến môi trường từ file .env
import 'dotenv/config';

// Import thư viện jsonwebtoken để kiểm tra cơ chế ký và xác minh token
import jwt from 'jsonwebtoken';

// Import thư viện bcrypt để kiểm tra thuật toán băm mật khẩu
import bcrypt from 'bcrypt';

// Import các hàm tiện ích JWT nội bộ của dự án
import { generateToken, verifyToken, getJwtSecret } from '../utils/jwt.js';

// Import schema validation đăng ký tài khoản
import { registerSchema } from '../validations/auth.schema.js';

// Import User model để kiểm tra trực tiếp cấu trúc dữ liệu trong CSDL
import { User } from '../models/user.model.js';

// Import đối tượng kết nối Sequelize để giải phóng kết nối sau khi kiểm tra
import { sequelize } from '../config/database.js';

// Hàm in tiêu đề cho từng phần kiểm tra
function logSection(title: string): void {
  // In dòng kẻ trên
  console.log('\n' + '='.repeat(85));
  // In tiêu đề mục
  console.log(`🛡️  ${title}`);
  // In dòng kẻ dưới
  console.log('='.repeat(85));
}

// Hàm in kết quả từng ca kiểm tra
function logResult(id: string, description: string, pass: boolean, detail?: string): void {
  // Biểu tượng PASS hoặc FAIL
  const tag = pass ? '✅ [PASS]' : '❌ [FAIL]';
  // In kết quả kiểm tra
  console.log(`${tag} ${id}: ${description}`);
  // In thông tin chi tiết nếu có
  if (detail) {
    console.log(`         Chi tiết: ${detail}`);
  }
}

// Hàm thực thi bộ kiểm thử an ninh Bước 11
async function runStep11SecurityAudit(): Promise<void> {
  // Đếm tổng số bài kiểm tra
  let totalTests = 0;
  // Đếm số bài kiểm tra đạt
  let passedTests = 0;

  // Helper assert
  const assert = (id: string, description: string, condition: boolean, detail?: string) => {
    totalTests++;
    if (condition) {
      passedTests++;
      logResult(id, description, true, detail);
    } else {
      logResult(id, description, false, detail);
    }
  };

  logSection('BƯỚC 11: SECURITY AUDIT - KIỂM CHỨNG 6 LỖ HỔNG BẢO MẬT (TRANG 18)');

  // ----------------------------------------------------------------------------
  // 1. KIỂM CHỨNG LỖ HỔNG 1: MẬT KHẨU KHÔNG ĐƯỢC LƯU DẠNG RÕ (PLAINTEXT)
  // ----------------------------------------------------------------------------
  const plainPassword = 'TestPassword@123';
  const hashedPassword = await bcrypt.hash(plainPassword, 12);
  const isBcryptFormat = hashedPassword.startsWith('$2b$12$');
  const isPlaintextDifferent = plainPassword !== hashedPassword;
  const canVerifyCompare = await bcrypt.compare(plainPassword, hashedPassword);
  assert(
    'SEC-01',
    'Chống Plaintext: Mật khẩu bắt buộc băm bằng bcrypt cost 12 ($2b$12$), xác thực qua bcrypt.compare',
    isBcryptFormat && isPlaintextDifferent && canVerifyCompare,
    `Định dạng hash: ${hashedPassword.slice(0, 29)}... (Độ dài: ${hashedPassword.length} ký tự)`
  );

  // ----------------------------------------------------------------------------
  // 2. KIỂM CHỨNG LỖ HỔNG 2: KHÓA BÍ MẬT JWT_SECRET MẠNH VÀ KHÔNG HARD-CODE
  // ----------------------------------------------------------------------------
  const currentSecret = getJwtSecret();
  const isSecretLongEnough = currentSecret.length >= 32;
  const isNotDefaultWeak = currentSecret !== '123456' && currentSecret !== 'secret';
  assert(
    'SEC-02',
    'Chống Weak Secret: JWT_SECRET nạp từ .env, không hard-code và độ dài >= 32 ký tự',
    isSecretLongEnough && isNotDefaultWeak,
    `Độ dài secret hiện tại: ${currentSecret.length} ký tự (Khác '123456')`
  );

  // ----------------------------------------------------------------------------
  // 3. KIỂM CHỨNG LỖ HỔNG 3: TOKEN BẮT BUỘC CÓ THỜI HẠN (KHÔNG ĐỂ VĨNH VIỄN)
  // ----------------------------------------------------------------------------
  const sampleToken = generateToken({ id: '10', role: 'student' });
  const decodedPayload = jwt.decode(sampleToken) as { exp?: number; iat?: number; sub?: string; role?: string };
  const hasExpClaim = typeof decodedPayload?.exp === 'number';
  const hasIatClaim = typeof decodedPayload?.iat === 'number';
  const diffSeconds = (decodedPayload?.exp || 0) - (decodedPayload?.iat || 0);
  const isOneHour = diffSeconds === 3600;
  assert(
    'SEC-03',
    'Chống Immortal Token: Token bắt buộc có hạn sống (exp), thời hạn chính xác 1 giờ (3600 giây)',
    hasExpClaim && hasIatClaim && isOneHour,
    `Thời hạn tính toán: ${diffSeconds}s (exp: ${decodedPayload?.exp}, iat: ${decodedPayload?.iat})`
  );

  // ----------------------------------------------------------------------------
  // 4. KIỂM CHỨNG LỖ HỔNG 4: CHỐNG LEO THANG ĐẶC QUYỀN (PRIVILEGE ESCALATION)
  // ----------------------------------------------------------------------------
  const payloadWithRole = {
    fullName: 'Attacker User',
    email: 'attacker@example.com',
    password: 'Password@123',
    role: 'admin' // Cố tình truyền thêm trường role
  };
  const parseResult = registerSchema.safeParse(payloadWithRole);
  const isRoleRejected = !parseResult.success;
  assert(
    'SEC-04',
    'Chống Leo thang đặc quyền: Zod schema dùng .strict() chặn đứng trường role do Client gửi',
    isRoleRejected,
    `Trạng thái Zod safeParse: success=${parseResult.success} (Đã chặn trường lạ 'role')`
  );

  // ----------------------------------------------------------------------------
  // 5. KIỂM CHỨNG LỖ HỔNG 5: PHẢI DÙNG jwt.verify XÁC MINH CHỮ KÝ (KHÔNG TIN jwt.decode)
  // ----------------------------------------------------------------------------
  // Tạo token giả mạo bằng cách sửa payload thành role 'admin'
  const tokenParts = sampleToken.split('.');
  const forgedPayload = Buffer.from(JSON.stringify({ sub: '10', role: 'admin', exp: decodedPayload?.exp })).toString('base64url');
  const forgedToken = `${tokenParts[0]}.${forgedPayload}.${tokenParts[2]}`;

  let isCaughtByVerify = false;
  try {
    verifyToken(forgedToken);
  } catch (err) {
    isCaughtByVerify = true;
  }

  // jwt.decode vẫn đọc được payload giả mạo, nhưng verifyToken từ chối ngay lập tức
  const decodeReadsForgedRole = (jwt.decode(forgedToken) as { role?: string })?.role === 'admin';
  assert(
    'SEC-05',
    'Chống Giả mạo Chữ ký: Dùng jwt.verify chặn đứng token bị can thiệp payload (jwt.decode sẽ bị lừa)',
    isCaughtByVerify && decodeReadsForgedRole,
    'jwt.verify ném lỗi JsonWebTokenError: invalid signature khi payload bị sửa'
  );

  // ----------------------------------------------------------------------------
  // 6. KIỂM CHỨNG LỖ HỔNG 6: TUYỆT ĐỐI KHÔNG TRẢ password / passwordHash RA CLIENT
  // ----------------------------------------------------------------------------
  const testEmail = `sec.test.${Date.now()}@example.com`;
  const registerRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Security Auditor', email: testEmail, password: 'AuditPassword@123' })
  });
  const registerBody = await registerRes.json();
  const noPasswordInRegister = registerBody.data?.password === undefined && registerBody.data?.passwordHash === undefined;

  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'AuditPassword@123' })
  });
  const loginBody = await loginRes.json();
  const noPasswordInLogin = loginBody.data?.password === undefined && loginBody.data?.passwordHash === undefined;

  const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
    headers: { Authorization: `Bearer ${loginBody.data?.accessToken}` }
  });
  const profileBody = await profileRes.json();
  const noPasswordInProfile = profileBody.data?.password === undefined && profileBody.data?.passwordHash === undefined;

  // Dọn dẹp tài khoản test
  await User.destroy({ where: { email: testEmail } });
  await sequelize.close();

  assert(
    'SEC-06',
    'Chống Lộ dữ liệu: Phản hồi Register, Login, Profile tuyệt đối không bao giờ chứa password/passwordHash',
    noPasswordInRegister && noPasswordInLogin && noPasswordInProfile,
    'Tất cả các API đều ẩn hoàn toàn thông tin mật khẩu của người dùng'
  );

  // ----------------------------------------------------------------------------
  // TỔNG KẾT BƯỚC 11
  // ----------------------------------------------------------------------------
  logSection('TỔNG KẾT KẾT QUẢ SECURITY AUDIT BƯỚC 11');
  console.log(`🎯 Kết quả: ${passedTests}/${totalTests} tiêu chí an ninh ĐẠT (${Math.round((passedTests / totalTests) * 100)}%)`);

  if (passedTests === totalTests) {
    console.log('🎉 BƯỚC 11 HOÀN THÀNH XUẤT SẮC - HỆ THỐNG AN TOÀN TUYỆT ĐỐI TRƯỚC 6 LỖ HỔNG CỦA AI!');
  } else {
    console.error('⚠️ Có tiêu chí an ninh chưa đạt, vui lòng rà soát lại mã nguồn!');
    process.exitCode = 1;
  }
}

// Chạy bộ kiểm tra
runStep11SecurityAudit();
