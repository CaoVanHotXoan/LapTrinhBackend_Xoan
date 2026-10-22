// ==============================================================================
// ỨNG DỤNG CHÍNH FRONTEND REACT QUẢN LÝ SINH VIÊN (CHƯƠNG 07 - BƯỚC 8)
// File: frontend/src/App.tsx
// Mục đích: Quản lý Authentication State (Memory Token), Profile và Bảng Sinh Viên
// ==============================================================================

// Import các hook useState và useCallback từ thư viện React
import React, { useState, useCallback } from 'react';

// Import stylesheet giao diện dùng chung của ứng dụng
import './App.css';

// Import component hiển thị danh sách 4 cột sinh viên (Bước 7)
import { SinhVienTable } from './components/SinhVienTable';

// Import component Form đăng nhập JWT (Bước 8)
import { LoginForm } from './components/LoginForm';

// Import component hiển thị hồ sơ cá nhân và nút đăng xuất (Bước 8)
import { UserProfileCard } from './components/UserProfileCard';

// Import component tải lên ảnh đại diện Multer (Bước 10)
import { AvatarUpload } from './components/AvatarUpload';

// Import các kiểu dữ liệu xác thực
import type { IUserProfile } from './types/auth.types';
import type { IApiResponse } from './types/sinhVien.types';

// Import client Axios, hằng số Base URL và hàm xóa token
import { apiClient, API_BASE_URL, setAuthToken } from './api/client';

// Định nghĩa component chính App
export const App: React.FC = () => {
  // State lưu trữ Token JWT trong BỘ NHỚ ỨNG DỤNG (Memory) theo đúng quy định bài lab
  const [token, setToken] = useState<string | null>(null);

  // State lưu trữ thông tin hồ sơ của tài khoản đang đăng nhập
  const [userProfile, setUserProfile] = useState<IUserProfile | null>(null);

  // State thông báo lỗi xác thực (ví dụ khi nhận 401 Unauthorized buộc đăng nhập lại)
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Hàm xử lý khi người dùng thực hiện ĐĂNG NHẬP THÀNH CÔNG
  const handleLoginSuccess = (newToken: string, profile: IUserProfile) => {
    // Lưu token vào bộ nhớ state của React
    setToken(newToken);
    // Lưu hồ sơ người dùng vào state
    setUserProfile(profile);
    // Xóa bỏ thông báo lỗi xác thực cũ
    setAuthNotice(null);
  };

  // Hàm xử lý ĐĂNG XUẤT: xóa sạch token và hồ sơ khỏi bộ nhớ ứng dụng
  const handleLogout = useCallback(() => {
    // Xóa token trong React state
    setToken(null);
    // Xóa hồ sơ trong React state
    setUserProfile(null);
    // Gỡ bỏ header Authorization trong cấu hình mặc định của Axios
    setAuthToken(null);
  }, []);

  // Hàm làm mới lại thông tin hồ sơ (gọi GET /api/auth/profile)
  const handleRefreshProfile = async () => {
    // Nếu chưa đăng nhập hoặc không có token thì không thực hiện
    if (!token) return;

    try {
      // Gửi request GET tới /api/auth/profile với token hiện có
      const res = await apiClient.get<IApiResponse<IUserProfile>>('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Nếu lấy được dữ liệu hồ sơ mới nhất từ SQL Server
      if (res.data?.data) {
        setUserProfile(res.data.data);
      }
    } catch (err: unknown) {
      // Nếu nhận mã lỗi 401 (token hết hạn hoặc bị thu hồi)
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 401) {
          // Buộc đăng xuất và thông báo cho người dùng
          handleLogout();
          setAuthNotice('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!');
        }
      }
    }
  };

  // Xác định người dùng có quyền Quản trị viên (Admin) hay không
  const isAdmin = userProfile?.role === 'admin';

  // Hàm xử lý gọi API DELETE /api/v1/sinh-vien/:maSV khi Admin thực hiện xóa (Bước 9)
  const handleDeleteSinhVien = async (maSV: string): Promise<void> => {
    // Gửi request DELETE tới endpoint của Backend kèm header Bearer JWT
    await apiClient.delete(`/api/v1/sinh-vien/${maSV}`);
  };

  return (
    <div className="app-container">
      {/* 1. Phần thanh tiêu đề điều hướng (Header / Navbar) */}
      <header className="app-header">
        <div className="header-brand">
          <span className="header-logo">🎓</span>
          <div>
            <h1 className="header-title">Hệ Thống Quản Lý Sinh Viên</h1>
            <p className="header-subtitle">
              Chương 07: Upload Hình Ảnh Multer & Kết Nối Frontend (React + Vite + Axios)
            </p>
          </div>
        </div>

        {/* Khu vực thông tin trạng thái tài khoản trên Header */}
        <div className="header-user-section">
          {userProfile ? (
            <div className="header-logged-info">
              {/* Nếu có avatarUrl thì hiển thị ảnh nhỏ trên thanh Header */}
              {userProfile.avatarUrl ? (
                <img
                  src={`${API_BASE_URL}${userProfile.avatarUrl}`}
                  alt="Ảnh nhỏ đại diện"
                  className="header-avatar-thumb"
                />
              ) : (
                <span className="header-avatar-circle">
                  {userProfile.fullName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="user-greeting">
                Xin chào, <strong>{userProfile.fullName}</strong>
              </span>
              <span
                className={`badge-role ${
                  isAdmin ? 'badge-role-admin' : 'badge-role-student'
                }`}
              >
                {isAdmin ? '🛡️ Admin' : '🎓 Sinh Viên'}
              </span>
            </div>
          ) : (
            <span className="badge-class">Trạng thái: Chưa đăng nhập</span>
          )}
        </div>
      </header>

      {/* 2. Phần nội dung chính (Main Content) */}
      <main className="app-main">
        {/* Thông báo phiên làm việc nếu bị hết hạn 401 */}
        {authNotice && (
          <div className="alert alert-danger" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{authNotice}</span>
          </div>
        )}

        {/* Bố cục 2 cột: Cột trái quản lý Xác thực / Hồ sơ; Cột phải hiển thị Bảng sinh viên */}
        <div className="content-grid">
          {/* CỘT 1: FORM ĐĂNG NHẬP HOẶC THẺ HỒ SƠ CÁ NHÂN */}
          <aside className="content-sidebar">
            {!userProfile ? (
              // Khi chưa đăng nhập: Hiển thị form đăng nhập
              <LoginForm onLoginSuccess={handleLoginSuccess} />
            ) : (
              // Khi đã đăng nhập: Hiển thị thông tin hồ sơ, nút đăng xuất và khung upload ảnh đại diện
              <UserProfileCard
                profile={userProfile}
                onLogout={handleLogout}
                onRefreshProfile={handleRefreshProfile}
              >
                {/* Bước 10: Tải ảnh đại diện trực tiếp trên giao diện React */}
                <AvatarUpload onUploadSuccess={handleRefreshProfile} />
              </UserProfileCard>
            )}
          </aside>

          {/* CỘT 2: BẢNG DANH SÁCH SINH VIÊN (GET & DELETE) */}
          <section className="content-table-area">
            {/* Truyền prop isAdmin để hiển thị nút Xóa và onDelete để thực thi gọi API DELETE */}
            <SinhVienTable isAdmin={isAdmin} onDelete={handleDeleteSinhVien} />
          </section>
        </div>
      </main>

      {/* 3. Phần chân trang (Footer) */}
      <footer className="app-footer">
        <p>
          Dự án Thực hành Lập trình Backend · Quản lý Sinh viên · Học kỳ 2
        </p>
      </footer>
    </div>
  );
};

// Xuất mặc định App component
export default App;
