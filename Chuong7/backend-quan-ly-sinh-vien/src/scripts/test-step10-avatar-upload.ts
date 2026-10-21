// ==============================================================================
// SCRIPT KIỂM THỬ BƯỚC 10: UPLOAD AVATAR TRỰC TIẾP TRÊN GIAO DIỆN REACT (CHƯƠNG 07 - TRANG 16)
// File: src/scripts/test-step10-avatar-upload.ts
// Mục đích: Xác minh toàn bộ luồng tích hợp Upload Avatar:
// 1. Đăng nhập Student lấy Bearer JWT Token.
// 2. Gửi request multipart/form-data (field "avatar") có gắn Bearer Token lên Backend.
// 3. Phản hồi 200 OK và data.avatarUrl dạng /uploads/<filename>.
// 4. Gọi lại GET /api/auth/profile xác nhận avatarUrl đã cập nhật trong SQL Server.
// 5. Mở ảnh tĩnh qua Express Static /uploads/<filename> nhận HTTP 200 OK.
// 6. Kiểm chứng file vật lý tồn tại trên ổ đĩa trong thư mục public/uploads/.
// 7. Kiểm chứng từ chối file > 2MB (413) và file giả mạo đuôi (400).
// 8. Dọn dẹp an toàn các file và tài khoản thử nghiệm sau khi hoàn thành.
// ==============================================================================

// Import thư viện băm mật khẩu bcrypt
import bcrypt from 'bcrypt';

// Import các module hệ thống tệp và đường dẫn từ Node.js
import fs from 'node:fs';
import path from 'node:path';

// Import kết nối Sequelize và Model User
import { sequelize } from '../config/database.js';
import { User } from '../models/user.model.js';

// Hàm in tiêu đề từng phần kiểm thử để dễ theo dõi
function logSection(title: string): void {
  // In đường kẻ phân cách trên
  console.log('\n================================================================================');
  // In nội dung tiêu đề
  console.log(`📌 ${title}`);
  // In đường kẻ phân cách dưới
  console.log('================================================================================');
}

// Hàm hỗ trợ tạo ảnh PNG mẫu tối thiểu 8 byte chuẩn (Magic bytes: 89 50 4E 47 0D 0A 1A 0A)
function createValidTestPngBuffer(): Buffer {
  // Trả về Buffer chứa chữ ký chuẩn của file ảnh PNG
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82
  ]);
}

// Hàm chính điều phối kiểm thử Bước 10
async function runStep10Verification(): Promise<void> {
  // Khai báo Base URL của máy chủ Backend Express
  const BASE_URL = 'http://localhost:5000';

  // Khai báo email và mật khẩu tài khoản Student kiểm thử
  const studentEmail = 'student.step10@example.com';
  const studentPassword = 'Password@123';

  // Biến lưu trữ đường dẫn file ảnh upload để dọn dẹp sau cùng
  let uploadedAvatarRelUrl = '';
  let uploadedAvatarPhysicalPath = '';

  // In thông điệp bắt đầu kiểm thử
  logSection('BƯỚC 10: KIỂM THỬ TẢI LÊN AVATAR TỪ GIAO DIỆN REACT (TRANG 16)');

  try {
    // 1. Kiểm tra kết nối cơ sở dữ liệu SQL Server
    await sequelize.authenticate();
    console.log('✅ Đã kết nối cơ sở dữ liệu SQL Server thành công.');

    // 2. Chuẩn bị tài khoản Student thử nghiệm
    await User.destroy({ where: { email: studentEmail } });
    const passwordHash = await bcrypt.hash(studentPassword, 12);
    const createdUser = await User.create({
      fullName: 'Sinh Viên Kiểm Thử Bước 10',
      email: studentEmail,
      passwordHash: passwordHash,
      role: 'student',
      avatarUrl: null
    });
    console.log(`✅ Đã chuẩn bị tài khoản kiểm thử: ${studentEmail} (ID: ${createdUser.id})`);

    // 3. Đăng nhập để lấy Access Token JWT hợp lệ
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: studentPassword })
    });
    const loginBody = (await loginRes.json()) as { data?: { accessToken: string } };
    const studentToken = loginBody.data?.accessToken ?? '';
    console.log(`✅ Đăng nhập Student thành công, nhận Bearer JWT Token.`);

    // ==========================================================================
    // TEST 1: GỬI MULTIPART/FORM-DATA VỚI FIELD "avatar" VÀ BEARER TOKEN
    // ==========================================================================
    logSection('TEST 1: GỬI POST /api/auth/me/avatar VỚI FORM-DATA & BEARER TOKEN');
    
    // Tạo đối tượng FormData chuẩn mô phỏng thao tác của component AvatarUpload.tsx trên React
    const formData = new FormData();
    // Tạo Blob nhị phân ảnh PNG hợp lệ (dùng Uint8Array để tương thích type BlobPart của TypeScript)
    const pngBlob = new Blob([new Uint8Array(createValidTestPngBuffer())], { type: 'image/png' });
    // Gắn vào trường có tên chính xác là "avatar" theo đúng hợp đồng API
    formData.append('avatar', pngBlob, 'student-avatar.png');

    // Gửi POST tới endpoint /api/auth/me/avatar
    const uploadRes = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`
      },
      body: formData
    });

    // Đọc mã HTTP và body phản hồi
    const uploadStatus = uploadRes.status;
    const uploadBody = (await uploadRes.json()) as {
      success: boolean;
      message: string;
      data?: { avatarUrl: string };
    };

    // Kiểm tra kết quả phản hồi
    uploadedAvatarRelUrl = uploadBody.data?.avatarUrl ?? '';
    const passTest1 = uploadStatus === 200 && uploadBody.success === true && uploadedAvatarRelUrl.startsWith('/uploads/');

    console.log(`${passTest1 ? '✅ [PASS]' : '❌ [FAIL]'} TEST 1: Upload avatar hợp lệ qua POST /api/auth/me/avatar`);
    console.log(`   └─> Status: ${uploadStatus} (Kỳ vọng: 200)`);
    console.log(`   └─> Response message: "${uploadBody.message}"`);
    console.log(`   └─> Avatar URL trả về: "${uploadedAvatarRelUrl}"`);

    // ==========================================================================
    // TEST 2: GỌI LẠI GET /api/auth/profile ĐỂ LÀM MỚI HỒ SƠ TỪ SQL SERVER
    // ==========================================================================
    logSection('TEST 2: LÀM MỚI HỒ SƠ QUA GET /api/auth/profile XÁC MINH CSDL SQL SERVER');
    
    const profileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });

    const profileStatus = profileRes.status;
    const profileBody = (await profileRes.json()) as {
      success: boolean;
      data?: { id: number; fullName: string; email: string; role: string; avatarUrl: string | null };
    };

    const dbAvatarUrl = profileBody.data?.avatarUrl;
    const passTest2 = profileStatus === 200 && dbAvatarUrl === uploadedAvatarRelUrl;

    console.log(`${passTest2 ? '✅ [PASS]' : '❌ [FAIL]'} TEST 2: GET /api/auth/profile trả về đúng avatarUrl mới`);
    console.log(`   └─> Status: ${profileStatus} (Kỳ vọng: 200)`);
    console.log(`   └─> avatarUrl trong CSDL SQL Server: "${dbAvatarUrl}"`);
    console.log(`   └─> Khớp hoàn toàn với URL vừa upload: ${dbAvatarUrl === uploadedAvatarRelUrl ? 'CÓ (Chính xác 100%)' : 'KHÔNG'}`);

    // ==========================================================================
    // TEST 3: TRUY CẬP ẢNH TĨNH QUA ĐƯỜNG DẪN STATIC CÔNG KHAI CỦA BACKEND
    // ==========================================================================
    logSection('TEST 3: TRUY CẬP TỆP ẢNH TĨNH QUA HTTP GET /uploads/<filename>');
    
    const staticImageUrl = `${BASE_URL}${uploadedAvatarRelUrl}`;
    const staticRes = await fetch(staticImageUrl);
    const staticStatus = staticRes.status;
    const staticContentType = staticRes.headers.get('content-type');
    const passTest3 = staticStatus === 200 && staticContentType?.includes('image/');

    console.log(`${passTest3 ? '✅ [PASS]' : '❌ [FAIL]'} TEST 3: Express static phục vụ ảnh thành công`);
    console.log(`   └─> URL kiểm tra: ${staticImageUrl}`);
    console.log(`   └─> Status: ${staticStatus} (Kỳ vọng: 200) | Content-Type: ${staticContentType}`);

    // ==========================================================================
    // TEST 4: XÁC MINH FILE VẬT LÝ TỒN TẠI TRÊN Ổ ĐĨA TRONG public/uploads/
    // ==========================================================================
    logSection('TEST 4: XÁC MINH TỆP VẬT LÝ TỒN TẠI TRÊN Ổ ĐĨA TRONG public/uploads/');
    
    const fileNameOnly = path.basename(uploadedAvatarRelUrl);
    uploadedAvatarPhysicalPath = path.resolve(process.cwd(), 'public', 'uploads', fileNameOnly);
    const fileExistsOnDisk = fs.existsSync(uploadedAvatarPhysicalPath);
    const fileSize = fileExistsOnDisk ? fs.statSync(uploadedAvatarPhysicalPath).size : 0;
    const passTest4 = fileExistsOnDisk && fileSize > 0;

    console.log(`${passTest4 ? '✅ [PASS]' : '❌ [FAIL]'} TEST 4: Tệp tin tồn tại thực tế trên ổ cứng máy chủ`);
    console.log(`   └─> Đường dẫn vật lý: ${uploadedAvatarPhysicalPath}`);
    console.log(`   └─> Dung lượng tệp: ${fileSize} byte`);

    // ==========================================================================
    // TEST 5: KIỂM CHỨNG TỪ CHỐI TỆP > 2MB (HTTP 413 PAYLOAD TOO LARGE)
    // ==========================================================================
    logSection('TEST 5: KIỂM CHỨNG TỪ CHỐI TỆP VƯỢT QUÁ 2MB (HTTP 413)');
    
    const oversizedBuffer = Buffer.alloc(2.5 * 1024 * 1024, 0x41); // 2.5MB
    const oversizedFormData = new FormData();
    oversizedFormData.append('avatar', new Blob([new Uint8Array(oversizedBuffer)], { type: 'image/png' }), 'oversized.png');

    const overRes = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: oversizedFormData
    });

    const passTest5 = overRes.status === 413;
    console.log(`${passTest5 ? '✅ [PASS]' : '❌ [FAIL]'} TEST 5: Tệp > 2MB bị từ chối với status 413`);
    console.log(`   └─> Status thực tế: ${overRes.status} (Kỳ vọng: 413)`);

    // ==========================================================================
    // TEST 6: KIỂM CHỨNG TỪ CHỐI TỆP GIẢ MẠO ĐUÔI PNG (HTTP 400 BAD REQUEST)
    // ==========================================================================
    logSection('TEST 6: KIỂM CHỨNG TỪ CHỐI TỆP VĂN BẢN ĐỔI ĐUÔI THÀNH .PNG (HTTP 400)');
    
    const fakeTextBuffer = Buffer.from('Day la file van ban fake gia mao thanh anh png');
    const fakeFormData = new FormData();
    fakeFormData.append('avatar', new Blob([new Uint8Array(fakeTextBuffer)], { type: 'image/png' }), 'fake.png');

    const fakeRes = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: fakeFormData
    });

    const passTest6 = fakeRes.status === 400;
    console.log(`${passTest6 ? '✅ [PASS]' : '❌ [FAIL]'} TEST 6: Tệp giả mạo chữ ký bị chặn đứng với status 400`);
    console.log(`   └─> Status thực tế: ${fakeRes.status} (Kỳ vọng: 400)`);

    // ==========================================================================
    // TỔNG KẾT BƯỚC 10
    // ==========================================================================
    logSection('TỔNG KẾT KẾT QUẢ KIỂM THỬ BƯỚC 10');
    const allPass = passTest1 && passTest2 && passTest3 && passTest4 && passTest5 && passTest6;
    if (allPass) {
      console.log('🎉 TẤT CẢ 6/6 CA KIỂM THỬ BƯỚC 10 ĐÃ ĐẠT CHUẨN 100% (PASS)!');
      console.log('   - Gửi FormData + Bearer Token thành công: HTTP 200 OK.');
      console.log('   - Đồng bộ avatarUrl vào SQL Server: Cập nhật chính xác.');
      console.log('   - Phục vụ ảnh tĩnh: Express static trả về 200 OK.');
      console.log('   - File vật lý: Lưu trữ an toàn trong public/uploads/.');
      console.log('   - Bảo vệ an ninh: Chặn tệp > 2MB (413) và tệp giả mạo (400).');
    } else {
      console.log('⚠️ CÓ CA KIỂM THỬ THẤT BẠI. VUI LÒNG KIỂM TRA LẠI CODE!');
    }

    // 8. Dọn dẹp tài khoản kiểm thử và file ảnh sau kiểm tra
    await User.destroy({ where: { email: studentEmail } });
    if (uploadedAvatarPhysicalPath && fs.existsSync(uploadedAvatarPhysicalPath)) {
      fs.unlinkSync(uploadedAvatarPhysicalPath);
      console.log(`\n🧹 Đã dọn dẹp file ảnh kiểm thử: ${fileNameOnly}`);
    }
    console.log('🧹 Đã dọn dẹp tài khoản kiểm thử khỏi SQL Server.');

  } catch (err: unknown) {
    console.error('❌ Lỗi ngoại lệ trong quá trình thực thi kiểm thử Bước 10:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Thực thi kiểm thử Bước 10
runStep10Verification();
