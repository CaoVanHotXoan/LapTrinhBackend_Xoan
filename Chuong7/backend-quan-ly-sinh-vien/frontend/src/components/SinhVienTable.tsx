// ==============================================================================
// COMPONENT HIỂN THỊ BẢNG DANH SÁCH SINH VIÊN BẰNG AXIOS (CHƯƠNG 07 - BƯỚC 7)
// File: frontend/src/components/SinhVienTable.tsx
// Mục đích: Gọi API GET /api/v1/sinh-vien, render 4 cột, xử lý Loading, Error, Empty
// ==============================================================================

// Import các hook useState và useEffect từ thư viện React
import React, { useState, useEffect, useCallback } from 'react';

// Import client Axios đã cấu hình Base URL và interceptors từ tầng api
import { apiClient } from '../api/client';

// Import các kiểu dữ liệu ISinhVien và IApiResponse từ thư mục types
import type { ISinhVien, IApiResponse } from '../types/sinhVien.types';

// Định nghĩa Props cho component SinhVienTable (hỗ trợ thêm nút xóa cho Bước 9)
export interface ISinhVienTableProps {
  // Cờ xác định người dùng hiện tại có vai trò admin hay không (dùng cho Bước 9)
  isAdmin?: boolean;
  // Hàm callback kích hoạt khi Admin bấm nút Xóa sinh viên (dùng cho Bước 9)
  onDelete?: (maSV: string) => Promise<void>;
}

// Khởi tạo functional component SinhVienTable
export const SinhVienTable: React.FC<ISinhVienTableProps> = ({ isAdmin = false, onDelete }) => {
  // State lưu trữ mảng danh sách sinh viên lấy về từ API
  const [sinhViens, setSinhViens] = useState<ISinhVien[]>([]);

  // State quản lý trạng thái đang tải dữ liệu (loading)
  const [loading, setLoading] = useState<boolean>(true);

  // State lưu trữ thông báo lỗi nếu xảy ra sự cố mạng hoặc server
  const [error, setError] = useState<string | null>(null);

  // State lưu mã sinh viên đang trong quá trình thực hiện xóa (để vô hiệu hóa nút xóa tạm thời)
  const [deletingMaSV, setDeletingMaSV] = useState<string | null>(null);

  // Hàm bất đồng bộ gọi API Backend lấy danh sách sinh viên bằng Axios
  const fetchSinhViens = useCallback(async () => {
    // Bắt đầu quá trình tải: bật cờ loading và xóa thông báo lỗi cũ
    setLoading(true);
    setError(null);

    try {
      // Gửi request GET tới endpoint /api/v1/sinh-vien qua Axios apiClient
      const response = await apiClient.get<IApiResponse<ISinhVien[]>>('/api/v1/sinh-vien');

      // Kiểm tra tính hợp lệ của cấu trúc phản hồi
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Lấy đúng mảng tại response.data.data theo đúng quy ước của hệ thống
        setSinhViens(response.data.data);
      } else {
        // Nếu cấu trúc phản hồi không đúng chuẩn { success: true, data: [...] }
        throw new Error('Dữ liệu máy chủ phản hồi không đúng cấu trúc danh sách sinh viên');
      }
    } catch (err: unknown) {
      // Chẩn đoán và trích xuất thông điệp lỗi phù hợp
      let errorMessage = 'Không thể tải danh sách sinh viên. Vui lòng kiểm tra máy chủ Backend.';

      // Nếu là lỗi có phản hồi từ máy chủ
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
        if (axiosErr.response?.data?.message) {
          errorMessage = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        // Lỗi kết nối mạng (ví dụ Backend bị tắt: ERR_CONNECTION_REFUSED)
        errorMessage = err.message;
      }

      // Lưu thông điệp lỗi vào state để hiển thị trên giao diện
      setError(errorMessage);
    } finally {
      // Kết thúc quá trình tải: tắt cờ loading
      setLoading(false);
    }
  }, []);

  // Hook useEffect để tự động gọi API lấy danh sách sinh viên ngay khi component được gắn (mount)
  useEffect(() => {
    // Biến cờ kiểm soát tránh lỗi setState sau khi component đã unmount
    let isMounted = true;

    // Gọi hàm tải dữ liệu nếu component vẫn đang tồn tại
    if (isMounted) {
      fetchSinhViens();
    }

    // Hàm dọn dẹp (cleanup function) chạy khi component unmount
    return () => {
      isMounted = false;
    };
  }, [fetchSinhViens]);

  // State lưu thông báo kết quả thao tác xóa để hiển thị trực tiếp trên giao diện bảng
  const [deleteFeedback, setDeleteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Hàm xử lý khi Admin bấm nút xóa sinh viên
  const handleDeleteClick = async (maSV: string) => {
    // 1. Hiển thị hộp thoại xác nhận rõ ràng mã sinh viên cần xóa theo yêu cầu đề bài
    const confirmMessage = `Bạn có chắc chắn muốn xóa sinh viên có mã số [${maSV}] không?\n(Cảnh báo: Chỉ xóa các bản ghi thử nghiệm, thao tác này không thể hoàn tác!)`;
    const isConfirmed = window.confirm(confirmMessage);

    // Nếu người dùng bấm Hủy (Cancel) thì dừng lại ngay
    if (!isConfirmed) {
      return;
    }

    // Xóa thông báo kết quả cũ
    setDeleteFeedback(null);

    // Nếu có hàm callback onDelete được truyền vào từ component cha
    if (onDelete) {
      // Đặt cờ đang xóa mã SV này để hiển thị trạng thái nút bấm
      setDeletingMaSV(maSV);
      try {
        // Thực thi gọi hàm xóa từ component App (gửi DELETE /api/v1/sinh-vien/:maSV)
        await onDelete(maSV);

        // Hiển thị thông báo thành công mã HTTP 200
        setDeleteFeedback({
          type: 'success',
          message: `Xóa sinh viên có mã [${maSV}] thành công!`
        });

        // 200: Gọi lại hàm fetchSinhViens để cập nhật lại danh sách mới nhất từ CSDL
        await fetchSinhViens();
      } catch (err: unknown) {
        // Bắt lỗi khi xóa thất bại (401, 403, 404,...) và trích xuất thông điệp chi tiết
        let errorMsg = `Xóa sinh viên [${maSV}] thất bại.`;

        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
          const status = axiosErr.response?.status;

          // Xử lý từng mã HTTP status code cụ thể theo đúng yêu cầu đề bài
          if (status === 401) {
            errorMsg = 'Phiên đăng nhập đã hết hạn hoặc chưa xác thực (401). Vui lòng đăng nhập lại!';
          } else if (status === 403) {
            errorMsg = 'Từ chối thao tác (403 Forbidden): Bạn không có quyền Quản trị viên (Admin) để xóa!';
          } else if (status === 404) {
            errorMsg = `Bản ghi không tồn tại (404 Not Found): Sinh viên mã [${maSV}] không tồn tại trong CSDL!`;
          } else if (axiosErr.response?.data?.message) {
            errorMsg = axiosErr.response.data.message;
          }
        } else if (err instanceof Error) {
          errorMsg = err.message;
        }

        // Hiển thị thông báo lỗi, giữ nguyên dữ liệu trên UI (không xóa dòng giả lập)
        setDeleteFeedback({
          type: 'error',
          message: errorMsg
        });
      } finally {
        // Tắt trạng thái đang xóa
        setDeletingMaSV(null);
      }
    }
  };

  // ----------------------------------------------------------------------------
  // GIAO DIỆN TRẠNG THÁI 1: ĐANG TẢI DỮ LIỆU (LOADING STATE)
  // ----------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="table-status-container loading-container">
        <div className="spinner"></div>
        <p className="status-text">Đang tải danh sách sinh viên từ máy chủ Backend...</p>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // GIAO DIỆN TRẠNG THÁI 2: XẢY RA LỖI (ERROR STATE - CÓ NÚT THỬ LẠI)
  // ----------------------------------------------------------------------------
  if (error) {
    return (
      <div className="table-status-container error-container">
        <div className="error-icon">⚠️</div>
        <h3 className="error-title">Lỗi kết nối máy chủ</h3>
        <p className="error-message">{error}</p>
        <button
          type="button"
          className="btn btn-retry"
          onClick={fetchSinhViens}
        >
          🔄 Thử lại
        </button>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // GIAO DIỆN CHÍNH: HIỂN THỊ DANH SÁCH SINH VIÊN (4 CỘT)
  // ----------------------------------------------------------------------------
  return (
    <div className="sinhvien-table-wrapper">
      {/* Thanh công cụ phía trên bảng */}
      <div className="table-header-toolbar">
        <div className="table-summary-info">
          <h2 className="table-title">Danh Sách Sinh Viên</h2>
          <span className="badge-count">Tổng số: {sinhViens.length}</span>
        </div>
        <button
          type="button"
          className="btn btn-refresh"
          onClick={fetchSinhViens}
          title="Tải lại dữ liệu mới nhất từ CSDL"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Hiển thị thông báo phản hồi thao tác Xóa (Thành công 200 hoặc Lỗi 401/403/404) */}
      {deleteFeedback && (
        <div
          className={`table-feedback-alert ${
            deleteFeedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          role="alert"
        >
          <span>{deleteFeedback.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{deleteFeedback.message}</span>
        </div>
      )}

      {/* Trường hợp danh sách rỗng (Empty State) */}
      {sinhViens.length === 0 ? (
        <div className="table-status-container empty-container">
          <p className="empty-text">Hiện tại chưa có sinh viên nào trong hệ thống.</p>
        </div>
      ) : (
        /* Bảng hiển thị thông tin 4 cột theo đúng yêu cầu đề bài */
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th scope="col" className="th-stt">STT</th>
                <th scope="col">Mã Sinh Viên</th>
                <th scope="col">Họ và Tên</th>
                <th scope="col">Địa Chỉ Email</th>
                <th scope="col">Mã Lớp</th>
                {/* Cột thao tác xóa chỉ hiển thị khi có quyền Admin */}
                {isAdmin && <th scope="col" className="th-actions">Thao Tác</th>}
              </tr>
            </thead>
            <tbody>
              {sinhViens.map((sv, index) => (
                <tr key={sv.maSV} className="table-row">
                  {/* Cột số thứ tự */}
                  <td className="text-center">{index + 1}</td>
                  {/* Cột 1: Mã sinh viên */}
                  <td className="font-code font-bold">{sv.maSV}</td>
                  {/* Cột 2: Họ và tên */}
                  <td>{sv.hoTen}</td>
                  {/* Cột 3: Email */}
                  <td>
                    <a href={`mailto:${sv.email}`} className="email-link">
                      {sv.email}
                    </a>
                  </td>
                  {/* Cột 4: Mã lớp */}
                  <td>
                    <span className="badge-class">{sv.maLop}</span>
                  </td>
                  {/* Cột hành động dành cho Admin (Bước 9) */}
                  {isAdmin && (
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-delete"
                        disabled={deletingMaSV === sv.maSV}
                        onClick={() => handleDeleteClick(sv.maSV)}
                        title={`Xóa sinh viên ${sv.maSV}`}
                      >
                        {deletingMaSV === sv.maSV ? 'Đang xóa...' : '🗑️ Xóa'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SinhVienTable;
