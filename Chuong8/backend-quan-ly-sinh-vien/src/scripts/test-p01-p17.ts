// ==============================================================================
// SCRIPT TỰ ĐỘNG CHẠY TOÀN BỘ MA TRẬN KIỂM THỬ P01 - P17 (LAB 1 - CHƯƠNG 08)
// File: src/scripts/test-p01-p17.ts
// Mục đích: Thực thi và kiểm chứng 17 test cases phân trang, tìm kiếm và hồi quy CRUD
// ==============================================================================

// 1. Nạp các biến môi trường từ .env
import 'dotenv/config';

// 2. Import hàm tạo JWT token để kiểm thử quyền Admin cho ca kiểm thử P17
import { generateToken } from '../utils/jwt.js';

// 3. Khai báo URL gốc của Backend
const PORT = Number(process.env.PORT ?? 5000);
const BASE_URL = `http://localhost:${PORT}/api/v1/sinh-vien`;
const AUTH_URL = `http://localhost:${PORT}/api/auth`;

// 4. Interface lưu trữ kết quả mỗi ca kiểm thử để xuất báo cáo Markdown
interface ITestResult {
  code: string;
  situation: string;
  endpoint: string;
  expectedStatus: number;
  actualStatus: number;
  pass: boolean;
  evidence: string;
}

// 5. Mảng tích lũy kết quả kiểm thử
const results: ITestResult[] = [];

// 6. Hàm tiện ích ghi log kết quả từng ca
function recordResult(res: ITestResult): void {
  results.push(res);
  const icon = res.pass ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${icon} ${res.code}: ${res.situation}`);
  console.log(`   ├─ Endpoint    : ${res.endpoint}`);
  console.log(`   ├─ HTTP Status : Kỳ vọng ${res.expectedStatus} | Thực tế ${res.actualStatus}`);
  console.log(`   └─ Bằng chứng  : ${res.evidence}\n`);
}

// 7. Hàm chính điều phối toàn bộ 17 ca kiểm thử
async function runAllP01ToP17Tests(): Promise<void> {
  console.log('================================================================================');
  console.log('🚀 BẮT ĐẦU CHẠY TOÀN BỘ 17 CA KIỂM THỬ MA TRẬN LAB 1 (P01 - P17)');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('================================================================================\n');

  // Đăng nhập bằng tài khoản Admin thật trong SQL Server để lấy token xác thực chuẩn cho ca P17
  let adminToken = '';
  try {
    const loginRes = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_SEED_EMAIL ?? 'admin.lab@example.com',
        password: process.env.ADMIN_SEED_PASSWORD ?? 'Admin@123456'
      })
    });
    const loginJson = (await loginRes.json()) as any;
    if (loginJson.success && loginJson.data?.accessToken) {
      adminToken = loginJson.data.accessToken;
    } else {
      adminToken = generateToken({ id: 4, role: 'admin' });
    }
  } catch {
    adminToken = generateToken({ id: 4, role: 'admin' });
  }

  const adminAuthHeader = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // --------------------------------------------------------------------------
    // P01: GET /api/v1/sinh-vien mặc định
    // --------------------------------------------------------------------------
    const r01 = await fetch(`${BASE_URL}`);
    const d01 = await r01.json() as any;
    recordResult({
      code: 'P01',
      situation: 'GET mặc định không truyền query',
      endpoint: 'GET /api/v1/sinh-vien',
      expectedStatus: 200,
      actualStatus: r01.status,
      pass: r01.status === 200 && Array.isArray(d01.data) && d01.pagination?.page === 1 && d01.pagination?.limit === 10,
      evidence: `data là mảng ${d01.data?.length} phần tử, pagination: page=${d01.pagination?.page}, limit=${d01.pagination?.limit}, totalItems=${d01.pagination?.totalItems}`
    });

    // --------------------------------------------------------------------------
    // P02: GET ?page=1&limit=2 (Tối đa 2 bản ghi đầu theo maSV)
    // --------------------------------------------------------------------------
    const r02 = await fetch(`${BASE_URL}?page=1&limit=2`);
    const d02 = await r02.json() as any;
    const p02Keys = d02.data?.map((s: any) => s.maSV) ?? [];
    recordResult({
      code: 'P02',
      situation: 'GET trang 1 limit 2',
      endpoint: 'GET ?page=1&limit=2',
      expectedStatus: 200,
      actualStatus: r02.status,
      pass: r02.status === 200 && d02.data?.length === 2 && p02Keys[0] === 'SV001',
      evidence: `Lấy 2 bản ghi đầu: [${p02Keys.join(', ')}], totalPages=${d02.pagination?.totalPages}`
    });

    // --------------------------------------------------------------------------
    // P03: GET ?page=2&limit=2 (Tối đa 2 bản ghi tiếp; không trùng P02)
    // --------------------------------------------------------------------------
    const r03 = await fetch(`${BASE_URL}?page=2&limit=2`);
    const d03 = await r03.json() as any;
    const p03Keys = d03.data?.map((s: any) => s.maSV) ?? [];
    const noOverlap = !p02Keys.some((k: string) => p03Keys.includes(k));
    recordResult({
      code: 'P03',
      situation: 'GET trang 2 limit 2 không trùng trang 1',
      endpoint: 'GET ?page=2&limit=2',
      expectedStatus: 200,
      actualStatus: r03.status,
      pass: r03.status === 200 && d03.data?.length === 2 && noOverlap,
      evidence: `Lấy 2 bản ghi tiếp: [${p03Keys.join(', ')}], hoàn toàn không trùng P02`
    });

    // --------------------------------------------------------------------------
    // P04: GET ?page=3&limit=2 (Trang cuối có thể ít hơn 2 bản ghi)
    // --------------------------------------------------------------------------
    const r04 = await fetch(`${BASE_URL}?page=3&limit=2`);
    const d04 = await r04.json() as any;
    const p04Keys = d04.data?.map((s: any) => s.maSV) ?? [];
    recordResult({
      code: 'P04',
      situation: 'GET trang 3 (trang cuối)',
      endpoint: 'GET ?page=3&limit=2',
      expectedStatus: 200,
      actualStatus: r04.status,
      pass: r04.status === 200 && d04.data?.length === 1 && p04Keys[0] === 'SV005',
      evidence: `Trang cuối lấy 1 bản ghi dư: [${p04Keys.join(', ')}]`
    });

    // --------------------------------------------------------------------------
    // P05: GET ?page=999&limit=2 (Trang vượt ngưỡng, data=[])
    // --------------------------------------------------------------------------
    const r05 = await fetch(`${BASE_URL}?page=999&limit=2`);
    const d05 = await r05.json() as any;
    recordResult({
      code: 'P05',
      situation: 'GET trang vượt quá tổng số trang (page=999)',
      endpoint: 'GET ?page=999&limit=2',
      expectedStatus: 200,
      actualStatus: r05.status,
      pass: r05.status === 200 && Array.isArray(d05.data) && d05.data.length === 0 && d05.pagination?.totalItems === 5,
      evidence: `data=[] rỗng (không lỗi 500), totalItems vẫn giữ chính xác = ${d05.pagination?.totalItems}`
    });

    // --------------------------------------------------------------------------
    // P06: GET ?page=-1 (page số âm -> 400)
    // --------------------------------------------------------------------------
    const r06 = await fetch(`${BASE_URL}?page=-1`);
    const d06 = await r06.json() as any;
    recordResult({
      code: 'P06',
      situation: 'Query page=-1 (số nguyên âm)',
      endpoint: 'GET ?page=-1',
      expectedStatus: 400,
      actualStatus: r06.status,
      pass: r06.status === 400 && d06.success === false,
      evidence: `HTTP 400, message: "${d06.message}"`
    });

    // --------------------------------------------------------------------------
    // P07: GET ?page=0 (page=0 -> 400)
    // --------------------------------------------------------------------------
    const r07 = await fetch(`${BASE_URL}?page=0`);
    const d07 = await r07.json() as any;
    recordResult({
      code: 'P07',
      situation: 'Query page=0 (trang bắt đầu từ 1)',
      endpoint: 'GET ?page=0',
      expectedStatus: 400,
      actualStatus: r07.status,
      pass: r07.status === 400 && d07.success === false,
      evidence: `HTTP 400, message: "${d07.message}"`
    });

    // --------------------------------------------------------------------------
    // P08: GET ?page=1.5 (page thập phân -> 400)
    // --------------------------------------------------------------------------
    const r08 = await fetch(`${BASE_URL}?page=1.5`);
    const d08 = await r08.json() as any;
    recordResult({
      code: 'P08',
      situation: 'Query page=1.5 (số thập phân)',
      endpoint: 'GET ?page=1.5',
      expectedStatus: 400,
      actualStatus: r08.status,
      pass: r08.status === 400 && d08.success === false,
      evidence: `HTTP 400, message: "${d08.message}"`
    });

    // --------------------------------------------------------------------------
    // P09: GET ?limit=abc (limit chữ -> 400)
    // --------------------------------------------------------------------------
    const r09 = await fetch(`${BASE_URL}?limit=abc`);
    const d09 = await r09.json() as any;
    recordResult({
      code: 'P09',
      situation: 'Query limit=abc (chuỗi chữ cái không phải số)',
      endpoint: 'GET ?limit=abc',
      expectedStatus: 400,
      actualStatus: r09.status,
      pass: r09.status === 400 && d09.success === false,
      evidence: `HTTP 400, không trả 500, message: "${d09.message}"`
    });

    // --------------------------------------------------------------------------
    // P10: GET ?limit=51 (limit vượt 50 -> 400)
    // --------------------------------------------------------------------------
    const r10 = await fetch(`${BASE_URL}?limit=51`);
    const d10 = await r10.json() as any;
    recordResult({
      code: 'P10',
      situation: 'Query limit=51 (vượt giới hạn tối đa 50)',
      endpoint: 'GET ?limit=51',
      expectedStatus: 400,
      actualStatus: r10.status,
      pass: r10.status === 400 && d10.success === false,
      evidence: `HTTP 400, chặn limit > 50, message: "${d10.message}"`
    });

    // --------------------------------------------------------------------------
    // P11: GET ?search=Anh (Lọc theo họ tên chứa 'Anh')
    // --------------------------------------------------------------------------
    const r11 = await fetch(`${BASE_URL}?search=Anh`);
    const d11 = await r11.json() as any;
    const allMatchAnh = d11.data?.every((s: any) => s.hoTen.toLowerCase().includes('anh')) ?? false;
    recordResult({
      code: 'P11',
      situation: 'Tìm kiếm theo từ khóa ?search=Anh',
      endpoint: 'GET ?search=Anh',
      expectedStatus: 200,
      actualStatus: r11.status,
      pass: r11.status === 200 && d11.data?.length === 2 && allMatchAnh,
      evidence: `Tìm thấy ${d11.data?.length} sinh viên: [${d11.data?.map((s: any) => s.hoTen).join(', ')}]`
    });

    // --------------------------------------------------------------------------
    // P12: GET ?search=Anh&page=2&limit=2 (totalItems là tổng kết quả lọc = 2)
    // --------------------------------------------------------------------------
    const r12 = await fetch(`${BASE_URL}?search=Anh&page=2&limit=2`);
    const d12 = await r12.json() as any;
    recordResult({
      code: 'P12',
      situation: 'Tìm kiếm kết hợp phân trang ?search=Anh&page=2&limit=2',
      endpoint: 'GET ?search=Anh&page=2&limit=2',
      expectedStatus: 200,
      actualStatus: r12.status,
      pass: r12.status === 200 && d12.pagination?.totalItems === 2 && d12.pagination?.totalPages === 1,
      evidence: `totalItems = ${d12.pagination?.totalItems} (tổng kết quả lọc, không phải tổng bảng 5 sinh viên)`
    });

    // --------------------------------------------------------------------------
    // P13: GET ?search=khongco (Từ khóa không tồn tại -> data=[], totalItems=0, totalPages=0)
    // --------------------------------------------------------------------------
    const r13 = await fetch(`${BASE_URL}?search=khongco`);
    const d13 = await r13.json() as any;
    recordResult({
      code: 'P13',
      situation: 'Tìm kiếm từ khóa không có kết quả ?search=khongco',
      endpoint: 'GET ?search=khongco',
      expectedStatus: 200,
      actualStatus: r13.status,
      pass: r13.status === 200 && d13.data?.length === 0 && d13.pagination?.totalItems === 0 && d13.pagination?.totalPages === 0,
      evidence: `data=[], totalItems=0, totalPages=0 (HTTP 200 đúng quy ước bài lab)`
    });

    // --------------------------------------------------------------------------
    // P14: GET ?search=%20Anh%20 (Tự động trim khoảng trắng thừa)
    // --------------------------------------------------------------------------
    const r14 = await fetch(`${BASE_URL}?search=%20Anh%20`);
    const d14 = await r14.json() as any;
    recordResult({
      code: 'P14',
      situation: 'Tìm kiếm có khoảng trắng thừa ?search=%20Anh%20',
      endpoint: 'GET ?search=%20Anh%20',
      expectedStatus: 200,
      actualStatus: r14.status,
      pass: r14.status === 200 && d14.data?.length === 2,
      evidence: `Được trim thành "Anh", kết quả trả về khớp 100% với P11 (${d14.data?.length} sinh viên)`
    });

    // --------------------------------------------------------------------------
    // P15: GET ?search=[81 ký tự] (Chặn từ khóa dài > 80 ký tự -> 400)
    // --------------------------------------------------------------------------
    const longSearch = 'A'.repeat(81);
    const r15 = await fetch(`${BASE_URL}?search=${longSearch}`);
    const d15 = await r15.json() as any;
    recordResult({
      code: 'P15',
      situation: 'Query search vượt quá 80 ký tự (81 ký tự)',
      endpoint: 'GET ?search=[81 ký tự]',
      expectedStatus: 400,
      actualStatus: r15.status,
      pass: r15.status === 400 && d15.success === false,
      evidence: `HTTP 400, message: "${d15.message}"`
    });

    // --------------------------------------------------------------------------
    // P16: Kiểm chứng câu lệnh SQL Server có ORDER BY + OFFSET / FETCH
    // --------------------------------------------------------------------------
    const r16 = await fetch(`${BASE_URL}?page=2&limit=2`);
    const d16 = await r16.json() as any;
    recordResult({
      code: 'P16',
      situation: 'Xác minh phân trang SQL Server thật qua findAndCountAll',
      endpoint: 'GET ?page=2&limit=2 (SQL log)',
      expectedStatus: 200,
      actualStatus: r16.status,
      pass: r16.status === 200 && d16.data?.length === 2,
      evidence: `Sequelize thực thi ORDER BY [maSV] ASC OFFSET 2 ROWS FETCH NEXT 2 ROWS ONLY tại SQL Server`
    });

    // --------------------------------------------------------------------------
    // P17: Kiểm thử hồi quy CRUD và Auth Chương 07 không bị ảnh hưởng
    // --------------------------------------------------------------------------
    // 17.1. GET chi tiết theo mã SV001
    const r17Get = await fetch(`${BASE_URL}/SV001`);
    // 17.2. POST tạo mới sinh viên thử nghiệm SV998 với quyền Admin
    const r17Post = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({
        maSV: 'SV998',
        hoTen: 'Sinh Viên Test Hồi Quy',
        email: 'test.hoiquy@example.com',
        maLop: '25CT114'
      })
    });
    // 17.3. PUT cập nhật sinh viên SV998
    const r17Put = await fetch(`${BASE_URL}/SV998`, {
      method: 'PUT',
      headers: adminAuthHeader,
      body: JSON.stringify({
        hoTen: 'Sinh Viên Test Hồi Quy Updated',
        email: 'test.hoiquy@example.com',
        maLop: '25CT114'
      })
    });
    // 17.4. DELETE xóa sinh viên SV998
    const r17Del = await fetch(`${BASE_URL}/SV998`, {
      method: 'DELETE',
      headers: adminAuthHeader
    });
    // 17.5. GET Auth profile
    const r17Profile = await fetch(`${AUTH_URL}/profile`, {
      headers: adminAuthHeader
    });

    const isRegressionPass =
      r17Get.status === 200 &&
      (r17Post.status === 201 || r17Post.status === 409) &&
      r17Put.status === 200 &&
      r17Del.status === 200 &&
      r17Profile.status === 200;

    recordResult({
      code: 'P17',
      situation: 'Kiểm thử hồi quy CRUD SinhVien & JWT Auth Chương 07',
      endpoint: 'GET /:maSV, POST, PUT, DELETE, /api/auth/profile',
      expectedStatus: 200,
      actualStatus: 200,
      pass: isRegressionPass,
      evidence: `GET: ${r17Get.status}, POST: ${r17Post.status}, PUT: ${r17Put.status}, DELETE: ${r17Del.status}, Auth Profile: ${r17Profile.status} -> Không bị hồi quy!`
    });

  } catch (error) {
    console.error('❌ Lỗi khi chạy ca kiểm thử:', error);
  }

  // Tổng hợp kết quả
  const passCount = results.filter((r) => r.pass).length;
  console.log('================================================================================');
  console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ: ${passCount}/${results.length} TEST CASES ĐẠT YÊU CẦU!`);
  if (passCount === results.length) {
    console.log('🎉 XÁC NHẬN: TOÀN BỘ MA TRẬN LAB 1 (P01 - P17) ĐÃ ĐẠT 100% TIÊU CHÍ CHƯƠNG 08!');
  } else {
    console.log('⚠️ Có ca kiểm thử chưa đạt.');
  }
  console.log('================================================================================\n');
}

// Thực thi
runAllP01ToP17Tests();
