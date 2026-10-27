// ==============================================================================
// CẤU HÌNH HTTP CLIENT AXIOS DÙNG CHUNG PHÍA FRONTEND (CHƯƠNG 07 - BƯỚC 6)
// File: frontend/src/api/client.ts
// Mục đích: Khởi tạo Axios instance với Base URL, quản lý Bearer Token trong bộ nhớ
// ==============================================================================

// Import thư viện axios và các kiểu dữ liệu liên quan
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

// Lấy địa chỉ API Base URL từ biến môi trường của Vite (mặc định là http://localhost:5000)
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000';

// Khởi tạo một Axios instance độc lập để gọi các API Backend
export const apiClient: AxiosInstance = axios.create({
  // Thiết lập đường dẫn gốc cho toàn bộ các request gửi từ Frontend
  baseURL: API_BASE_URL,
  // Giới hạn thời gian chờ phản hồi tối đa là 10 giây (10000ms)
  timeout: 10000,
  // Cấu hình headers mặc định cho các request
  headers: {
    // Định dạng dữ liệu mong muốn nhận về từ máy chủ là JSON
    Accept: 'application/json'
  }
});

// Biến lưu trữ Access Token tạm thời trong bộ nhớ ứng dụng (Memory) theo đúng quy ước bài lab
let currentToken: string | null = null;

// Hàm hỗ trợ cập nhật hoặc xóa Token trong bộ nhớ và cấu hình Authorization Header
export function setAuthToken(token: string | null): void {
  // Gán token vào biến lưu trữ bộ nhớ
  currentToken = token;

  // Nếu token tồn tại và hợp lệ
  if (token) {
    // Thiết lập Header Authorization chuẩn Bearer cho tất cả các request tiếp theo
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Nếu token là null (khi đăng xuất), xóa header Authorization
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

// Hàm hỗ trợ đọc Token hiện tại đang được lưu trong bộ nhớ
export function getAuthToken(): string | null {
  // Trả về chuỗi token hoặc null
  return currentToken;
}

// Thiết lập Interceptor trước khi request được gửi đi (Request Interceptor)
apiClient.interceptors.request.use(
  // Hàm xử lý cấu hình trước khi gửi đi
  (config: InternalAxiosRequestConfig) => {
    // Nếu trong bộ nhớ đang có token nhưng config chưa có header Authorization
    if (currentToken && !config.headers['Authorization']) {
      // Tự động đính kèm chuỗi Bearer Token vào header request
      config.headers['Authorization'] = `Bearer ${currentToken}`;
    }

    // Nếu request gửi dữ liệu dạng FormData, xóa Content-Type cố định để trình duyệt tự tạo boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Trả về cấu hình hoàn chỉnh
    return config;
  },
  // Hàm bắt lỗi khi chuẩn bị gửi request
  (error) => {
    // Trả về ngoại lệ lỗi
    return Promise.reject(error);
  }
);

// Thiết lập Interceptor sau khi nhận phản hồi từ Backend (Response Interceptor)
apiClient.interceptors.response.use(
  // Khi server phản hồi thành công (status 2xx)
  (response) => {
    // Chuyển tiếp dữ liệu phản hồi
    return response;
  },
  // Khi xảy ra lỗi phản hồi (status 4xx, 5xx, lỗi kết nối hoặc CORS)
  (error) => {
    // Nếu lỗi do mạng không kết nối được hoặc bị chặn CORS
    if (!error.response) {
      // In cảnh báo lỗi kết nối hoặc vi phạm chính sách CORS
      console.error('[Network/CORS Error] Không thể kết nối tới Backend hoặc bị chặn CORS:', error.message);
    }
    // Trả về lỗi để component gọi API có thể bắt và hiển thị thông báo
    return Promise.reject(error);
  }
);

// Xuất mặc định apiClient
export default apiClient;
