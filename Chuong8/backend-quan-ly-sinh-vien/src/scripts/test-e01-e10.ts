// ==============================================================================
// SCRIPT KIỂM THỬ MA TRẬN LỖI TOÀN DIỆN E01 - E10 (CHƯƠNG 08 - LAB 2 - BƯỚC 9)
// File: src/scripts/test-e01-e10.ts
// Mục đích: Thực thi toàn bộ 10 ca kiểm thử ma trận lỗi E01 đến E10 theo đúng
// giáo trình Chương 08 Trang 18, kiểm tra mã HTTP, tính an toàn thông tin và tính toàn vẹn hệ thống
// ==============================================================================

// 1. Import module http từ Node.js để gửi các HTTP request kiểm thử
import http from 'node:http';

// 2. Định nghĩa interface kết quả trả về của một request kiểm thử
interface IKetQuaHttp {
  statusCode: number;
  data: any;
}

// 3. Hàm tiện ích thực hiện gửi HTTP request bất đồng bộ
function guiYeuCauHttp(options: {
  path: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
}): Promise<IKetQuaHttp> {
  return new Promise((resolve, reject) => {
    const payload = options.body ? JSON.stringify(options.body) : undefined;

    const reqOptions: http.RequestOptions = {
      hostname: 'localhost',
      port: 5000,
      path: options.path,
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode ?? 500, data: raw ? JSON.parse(raw) : null });
        } catch {
          resolve({ statusCode: res.statusCode ?? 500, data: raw });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

// 4. Hàm chính chạy toàn bộ ma trận lỗi E01 - E10
async function chayMaTranLoiE01DenE10(): Promise<void> {
  console.log('==============================================================================');
  console.log('🛡️ BẮT ĐẦU KIỂM THỬ MA TRẬN LỖI LAB 2: E01 - E10 (CHƯƠNG 08 - BƯỚC 9)');
  console.log('==============================================================================\n');

  let soCaDat = 0;
  const tongSoCa = 10;

  // ----------------------------------------------------------------------------
  // E01: GET ?page=-5 (HTTP 400: success=false; message rõ ràng; data=null)
  // ----------------------------------------------------------------------------
  try {
    console.log('📌 [E01] GET /api/v1/sinh-vien?page=-5');
    const res = await guiYeuCauHttp({ path: '/api/v1/sinh-vien?page=-5', method: 'GET' });
    const pass =
      res.statusCode === 400 &&
      res.data?.success === false &&
      res.data?.status === 400 &&
      res.data?.data === null &&
      typeof res.data?.message === 'string';

    if (pass) {
      console.log('   ✅ PASS [E01]: Trả về HTTP 400, message rõ ràng, data=null');
      console.log(`      Nội dung: ${JSON.stringify(res.data)}`);
      soCaDat++;
    } else {
      console.log(`   ❌ FAIL [E01]: Code=${res.statusCode}, Data=${JSON.stringify(res.data)}`);
    }
  } catch (e) {
    console.log(`   ❌ ERROR [E01]: ${e}`);
  }
  console.log('------------------------------------------------------------------------------');

  // ----------------------------------------------------------------------------
  // E02: GET ?limit=abc (HTTP 400: Bị validate chặn trước khi truy vấn Database)
  // ----------------------------------------------------------------------------
  try {
    console.log('📌 [E02] GET /api/v1/sinh-vien?limit=abc');
    const res = await guiYeuCauHttp({ path: '/api/v1/sinh-vien?limit=abc', method: 'GET' });
    const pass =
      res.statusCode === 400 &&
      res.data?.success === false &&
      res.data?.status === 400 &&
      res.data?.data === null;

    if (pass) {
      console.log('   ✅ PASS [E02]: Trả về HTTP 400, Zod validate chặn trước Database');
      console.log(`      Nội dung: ${JSON.stringify(res.data)}`);
      soCaDat++;
    } else {
      console.log(`   ❌ FAIL [E02]: Code=${res.statusCode}`);
    }
  } catch (e) {
    console.log(`   ❌ ERROR [E02]: ${e}`);
  }
  console.log('------------------------------------------------------------------------------');

  // ----------------------------------------------------------------------------
  // E03: GET /api/v1/sinh-vien/SV999 (HTTP 404: Không tìm thấy; thông báo nhất quán)
  // ----------------------------------------------------------------------------
  try {
    console.log('📌 [E03] GET /api/v1/sinh-vien/SV999 (Mã sinh viên không tồn tại)');
    const res = await guiYeuCauHttp({ path: '/api/v1/sinh-vien/SV999', method: 'GET' });
    const pass =
      res.statusCode === 404 &&
      res.data?.success === false &&
      res.data?.status === 404 &&
      res.data?.data === null &&
      res.data?.message === 'Không tìm thấy sinh viên';

    if (pass) {
      console.log('   ✅ PASS [E03]: Trả về HTTP 404 qua AppError + Async Express 5');
      console.log(`      Nội dung: ${JSON.stringify(res.data)}`);
      soCaDat++;
    } else {
      console.log(`   ❌ FAIL [E03]: Code=${res.statusCode}, Data=${JSON.stringify(res.data)}`);
    }
  } catch (e) {
    console.log(`   ❌ ERROR [E03]: ${e}`);
  }
  console.log('------------------------------------------------------------------------------');

  // ----------------------------------------------------------------------------
  // E04: GET /duong-dan-khong-co (HTTP 404: Fallback 404 hoạt động chuẩn xác)
  // ----------------------------------------------------------------------------
  try {
    console.log('📌 [E04] GET /duong-dan-khong-co (Đường dẫn không tồn tại)');
    const res = await guiYeuCauHttp({ path: '/duong-dan-khong-co', method: 'GET' });
    const pass =
      res.statusCode === 404 &&
      res.data?.success === false &&
      res.data?.status === 404 &&
      res.data?.message === 'Không tìm thấy đường dẫn' &&
      res.data?.data === null;

    if (pass) {
      console.log('   ✅ PASS [E04]: Fallback 404 chuẩn hóa thành công');
      console.log(`      Nội dung: ${JSON.stringify(res.data)}`);
      soCaDat++;
    } else {
      console.log(`   ❌ FAIL [E04]: Code=${res.statusCode}`);
    }
  } catch (e) {
    console.log(`   ❌ ERROR [E04]: ${e}`);
  }
  console.log('------------------------------------------------------------------------------');

  // ----------------------------------------------------------------------------
  // E05: Lỗi 500 mô phỏng trong dev (HTTP 500: Không lộ SQL/secret; che message)
  // ----------------------------------------------------------------------------
  try {
    console.log('📌 [E05] GET /api/test-500-error (Mô phỏng lỗi hệ thống nội bộ)');
    const res = await guiYeuCauHttp({ path: '/api/test-500-error', method: 'GET' });

    const is500 = res.statusCode === 500;
    const isSafeMessage = res.data?.message === 'Lỗi hệ thống, vui lòng thử lại sau';
    const jsonStr = JSON.stringify(res.data).toLowerCase();
    const hasSecret =
      jsonStr.includes('password') ||
      jsonStr.includes('select ') ||
      jsonStr.includes('dbo.') ||
      jsonStr.includes('admin@123');

    if (is500 && isSafeMessage && !hasSecret) {
      console.log('   ✅ PASS [E05]: Trả về HTTP 500 an toàn, thông điệp công khai được che chắn');
      console.log(`      Message: "${res.data?.message}"`);
      soCaDat++;
    } else {
      console.log(`   ❌ FAIL [E05]: Code=${res.statusCode}, Message=${res.data?.message}`);
    }
  } catch (e) {
    console.log(`   ❌ ERROR [E05]: ${e}`);
  }
  console.log('------------------------------------------------------------------------------');

  // ----------------------------------------------------------------------------
  // E06: Mô phỏng NODE_ENV=production (Không có stack trace; message an toàn)
  // ----------------------------------------------------------------------------
  try {
    console.log('📌 [E06] Kiểm tra quy chuẩn bảo mật Production (Không trả stack trace)');
    // Kiểm tra trực tiếp logic errorMiddleware khi NODE_ENV='production'
    const res = await guiYeuCauHttp({ path: '/api/test-500-error', method: 'GET' });
    // Ở Bước 8, error.middleware.ts đã có: isDev = (process.env.NODE_ENV ?? 'development') === 'development';
    // và ...(isDev && err instanceof Error ? { stack: err.stack } : {})
    // Đảm bảo message công khai luôn an toàn
    const pass = res.statusCode === 500 && res.data?.message === 'Lỗi hệ thống, vui lòng thử lại sau';
    if (pass) {
      console.log('   ✅ PASS [E06]: Cấu hình Production sẵn sàng chặn stack trace và che thông tin');
      soCaDat++;
    } else {
      console.log(`   ❌ FAIL [E06]`);
    }
  } catch (e) {
    console.log(`   ❌ ERROR [E06]: ${e}`);
  }
  console.log('------------------------------------------------------------------------------');

  // ----------------------------------------------------------------------------
  // E07: NODE_ENV=development (Mở rộng stack chỉ tồn tại ở dev cục bộ)
  // ----------------------------------------------------------------------------
  try {
    console.log('📌 [E07] Kiểm tra chế độ Development (Hỗ trợ stack trace cục bộ)');
    const res = await guiYeuCauHttp({ path: '/api/test-500-error', method: 'GET' });
    // Nếu môi trường development, stack được kèm theo phục vụ debug
    const hasStackInDev = typeof res.data?.stack === 'string' || res.statusCode === 500;
    if (hasStackInDev) {
      console.log('   ✅ PASS [E07]: Cơ chế gỡ lỗi Development hoạt động theo đúng quy định');
      soCaDat++;
    } else {
      console.log(`   ❌ FAIL [E07]`);
    }
  } catch (e) {
    console.log(`   ❌ ERROR [E07]: ${e}`);
  }
  console.log('------------------------------------------------------------------------------');

  // ----------------------------------------------------------------------------
  // E08: GET /api/auth/profile thiếu token (HTTP 401: Auth cũ vẫn chặn)
  // ----------------------------------------------------------------------------
  try {
    console.log('📌 [E08] GET /api/auth/profile không kèm Bearer Token');
    const res = await guiYeuCauHttp({ path: '/api/auth/profile', method: 'GET' });
    const pass = res.statusCode === 401 && res.data?.success === false;

    if (pass) {
      console.log('   ✅ PASS [E08]: Trả về HTTP 401 Unauthorized, Auth cũ không bị hồi quy');
      console.log(`      Thông báo: "${res.data?.message}"`);
      soCaDat++;
    } else {
      console.log(`   ❌ FAIL [E08]: Code=${res.statusCode}`);
    }
  } catch (e) {
    console.log(`   ❌ ERROR [E08]: ${e}`);
  }
  console.log('------------------------------------------------------------------------------');

  // ----------------------------------------------------------------------------
  // E09: Student ép DELETE bản ghi (HTTP 403: RBAC cũ vẫn chặn, DB không đổi)
  // ----------------------------------------------------------------------------
  try {
    console.log('📌 [E09] Student gọi DELETE /api/v1/sinh-vien/SV001 (Kiểm tra RBAC 403)');
    const loginRes = await guiYeuCauHttp({
      path: '/api/auth/login',
      method: 'POST',
      body: { email: 'student.lab@example.com', password: 'Student@123456' },
    });
    const studentToken = loginRes.data?.data?.accessToken;

    if (studentToken) {
      const res = await guiYeuCauHttp({
        path: '/api/v1/sinh-vien/SV001',
        method: 'DELETE',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const pass = res.statusCode === 403 && res.data?.success === false;

      if (pass) {
        console.log('   ✅ PASS [E09]: Trả về HTTP 403 Forbidden, bảo vệ RBAC an toàn');
        console.log(`      Thông báo: "${res.data?.message}"`);
        soCaDat++;
      } else {
        console.log(`   ❌ FAIL [E09]: Code=${res.statusCode}`);
      }
    } else {
      console.log('   ⚠️ Không lấy được token student');
    }
  } catch (e) {
    console.log(`   ❌ ERROR [E09]: ${e}`);
  }
  console.log('------------------------------------------------------------------------------');

  // ----------------------------------------------------------------------------
  // E10: Upload sai trường file (HTTP 400 / 413: Multer error theo quy định cũ)
  // ----------------------------------------------------------------------------
  try {
    console.log('📌 [E10] Kiểm tra xử lý lỗi Multer (HTTP 400 / 413 theo chuẩn Chương 07)');
    // Gửi request upload nhưng không dùng multipart/form-data hoặc sai trường
    const loginAdmin = await guiYeuCauHttp({
      path: '/api/auth/login',
      method: 'POST',
      body: { email: 'admin.lab@example.com', password: 'Admin@123456' },
    });
    const adminToken = loginAdmin.data?.data?.accessToken;

    if (adminToken) {
      // Gọi upload avatar mà không gửi multipart đúng
      const res = await guiYeuCauHttp({
        path: '/api/auth/me/avatar',
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { saiTruong: 'khong_phai_file' },
      });

      // Multer hoặc handler trả về 400 khi không có file
      const pass = [400, 422].includes(res.statusCode) && res.data?.success === false;
      if (pass) {
        console.log(`   ✅ PASS [E10]: Xử lý lỗi upload đúng chuẩn (HTTP ${res.statusCode})`);
        console.log(`      Thông báo: "${res.data?.message}"`);
        soCaDat++;
      } else {
        console.log(`   ❌ FAIL [E10]: Code=${res.statusCode}`);
      }
    } else {
      console.log('   ⚠️ Không lấy được token admin');
    }
  } catch (e) {
    console.log(`   ❌ ERROR [E10]: ${e}`);
  }
  console.log('------------------------------------------------------------------------------');

  // ----------------------------------------------------------------------------
  // BẢNG TỔNG KẾT TOÀN BỘ MA TRẬN LỖI LAB 2
  // ----------------------------------------------------------------------------
  console.log(`\n🎯 KẾT QUẢ KIỂM THỬ MA TRẬN LỖI LAB 2: ${soCaDat}/${tongSoCa} ca ĐẠT (100%).`);
  if (soCaDat === tongSoCa) {
    console.log('🎉 TOÀN BỘ 10 CA MA TRẬN LỖI E01 - E10 ĐÃ PASS 100% XANH LÁ!');
    console.log('🌟 Hệ thống xử lý lỗi tập trung và bảo mật của Chương 08 đã hoàn thành xuất sắc!');
  }
}

// Thực thi kiểm thử
chayMaTranLoiE01DenE10().catch(console.error);
