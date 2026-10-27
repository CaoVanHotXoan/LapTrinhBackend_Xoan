// ==============================================================================
// BỘ KIỂM THỬ BẢO MẬT API (SECURITY TEST) - CHƯƠNG 09 LAB 2
// File: tests/api/security.api.test.ts
// Mục đích: Kiểm chứng toàn diện ma trận bảo mật S01 - S07 (Rate Limit, Helmet, RBAC)
// ==============================================================================

// 1. Import các hàm định nghĩa bài test và mock từ thư viện @jest/globals
import { describe, test, expect, jest, afterAll } from '@jest/globals';

// 2. Import thư viện Supertest để giả lập gọi HTTP request tới ứng dụng
import request from 'supertest';

// 3. Import Express app từ app.ts
import { app } from '../../src/app.js';

// 4. Import User Model để mock cô lập cơ sở dữ liệu
import { User } from '../../src/models/user.model.js';

// 5. Import SinhVien Model để mock khi test API danh sách, chống mở kết nối treo
import { SinhVien } from '../../src/models/SinhVien.js';

// 6. Import instance sequelize để đóng kết nối an toàn sau khi chạy xong bài test
import { sequelize } from '../../src/config/database.js';

// 7. Import thư viện bcrypt để mock mật khẩu
import bcrypt from 'bcrypt';

// 8. Import hàm tạo JWT để tạo token student và admin cho kiểm thử phân quyền RBAC
import { generateToken } from '../../src/utils/jwt.js';

// Nhóm bộ kiểm thử Ma trận Bảo mật S01 - S07
describe('Security Test: Ma trận kiểm thử Bảo mật S01 - S07 (Chương 09 Lab 2)', () => {
  // Dọn dẹp đóng kết nối CSDL sau khi tất cả các bài test hoàn tất
  afterAll(async () => {
    // Đóng connection pool nếu có kết nối được mở ngầm
    await sequelize.close();
  });

  // ----------------------------------------------------------------------------
  // S06: Đăng nhập sai mật khẩu trước khi chạm hạn mức (Lần gọi thứ 1 trong cửa sổ)
  // ----------------------------------------------------------------------------
  test('S06 - Login sai trước khi vượt hạn mức: Trả về HTTP 401 và không cấp JWT', async () => {
    // [Arrange] Dữ liệu giả lập người dùng tìm thấy trong CSDL
    const mockUserRecord = {
      id: 201,
      fullName: 'Sinh Viên Test',
      email: 'security.test@example.com',
      passwordHash: '$2b$12$FakePasswordHashRateLimitTest...',
      role: 'student'
    };

    // [Arrange] Giả lập tìm thấy tài khoản
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUserRecord as any);

    // [Arrange] Giả lập mật khẩu không khớp (sai mật khẩu)
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

    // [Act] Gửi request login với mật khẩu sai (Request 1 trong cửa sổ 60s)
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'security.test@example.com',
        password: 'MatKhauSaiBaoMat!'
      });

    // [Assert] Phải nhận về mã HTTP 401 Unauthorized
    expect(response.status).toBe(401);

    // [Assert] Trạng thái phản hồi là thất bại
    expect(response.body.success).toBe(false);

    // [Assert] Tuyệt đối không có token trong phản hồi
    expect(response.body.data).toBeNull();
  });

  // ----------------------------------------------------------------------------
  // S01 & S02: Kiểm chứng giới hạn 5 request đầu bình thường, request 6 nhận 429
  // ----------------------------------------------------------------------------
  test('S01 & S02 - Bộ đếm Rate Limit: 5 request đầu xử lý bình thường, request thứ 6 nhận HTTP 429', async () => {
    // [Arrange] Dữ liệu giả lập người dùng hợp lệ
    const mockUserRecord = {
      id: 201,
      fullName: 'Sinh Viên Kiểm Thử Bảo Mật',
      email: 'security.test@example.com',
      passwordHash: '$2b$12$FakePasswordHashRateLimitTest...',
      role: 'student'
    };

    // [Arrange] Mock tìm thấy user trong CSDL
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUserRecord as any);

    // [Arrange] Mock so sánh mật khẩu chính xác
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

    // [Act - S01] Vì ở S06 đã gửi 1 request, ta gửi tiếp 4 request hợp lệ nữa (tổng cộng 5 request trong cửa sổ)
    for (let i = 2; i <= 5; i++) {
      // Gửi request thứ i
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'security.test@example.com',
          password: 'MatKhauDung123@'
        });

      // [Assert - S01] Các lần 1 đến 5 đều được xử lý bình thường (không bị mã 429)
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }

    // [Act - S02] Gửi request thứ 6 vượt quá hạn mức 5 request / 60 giây
    const response6 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'security.test@example.com',
        password: 'MatKhauDung123@'
      });

    // [Assert - S02] Request thứ 6 bắt buộc phải bị chặn với mã HTTP 429 Too Many Requests
    expect(response6.status).toBe(429);

    // [Assert] Kiểm tra định dạng JSON phản hồi đúng chuẩn của hệ thống
    expect(response6.body.success).toBe(false);
    expect(response6.body.status).toBe(429);
    expect(response6.body.message).toBe('Bạn đã gửi quá nhiều yêu cầu');
    expect(response6.body.data).toBeNull();

    // [Assert] Kiểm tra sự xuất hiện của Header RateLimit theo chuẩn draft-7
    expect(response6.headers['ratelimit']).toBeDefined();
  });

  // ----------------------------------------------------------------------------
  // S04: Endpoint khác (GET SinhVien) không bị ảnh hưởng bởi Login Rate Limit
  // ----------------------------------------------------------------------------
  test('S04 - GET danh sách SinhVien: Không chịu giới hạn rate limit của route Login', async () => {
    // [Arrange] Mock hàm findAndCountAll của SinhVien để không phụ thuộc kết nối DB
    jest.spyOn(SinhVien, 'findAndCountAll').mockResolvedValue({
      count: 1,
      rows: [
        { maSV: 'SV001', hoTen: 'Nguyễn Văn Test', email: 'sv001@example.com', maLop: '25CT114' }
      ]
    } as any);

    // [Act] Gửi HTTP GET tới API danh sách sinh viên
    const response = await request(app)
      .get('/api/v1/sinh-vien?page=1&limit=5');

    // [Assert] Endpoint này không bị mã 429 (vẫn trả 200 OK)
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  // ----------------------------------------------------------------------------
  // S05: Kiểm tra các HTTP Security Headers do Helmet thiết lập
  // ----------------------------------------------------------------------------
  test('S05 - Kiểm tra Response Headers: Đảm bảo có đầy đủ các Header bảo mật từ Helmet', async () => {
    // [Act] Gửi request GET tới endpoint trang chủ
    const response = await request(app).get('/');

    // [Assert] Chống tấn công MIME-sniffing: Trình duyệt không được tự đoán kiểu dữ liệu
    expect(response.headers['x-content-type-options']).toBe('nosniff');

    // [Assert] Chống Clickjacking: Chặn nhúng iframe trái phép
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');

    // [Assert] Chống rò rỉ công nghệ: Ẩn hoặc loại bỏ header X-Powered-By của Express
    expect(response.headers['x-powered-by']).toBeUndefined();

    // [Assert] Chính sách chia sẻ tài nguyên được cấu hình cho phép Vite tải ảnh
    expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  // ----------------------------------------------------------------------------
  // S07: Quyền Student cố tình gọi lệnh DELETE sinh viên qua API
  // ----------------------------------------------------------------------------
  test('S07 - Student gọi DELETE: Bị chặn đứng với mã HTTP 403 Forbidden theo RBAC', async () => {
    // [Arrange] Tạo một Bearer Token hợp lệ có vai trò là 'student'
    const studentToken = generateToken({
      id: 301,
      role: 'student'
    });

    // [Act] Người dùng student gửi HTTP DELETE tới route xóa sinh viên
    const response = await request(app)
      .delete('/api/v1/sinh-vien/SV001')
      .set('Authorization', `Bearer ${studentToken}`);

    // [Assert] Middleware isAdmin phải chặn lại và trả về HTTP 403 Forbidden
    expect(response.status).toBe(403);

    // [Assert] Kiểm tra thông báo từ chối phân quyền rõ ràng theo thông điệp của hệ thống
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Yêu cầu vai trò quản trị viên');
  });
});
