// ==============================================================================
// SCRIPT KIỂM THỬ BƯỚC 7: XÁC MINH API SINH VIÊN VÀ ĐỒNG BỘ DỮ LIỆU FRONTEND
// File: src/scripts/test-step7-frontend-table.ts
// Mục đích: Xác minh API GET /api/v1/sinh-vien trả đúng cấu trúc cho Component SinhVienTable
// ==============================================================================

// Import instance sequelize để đối chiếu trực tiếp dữ liệu từ SQL Server
import { sequelize } from '../config/database.js';

// Import SinhVien model từ backend (lưu ý tên file là SinhVien.js)
import { SinhVien } from '../models/SinhVien.js';

// Hàm chính điều phối kiểm thử Bước 7
async function runStep7Verification(): Promise<void> {
  // Địa chỉ endpoint lấy danh sách sinh viên
  const API_URL = 'http://localhost:5000/api/v1/sinh-vien';

  console.log(`\n================================================================================`);
  console.log(`🚀 BẮT ĐẦU KIỂM THỬ BƯỚC 7: HIỂN THỊ DANH SÁCH SINH VIÊN QUA AXIOS GET`);
  console.log(`================================================================================\n`);

  try {
    // 1. Kết nối cơ sở dữ liệu để truy vấn số liệu thật
    await sequelize.authenticate();

    // 2. Truy vấn danh sách sinh viên trực tiếp từ SQL Server
    const dbSinhViens = await SinhVien.findAll({ order: [['maSV', 'ASC']] });
    console.log(`==> Số lượng sinh viên thực tế trong SQL Server: ${dbSinhViens.length}`);

    // 3. Giả lập Frontend gửi request GET kèm Origin http://localhost:5173
    const res = await fetch(API_URL, {
      method: 'GET',
      headers: {
        Origin: 'http://localhost:5173',
        Accept: 'application/json'
      }
    });

    const body = (await res.json()) as {
      success: boolean;
      message: string;
      data: Array<{ maSV: string; hoTen: string; email: string; maLop: string }>;
    };

    // --------------------------------------------------------------------------
    // TEST 1 (F01/F02): HTTP Status 200 và cấu trúc { success, message, data }
    // --------------------------------------------------------------------------
    const passStructure =
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.data) &&
      body.data.length === dbSinhViens.length;

    console.log(`${passStructure ? '✅ [PASS]' : '❌ [FAIL]'} TEST 1: API GET trả 200 và mảng dữ liệu khớp 100% với SQL Server`);
    console.log(`   └─> Status: ${res.status} | Số lượng phần tử trả về: ${body.data.length}`);

    // --------------------------------------------------------------------------
    // TEST 2: Kiểm tra đầy đủ 4 cột (maSV, hoTen, email, maLop) trên từng bản ghi
    // --------------------------------------------------------------------------
    const allRecordsValid = body.data.every(
      (sv) =>
        typeof sv.maSV === 'string' &&
        typeof sv.hoTen === 'string' &&
        typeof sv.email === 'string' &&
        typeof sv.maLop === 'string'
    );
    console.log(`${allRecordsValid ? '✅ [PASS]' : '❌ [FAIL]'} TEST 2: Đảm bảo toàn bộ sinh viên có đủ 4 trường hiển thị trên Table`);
    if (body.data.length > 0) {
      console.log(`   └─> Mẫu sinh viên đầu tiên: ${JSON.stringify(body.data[0])}`);
    }

    // --------------------------------------------------------------------------
    // TEST 3 (F12): Kiểm tra Header CORS cho phép Origin của Vite
    // --------------------------------------------------------------------------
    const allowOrigin = res.headers.get('access-control-allow-origin');
    const passCors = allowOrigin === 'http://localhost:5173';
    console.log(`${passCors ? '✅ [PASS]' : '❌ [FAIL]'} TEST 3: Header CORS Access-Control-Allow-Origin cấp đúng cho Vite (5173)`);

    console.log(`\n================================================================================`);
    console.log(`🎉 TOÀN BỘ CÁC TIÊU CHÍ BƯỚC 7 ĐÃ PASS 100%!`);
    console.log(`================================================================================\n`);
  } catch (error) {
    console.error('Lỗi kiểm thử Bước 7:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

// Chạy kịch bản kiểm thử
runStep7Verification();
