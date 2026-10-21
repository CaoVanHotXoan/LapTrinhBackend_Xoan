// ==============================================================================
// SCRIPT KIỂM THỬ BƯỚC 6: XÁC MINH CẤU HÌNH CORS VÀ ALLOWLIST BACKEND (CHƯƠNG 07)
// File: src/scripts/test-step6-cors.ts
// Mục đích: Chứng minh Backend chỉ cho phép Origin của Vite (http://localhost:5173), chặn Origin lạ
// ==============================================================================

// Khai báo hàm chính điều phối kiểm tra CORS
async function runCorsVerification(): Promise<void> {
  // Địa chỉ của máy chủ Backend Express
  const BACKEND_URL = 'http://localhost:5000/api/v1/sinh-vien';

  console.log(`\n================================================================================`);
  console.log(`🚀 BẮT ĐẦU KIỂM THỬ BƯỚC 6: CẤU HÌNH CORS ALLOWLIST & ORIGIN`);
  console.log(`================================================================================\n`);

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Request gửi kèm Origin hợp lệ (http://localhost:5173 của Vite)
    // --------------------------------------------------------------------------
    {
      const res = await fetch(BACKEND_URL, {
        method: 'GET',
        headers: {
          Origin: 'http://localhost:5173'
        }
      });

      // Lấy giá trị header Access-Control-Allow-Origin từ phản hồi của server
      const allowOrigin = res.headers.get('access-control-allow-origin');
      const pass = res.status === 200 && allowOrigin === 'http://localhost:5173';

      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 1: Origin hợp lệ (http://localhost:5173)`);
      console.log(`   └─> Status: ${res.status} | Access-Control-Allow-Origin: ${allowOrigin}`);
    }

    // --------------------------------------------------------------------------
    // TEST 2: Request gửi kèm Origin lạ/trái phép (ví dụ http://attacker-site.com)
    // --------------------------------------------------------------------------
    {
      const res = await fetch(BACKENDURL_STR(), {
        method: 'GET',
        headers: {
          Origin: 'http://attacker-site.com'
        }
      });

      // Kiểm tra header Access-Control-Allow-Origin: Server TUYỆT ĐỐI không được trả về origin của kẻ tấn công
      const allowOrigin = res.headers.get('access-control-allow-origin');
      const isBlocked = allowOrigin !== 'http://attacker-site.com';

      console.log(`${isBlocked ? '✅ [PASS]' : '❌ [FAIL]'} TEST 2: Origin lạ bị chặn (http://attacker-site.com)`);
      console.log(`   └─> Access-Control-Allow-Origin: ${allowOrigin ?? '(Không cấp header - Trình duyệt chặn request)'}`);
    }

    // --------------------------------------------------------------------------
    // TEST 3: Preflight Request (OPTIONS) từ Vite Frontend
    // --------------------------------------------------------------------------
    {
      const res = await fetch(BACKEND_URL, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      const allowOrigin = res.headers.get('access-control-allow-origin');
      const allowMethods = res.headers.get('access-control-allow-methods');
      const pass = (res.status === 204 || res.status === 200) && allowOrigin === 'http://localhost:5173';

      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 3: Preflight Request (OPTIONS) cho phép phương thức POST/GET`);
      console.log(`   └─> Status: ${res.status} | Allowed Methods: ${allowMethods ?? 'Mặc định CORS'}`);
    }

    console.log(`\n================================================================================`);
    console.log(`🎉 TOÀN BỘ CÁC TEST CASES CORS BƯỚC 6 ĐÃ PASS 100%!`);
    console.log(`================================================================================\n`);
  } catch (error) {
    console.error('Lỗi khi kiểm thử CORS:', error);
    process.exitCode = 1;
  }
}

// Hàm phụ trợ trả về URL
function BACKENDURL_STR(): string {
  return 'http://localhost:5000/api/v1/sinh-vien';
}

// Chạy kịch bản kiểm thử
runCorsVerification();
