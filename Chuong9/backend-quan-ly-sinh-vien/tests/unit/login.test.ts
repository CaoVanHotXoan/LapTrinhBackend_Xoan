// ==============================================================================
// BỘ KIỂM THỬ ĐƠN VỊ (UNIT TEST) CHO NGHIỆP VỤ ĐĂNG NHẬP (LOGIN)
// File: tests/unit/login.test.ts
// Mục đích: Kiểm chứng 5 tình huống logic xác thực T01 - T05 sử dụng Mock cô lập
// ==============================================================================

// 1. Import các hàm hỗ trợ định nghĩa bài test và mock từ thư viện @jest/globals
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// 2. Import hàm nghiệp vụ loginUser cần kiểm thử từ tầng Service
import { loginUser } from '../../src/services/auth.service.js';

// 3. Import User Model để mock các truy vấn cơ sở dữ liệu Sequelize
import { User } from '../../src/models/user.model.js';

// 4. Import thư viện bcrypt để mock hàm so sánh mật khẩu compare
import bcrypt from 'bcrypt';

// 5. Import lớp ngoại lệ AppError tùy biến để kiểm chứng mã lỗi HTTP chuẩn hóa
import { AppError } from '../../src/utils/AppError.js';

// 6. Import schema kiểm thực dữ liệu đăng nhập loginSchema để kiểm chứng quy tắc đầu vào
import { loginSchema } from '../../src/validations/auth.schema.js';

// Nhóm toàn bộ 5 ca Unit Test cho luồng Đăng nhập (Authentication)
describe('Unit Test: Nghiệp vụ Đăng nhập (Auth Service & Validation)', () => {
  // Chuẩn bị trước mỗi ca kiểm thử: xóa sạch lịch sử gọi hàm của các mock
  beforeEach(() => {
    // Xóa sạch trạng thái và bộ đếm số lần gọi của toàn bộ Mock
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------------------
  // T01: Tài khoản tồn tại trong hệ thống và mật khẩu nhập chính xác
  // ----------------------------------------------------------------------------
  test('T01 - Tài khoản có, mật khẩu đúng: Xác thực thành công và tạo Token', async () => {
    // [Arrange] Chuẩn bị dữ liệu đầu vào người dùng gửi lên
    const loginInput = {
      email: 'sinhvien.test@example.com',
      password: 'MatKhauDung123@'
    };

    // [Arrange] Dữ liệu giả lập bản ghi người dùng tìm thấy từ CSDL
    const mockUserRecord = {
      id: 101,
      fullName: 'Nguyễn Văn Test',
      email: 'sinhvien.test@example.com',
      passwordHash: '$2b$12$FakeHashStringForTestingPurposesOnly...',
      role: 'student'
    };

    // [Arrange] Giả lập hàm User.findOne trả về người dùng hợp lệ
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUserRecord as any);

    // [Arrange] Giả lập bcrypt.compare trả về true (mật khẩu khớp chuỗi băm)
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

    // [Act] Thực thi gọi hàm nghiệp vụ đăng nhập
    const result = await loginUser(loginInput);

    // [Assert] Kiểm tra kết quả trả về có chứa accessToken dạng chuỗi
    expect(result).toHaveProperty('accessToken');
    expect(typeof result.accessToken).toBe('string');

    // [Assert] Kiểm tra phương thức xác thực là chuẩn Bearer
    expect(result.tokenType).toBe('Bearer');

    // [Assert] Kiểm tra thời hạn hết hạn mặc định là 3600 giây (1 giờ)
    expect(result.expiresIn).toBe(3600);

    // [Assert] Xác nhận hàm User.findOne được gọi đúng 1 lần với email chuẩn hóa
    expect(User.findOne).toHaveBeenCalledTimes(1);

    // [Assert] Xác nhận bcrypt.compare được gọi đúng 1 lần với mật khẩu gốc và hash
    expect(bcrypt.compare).toHaveBeenCalledWith(loginInput.password, mockUserRecord.passwordHash);
  });

  // ----------------------------------------------------------------------------
  // T02: Tài khoản có tồn tại nhưng người dùng nhập sai mật khẩu
  // ----------------------------------------------------------------------------
  test('T02 - Tài khoản có, mật khẩu sai: Bị từ chối HTTP 401 và không tạo Token', async () => {
    // [Arrange] Chuẩn bị dữ liệu đăng nhập với mật khẩu sai
    const loginInput = {
      email: 'sinhvien.test@example.com',
      password: 'MatKhauSaiHoanToan!'
    };

    // [Arrange] Dữ liệu giả lập người dùng tìm thấy trong CSDL
    const mockUserRecord = {
      id: 101,
      fullName: 'Nguyễn Văn Test',
      email: 'sinhvien.test@example.com',
      passwordHash: '$2b$12$FakeHashStringForTestingPurposesOnly...',
      role: 'student'
    };

    // [Arrange] Giả lập tìm thấy người dùng
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUserRecord as any);

    // [Arrange] Giả lập bcrypt.compare trả về false (mật khẩu không khớp)
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

    // [Act & Assert] Gọi loginUser và kỳ vọng ném ra ngoại lệ AppError với mã 401
    await expect(loginUser(loginInput)).rejects.toThrow(AppError);

    // [Assert] Kiểm tra cụ thể mã trạng thái HTTP 401 và thông báo an toàn
    try {
      await loginUser(loginInput);
    } catch (error) {
      // Ép kiểu lỗi về AppError để kiểm tra thuộc tính
      const appErr = error as AppError;
      // Mã trạng thái kỳ vọng là 401 Unauthorized
      expect(appErr.statusCode).toBe(401);
      // Thông báo chung an toàn tránh lộ thông tin người dùng
      expect(appErr.message).toBe('Email hoặc mật khẩu không chính xác');
    }
  });

  // ----------------------------------------------------------------------------
  // T03: Tài khoản không tồn tại trong hệ thống (Email chưa đăng ký)
  // ----------------------------------------------------------------------------
  test('T03 - Tài khoản không tồn tại: Bị từ chối HTTP 401 và không tạo Token', async () => {
    // [Arrange] Chuẩn bị dữ liệu đăng nhập với email chưa từng đăng ký
    const loginInput = {
      email: 'khongtontai@example.com',
      password: 'AnyPassword123'
    };

    // [Arrange] Giả lập User.findOne trả về null (không tìm thấy tài khoản)
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    // [Arrange] Spy theo dõi bcrypt.compare
    const bcryptSpy = jest.spyOn(bcrypt, 'compare');

    // [Act & Assert] Kỳ vọng ném ngoại lệ AppError với mã 401
    await expect(loginUser(loginInput)).rejects.toThrow(AppError);

    // [Assert] Xác nhận bcrypt.compare KHÔNG được gọi để tiết kiệm tài nguyên
    expect(bcryptSpy).not.toHaveBeenCalled();

    // [Assert] Kiểm tra mã trạng thái trả về đúng 401
    try {
      await loginUser(loginInput);
    } catch (error) {
      const appErr = error as AppError;
      expect(appErr.statusCode).toBe(401);
      expect(appErr.message).toBe('Email hoặc mật khẩu không chính xác');
    }
  });

  // ----------------------------------------------------------------------------
  // T04: Thiếu thông tin email hoặc mật khẩu (Kiểm tra tầng Validation Schema)
  // ----------------------------------------------------------------------------
  test('T04 - Thiếu email hoặc password: Bị Validation Zod Schema từ chối', () => {
    // [Arrange] Trường hợp 1: Thiếu hoàn toàn trường email
    const missingEmailInput = {
      password: 'Password123'
    };

    // [Act] Thực thi kiểm tra với schema zod
    const resultMissingEmail = loginSchema.safeParse(missingEmailInput);

    // [Assert] Kết quả validation phải thất bại
    expect(resultMissingEmail.success).toBe(false);

    // [Arrange] Trường hợp 2: Thiếu hoàn toàn trường password
    const missingPasswordInput = {
      email: 'test@example.com'
    };

    // [Act] Thực thi kiểm tra với schema zod
    const resultMissingPassword = loginSchema.safeParse(missingPasswordInput);

    // [Assert] Kết quả validation phải thất bại
    expect(resultMissingPassword.success).toBe(false);

    // [Arrange] Trường hợp 3: Email sai định dạng (không có ký tự @)
    const invalidEmailInput = {
      email: 'dinh-dang-sai-email',
      password: 'Password123'
    };

    // [Act] Thực thi kiểm tra định dạng
    const resultInvalidEmail = loginSchema.safeParse(invalidEmailInput);

    // [Assert] Bị từ chối do email không đúng chuẩn RFC
    expect(resultInvalidEmail.success).toBe(false);
  });

  // ----------------------------------------------------------------------------
  // T05: Lỗi kết nối CSDL hoặc lỗi bất ngờ trong quá trình xác thực
  // ----------------------------------------------------------------------------
  test('T05 - Lỗi Database: Xử lý an toàn, ném lỗi hệ thống không làm lộ dữ liệu nội bộ', async () => {
    // [Arrange] Chuẩn bị dữ liệu đăng nhập thông thường
    const loginInput = {
      email: 'sinhvien.test@example.com',
      password: 'Password123@'
    };

    // [Arrange] Giả lập Database ném ra ngoại lệ kết nối mạng bị gián đoạn
    const databaseError = new Error('Connection lost: SQL Server timeout');
    jest.spyOn(User, 'findOne').mockRejectedValue(databaseError);

    // [Act & Assert] Hàm loginUser ném lỗi ra ngoài để Error Middleware xử lý
    await expect(loginUser(loginInput)).rejects.toThrow('Connection lost: SQL Server timeout');
  });
});
