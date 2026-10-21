// ==============================================================================
// CẤU HÌNH VITE BUILD TOOL CHO ỨNG DỤNG FRONTEND REACT (CHƯƠNG 07 - BƯỚC 6)
// File: frontend/vite.config.ts
// ==============================================================================

// Import plugin hỗ trợ React từ Vite
import react from '@vitejs/plugin-react';

// Import hàm cấu hình defineConfig từ thư viện Vite
import { defineConfig } from 'vite';

// Xuất cấu hình mặc định cho máy chủ phát triển Vite
export default defineConfig({
  // Nạp plugin React để hỗ trợ biên dịch JSX/TSX và Fast Refresh
  plugins: [react()],

  // Cấu hình máy chủ phát triển cục bộ (Dev Server)
  server: {
    // Chỉ định cố định cổng chạy 5173 theo quy ước bài thực hành Chương 07
    port: 5173,
    // Nếu cổng 5173 đã bị chiếm dụng thì dừng lại báo lỗi, không tự ý nhảy cổng khác
    strictPort: true
  }
});
