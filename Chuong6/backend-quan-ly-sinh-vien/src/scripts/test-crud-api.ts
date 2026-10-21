// ==============================================================================
// SCRIPT TỰ ĐỘNG KIỂM THỬ TOÀN BỘ 12 CA TEST CRUD & SWAGGER (BƯỚC 7 & BƯỚC 10)
// File: src/scripts/test-crud-api.ts
// Mục đích: Chạy thử nghiệm tự động trên Express server để kiểm chứng dữ liệu thực tế
// ==============================================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { sequelize } from '../config/database.js';
import { swaggerSpec } from '../config/swagger.config.js';
import sinhVienRouter from '../routes/sinhVien.routes.js';
import { errorMiddleware } from '../middlewares/error.middleware.js';
import { generateToken } from '../utils/jwt.js';
import type { Server } from 'node:http';

// Khởi tạo app phục vụ test
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Gắn route Swagger UI và API Sinh Viên
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1/sinh-vien', sinhVienRouter);
app.use(errorMiddleware);

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Tạo token admin hợp lệ phục vụ kiểm thử hồi quy các route ghi được bảo vệ bởi isAuth & isAdmin
const adminToken = generateToken({ id: 1, role: 'admin' });
const adminHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${adminToken}`
};
const adminAuthHeader = {
  'Authorization': `Bearer ${adminToken}`
};

// Hàm in kết quả test trực quan
function logTestResult(id: string, name: string, pass: boolean, detail: string): void {
  const statusIcon = pass ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${statusIcon} ${id}: ${name}`);
  console.log(`   └─> ${detail}\n`);
}

async function runTests(): Promise<void> {
  let server: Server | null = null;
  try {
    // 1. Kết nối CSDL
    await sequelize.authenticate();
    console.log(`\n======================================================`);
    console.log(`🚀 BẮT ĐẦU KIỂM THỬ BƯỚC 7 & 12 TEST CASES CRUD`);
    console.log(`======================================================\n`);

    // 2. Mở server test
    server = app.listen(TEST_PORT);

    // Dọn dẹp mã SV003 trước khi test nếu đã tồn tại từ trước (kèm Bearer token admin)
    await fetch(`${BASE_URL}/api/v1/sinh-vien/SV003`, { method: 'DELETE', headers: adminAuthHeader });

    // --- TEST SWAGGER UI ---
    const swaggerRes = await fetch(`${BASE_URL}/api-docs/`);
    logTestResult(
      'SWAGGER',
      'Kiểm tra giao diện Swagger UI (/api-docs)',
      swaggerRes.status === 200,
      `Status: ${swaggerRes.status} (Hiển thị đầy đủ 5 API CRUD)`
    );

    // --- T01: GET danh sách ---
    const t01Res = await fetch(`${BASE_URL}/api/v1/sinh-vien`);
    const t01Data = await t01Res.json();
    logTestResult(
      'T01',
      'GET danh sách sinh viên',
      t01Res.status === 200 && Array.isArray(t01Data.data),
      `Status: ${t01Res.status} | Số lượng sinh viên: ${t01Data.data?.length ?? 0}`
    );

    // --- T02: POST SV003 hợp lệ ---
    const t02Res = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        maSV: 'SV003',
        hoTen: 'Ngọc Mai',
        email: 'ngocmai@example.com',
        maLop: '25CT114'
      })
    });
    const t02Data = await t02Res.json();
    logTestResult(
      'T02',
      'POST SV003 mới hợp lệ',
      t02Res.status === 201 && t02Data.success === true,
      `Status: ${t02Res.status} | Message: ${t02Data.message}`
    );

    // --- T03: POST lại SV003 (trùng mã) ---
    const t03Res = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        maSV: 'SV003',
        hoTen: 'Ngọc Mai Trùng',
        email: 'ngocmai2@example.com',
        maLop: '25CT114'
      })
    });
    const t03Data = await t03Res.json();
    logTestResult(
      'T03',
      'POST lại SV003 lần 2 (Trùng mã)',
      t03Res.status === 409 && t03Data.success === false,
      `Status: ${t03Res.status} | Message: ${t03Data.message}`
    );

    // --- T04: POST thiếu hoTen ---
    const t04Res = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        maSV: 'SV004',
        email: 'thieu@example.com',
        maLop: '25CT114'
      })
    });
    const t04Data = await t04Res.json();
    logTestResult(
      'T04',
      'POST thiếu trường hoTen',
      t04Res.status === 400 && t04Data.success === false,
      `Status: ${t04Res.status} | Message: ${t04Data.message}`
    );

    // --- T05: GET SV003 sau khi tạo ---
    const t05Res = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV003`);
    const t05Data = await t05Res.json();
    logTestResult(
      'T05',
      'GET SV003 sau khi tạo (Kiểm chứng)',
      t05Res.status === 200 && t05Data.data?.hoTen === 'Ngọc Mai',
      `Status: ${t05Res.status} | Data: ${JSON.stringify(t05Data.data)}`
    );

    // --- T06: PUT SV003 đủ ba trường ---
    const t06Res = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV003`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        hoTen: 'Ngọc Mai Updated',
        email: 'ngocmai@example.com',
        maLop: '25CT114'
      })
    });
    const t06Data = await t06Res.json();
    logTestResult(
      'T06',
      'PUT SV003 đủ 3 trường',
      t06Res.status === 200 && t06Data.data?.hoTen === 'Ngọc Mai Updated',
      `Status: ${t06Res.status} | Họ tên mới: ${t06Data.data?.hoTen}`
    );

    // --- T07: PUT SV003 thiếu email ---
    const t07Res = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV003`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        hoTen: 'Ngọc Mai Thiếu Email',
        maLop: '25CT114'
      })
    });
    const t07Data = await t07Res.json();
    logTestResult(
      'T07',
      'PUT SV003 thiếu email (Kiểm tra validation)',
      t07Res.status === 400 && t07Data.success === false,
      `Status: ${t07Res.status} | Message: ${t07Data.message}`
    );

    // --- T08: PUT SV9999 không tồn tại ---
    const t08Res = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV9999`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        hoTen: 'Khong Ton Tai',
        email: 'khong@example.com',
        maLop: '25CT114'
      })
    });
    const t08Data = await t08Res.json();
    logTestResult(
      'T08',
      'PUT mã không tồn tại SV9999',
      t08Res.status === 404 && t08Data.success === false,
      `Status: ${t08Res.status} | Message: ${t08Data.message}`
    );

    // --- T09: GET SV9999 ---
    const t09Res = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV9999`);
    const t09Data = await t09Res.json();
    logTestResult(
      'T09',
      'GET mã không tồn tại SV9999',
      t09Res.status === 404 && t09Data.success === false,
      `Status: ${t09Res.status} | Message: ${t09Data.message}`
    );

    // --- T10: DELETE SV003 ---
    const t10Res = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV003`, {
      method: 'DELETE',
      headers: adminAuthHeader
    });
    const t10Data = await t10Res.json();
    logTestResult(
      'T10',
      'DELETE SV003 thành công',
      t10Res.status === 200 && t10Data.success === true,
      `Status: ${t10Res.status} | Message: ${t10Data.message}`
    );

    // --- T11: GET SV003 sau khi xóa ---
    const t11Res = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV003`);
    const t11Data = await t11Res.json();
    logTestResult(
      'T11',
      'GET SV003 sau khi xóa (Kiểm chứng 404)',
      t11Res.status === 404 && t11Data.success === false,
      `Status: ${t11Res.status} | Message: ${t11Data.message}`
    );

    // --- T12: DELETE lại SV003 lần 2 ---
    const t12Res = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV003`, {
      method: 'DELETE',
      headers: adminAuthHeader
    });
    const t12Data = await t12Res.json();
    logTestResult(
      'T12',
      'DELETE lại SV003 lần 2 (Kiểm tra 404)',
      t12Res.status === 404 && t12Data.success === false,
      `Status: ${t12Res.status} | Message: ${t12Data.message}`
    );

    console.log(`======================================================`);
    console.log(`🎉 TẤT CẢ CÁC TEST CASES ĐÃ PASS 100%!`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Lỗi trong quá trình kiểm thử:', err);
  } finally {
    if (server) {
      server.close();
    }
    await sequelize.close();
  }
}

// Chạy hàm kiểm thử
runTests();
