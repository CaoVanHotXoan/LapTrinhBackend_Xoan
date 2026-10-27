// ==============================================================================
// CẤU HÌNH THƯ VIỆN KIỂM THỬ JEST CHO DỰ ÁN TYPESCRIPT + ESM (NODE 20+)
// File: jest.config.mjs
// ==============================================================================

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // 1. Chỉ định môi trường thực thi bài test là Node.js (thay vì jsdom như browser)
  testEnvironment: 'node',

  // 2. Định nghĩa phần mở rộng file .ts được Jest xử lý theo chuẩn ECMAScript Modules (ESM)
  extensionsToTreatAsEsm: ['.ts'],

  // 3. Xử lý quy ước import đuôi .js trong mã nguồn TypeScript theo chuẩn ESM (NodeNext)
  // Biến đổi các đường dẫn './*.js' thành './*' để Jest tìm đúng file TypeScript gốc
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // 4. Cấu hình transformer sử dụng ts-jest để biên dịch file .ts sang JavaScript khi chạy test
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Kích hoạt chế độ hỗ trợ ESM cho ts-jest
        useESM: true,
        // Sử dụng cấu hình TypeScript riêng biệt từ file tsconfig.spec.json
        tsconfig: 'tsconfig.spec.json',
        // Tắt cảnh báo mã 151002 để log hiển thị sạch sẽ
        diagnostics: {
          ignoreCodes: [151002],
        },
      },
    ],
  },

  // 5. Đường dẫn nhận diện các file chứa kịch bản kiểm thử (nằm trong thư mục tests/)
  testMatch: [
    '**/tests/**/*.test.ts',
  ],

  // 6. In chi tiết kết quả từng bài test ra màn hình terminal
  verbose: true,

  // 7. Tự động xóa (clear) các Mock calls và instances sau mỗi test case để tránh ảnh hưởng chéo
  clearMocks: true,

  // 8. Tự động phục hồi (restore) nguyên trạng các hàm gốc sau khi mock
  restoreMocks: true,
};
