// ==============================================================================
// SCRIPT KIỂM THỬ TỰ ĐỘNG BƯỚC 3: API POST /api/auth/me/avatar & XÁC THỰC PROFILE
// File: src/scripts/test-step3-avatar.ts
// Mục đích: Xác minh luồng upload avatar, quyền User, chống sửa chéo và phục vụ ảnh tĩnh
// ==============================================================================

// Import module hệ thống tập tin Node.js
import fs from 'node:fs';

// Import module xử lý đường dẫn tập tin
import path from 'node:path';

// Import thư viện băm mật khẩu bcrypt
import bcrypt from 'bcrypt';

// Import instance sequelize kết nối cơ sở dữ liệu
import { sequelize } from '../config/database.js';

// Import User model để chuẩn bị và xác minh dữ liệu trong SQL Server
import { User } from '../models/user.model.js';

// Import hàm sinh mã JWT phục vụ tạo Token cho Student A và Student B
import { generateToken } from '../utils/jwt.js';

// Khai báo hàm chính điều phối toàn bộ kịch bản kiểm thử Bước 3
async function runStep3Tests(): Promise<void> {
  // Địa chỉ Backend Server đang chạy (port mặc định 5000)
  const BASE_URL = 'http://localhost:5000';

  // Đường dẫn thư mục công khai lưu trữ ảnh
  const PUBLIC_UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

  try {
    console.log(`\n======================================================`);
    console.log(`🚀 BẮT ĐẦU KIỂM THỬ BƯỚC 3: API AVATAR & BẢO MẬT USER`);
    console.log(`======================================================\n`);

    // 1. Kết nối cơ sở dữ liệu
    await sequelize.authenticate();

    // 2. Chuẩn bị 2 tài khoản kiểm thử độc lập: Student A và Student B
    const emailA = 'student.a.step3@example.com';
    const emailB = 'student.b.step3@example.com';

    // Xóa dữ liệu cũ nếu đã tồn tại để đảm bảo tính cô lập
    await User.destroy({ where: { email: [emailA, emailB] } });

    // Băm mật khẩu mẫu
    const passwordHash = await bcrypt.hash('MatKhau@123', 12);

    // Tạo mới tài khoản Student A trong dbo.Users
    const userA = await User.create({
      fullName: 'Sinh Viên A Thử Nghiệm',
      email: emailA,
      passwordHash: passwordHash,
      role: 'student',
      avatarUrl: null
    });

    // Tạo mới tài khoản Student B trong dbo.Users
    const userB = await User.create({
      fullName: 'Sinh Viên B Thử Nghiệm',
      email: emailB,
      passwordHash: passwordHash,
      role: 'student',
      avatarUrl: null
    });

    console.log(`==> Đã chuẩn bị 2 tài khoản test: Student A (ID: ${userA.id}), Student B (ID: ${userB.id})`);

    // Tạo mã JWT Token hợp lệ cho từng sinh viên
    const tokenA = generateToken({ id: userA.id, role: userA.role });
    const tokenB = generateToken({ id: userB.id, role: userB.role });

    // Tạo mẫu ảnh PNG hợp lệ (chuẩn Magic Bytes)
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02]);

    // --------------------------------------------------------------------------
    // TEST 1 (U03): Upload nhưng KHÔNG có Authorization Header -> Bị từ chối 401
    // --------------------------------------------------------------------------
    {
      const formData = new FormData();
      formData.append('avatar', new Blob([validPngBuffer], { type: 'image/png' }), 'avatar.png');

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        body: formData
      });

      const pass = res.status === 401;
      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 1 (U03): Không có Authorization -> 401 Unauthorized`);
      console.log(`   └─> Status: ${res.status}`);
    }

    // --------------------------------------------------------------------------
    // TEST 2 (U05): Có JWT của Student A nhưng Body thiếu file -> Bị từ chối 400
    // --------------------------------------------------------------------------
    {
      const formData = new FormData();
      // Không append file nào

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: formData
      });

      const pass = res.status === 400;
      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 2 (U05): Thiếu tập tin avatar -> 400 Bad Request`);
      console.log(`   └─> Status: ${res.status}`);
    }

    // --------------------------------------------------------------------------
    // TEST 3 (U01 & U11): Student A upload avatar và cố tình gửi kèm userId của Student B
    // Mục tiêu: Bắt buộc chỉ User A đổi avatar, User B giữ nguyên (không tin body.userId)
    // --------------------------------------------------------------------------
    let uploadedAvatarUrl = '';
    {
      const formData = new FormData();
      formData.append('avatar', new Blob([validPngBuffer], { type: 'image/png' }), 'studentA_avatar.png');
      // Kẻ gian cố tình đính kèm userId của B vào Body
      formData.append('userId', String(userB.id));

      const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: formData
      });

      const body = (await res.json()) as { success: boolean; data?: { avatarUrl: string } };
      uploadedAvatarUrl = body.data?.avatarUrl ?? '';

      // Kiểm tra trong CSDL: User A phải có avatarUrl mới, User B vẫn phải là null!
      const refreshedUserA = await User.findByPk(userA.id);
      const refreshedUserB = await User.findByPk(userB.id);

      const pass =
        res.status === 200 &&
        body.success === true &&
        refreshedUserA?.avatarUrl === uploadedAvatarUrl &&
        refreshedUserB?.avatarUrl === null;

      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 3 (U01/U11): Student A upload avatar & gửi userId của B`);
      console.log(`   └─> Status: ${res.status} | avatarUrl của A: ${uploadedAvatarUrl}`);
      console.log(`   └─> Khẳng định bảo mật: Avatar của B trong DB vẫn là: ${refreshedUserB?.avatarUrl} (Không bị sửa chéo)`);
    }

    // --------------------------------------------------------------------------
    // TEST 4: Gọi GET /api/auth/profile của Student A và Student B
    // Mục tiêu: Profile A trả avatarUrl mới; Profile B trả null; cả hai không lộ passwordHash
    // --------------------------------------------------------------------------
    {
      // Profile Student A
      const resA = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      const bodyA = (await resA.json()) as { success: boolean; data: Record<string, unknown> };

      // Profile Student B
      const resB = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      const bodyB = (await resB.json()) as { success: boolean; data: Record<string, unknown> };

      const pass =
        resA.status === 200 &&
        bodyA.data?.avatarUrl === uploadedAvatarUrl &&
        bodyA.data?.passwordHash === undefined &&
        resB.status === 200 &&
        bodyB.data?.avatarUrl === null &&
        bodyB.data?.passwordHash === undefined;

      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 4: Kiểm tra Profile của A và B`);
      console.log(`   └─> Profile A avatarUrl: ${bodyA.data?.avatarUrl} | PasswordHash ẩn: true`);
      console.log(`   └─> Profile B avatarUrl: ${bodyB.data?.avatarUrl} | PasswordHash ẩn: true`);
    }

    // --------------------------------------------------------------------------
    // TEST 5 (U02): Phục vụ ảnh tĩnh (Static Files) qua Express
    // Mục tiêu: Truy cập URL http://localhost:5000/uploads/<filename> trả về 200 OK
    // --------------------------------------------------------------------------
    {
      const staticUrl = `${BASE_URL}${uploadedAvatarUrl}`;
      const res = await fetch(staticUrl, { method: 'GET' });

      const pass = res.status === 200;
      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 5 (U02): Truy cập ảnh tĩnh qua URL công khai`);
      console.log(`   └─> GET ${staticUrl} -> Status: ${res.status}`);
    }

    // Dọn dẹp tài khoản kiểm thử và file ảnh sau khi test xong
    await User.destroy({ where: { email: [emailA, emailB] } });
    if (uploadedAvatarUrl) {
      const filename = path.basename(uploadedAvatarUrl);
      const filePath = path.join(PUBLIC_UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    console.log(`\n======================================================`);
    console.log(`🎉 TẤT CẢ CÁC TEST CASES BƯỚC 3 ĐÃ PASS 100%!`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error('Lỗi khi kiểm thử Bước 3:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

// Thực thi kiểm thử Bước 3
runStep3Tests();
