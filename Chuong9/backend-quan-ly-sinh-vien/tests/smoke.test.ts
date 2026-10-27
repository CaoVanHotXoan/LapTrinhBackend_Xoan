// ==============================================================================
// BÀI TEST KHỞI ĐỘNG (SMOKE TEST) - KIỂM CHỨNG CẤU HÌNH JEST VÀ ESM
// File: tests/smoke.test.ts
// Mục đích: Xác nhận Jest chạy trơn tru với TypeScript và ESM mà không cần kết nối DB
// ==============================================================================

// Định nghĩa bộ kiểm thử (Test Suite) cho kiểm tra khởi động môi trường
describe('Smoke test', () => {
  // Định nghĩa ca kiểm thử (Test Case) đầu tiên xác nhận hoạt động của Jest
  test('Jest hoạt động trong project hiện tại', () => {
    // Giá trị chuẩn bị đầu vào (Arrange)
    const isConfigReady = true;

    // Đối chiếu kết quả mong đợi với thực tế (Assert)
    expect(isConfigReady).toBe(true);
  });
});
