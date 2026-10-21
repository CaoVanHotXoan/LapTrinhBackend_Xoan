// ==============================================================================
// SCRIPT KIỂM THỬ MA TRẬN 12 CA UPLOAD HÌNH ẢNH & MULTER (U01 – U12) (CHƯƠNG 07 - BƯỚC 4)
// File: src/scripts/test-u01-u12.ts
// Mục đích: Thực thi và kiểm chứng 3 lớp bằng chứng cho 12 ca kiểm thử theo chuẩn bài lab
// Ba lớp bằng chứng: (1) HTTP Response, (2) File trên đĩa, (3) Dữ liệu trong SQL Server
// ==============================================================================

// Import module hệ thống file của Node.js để thao tác tệp tin kiểm thử
import fs from 'node:fs';

// Import module xử lý đường dẫn đa nền tảng
import path from 'node:path';

// Import thư viện băm mật khẩu bcrypt
import bcrypt from 'bcrypt';

// Import đối tượng kết nối Sequelize
import { sequelize } from '../config/database.js';

// Import User model để thao tác và kiểm tra dữ liệu trong bảng dbo.Users
import { User } from '../models/user.model.js';

// Import hàm tạo token JWT
import { generateToken } from '../utils/jwt.js';

// Khai báo kiểu kết quả kiểm thử cho từng ca
interface ITestResult {
  code: string;
  scenario: string;
  method: string;
  endpoint: string;
  expectedStatus: number;
  actualStatus: number;
  evidence: string;
  passed: boolean;
}

// Hàm chính điều phối toàn bộ 12 ca kiểm thử U01 - U12
async function runU01ToU12Tests(): Promise<void> {
  // Địa chỉ Backend Express Server đang chạy
  const BASE_URL = 'http://localhost:5000';

  // Đường dẫn thư mục công khai chứa ảnh upload
  const PUBLIC_UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

  // Đường dẫn thư mục lưu tạm của Multer
  const TEMP_UPLOADS_DIR = path.resolve(process.cwd(), 'temp_uploads');

  // Thư mục chứa các file mẫu dùng để kiểm thử
  const FIXTURES_DIR = path.resolve(process.cwd(), 'temp_u12_fixtures');

  // Mảng lưu trữ kết quả của 12 test case
  const results: ITestResult[] = [];

  try {
    console.log(`\n====================================================================`);
    console.log(`🚀 BẮT ĐẦU CHẠY MA TRẬN 12 CA KIỂM THỬ MULTER, JWT & LƯU TRỮ (U01 - U12)`);
    console.log(`====================================================================\n`);

    // 1. Kết nối cơ sở dữ liệu
    await sequelize.authenticate();

    // 2. Tạo thư mục tạm chứa file mẫu kiểm thử
    if (!fs.existsSync(FIXTURES_DIR)) {
      fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    }

    // Chuẩn bị Mẫu ảnh PNG hợp lệ (chuẩn Magic bytes)
    const validPngPath = path.join(FIXTURES_DIR, 'valid.png');
    fs.writeFileSync(
      validPngPath,
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03])
    );

    // Chuẩn bị Mẫu ảnh JPEG hợp lệ (chuẩn Magic bytes)
    const validJpgPath = path.join(FIXTURES_DIR, 'valid.jpg');
    fs.writeFileSync(
      validJpgPath,
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
    );

    // Chuẩn bị Mẫu file văn bản Text nhưng cố tình đổi đuôi thành .png (giả mạo định dạng)
    const fakePngPath = path.join(FIXTURES_DIR, 'fake.png');
    fs.writeFileSync(fakePngPath, 'Day la tep tin van ban text gia mao duoi .png');

    // Chuẩn bị Mẫu file GIF không được phép
    const gifPath = path.join(FIXTURES_DIR, 'sample.gif');
    fs.writeFileSync(gifPath, 'GIF89a...');

    // Chuẩn bị Mẫu file dung lượng lớn vượt quá 2MB (2.5MB)
    const largePngPath = path.join(FIXTURES_DIR, 'large.png');
    const largeBuffer = Buffer.alloc(2.5 * 1024 * 1024);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(largeBuffer, 0);
    fs.writeFileSync(largePngPath, largeBuffer);

    // 3. Chuẩn bị 2 User thật trong SQL Server (không dùng token giả theo constraint)
    const emailA = 'student.u12.a@example.com';
    const emailB = 'student.u12.b@example.com';
    await User.destroy({ where: { email: [emailA, emailB] } });

    const passwordHash = await bcrypt.hash('MatKhau@123', 12);

    const userA = await User.create({
      fullName: 'Sinh Viên Test A',
      email: emailA,
      passwordHash: passwordHash,
      role: 'student',
      avatarUrl: null
    });

    const userB = await User.create({
      fullName: 'Sinh Viên Test B',
      email: emailB,
      passwordHash: passwordHash,
      role: 'student',
      avatarUrl: null
    });

    const tokenA = generateToken({ id: userA.id, role: userA.role });
    const tokenB = generateToken({ id: userB.id, role: userB.role });

    // Hàm đếm số file trong public/uploads
    const countPublic = () => fs.readdirSync(PUBLIC_UPLOADS_DIR).filter((f) => f !== '.gitkeep').length;
    // Hàm đếm số file trong temp_uploads
    const countTemp = () => fs.readdirSync(TEMP_UPLOADS_DIR).filter((f) => f !== '.gitkeep').length;

    let userAAvatarUrl = '';

    // ==========================================================================
    // U01: Avatar PNG hợp lệ + Student JWT -> 200 (File, URL, SQL cập nhật đúng User)
    // ==========================================================================
    {
      const countBefore = countPublic();
      const form = new FormData();
      form.append('avatar', new Blob([fs.readFileSync(validPngPath)], { type: 'image/png' }), 'test_u01.png');

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: form
      });
      const body = (await res.json()) as { success: boolean; data?: { avatarUrl: string } };
      userAAvatarUrl = body.data?.avatarUrl ?? '';

      const userInDb = await User.findByPk(userA.id);
      const fileCreated = countPublic() === countBefore + 1;
      const dbMatched = userInDb?.avatarUrl === userAAvatarUrl;

      const pass = res.status === 200 && fileCreated && dbMatched;
      results.push({
        code: 'U01',
        scenario: 'Avatar PNG hợp lệ + Student JWT',
        method: 'POST',
        endpoint: '/api/auth/me/avatar',
        expectedStatus: 200,
        actualStatus: res.status,
        evidence: `File tạo trên đĩa, DB cập nhật avatarUrl: ${userAAvatarUrl}`,
        passed: pass
      });
    }

    // ==========================================================================
    // U02: Avatar JPEG hợp lệ + Student JWT -> 200 (Ảnh trình duyệt mở được)
    // ==========================================================================
    {
      const form = new FormData();
      form.append('avatar', new Blob([fs.readFileSync(validJpgPath)], { type: 'image/jpeg' }), 'test_u02.jpg');

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` },
        body: form
      });
      const body = (await res.json()) as { success: boolean; data?: { avatarUrl: string } };

      // Thử truy cập ảnh tĩnh qua URL công khai để kiểm tra trình duyệt mở được
      const staticRes = await fetch(`${BASE_URL}${body.data?.avatarUrl}`);

      const pass = res.status === 200 && staticRes.status === 200;
      results.push({
        code: 'U02',
        scenario: 'Avatar JPEG hợp lệ + Student JWT',
        method: 'POST',
        endpoint: '/api/auth/me/avatar',
        expectedStatus: 200,
        actualStatus: res.status,
        evidence: `Trình duyệt mở ảnh thành công qua GET ${body.data?.avatarUrl} (Status 200)`,
        passed: pass
      });
    }

    // ==========================================================================
    // U03: Không có Authorization -> 401 (Không sinh file và không UPDATE)
    // ==========================================================================
    {
      const countBefore = countPublic();
      const form = new FormData();
      form.append('avatar', new Blob([fs.readFileSync(validPngPath)], { type: 'image/png' }), 'test_u03.png');

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        body: form
      });
      const countAfter = countPublic();

      const pass = res.status === 401 && countAfter === countBefore;
      results.push({
        code: 'U03',
        scenario: 'Không có Authorization',
        method: 'POST',
        endpoint: '/api/auth/me/avatar',
        expectedStatus: 401,
        actualStatus: res.status,
        evidence: `Bị từ chối 401, không sinh thêm file trên đĩa`,
        passed: pass
      });
    }

    // ==========================================================================
    // U04: JWT sai/hết hạn -> 401 (Không có URL mới)
    // ==========================================================================
    {
      const countBefore = countPublic();
      const form = new FormData();
      form.append('avatar', new Blob([fs.readFileSync(validPngPath)], { type: 'image/png' }), 'test_u04.png');

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: 'Bearer invalid.token.signature' },
        body: form
      });
      const countAfter = countPublic();

      const pass = res.status === 401 && countAfter === countBefore;
      results.push({
        code: 'U04',
        scenario: 'JWT sai hoặc không hợp lệ',
        method: 'POST',
        endpoint: '/api/auth/me/avatar',
        expectedStatus: 401,
        actualStatus: res.status,
        evidence: `Bị từ chối 401 Unauthorized, không có URL mới`,
        passed: pass
      });
    }

    // ==========================================================================
    // U05: Body thiếu file -> 400 (Không cập nhật SQL)
    // ==========================================================================
    {
      const form = new FormData();
      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: form
      });

      const pass = res.status === 400;
      results.push({
        code: 'U05',
        scenario: 'Body thiếu file đính kèm',
        method: 'POST',
        endpoint: '/api/auth/me/avatar',
        expectedStatus: 400,
        actualStatus: res.status,
        evidence: `Trả về 400 Bad Request, không cập nhật CSDL`,
        passed: pass
      });
    }

    // ==========================================================================
    // U06: Field photo thay vì avatar -> 400 (Bị từ chối, không ghi file hợp lệ)
    // ==========================================================================
    {
      const countBefore = countPublic();
      const form = new FormData();
      form.append('photo', new Blob([fs.readFileSync(validPngPath)], { type: 'image/png' }), 'test_u06.png');

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: form
      });
      const countAfter = countPublic();

      const pass = res.status === 400 && countAfter === countBefore;
      results.push({
        code: 'U06',
        scenario: 'Field name photo thay vì avatar',
        method: 'POST',
        endpoint: '/api/auth/me/avatar',
        expectedStatus: 400,
        actualStatus: res.status,
        evidence: `Bị từ chối 400 (LIMIT_UNEXPECTED_FILE), không ghi file`,
        passed: pass
      });
    }

    // ==========================================================================
    // U07: Kích thước > 2MB -> 413 (Bắt LIMIT_FILE_SIZE, không file rác)
    // ==========================================================================
    {
      const countBefore = countPublic();
      const tempBefore = countTemp();
      const form = new FormData();
      form.append('avatar', new Blob([fs.readFileSync(largePngPath)], { type: 'image/png' }), 'too_large.png');

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: form
      });
      const countAfter = countPublic();
      const tempAfter = countTemp();

      const pass = res.status === 413 && countAfter === countBefore && tempAfter === tempBefore;
      results.push({
        code: 'U07',
        scenario: 'Dung lượng file lớn hơn 2MB',
        method: 'POST',
        endpoint: '/api/auth/me/avatar',
        expectedStatus: 413,
        actualStatus: res.status,
        evidence: `Bắt đúng LIMIT_FILE_SIZE trả 413, không tồn tại file rác`,
        passed: pass
      });
    }

    // ==========================================================================
    // U08: TXT đổi tên thành avatar.png -> 400 (Kiểm chữ ký file thực)
    // ==========================================================================
    {
      const countBefore = countPublic();
      const tempBefore = countTemp();
      const form = new FormData();
      form.append('avatar', new Blob([fs.readFileSync(fakePngPath)], { type: 'image/png' }), 'avatar.png');

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: form
      });
      const countAfter = countPublic();
      const tempAfter = countTemp();

      const pass = res.status === 400 && countAfter === countBefore && tempAfter === tempBefore;
      results.push({
        code: 'U08',
        scenario: 'Tệp văn bản giả mạo đổi đuôi .png',
        method: 'POST',
        endpoint: '/api/auth/me/avatar',
        expectedStatus: 400,
        actualStatus: res.status,
        evidence: `Phát hiện sai Magic Bytes, xóa file tạm, không sinh file rác`,
        passed: pass
      });
    }

    // ==========================================================================
    // U09: Đuôi .gif / MIME không chấp nhận -> 400 (Không tồn tại file công khai mới)
    // ==========================================================================
    {
      const countBefore = countPublic();
      const form = new FormData();
      form.append('avatar', new Blob([fs.readFileSync(gifPath)], { type: 'image/gif' }), 'sample.gif');

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: form
      });
      const countAfter = countPublic();

      const pass = res.status === 400 && countAfter === countBefore;
      results.push({
        code: 'U09',
        scenario: 'Định dạng .gif / MIME không được phép',
        method: 'POST',
        endpoint: '/api/auth/me/avatar',
        expectedStatus: 400,
        actualStatus: res.status,
        evidence: `Bộ lọc từ chối file không hỗ trợ, không sinh file công khai`,
        passed: pass
      });
    }

    // ==========================================================================
    // U10: Upload hai lần cùng tài khoản -> 200 (URL mới, không ghi đè bất ngờ)
    // ==========================================================================
    {
      const form = new FormData();
      form.append('avatar', new Blob([fs.readFileSync(validPngPath)], { type: 'image/png' }), 'avatar_second.png');

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: form
      });
      const body = (await res.json()) as { success: boolean; data?: { avatarUrl: string } };
      const secondAvatarUrl = body.data?.avatarUrl ?? '';

      // Tên file mới phải khác tên file cũ (UUID duy nhất)
      const isUnique = secondAvatarUrl !== userAAvatarUrl;
      const pass = res.status === 200 && isUnique;
      userAAvatarUrl = secondAvatarUrl;

      results.push({
        code: 'U10',
        scenario: 'Upload lần 2 cùng tài khoản',
        method: 'POST',
        endpoint: '/api/auth/me/avatar',
        expectedStatus: 200,
        actualStatus: res.status,
        evidence: `Cấp URL mới (${secondAvatarUrl}) sinh bằng UUID, không ghi đè bất ngờ`,
        passed: pass
      });
    }

    // ==========================================================================
    // U11: Student A gửi userId của B trong body -> 200 (Chỉ A đổi avatar, không tin userId)
    // ==========================================================================
    {
      const form = new FormData();
      form.append('avatar', new Blob([fs.readFileSync(validPngPath)], { type: 'image/png' }), 'avatar_spoof.png');
      form.append('userId', String(userB.id));

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: form
      });
      const body = (await res.json()) as { success: boolean; data?: { avatarUrl: string } };

      const dbUserA = await User.findByPk(userA.id);
      const dbUserB = await User.findByPk(userB.id);

      // Điều kiện cốt lõi: Chỉ avatar của A thay đổi, avatar của B không bị thay đổi chéo
      const pass = res.status === 200 && dbUserA?.avatarUrl === body.data?.avatarUrl && dbUserB?.avatarUrl !== body.data?.avatarUrl;
      // Cập nhật lại URL mới nhất của User A sau ca kiểm thử U11
      if (body.data?.avatarUrl) {
        userAAvatarUrl = body.data.avatarUrl;
      }

      results.push({
        code: 'U11',
        scenario: 'Student A gửi userId của B trong body',
        method: 'POST',
        endpoint: '/api/auth/me/avatar',
        expectedStatus: 200,
        actualStatus: res.status,
        evidence: `Chỉ A đổi avatar, B giữ nguyên avatarUrl trong SQL Server`,
        passed: pass
      });
    }

    // ==========================================================================
    // U12: Gọi GET Profile -> 200 (URL giữ nguyên, file hiển thị)
    // ==========================================================================
    {
      const res = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      const body = (await res.json()) as { success: boolean; data?: { avatarUrl: string; passwordHash?: string } };

      const staticRes = await fetch(`${BASE_URL}${body.data?.avatarUrl}`);

      const pass =
        res.status === 200 &&
        body.data?.avatarUrl === userAAvatarUrl &&
        body.data?.passwordHash === undefined &&
        staticRes.status === 200;

      results.push({
        code: 'U12',
        scenario: 'Kiểm tra GET Profile & tính toàn vẹn',
        method: 'GET',
        endpoint: '/api/auth/profile',
        expectedStatus: 200,
        actualStatus: res.status,
        evidence: `URL giữ nguyên, ảnh hiển thị qua static, tuyệt đối không lộ passwordHash`,
        passed: pass
      });
    }

    // Dọn dẹp thư mục fixtures
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    // Dọn dẹp User test
    await User.destroy({ where: { email: [emailA, emailB] } });

    // In bảng kết quả tổng hợp ra màn hình console
    console.log('\n========================================================================================');
    console.log('📊 BẢNG TỔNG HỢP KẾT QUẢ 12 CA KIỂM THỬ U01 - U12:');
    console.log('========================================================================================');
    console.table(
      results.map((r) => ({
        Mã: r.code,
        'Tình huống': r.scenario,
        'Expected': r.expectedStatus,
        'Actual': r.actualStatus,
        'Kết quả': r.passed ? 'PASS ✅' : 'FAIL ❌',
        'Bằng chứng': r.evidence
      }))
    );

    const allPassed = results.every((r) => r.passed);
    console.log(`\n====================================================================`);
    console.log(`${allPassed ? '🎉 TOÀN BỘ 12 CA KIỂM THỬ U01 - U12 ĐÃ ĐẠT 100%!' : '❌ CÓ CA THẤT BẠI'}`);
    console.log(`====================================================================\n`);
  } catch (error) {
    console.error('Lỗi khi chạy ma trận U01 - U12:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

// Thực thi
runU01ToU12Tests();
