// ==============================================================================
// COMPONENT HIỂN THỊ BẢNG DANH SÁCH SINH VIÊN BẰNG AXIOS (CHƯƠNG 08 - BƯỚC 6)
// File: frontend/src/components/SinhVienTable.tsx
// Mục đích: Tích hợp ô tìm kiếm theo họ tên, phân trang Trước/Sau và metadata từ Backend
// ==============================================================================

// 1. Import các hook useState, useEffect, useCallback từ thư viện React
import React, { useState, useEffect, useCallback } from 'react';

// 2. Import client Axios đã cấu hình Base URL và interceptors từ tầng api
import { apiClient } from '../api/client';

// 3. Import các kiểu dữ liệu ISinhVien, IPaginationMeta, IApiResponse từ thư mục types
import type { ISinhVien, IPaginationMeta, IApiResponse } from '../types/sinhVien.types';

// 4. Định nghĩa Props cho component SinhVienTable (hỗ trợ phân quyền Admin)
export interface ISinhVienTableProps {
  // Cờ xác định tài khoản hiện tại có vai trò admin hay không
  isAdmin?: boolean;
  // Hàm callback kích hoạt khi Admin bấm nút Xóa sinh viên
  onDelete?: (maSV: string) => Promise<void>;
}

// 5. Khởi tạo functional component SinhVienTable
export const SinhVienTable: React.FC<ISinhVienTableProps> = ({ isAdmin = false, onDelete }) => {
  // --- STATE QUẢN LÝ DỮ LIỆU VÀ PHÂN TRANG (CHƯƠNG 08) ---
  // State lưu trữ mảng danh sách sinh viên của trang hiện tại nhận từ Backend
  const [sinhViens, setSinhViens] = useState<ISinhVien[]>([]);

  // State lưu trữ số thứ tự trang hiện tại (bắt đầu từ 1)
  const [page, setPage] = useState<number>(1);

  // State lưu trữ số lượng bản ghi tối đa trên một trang (mặc định là 5 để dễ quan sát phân trang với 5 sinh viên)
  const [limit, setLimit] = useState<number>(5);

  // State lưu trữ từ khóa tìm kiếm đã xác nhận gửi tới server
  const [search, setSearch] = useState<string>('');

  // State lưu trữ giá trị người dùng đang gõ trong ô input tìm kiếm
  const [searchInput, setSearchInput] = useState<string>('');

  // State lưu trữ metadata phân trang nhận được từ Backend (page, limit, totalItems, totalPages)
  const [pagination, setPagination] = useState<IPaginationMeta>({
    page: 1,
    limit: 5,
    totalItems: 0,
    totalPages: 0
  });

  // --- STATE QUẢN LÝ TRẠNG THÁI GIAO DIỆN ---
  // State cờ báo đang tải dữ liệu (loading)
  const [loading, setLoading] = useState<boolean>(true);

  // State lưu thông báo lỗi nếu xảy ra sự cố mạng hoặc server
  const [error, setError] = useState<string | null>(null);

  // State lưu mã sinh viên đang trong quá trình thực hiện xóa
  const [deletingMaSV, setDeletingMaSV] = useState<string | null>(null);

  // State lưu thông báo kết quả thao tác xóa (Thành công 200 hoặc Lỗi 401/403/404)
  const [deleteFeedback, setDeleteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ----------------------------------------------------------------------------
  // HÀM GỌI API BACKEND LẤY DANH SÁCH SINH VIÊN QUA AXIOS (CÓ PARAMS PAGE, LIMIT, SEARCH)
  // ----------------------------------------------------------------------------
  const fetchSinhViens = useCallback(async (
    targetPage: number = page,
    targetLimit: number = limit,
    targetSearch: string = search
  ) => {
    // Bật trạng thái loading và xóa thông báo lỗi cũ
    setLoading(true);
    setError(null);

    try {
      // Chuẩn bị tham số query string gửi qua Axios params
      // Lưu ý: Tuyệt đối không dùng Array.slice() trên Frontend để phân trang giả lập
      const queryParams: Record<string, string | number> = {
        page: targetPage,
        limit: targetLimit
      };

      // Chỉ gửi tham số search nếu người dùng có nhập từ khóa (đã trim)
      if (targetSearch.trim().length > 0) {
        queryParams.search = targetSearch.trim();
      }

      // Gửi request HTTP GET tới API /api/v1/sinh-vien kèm params
      const response = await apiClient.get<IApiResponse<ISinhVien[]>>('/api/v1/sinh-vien', {
        params: queryParams
      });

      // Kiểm tra phản hồi thành công và dữ liệu data là một mảng
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Cập nhật danh sách sinh viên của trang vào state
        setSinhViens(response.data.data);

        // Cập nhật metadata phân trang từ response.data.pagination
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        throw new Error('Cấu trúc dữ liệu phản hồi từ máy chủ không đúng định dạng');
      }
    } catch (err: unknown) {
      // Chẩn đoán lỗi và trích xuất thông điệp chi tiết
      let errorMessage = 'Không thể tải danh sách sinh viên. Vui lòng kiểm tra kết nối Backend.';

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
        if (axiosErr.response?.data?.message) {
          errorMessage = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      // Tắt trạng thái loading khi hoàn tất request
      setLoading(false);
    }
  }, [page, limit, search]);

  // Hook useEffect: Tự động gọi API mỗi khi page, limit hoặc search thay đổi
  useEffect(() => {
    fetchSinhViens(page, limit, search);
  }, [fetchSinhViens, page, limit, search]);

  // ----------------------------------------------------------------------------
  // XỬ LÝ SỰ KIỆN TÌM KIẾM THEO HỌ TÊN
  // ----------------------------------------------------------------------------
  const handleSearchSubmit = (e: React.FormEvent) => {
    // Ngăn chặn hành vi reload trang mặc định của form HTML
    e.preventDefault();

    // Theo quy định giáo trình Chương 08 (Trang 11):
    // Khi thay đổi từ khóa tìm kiếm, luôn quay về trang 1 để tránh bị rỗng do đang đứng ở trang quá xa
    setPage(1);
    setSearch(searchInput.trim());
  };

  // Hàm xóa từ khóa tìm kiếm và tải lại danh sách đầy đủ
  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // ----------------------------------------------------------------------------
  // XỬ LÝ SỰ KIỆN CHUYỂN TRANG (NÚT TRƯỚC / SAU)
  // ----------------------------------------------------------------------------
  // Chuyển về trang trước
  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  // Chuyển sang trang tiếp theo
  const handleNextPage = () => {
    if (pagination && page < pagination.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  // Thay đổi số bản ghi hiển thị trên mỗi trang (limit)
  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(e.target.value);
    setLimit(newLimit);
    // Quay về trang 1 khi thay đổi kích thước trang
    setPage(1);
  };

  // ----------------------------------------------------------------------------
  // XỬ LÝ SỰ KIỆN XÓA SINH VIÊN DÀNH CHO ADMIN (BẢO TOÀN TÍNH NĂNG CHƯƠNG 07)
  // ----------------------------------------------------------------------------
  const handleDeleteClick = async (maSV: string) => {
    const confirmMessage = `Bạn có chắc chắn muốn xóa sinh viên có mã số [${maSV}] không?\n(Cảnh báo: Thao tác này sẽ xóa vĩnh viễn khỏi CSDL!)`;
    const isConfirmed = window.confirm(confirmMessage);

    if (!isConfirmed) {
      return;
    }

    setDeleteFeedback(null);

    if (onDelete) {
      setDeletingMaSV(maSV);
      try {
        await onDelete(maSV);

        setDeleteFeedback({
          type: 'success',
          message: `Xóa sinh viên có mã [${maSV}] thành công!`
        });

        // Tải lại dữ liệu trang hiện tại từ CSDL
        await fetchSinhViens(page, limit, search);
      } catch (err: unknown) {
        let errorMsg = `Xóa sinh viên [${maSV}] thất bại.`;

        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
          const status = axiosErr.response?.status;

          if (status === 401) {
            errorMsg = 'Phiên đăng nhập đã hết hạn (401). Vui lòng đăng nhập lại!';
          } else if (status === 403) {
            errorMsg = 'Từ chối thao tác (403 Forbidden): Bạn không có quyền Admin!';
          } else if (status === 404) {
            errorMsg = `Sinh viên [${maSV}] không tồn tại (404)!`;
          } else if (axiosErr.response?.data?.message) {
            errorMsg = axiosErr.response.data.message;
          }
        } else if (err instanceof Error) {
          errorMsg = err.message;
        }

        setDeleteFeedback({
          type: 'error',
          message: errorMsg
        });
      } finally {
        setDeletingMaSV(null);
      }
    }
  };

  // ----------------------------------------------------------------------------
  // GIAO DIỆN TRẠNG THÁI 1: LỖI KẾT NỐI (ERROR STATE CÓ NÚT THỬ LẠI)
  // ----------------------------------------------------------------------------
  if (error && !loading) {
    return (
      <div className="table-status-container error-container">
        <div className="error-icon">⚠️</div>
        <h3 className="error-title">Lỗi tải dữ liệu</h3>
        <p className="error-message">{error}</p>
        <button
          type="button"
          className="btn btn-retry"
          onClick={() => fetchSinhViens(page, limit, search)}
        >
          🔄 Thử lại
        </button>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // GIAO DIỆN CHÍNH: THANH CÔNG CỤ TÌM KIẾM, BẢNG VÀ CHÂN TRANG PHÂN TRANG
  // ----------------------------------------------------------------------------
  return (
    <div className="sinhvien-table-wrapper">
      {/* 1. THANH CÔNG CỤ TRÊN CÙNG: TIÊU ĐỀ VÀ Ô TÌM KIẾM THEO HỌ TÊN */}
      <div className="table-header-toolbar">
        <div className="table-summary-info">
          <h2 className="table-title">Danh Sách Sinh Viên</h2>
          <span className="badge-count">
            Tổng cộng: {pagination.totalItems} sinh viên
          </span>
        </div>

        {/* Form tìm kiếm theo họ tên theo yêu cầu Bước 6 */}
        <form onSubmit={handleSearchSubmit} className="table-search-bar">
          <input
            type="text"
            className="table-search-input"
            placeholder="Tìm theo họ tên (vd: Anh)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn-search" title="Tìm kiếm theo họ tên">
            🔍 Tìm
          </button>
          {search && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={handleClearSearch}
              title="Xóa bộ lọc tìm kiếm"
            >
              ✖ Bỏ lọc
            </button>
          )}
          <button
            type="button"
            className="btn btn-refresh"
            onClick={() => fetchSinhViens(page, limit, search)}
            title="Làm mới dữ liệu từ CSDL"
          >
            🔄
          </button>
        </form>
      </div>

      {/* 2. THÔNG BÁO FEEDBACK (KHI XÓA THÀNH CÔNG HOẶC THẤT BẠI) */}
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

      {/* 3. NỘI DUNG CHÍNH: LOADING SPINNER HOẶC EMPTY STATE HOẶC BẢNG DỮ LIỆU */}
      {loading ? (
        <div className="table-status-container loading-container">
          <div className="spinner"></div>
          <p className="status-text">Đang tải dữ liệu từ máy chủ SQL Server...</p>
        </div>
      ) : sinhViens.length === 0 ? (
        <div className="table-status-container empty-container">
          <p className="empty-text">
            {search
              ? `Không tìm thấy sinh viên nào phù hợp với từ khóa "${search}".`
              : 'Hiện tại chưa có sinh viên nào trong hệ thống.'}
          </p>
          {search && (
            <button
              type="button"
              className="btn btn-retry"
              onClick={handleClearSearch}
            >
              Quay lại danh sách đầy đủ
            </button>
          )}
        </div>
      ) : (
        /* Bảng hiển thị thông tin 4 cột sinh viên */
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th scope="col" className="th-stt">STT</th>
                <th scope="col">Mã Sinh Viên</th>
                <th scope="col">Họ và Tên</th>
                <th scope="col">Địa Chỉ Email</th>
                <th scope="col">Mã Lớp</th>
                {isAdmin && <th scope="col" className="th-actions">Thao Tác</th>}
              </tr>
            </thead>
            <tbody>
              {sinhViens.map((sv, index) => (
                <tr key={sv.maSV} className="table-row">
                  {/* Tính số thứ tự liên tục qua các trang: (page - 1) * limit + index + 1 */}
                  <td className="text-center font-bold">
                    {(page - 1) * limit + index + 1}
                  </td>
                  {/* Cột mã sinh viên */}
                  <td className="font-code font-bold">{sv.maSV}</td>
                  {/* Cột họ và tên */}
                  <td>{sv.hoTen}</td>
                  {/* Cột email */}
                  <td>
                    <a href={`mailto:${sv.email}`} className="email-link">
                      {sv.email}
                    </a>
                  </td>
                  {/* Cột mã lớp */}
                  <td>
                    <span className="badge-class">{sv.maLop}</span>
                  </td>
                  {/* Cột nút xóa cho Admin */}
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

      {/* 4. THANH ĐIỀU KHIỂN PHÂN TRANG Ở CHÂN BẢNG (CHƯƠNG 08 - BƯỚC 6) */}
      <div className="table-pagination-footer">
        {/* Thông tin số lượng bản ghi hiển thị */}
        <div className="pagination-summary">
          Hiển thị <strong>{sinhViens.length}</strong> / <strong>{pagination.totalItems}</strong> sinh viên
        </div>

        {/* Bộ nút chuyển trang: Nút Trước, Nhãn Trang X/Y, Nút Sau */}
        <div className="pagination-controls">
          {/* Nút Trước: Bị vô hiệu hóa (disabled) khi đang ở trang 1 hoặc đang tải */}
          <button
            type="button"
            className="pagination-btn"
            onClick={handlePrevPage}
            disabled={page <= 1 || loading}
            title="Về trang trước"
          >
            ◀ Trước
          </button>

          {/* Nhãn thông tin trang hiện tại trên tổng số trang */}
          <span className="pagination-page-indicator">
            Trang <strong>{pagination.page}</strong> / <strong>{pagination.totalPages || 1}</strong>
          </span>

          {/* Nút Sau: Bị vô hiệu hóa khi đang ở trang cuối cùng hoặc không có dữ liệu */}
          <button
            type="button"
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={page >= pagination.totalPages || pagination.totalPages === 0 || loading}
            title="Sang trang tiếp theo"
          >
            Sau ▶
          </button>

          {/* Tùy chọn số lượng bản ghi trên một trang (limit selector) */}
          <div className="limit-selector-group">
            <span>Hiển thị:</span>
            <select
              className="limit-select"
              value={limit}
              onChange={handleLimitChange}
              disabled={loading}
              title="Chọn số lượng bản ghi mỗi trang"
            >
              <option value={2}>2 / trang</option>
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinhVienTable;
