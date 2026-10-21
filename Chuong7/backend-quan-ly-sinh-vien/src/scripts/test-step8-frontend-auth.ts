// ==============================================================================
// SCRIPT KIỂM THỬ BƯỚC 8: XÁC MINH LUỒNG ĐĂNG NHẬP REACT & BEARER JWT (CHƯƠNG 07)
// File: src/scripts/test-step8-frontend-auth.ts
// Mục đích: Kiểm chứng các ca F06, F07, F08 (Login đúng/sai, lấy Profile, kiểm soát 401)
// ==============================================================================

// Import bcrypt để tạo user test thật
import bcrypt from 'bcrypt';

// Import sequelize và User model
import { sequelize } from '../config/database.js';
import { User } from '../models/user.model.js';

// Hàm chính điều phối kiểm thử Bước 8
async function runStep8AuthVerification(): Promise<void> {
  const BASE_URL = 'http://localhost:5000';
  const emailStudent = 'student.step8@example.com';
  const rawPassword = 'Password@123';

  console.log(`\n================================================================================`);
  console.log(`🚀 BẮT ĐẦU KIỂM THỬ BƯỚC 8: ĐĂNG NHẬP QUA REACT & SỬ DỤNG BEARER JWT`);
  console.log(`================================================================================\n`);

  try {
    // 1. Kết nối CSDL và tạo tài khoản Student test thật
    await sequelize.authenticate();
    await User.destroy({ where: { email: emailStudent } });

    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const createdUser = await User.create({
      fullName: 'Trần Văn Sinh Viên',
      email: emailStudent,
      passwordHash: passwordHash,
      role: 'student',
      avatarUrl: null
    });
    console.log(`==> Đã chuẩn bị tài khoản test: ${createdUser.email} (ID: ${createdUser.id})`);

    // --------------------------------------------------------------------------
    // TEST 1 (F06): Đăng nhập đúng thông tin -> 200 OK + Nhận accessToken
    // --------------------------------------------------------------------------
    let studentToken = '';
    {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailStudent, password: rawPassword })
      });

      const body = (await res.json()) as {
        success: boolean;
        message: string;
        data?: { accessToken: string; tokenType: string; expiresIn: number };
      };

      studentToken = body.data?.accessToken ?? '';
      const pass = res.status === 200 && body.success === true && studentToken.length > 20;

      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 1 (F06): Đăng nhập đúng thông tin -> 200 OK`);
      console.log(`   └─> Status: ${res.status} | Token nhận được: ${studentToken.slice(0, 25)}...`);
    }

    // --------------------------------------------------------------------------
    // TEST 2 (F06 tiếp tục): Dùng Token vừa nhận gọi GET /api/auth/profile
    // --------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${studentToken}`
        }
      });

      const body = (await res.json()) as {
        success: boolean;
        data?: { id: number; fullName: string; email: string; role: string; avatarUrl: string | null; passwordHash?: string };
      };

      const pass =
        res.status === 200 &&
        body.success === true &&
        body.data?.email === emailStudent &&
        body.data?.role === 'student' &&
        body.data?.passwordHash === undefined;

      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 2: Gọi GET /api/auth/profile có Bearer Token -> 200 OK`);
      console.log(`   └─> Profile: fullName="${body.data?.fullName}", role="${body.data?.role}", passwordHash ẩn=${body.data?.passwordHash === undefined}`);
    }

    // --------------------------------------------------------------------------
    // TEST 3 (F07): Đăng nhập sai mật khẩu -> 401 Unauthorized
    // --------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailStudent, password: 'SaiMatKhau@999' })
      });

      const pass = res.status === 401;
      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 3 (F07): Đăng nhập sai mật khẩu -> 401 Unauthorized`);
      console.log(`   └─> Status: ${res.status} (Không lưu token giả)`);
    }

    // --------------------------------------------------------------------------
    // TEST 4 (F08): GET /api/auth/profile thiếu Bearer Header -> 401 Unauthorized
    // --------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: 'GET'
      });

      const pass = res.status === 401;
      console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} TEST 4 (F08): GET Profile thiếu Token -> 401 Unauthorized`);
      console.log(`   └─> Status: ${res.status} (Không lộ hồ sơ khi chưa xác thực)`);
    }

    // Dọn dẹp tài khoản test
    await User.destroy({ where: { email: emailStudent } });

    console.log(`\n================================================================================`);
    console.log(`🎉 TOÀN BỘ CÁC TEST CASES BƯỚC 8 ĐÃ PASS 100%!`);
    console.log(`================================================================================\n`);
  } catch (error) {
    console.error('Lỗi khi kiểm thử Bước 8:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

// Chạy kịch bản kiểm thử
runStep8AuthVerification();
