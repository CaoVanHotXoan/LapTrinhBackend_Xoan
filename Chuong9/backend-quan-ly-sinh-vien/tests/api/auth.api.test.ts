// ==============================================================================
// BỘ KIỂM THỬ GIAO DIỆN API HTTP (API TEST) VỚI SUPERTEST
// File: tests/api/auth.api.test.ts
// Mục đích: Kiểm thử lớp HTTP, Status Code, Body JSON và hành vi cấp phát JWT (A01 - A07)
// ==============================================================================

// 1. Import các hàm định nghĩa bài test và mock từ @jest/globals
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// 2. Import thư viện Supertest để giả lập các HTTP request tới Express app mà không cần mở PORT
import request from 'supertest';

// 3. Import instance Express app đã được tách rời từ app.ts
import { app } from '../../src/app.js';

// 4. Import User Model để mock các truy vấn dữ liệu theo đúng yêu cầu cô lập DB của giáo trình
import { User } from '../../src/models/user.model.js';

// 5. Import thư viện bcrypt để mock so sánh mật khẩu trong tầng nghiệp vụ
import bcrypt from 'bcrypt';

// 6. Import hàm tiện ích tạo JWT hợp lệ để kiểm thử các route yêu cầu xác thực Bearer Token
import { generateToken } from '../../src/utils/jwt.js';

// Nhóm bộ kiểm thử API Xác thực (Authentication HTTP API)
describe('API Test: Bộ kiểm thử Ma trận HTTP / JWT với Supertest (A01 - A07)', () => {
  // Reset trạng thái mock trước mỗi ca kiểm thử để đảm bảo tính độc lập
  beforeEach(() => {
    // Xóa sạch lịch sử gọi hàm của các mock
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------------------
  // A01: Đăng nhập hợp lệ với email và mật khẩu chính xác
  // ----------------------------------------------------------------------------
  test('A01 - Login hợp lệ: Trả về HTTP 200 và cấp Token JWT', async () => {
    // [Arrange] Dữ liệu giả lập người dùng trong cơ sở dữ liệu
    const mockUserRecord = {
      id: 101,
      fullName: 'Nguyễn Văn Test',
      email: 'sinhvien.test@example.com',
      passwordHash: '$2b$12$FakeHashedPassword1234567890123456789012',
      role: 'student'
    };

    // [Arrange] Giả lập tìm thấy người dùng trong CSDL
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUserRecord as any);

    // [Arrange] Giả lập mật khẩu nhập vào khớp hoàn toàn với chuỗi băm
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

    // [Act] Gửi HTTP POST request tới endpoint /api/auth/login thông qua Supertest
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'sinhvien.test@example.com',
        password: 'MatKhauChinhXac123@'
      });

    // [Assert] Kiểm tra HTTP Status Code phải là 200 OK
    expect(response.status).toBe(200);

    // [Assert] Kiểm tra định dạng JSON phản hồi đúng chuẩn hợp đồng
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Đăng nhập thành công');

    // [Assert] Kiểm tra sự tồn tại của Access Token hợp lệ
    expect(response.body.data).toBeDefined();
    expect(response.body.data.accessToken).toBeDefined();
    expect(typeof response.body.data.accessToken).toBe('string');
    expect(response.body.data.tokenType).toBe('Bearer');
  });

  // ----------------------------------------------------------------------------
  // A02: Đăng nhập với mật khẩu không đúng
  // ----------------------------------------------------------------------------
  test('A02 - Sai mật khẩu: Trả về HTTP 401 và không cấp Token JWT', async () => {
    // [Arrange] Dữ liệu giả lập người dùng trong CSDL
    const mockUserRecord = {
      id: 101,
      fullName: 'Nguyễn Văn Test',
      email: 'sinhvien.test@example.com',
      passwordHash: '$2b$12$FakeHashedPassword1234567890123456789012',
      role: 'student'
    };

    // [Arrange] Giả lập tìm thấy tài khoản
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUserRecord as any);

    // [Arrange] Giả lập so sánh mật khẩu thất bại (sai mật khẩu)
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

    // [Act] Gửi HTTP POST với mật khẩu sai
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'sinhvien.test@example.com',
        password: 'MatKhauSaiRoi!'
      });

    // [Assert] Phải nhận về mã HTTP 401 Unauthorized
    expect(response.status).toBe(401);

    // [Assert] Trạng thái phản hồi là thất bại (success: false)
    expect(response.body.success).toBe(false);

    // [Assert] Tuyệt đối không được cấp phát accessToken
    expect(response.body.data).toBeNull();
    expect(response.body.accessToken).toBeUndefined();
  });

  // ----------------------------------------------------------------------------
  // A03: Đăng nhập với tài khoản email không tồn tại trong hệ thống
  // ----------------------------------------------------------------------------
  test('A03 - User không tồn tại: Trả về HTTP 401 và không cấp Token JWT', async () => {
    // [Arrange] Giả lập CSDL trả về null (không tồn tại tài khoản này)
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    // [Act] Gửi HTTP POST với email lạ
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'email.chua.dang.ky@example.com',
        password: 'PasswordBấtKỳ123'
      });

    // [Assert] Phải nhận về mã HTTP 401 Unauthorized
    expect(response.status).toBe(401);

    // [Assert] Trạng thái thất bại
    expect(response.body.success).toBe(false);

    // [Assert] Dữ liệu data là null, không có accessToken
    expect(response.body.data).toBeNull();
  });

  // ----------------------------------------------------------------------------
  // A04: Gửi dữ liệu đăng nhập thiếu các trường bắt buộc
  // ----------------------------------------------------------------------------
  test('A04 - Thiếu trường bắt buộc: Trả về HTTP 400 cùng thông báo lỗi Validation', async () => {
    // [Act] Gửi request body rỗng (thiếu cả email và password)
    const response = await request(app)
      .post('/api/auth/login')
      .send({});

    // [Assert] Phải nhận về mã lỗi HTTP 400 Bad Request từ Validation Middleware
    expect(response.status).toBe(400);

    // [Assert] Trạng thái trả về phải là false
    expect(response.body.success).toBe(false);

    // [Assert] Thông báo phải phản ánh lỗi validation dữ liệu
    expect(response.body.message).toBeDefined();
  });

  // ----------------------------------------------------------------------------
  // A05: Truy cập API xem Profile nhưng không gửi Bearer JWT Token
  // ----------------------------------------------------------------------------
  test('A05 - GET Profile không có JWT: Bị chặn lại với HTTP 401 Unauthorized', async () => {
    // [Act] Gửi HTTP GET tới /api/auth/profile nhưng không đính kèm header Authorization
    const response = await request(app)
      .get('/api/auth/profile');

    // [Assert] Middleware isAuth phải chặn lại và trả về HTTP 401
    expect(response.status).toBe(401);

    // [Assert] Kiểm tra trạng thái thất bại
    expect(response.body.success).toBe(false);

    // [Assert] Thông báo yêu cầu cung cấp token hợp lệ
    expect(response.body.message).toContain('Bearer Token');
  });

  // ----------------------------------------------------------------------------
  // A06: Truy cập API xem Profile khi có Bearer JWT Token hợp lệ
  // ----------------------------------------------------------------------------
  test('A06 - GET Profile có JWT hợp lệ: Trả về HTTP 200 và dữ liệu hồ sơ cá nhân', async () => {
    // [Arrange] Tạo một token hợp lệ sử dụng khóa bí mật JWT_SECRET
    const validToken = generateToken({
      id: 101,
      role: 'student'
    });

    // [Arrange] Dữ liệu hồ sơ người dùng trả về từ User.findByPk
    const mockProfile = {
      id: 101,
      fullName: 'Nguyễn Văn Test',
      email: 'sinhvien.test@example.com',
      role: 'student',
      avatarUrl: '/uploads/default-avatar.png'
    };

    // [Arrange] Giả lập truy vấn findByPk trả về thông tin người dùng
    jest.spyOn(User, 'findByPk').mockResolvedValue(mockProfile as any);

    // [Act] Gửi HTTP GET kèm theo Bearer Token hợp lệ trong header Authorization
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${validToken}`);

    // [Assert] Phải nhận về HTTP 200 OK
    expect(response.status).toBe(200);

    // [Assert] Kiểm tra thông tin trả về khớp với người dùng
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(101);
    expect(response.body.data.email).toBe('sinhvien.test@example.com');
  });

  // ----------------------------------------------------------------------------
  // A07: Giả lập lỗi hệ thống nội bộ để kiểm tra tính an toàn của Error Middleware
  // ----------------------------------------------------------------------------
  test('A07 - Lỗi hệ thống giả lập: Trả về HTTP 500 an toàn, không lộ chuỗi kết nối hay SQL stack', async () => {
    // [Act] Gửi HTTP GET tới endpoint thử nghiệm ném lỗi hệ thống /api/test-500-error
    const response = await request(app)
      .get('/api/test-500-error');

    // [Assert] Phải trả về mã HTTP 500 Internal Server Error
    expect(response.status).toBe(500);

    // [Assert] Định dạng phản hồi chuẩn hóa
    expect(response.body.success).toBe(false);
    expect(response.body.status).toBe(500);

    // [Assert] Kiểm tra thông báo an toàn, không chứa thông tin mật khẩu hay chuỗi kết nối
    expect(response.body.message).toBe('Lỗi hệ thống, vui lòng thử lại sau');
    expect(response.body.data).toBeNull();
  });
});
