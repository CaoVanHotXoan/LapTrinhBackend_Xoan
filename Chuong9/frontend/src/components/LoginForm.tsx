// ==============================================================================
// COMPONENT FORM ĐĂNG NHẬP VÀ XÁC THỰC JWT (CHƯƠNG 07 - BƯỚC 8)
// File: frontend/src/components/LoginForm.tsx
// Mục đích: Gửi POST /api/auth/login, nhận JWT token, gọi GET /api/auth/profile
// ==============================================================================

// Import các hook useState từ React
import React, { useState } from 'react';

// Import client Axios và hàm cập nhật token
import { apiClient, setAuthToken } from '../api/client';

// Import kiểu dữ liệu từ types
import type { IApiResponse } from '../types/sinhVien.types';
import type { ILoginResultData, IUserProfile } from '../types/auth.types';

// Định nghĩa Props cho component LoginForm
export interface ILoginFormProps {
  // Callback thông báo cho component cha khi đăng nhập và tải profile thành công
  onLoginSuccess: (token: string, profile: IUserProfile) => void;
}

// Khởi tạo component LoginForm
export const LoginForm: React.FC<ILoginFormProps> = ({ onLoginSuccess }) => {
  // State lưu trữ giá trị nhập ở ô input email
  const [email, setEmail] = useState<string>('');

  // State lưu trữ giá trị nhập ở ô input mật khẩu
  const [password, setPassword] = useState<string>('');

  // State quản lý trạng thái đang gửi request đăng nhập (loading)
  const [loading, setLoading] = useState<boolean>(false);

  // State lưu trữ thông điệp lỗi để hiển thị cho người dùng
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hàm xử lý khi người dùng submit form đăng nhập
  const handleSubmit = async (e: React.FormEvent) => {
    // Ngăn chặn hành vi reload trang mặc định của thẻ form
    e.preventDefault();

    // Xóa thông điệp lỗi cũ trước khi gửi request mới
    setErrorMessage(null);

    // Kiểm tra dữ liệu đầu vào cơ bản
    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    // Bật cờ trạng thái đang tải
    setLoading(true);

    try {
      // 1. Gửi request POST /api/auth/login dạng JSON tới Backend
      const loginRes = await apiClient.post<IApiResponse<ILoginResultData>>(
        '/api/auth/login',
        {
          email: email.trim(),
          password: password
        }
      );

      // Trích xuất mã Access Token từ đúng cấu trúc response của Chương 06
      const token = loginRes.data?.data?.accessToken;

      // Nếu không nhận được token hợp lệ
      if (!token) {
        throw new Error('Máy chủ không trả về Access Token hợp lệ');
      }

      // 2. Thiết lập token vào bộ nhớ ứng dụng và gắn Authorization Bearer cho client Axios
      setAuthToken(token);

      // 3. Gọi ngay API GET /api/auth/profile với Header Authorization: Bearer <token>
      const profileRes = await apiClient.get<IApiResponse<IUserProfile>>(
        '/api/auth/profile',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Trích xuất thông tin hồ sơ người dùng
      const userProfile = profileRes.data?.data;

      // Nếu không có thông tin hồ sơ
      if (!userProfile) {
        throw new Error('Không thể tải thông tin hồ sơ cá nhân');
      }

      // 4. Kích hoạt callback thông báo thành công cho component App
      onLoginSuccess(token, userProfile);

    } catch (err: unknown) {
      // Đăng nhập thất bại -> xóa token trong bộ nhớ
      setAuthToken(null);

      // Chẩn đoán mã lỗi HTTP để hiển thị thông báo chính xác
      let message = 'Đăng nhập thất bại. Vui lòng thử lại.';

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        const status = axiosErr.response?.status;

        // Nếu mã lỗi 401 Unauthorized (sai email hoặc mật khẩu)
        if (status === 401) {
          message = 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!';
        } else if (status === 400) {
          // Lỗi dữ liệu không hợp lệ
          message = axiosErr.response?.data?.message || 'Dữ liệu đăng nhập không hợp lệ.';
        } else if (axiosErr.response?.data?.message) {
          message = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        // Lỗi kết nối mạng hoặc lỗi hệ thống
        message = err.message;
      }

      // Lưu thông điệp lỗi vào state
      setErrorMessage(message);
    } finally {
      // Tắt cờ loading
      setLoading(false);
    }
  };

  // Hàm điền nhanh thông tin tài khoản mẫu phục vụ thử nghiệm và chấm bài
  const fillSampleAccount = (sampleEmail: string, samplePass: string) => {
    setEmail(sampleEmail);
    setPassword(samplePass);
    setErrorMessage(null);
  };

  return (
    <div className="login-card">
      <div className="login-header">
        <h2 className="login-title">🔐 Đăng Nhập Hệ Thống</h2>
        <p className="login-subtitle">Nhập tài khoản để thực hiện các thao tác quản trị & đổi ảnh đại diện</p>
      </div>

      {/* Hiển thị thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form đăng nhập */}
      <form onSubmit={handleSubmit} className="login-form">
        {/* Trường nhập Email */}
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">
            Địa chỉ Email:
          </label>
          <input
            id="login-email"
            type="email"
            className="form-control"
            placeholder="vd: admin.lab@example.com"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        {/* Trường nhập Mật khẩu */}
        <div className="form-group">
          <label htmlFor="login-password" className="form-label">
            Mật khẩu:
          </label>
          <input
            id="login-password"
            type="password"
            className="form-control"
            placeholder="Nhập mật khẩu của bạn"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {/* Nút submit đăng nhập */}
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng Nhập'}
        </button>
      </form>

      {/* Khu vực nút bấm điền nhanh tài khoản kiểm thử */}
      <div className="sample-accounts-section">
        <span className="sample-label">Tài khoản thử nghiệm:</span>
        <div className="sample-buttons">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => fillSampleAccount('admin.lab@example.com', 'Admin@123456')}
          >
            🛡️ Admin Lab
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
