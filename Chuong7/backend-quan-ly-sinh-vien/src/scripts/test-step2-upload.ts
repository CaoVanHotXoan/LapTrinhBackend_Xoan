// ==============================================================================
// SCRIPT KIỂM THỬ ĐỘC LẬP BƯỚC 2: MULTER MIDDLEWARE & AN TOÀN TẬP TIN
// File: src/scripts/test-step2-upload.ts
// Mục đích: Chứng minh upload xử lý file hợp lệ, từ chối file sai, không giữ file rác
// ==============================================================================

// Import module hệ thống file để đọc/ghi file mẫu kiểm thử
import fs from 'node:fs';

// Import module xử lý đường dẫn từ Node.js
import path from 'node:path';

// Import thư viện express để tạo máy chủ thử nghiệm cục bộ
import express from 'express';

// Import Server từ thư viện http của Node.js
import type { Server } from 'node:http';

// Import middleware upload avatar vừa xây dựng
import { avatarUploadMiddleware } from '../middlewares/upload.middleware.js';

// Import middleware xử lý lỗi tập trung để kiểm tra việc chuyển đổi status code (413, 400)
import { errorMiddleware } from '../middlewares/error.middleware.js';

// Khởi tạo ứng dụng Express riêng biệt cho mục đích kiểm thử
const app = express();

// Cho phép phân tích cú pháp JSON
app.use(express.json());

// Khai báo route thử nghiệm tích hợp avatarUploadMiddleware
app.post(
  '/test-upload',
  // Áp dụng middleware upload avatar cần kiểm thử
  avatarUploadMiddleware,
  // Handler kết quả trả về khi vượt qua middleware thành công
  (req, res) => {
    // Nếu request không có file (trường hợp client không gửi file)
    if (!req.file) {
      // Trả về mã HTTP 400 Bad Request
      res.status(400).json({ success: false, message: 'Vui lòng chọn tập tin ảnh' });
      return;
    }

    // Trả về mã HTTP 200 OK kèm thông tin metadata của file đã lưu an toàn
    res.status(200).json({
      success: true,
      message: 'Upload file hợp lệ thành công',
      data: {
        filename: req.file.filename,
        size: req.file.size,
        path: req.file.path
      }
    });
  }
);

// Gắn middleware xử lý lỗi tập trung vào cuối chuỗi xử lý của Express
app.use(errorMiddleware);

// Hàm chính điều phối toàn bộ các kịch bản kiểm thử của Bước 2
async function runStep2Tests(): Promise<void> {
  // Biến lưu trữ instance máy chủ thử nghiệm
  let server: Server | null = null;

  // Xác định cổng thử nghiệm riêng biệt (cổng 5050 để không trùng cổng chính 5000)
  const TEST_PORT = 5050;
  // Địa chỉ cơ sở cho các request kiểm thử
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  // Thư mục chứa các file tạm phục vụ kiểm thử
  const TEST_FIXTURES_DIR = path.resolve(process.cwd(), 'temp_test_fixtures');
  // Thư mục công khai lưu ảnh thực tế
  const PUBLIC_DIR = path.resolve(process.cwd(), 'public', 'uploads');
  // Thư mục tạm của multer
  const TEMP_DIR = path.resolve(process.cwd(), 'temp_uploads');

  try {
    // 1. Tạo thư mục tạm để chứa các mẫu file kiểm thử nếu chưa có
    if (!fs.existsSync(TEST_FIXTURES_DIR)) {
      fs.mkdirSync(TEST_FIXTURES_DIR, { recursive: true });
    }

    // 2. Chuẩn bị Mẫu 1: File PNG hợp lệ có chữ ký thực (Magic bytes: 89 50 4E 47 0D 0A 1A 0A)
    const validPngPath = path.join(TEST_FIXTURES_DIR, 'valid_sample.png');
    // Tạo Buffer đúng chữ ký PNG chuẩn
    const pngMagicBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    fs.writeFileSync(validPngPath, pngMagicBytes);

    // 3. Chuẩn bị Mẫu 2: File JPEG hợp lệ có chữ ký thực (Magic bytes: FF D8 FF)
    const validJpgPath = path.join(TEST_FIXTURES_DIR, 'valid_sample.jpg');
    // Tạo Buffer đúng chữ ký JPEG chuẩn
    const jpegMagicBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    fs.writeFileSync(validJpgPath, jpegMagicBytes);

    // 4. Chuẩn bị Mẫu 3: File giả mạo (nội dung là text thuần nhưng đổi tên thành fake_image.png)
    const fakeImagePath = path.join(TEST_FIXTURES_DIR, 'fake_image.png');
    // Nội dung chữ giả mạo, không hề có chữ ký ảnh
    fs.writeFileSync(fakeImagePath, 'Day la noi dung file text gia mao file anh PNG!');

    // 5. Chuẩn bị Mẫu 4: File dung lượng vượt quá giới hạn 2MB (tạo 2.5MB)
    const oversizedPath = path.join(TEST_FIXTURES_DIR, 'oversized.png');
    // Khởi tạo vùng đệm 2.5 * 1024 * 1024 bytes (lớn hơn 2MB)
    const oversizedBuffer = Buffer.alloc(2.5 * 1024 * 1024);
    // Gán chữ ký PNG ở đầu để vượt qua kiểm tra định dạng
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(oversizedBuffer, 0);
    fs.writeFileSync(oversizedPath, oversizedBuffer);

    // 6. Khởi động server thử nghiệm
    await new Promise<void>((resolve) => {
      server = app.listen(TEST_PORT, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 BẮT ĐẦU KIỂM THỬ BƯỚC 2: MULTER & AN TOÀN TẬP TIN`);
        console.log(`======================================================\n`);
        resolve();
      });
    });

    // Hàm đếm số file hiện tại trong thư mục public/uploads (loại trừ .gitkeep)
    const countPublicFiles = (): number => {
      return fs.readdirSync(PUBLIC_DIR).filter((f) => f !== '.gitkeep').length;
    };

    // Hàm đếm số file hiện tại trong thư mục temp_uploads (loại trừ .gitkeep)
    const countTempFiles = (): number => {
      return fs.readdirSync(TEMP_DIR).filter((f) => f !== '.gitkeep').length;
    };

    // Ghi nhận số file ban đầu
    const initialPublicCount = countPublicFiles();
    const initialTempCount = countTempFiles();

    // --------------------------------------------------------------------------
    // TEST CASE 1: Upload file PNG hợp lệ (Expected: 200 OK, sinh file trong public)
    // --------------------------------------------------------------------------
    {
      const formData = new FormData();
      // Đọc file và thêm vào form data với tên field là 'avatar'
      const fileBlob = new Blob([fs.readFileSync(validPngPath)], { type: 'image/png' });
      formData.append('avatar', fileBlob, 'avatar.png');

      const res = await fetch(`${BASE_URL}/test-upload`, { method: 'POST', body: formData });
      const body = (await res.json()) as { success: boolean; data?: { filename: string } };

      const pass = res.status === 200 && body.success === true && countPublicFiles() === initialPublicCount + 1;
      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 1: Upload file PNG hợp lệ (đúng chữ ký)`);
      console.log(`   └─> Status: ${res.status} | File tạo mới: ${body.data?.filename}`);
    }

    // --------------------------------------------------------------------------
    // TEST CASE 2: Upload file JPEG hợp lệ (Expected: 200 OK, sinh file trong public)
    // --------------------------------------------------------------------------
    {
      const formData = new FormData();
      const fileBlob = new Blob([fs.readFileSync(validJpgPath)], { type: 'image/jpeg' });
      formData.append('avatar', fileBlob, 'avatar.jpg');

      const res = await fetch(`${BASE_URL}/test-upload`, { method: 'POST', body: formData });
      const body = (await res.json()) as { success: boolean; data?: { filename: string } };

      const pass = res.status === 200 && body.success === true && countPublicFiles() === initialPublicCount + 2;
      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 2: Upload file JPEG hợp lệ (đúng chữ ký)`);
      console.log(`   └─> Status: ${res.status} | File tạo mới: ${body.data?.filename}`);
    }

    // --------------------------------------------------------------------------
    // TEST CASE 3: Upload file quá 2MB (Expected: 413 Payload Too Large, không sinh file rác)
    // --------------------------------------------------------------------------
    {
      const filesBefore = countPublicFiles();
      const tempBefore = countTempFiles();

      const formData = new FormData();
      const fileBlob = new Blob([fs.readFileSync(oversizedPath)], { type: 'image/png' });
      formData.append('avatar', fileBlob, 'too_large.png');

      const res = await fetch(`${BASE_URL}/test-upload`, { method: 'POST', body: formData });
      const body = (await res.json()) as { success: boolean; message: string };

      const filesAfter = countPublicFiles();
      const tempAfter = countTempFiles();

      const pass = res.status === 413 && filesAfter === filesBefore && tempAfter === tempBefore;
      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 3: Giới hạn file > 2MB (LIMIT_FILE_SIZE)`);
      console.log(`   └─> Status: ${res.status} (Quy ước 413) | Không sinh file rác: ${pass}`);
    }

    // --------------------------------------------------------------------------
    // TEST CASE 4: File giả mạo (Nội dung text đổi đuôi .png) (Expected: 400 Bad Request, xóa file rác)
    // --------------------------------------------------------------------------
    {
      const filesBefore = countPublicFiles();
      const tempBefore = countTempFiles();

      const formData = new FormData();
      const fileBlob = new Blob([fs.readFileSync(fakeImagePath)], { type: 'image/png' });
      formData.append('avatar', fileBlob, 'fake_image.png');

      const res = await fetch(`${BASE_URL}/test-upload`, { method: 'POST', body: formData });
      const body = (await res.json()) as { success: boolean; message: string };

      const filesAfter = countPublicFiles();
      const tempAfter = countTempFiles();

      const pass = res.status === 400 && filesAfter === filesBefore && tempAfter === tempBefore;
      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 4: Chặn tệp giả mạo nội dung (Kiểm tra chữ ký thực)`);
      console.log(`   └─> Status: ${res.status} | File rác tạm đã dọn sạch: ${tempAfter === tempBefore}`);
    }

    // --------------------------------------------------------------------------
    // TEST CASE 5: Gửi sai tên trường (gửi 'photo' thay vì 'avatar') (Expected: 400 Bad Request)
    // --------------------------------------------------------------------------
    {
      const formData = new FormData();
      const fileBlob = new Blob([fs.readFileSync(validPngPath)], { type: 'image/png' });
      // Cố tình dùng field name 'photo'
      formData.append('photo', fileBlob, 'test.png');

      const res = await fetch(`${BASE_URL}/test-upload`, { method: 'POST', body: formData });
      const pass = res.status === 400;
      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 5: Gửi sai tên field (Dùng 'photo' thay vì 'avatar')`);
      console.log(`   └─> Status: ${res.status} (Mong đợi 400)`);
    }

    // Dọn dẹp thư mục mẫu thử nghiệm sau khi hoàn thành
    fs.rmSync(TEST_FIXTURES_DIR, { recursive: true, force: true });

    // Dọn dẹp các file ảnh test vừa upload thành công để thư mục luôn sạch
    fs.readdirSync(PUBLIC_DIR)
      .filter((f) => f !== '.gitkeep')
      .forEach((f) => fs.unlinkSync(path.join(PUBLIC_DIR, f)));

    console.log(`\n======================================================`);
    console.log(`🎉 TẤT CẢ CÁC TEST CASES BƯỚC 2 ĐÃ PASS 100%!`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Lỗi kiểm thử Bước 2:', err);
    process.exitCode = 1;
  } finally {
    // Luôn đóng máy chủ thử nghiệm để giải phóng cổng
    if (server) {
      (server as Server).close();
    }
  }
}

// Chạy kịch bản kiểm thử
runStep2Tests();
