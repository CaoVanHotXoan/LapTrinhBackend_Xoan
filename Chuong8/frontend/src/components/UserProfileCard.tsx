// ==============================================================================
// COMPONENT HIỂN THỊ HỒ SƠ NGƯỜI DÙNG & ĐĂNG XUẤT (CHƯƠNG 07 - BƯỚC 8)
// File: frontend/src/components/UserProfileCard.tsx
// Mục đích: Hiển thị fullName, email, role, avatarUrl từ SQL Server và nút Đăng xuất
// ==============================================================================

// Import React từ thư viện react
import React from 'react';

// Import địa chỉ Base URL để tải ảnh tĩnh và kiểu dữ liệu hồ sơ
import { API_BASE_URL } from '../api/client';
import type { IUserProfile } from '../types/auth.types';

// Định nghĩa Props cho component UserProfileCard
export interface IUserProfileCardProps {
  // Đối tượng hồ sơ người dùng hiện tại
  profile: IUserProfile;
  // Callback kích hoạt khi người dùng bấm nút Đăng xuất
  onLogout: () => void;
  // Callback tải lại hồ sơ khi có cập nhật (ví dụ sau khi upload avatar ở Bước 10)
  onRefreshProfile?: () => Promise<void>;
  // Slot render thêm component con (như AvatarUpload ở Bước 10)
  children?: React.ReactNode;
}

// Khởi tạo component UserProfileCard
export const UserProfileCard: React.FC<IUserProfileCardProps> = ({
  profile,
  onLogout,
  onRefreshProfile,
  children
}) => {
  // Xác định đường dẫn đầy đủ của ảnh đại diện
  const fullAvatarUrl = profile.avatarUrl ? `${API_BASE_URL}${profile.avatarUrl}` : null;

  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <h3 className="profile-card-title">👤 Thông Tin Tài Khoản</h3>
        {/* Nút đăng xuất xóa token khỏi bộ nhớ */}
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          onClick={onLogout}
          title="Đăng xuất và xóa mã xác thực khỏi bộ nhớ"
        >
          🚪 Đăng Xuất
        </button>
      </div>

      <div className="profile-content">
        {/* Khu vực hiển thị Avatar */}
        <div className="profile-avatar-wrapper">
          {fullAvatarUrl ? (
            // Hiển thị ảnh đại diện thật tải về từ máy chủ Express static /uploads
            <img
              src={fullAvatarUrl}
              alt={`Ảnh đại diện của ${profile.fullName}`}
              className="profile-avatar-img"
              onError={(e) => {
                // Nếu ảnh tải lỗi, hiển thị ảnh dự phòng
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23cbd5e1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="28">👤</text></svg>';
              }}
            />
          ) : (
            // Nếu chưa upload ảnh, hiển thị placeholder
            <div className="profile-avatar-placeholder">
              <span className="avatar-initials">
                {profile.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Khu vực hiển thị thông tin chi tiết */}
        <div className="profile-details">
          <div className="profile-name-row">
            <h4 className="profile-fullname">{profile.fullName}</h4>
            {/* Huy hiệu vai trò tài khoản */}
            <span
              className={`badge-role ${
                profile.role === 'admin' ? 'badge-role-admin' : 'badge-role-student'
              }`}
            >
              {profile.role === 'admin' ? '🛡️ Quản Trị Viên (Admin)' : '🎓 Sinh Viên (Student)'}
            </span>
          </div>

          <p className="profile-email">
            <strong>Email:</strong> {profile.email}
          </p>

          <p className="profile-avatar-status">
            <strong>Ảnh đại diện:</strong>{' '}
            {profile.avatarUrl ? (
              <span className="text-success">Đã cập nhật ({profile.avatarUrl})</span>
            ) : (
              <span className="text-muted">Chưa có ảnh đại diện</span>
            )}
          </p>

          {/* Nút làm mới hồ sơ */}
          {onRefreshProfile && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={onRefreshProfile}
            >
              🔄 Cập nhật thông tin hồ sơ
            </button>
          )}
        </div>
      </div>

      {/* Vị trí chèn component upload avatar ở Bước 10 */}
      {children && <div className="profile-card-footer">{children}</div>}
    </div>
  );
};

export default UserProfileCard;
