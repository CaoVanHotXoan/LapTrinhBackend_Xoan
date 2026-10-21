// ==============================================================================
// SCRIPT TỰ ĐỘNG KIỂM THỬ BƯỚC 6: MIDDLEWARE ISADMIN VÀ KẾT HỢP HAI LỚP BẢO VỆ
// File: src/scripts/test-step6-isadmin.ts
// Mục đích: Kiểm chứng 3 ca kiểm thử: Không token (401), Student (403), Admin (200)
// ==============================================================================

// Nạp các biến môi trường từ file .env
import 'dotenv/config';

// Import framework express để dựng test server tạm thời
import express from 'express';

// Import middleware helmet bảo mật
import helmet from 'helmet';

// Import middleware cors
import cors from 'cors';

// Import middleware xác thực danh tính isAuth
import { isAuth } from '../middlewares/isAuth.js';

// Import middleware phân quyền vai trò isAdmin vừa tạo
import { isAdmin } from '../middlewares/isAdmin.js';

// Import hàm tạo token để sinh JWT student và JWT admin phục vụ kiểm thử
import { generateToken } from '../utils/jwt.js';

// Import kiểu Server từ thư viện chuẩn node:http
import type { Server } from 'node:http';

// Khởi tạo app express phục vụ kiểm thử phân quyền
const app = express();

// Gắn middleware bảo mật helmet
app.use(helmet());

// Gắn middleware cors
app.use(cors());

// Gắn middleware parse JSON body
app.use(express.json());

// Định nghĩa một route demo kiểm thử kết hợp hai lớp bảo vệ: isAuth -> isAdmin -> controller
app.delete('/api/test-admin-only', isAuth, isAdmin, (_req, res) => {
  // Nếu vượt qua cả 2 lớp middleware, controller phản hồi HTTP 200 thành công
  res.status(200).json({
    // Trạng thái thành công
    success: true,
    // Thông báo chứng minh đã vào tới controller
    message: 'Thao tác quản trị viên được thực thi thành công'
  });
});

// Cấu hình cổng kiểm thử riêng biệt
const TEST_PORT = 5006;

// Địa chỉ URL cơ sở
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Hàm in kết quả từng ca kiểm thử với biểu tượng trực quan
function printResult(code: string, desc: string, pass: boolean, detail: string): void {
  // Biểu tượng đánh dấu kết quả đạt hay không đạt
  const icon = pass ? '✅ [PASS]' : '❌ [FAIL]';
  // In mã ca test và mô tả
  console.log(`${icon} ${code}: ${desc}`);
  // In chi tiết kết quả thực tế
  console.log(`   └─> ${detail}\n`);
}

// Hàm chính điều phối quá trình kiểm thử Bước 6
async function runStep6Tests(): Promise<void> {
  // Biến lưu tham chiếu HTTP server
  let server: Server | null = null;

  try {
    // 1. Khởi động server trên cổng kiểm thử
    await new Promise<void>((resolve) => {
      // Bắt đầu lắng nghe kết nối
      server = app.listen(TEST_PORT, () => {
        // In tiêu đề kiểm thử
        console.log(`Test Server đang chạy trên cổng ${TEST_PORT}...\n`);
        // Giải phóng Promise để tiếp tục
        resolve();
      });
    });

    // --------------------------------------------------------------------------
    // Ca 1: Không có JWT Token (Kỳ vọng: isAuth từ chối 401, isAdmin không chạy)
    // --------------------------------------------------------------------------
    const resCa1 = await fetch(`${BASE_URL}/api/test-admin-only`, {
      // Phương thức DELETE
      method: 'DELETE'
      // Không gửi header Authorization
    });
    // Parse response body
    const dataCa1 = await resCa1.json() as { success: boolean; message: string };
    // Điều kiện đạt: Status 401 Unauthorized
    const passCa1 = resCa1.status === 401 && dataCa1.success === false;
    // In kết quả ca 1
    printResult(
      'CASE-01',
      'Người gọi không có JWT -> isAuth từ chối 401, isAdmin không chạy',
      passCa1,
      `Status: ${resCa1.status} | Message: "${dataCa1.message}"`
    );

    // --------------------------------------------------------------------------
    // Ca 2: Người dùng student gửi JWT hợp lệ (Kỳ vọng: isAuth cho qua, isAdmin chặn 403)
    // --------------------------------------------------------------------------
    // Tạo token cho tài khoản có role='student'
    const studentToken = generateToken({ id: 101, role: 'student' });
    // Gửi request kèm token student
    const resCa2 = await fetch(`${BASE_URL}/api/test-admin-only`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${studentToken}`
      }
    });
    // Parse response body
    const dataCa2 = await resCa2.json() as { success: boolean; message: string };
    // Điều kiện đạt: Status PHẢI LÀ 403 Forbidden (tuyệt đối không phải 401 hay 500)
    const passCa2 = resCa2.status === 403 && dataCa2.success === false;
    // In kết quả ca 2
    printResult(
      'CASE-02',
      'Người gọi role student gửi JWT hợp lệ -> isAuth cho qua, isAdmin TỪ CHỐI 403',
      passCa2,
      `Status: ${resCa2.status} | Message: "${dataCa2.message}" (Phân quyền 403 chính xác)`
    );

    // --------------------------------------------------------------------------
    // Ca 3: Người dùng admin gửi JWT hợp lệ (Kỳ vọng: isAuth cho qua, isAdmin cho qua -> 200)
    // --------------------------------------------------------------------------
    // Tạo token cho tài khoản có role='admin'
    const adminToken = generateToken({ id: 1, role: 'admin' });
    // Gửi request kèm token admin
    const resCa3 = await fetch(`${BASE_URL}/api/test-admin-only`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    // Parse response body
    const dataCa3 = await resCa3.json() as { success: boolean; message: string };
    // Điều kiện đạt: Status 200 OK và thông điệp thành công từ controller
    const passCa3 = resCa3.status === 200 && dataCa3.success === true;
    // In kết quả ca 3
    printResult(
      'CASE-03',
      'Người gọi role admin gửi JWT hợp lệ -> Cả 2 middleware cho qua -> VÀO CONTROLLER (200 OK)',
      passCa3,
      `Status: ${resCa3.status} | Message: "${dataCa3.message}"`
    );

    // --------------------------------------------------------------------------
    // Ca 4: Kiểm tra an toàn xử lý thiếu req.user (không gây lỗi crash 500)
    // --------------------------------------------------------------------------
    // Tạo giả lập đối tượng req không có user
    let safeHandledStatus = 0;
    // Giả lập đối tượng response
    const mockRes = {
      status(code: number) {
        safeHandledStatus = code;
        return {
          json() {
            return;
          }
        };
      }
    } as unknown as express.Response;
    // Gọi trực tiếp isAdmin khi req.user là undefined
    isAdmin({} as express.Request, mockRes, () => {});
    // Điều kiện đạt: Phản hồi 401 an toàn, không ném exception làm crash app
    const passCa4 = safeHandledStatus === 401;
    // In kết quả ca 4
    printResult(
      'CASE-04',
      'Xử lý an toàn khi thiếu req.user -> Không crash lỗi 500, phản hồi 401 an toàn',
      passCa4,
      `Status: ${safeHandledStatus} | Đảm bảo tính vững chắc của ứng dụng`
    );

    // --------------------------------------------------------------------------
    // Tổng kết kiểm thử Bước 6
    // --------------------------------------------------------------------------
    if (passCa1 && passCa2 && passCa3 && passCa4) {
      console.log('===============================================================');
      console.log('🎉 TẤT CẢ CÁC ĐIỀU KIỆN VÀ TEST CASES BƯỚC 6 ĐÃ ĐẠT 100%!');
      console.log('===============================================================');
    } else {
      console.error('⚠️ Có ca kiểm thử chưa đạt yêu cầu của Bước 6!');
      process.exitCode = 1;
    }
  } catch (error) {
    // Bắt lỗi phát sinh ngoài dự kiến
    console.error('Lỗi khi chạy kiểm thử Bước 6:', error);
  } finally {
    // Đóng server kiểm thử nếu đang mở
    if (server) {
      (server as Server).close();
    }
  }
}

// Thực thi kiểm thử Bước 6
runStep6Tests();
