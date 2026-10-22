// ==============================================================================
// COMPONENT TẢI LÊN ẢNH ĐẠI DIỆN TRỰC TIẾP TRÊN REACT (CHƯƠNG 07 - BƯỚC 10)
// File: frontend/src/components/AvatarUpload.tsx
// Mục đích: Cho phép người dùng chọn ảnh, kiểm tra 2MB, gửi FormData + Bearer JWT,
//          hiển thị preview ảnh, xử lý loading/error và làm mới hồ sơ người dùng.
// ==============================================================================

// Import các hook useState và useRef từ React
import React, { useState, useRef } from 'react';

// Import apiClient Axios đã cấu hình interceptor và Base URL
import { apiClient } from '../api/client';

// Import interface định dạng ApiResponse
import type { IApiResponse } from '../types/sinhVien.types';

// Định nghĩa Props cho component AvatarUpload
export interface IAvatarUploadProps {
  // Callback kích hoạt sau khi upload ảnh thành công để làm mới thông tin hồ sơ
  onUploadSuccess?: (newAvatarUrl: string) => void | Promise<void>;
  // Mã token JWT (tùy chọn nếu cần truyền trực tiếp)
  token?: string | null;
}

// Khai báo hằng số dung lượng tối đa cho phép là 2MB (2 * 1024 * 1024 byte = 2.097.152 byte)
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

// Khởi tạo functional component AvatarUpload
export const AvatarUpload: React.FC<IAvatarUploadProps> = ({ onUploadSuccess }) => {
  // Ref tham chiếu đến thẻ input file để có thể reset giá trị khi cần
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State lưu trữ file ảnh được người dùng chọn
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // State lưu URL xem trước của ảnh trước khi bấm nút Upload
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // State quản lý trạng thái đang trong quá trình upload (loading)
  const [uploading, setUploading] = useState<boolean>(false);

  // State lưu thông báo lỗi (nếu có)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State lưu thông báo thành công (nếu có)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Hàm xử lý khi người dùng chọn tập tin từ máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Xóa các thông báo phản hồi cũ trước đó
    setErrorMessage(null);
    setSuccessMessage(null);

    // Lấy danh sách file được chọn
    const files = e.target.files;

    // Nếu người dùng không chọn tệp nào (hoặc nhấn Hủy)
    if (!files || files.length === 0) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Lấy tập tin đầu tiên được chọn (chỉ upload đúng 1 file duy nhất theo yêu cầu lab)
    const file = files[0];

    // 1. Kiểm tra sơ bộ định dạng MIME phía Frontend (chỉ chấp nhận image/png hoặc image/jpeg)
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validMimeTypes.includes(file.type)) {
      setErrorMessage('Định dạng tệp không được hỗ trợ! Vui lòng chỉ chọn tệp ảnh PNG hoặc JPEG (.png, .jpg, .jpeg).');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // 2. Kiểm tra sơ bộ dung lượng 2MB ở Frontend để báo lỗi sớm cho người dùng
    if (file.size > MAX_FILE_SIZE_BYTES) {
      // Tính toán dung lượng thực tế để hiển thị thông báo rõ ràng
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(`Kích thước tệp vượt quá giới hạn 2MB cho phép (Dung lượng tệp: ${actualSizeMB} MB). Vui lòng chọn ảnh nhỏ hơn!`);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Nếu tệp hợp lệ qua kiểm tra sơ bộ: Lưu file vào state
    setSelectedFile(file);

    // Tạo URL tạm thời bằng URL.createObjectURL để hiển thị ảnh xem trước trên giao diện
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
  };

  // Hàm hủy bỏ ảnh đã chọn và đặt lại trạng thái ban đầu
  const handleCancelSelection = () => {
    // Đặt lại file được chọn về null
    setSelectedFile(null);

    // Giải phóng bộ nhớ của URL preview nếu đang tồn tại
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    // Xóa giá trị trong thẻ input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Xóa các thông báo
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Hàm xử lý gửi yêu cầu tải ảnh lên máy chủ Backend
  const handleUploadSubmit = async (e: React.FormEvent) => {
    // Ngăn chặn hành vi reload mặc định của biểu mẫu submit HTML
    e.preventDefault();

    // Nếu chưa chọn tập tin nào thì hiển thị cảnh báo
    if (!selectedFile) {
      setErrorMessage('Vui lòng chọn một tệp hình ảnh trước khi nhấn nút Tải lên!');
      return;
    }

    // Xóa sạch các thông báo cũ
    setErrorMessage(null);
    setSuccessMessage(null);

    // Bật cờ trạng thái đang tải
    setUploading(true);

    try {
      // 1. Khởi tạo đối tượng FormData theo đúng chuẩn multipart/form-data
      const formData = new FormData();

      // 2. Gắn trường file mang tên chính xác "avatar" theo đúng hợp đồng API đã chốt
      formData.append('avatar', selectedFile);

      // 3. Gửi POST tới endpoint /api/auth/me/avatar bằng client Axios
      // Chú ý: Không tự ý đặt header 'Content-Type: multipart/form-data' vì trình duyệt cần tự bổ sung boundary
      const response = await apiClient.post<IApiResponse<{ avatarUrl: string }>>(
        '/api/auth/me/avatar',
        formData
      );

      // Kiểm tra phản hồi từ máy chủ Backend
      if (response.data && response.data.success && response.data.data?.avatarUrl) {
        // Lấy đường dẫn ảnh mới từ phản hồi của máy chủ
        const newUrl = response.data.data.avatarUrl;

        // Cập nhật thông báo thành công cho người dùng
        setSuccessMessage('🎉 Cập nhật ảnh đại diện thành công!');

        // Hủy bỏ trạng thái chọn ảnh cũ và giải phóng URL preview
        handleCancelSelection();

        // Kích hoạt callback để component cha App/UserProfileCard gọi lại GET /api/auth/profile cập nhật CSDL
        if (onUploadSuccess) {
          await onUploadSuccess(newUrl);
        }
      } else {
        // Trường hợp phản hồi không chứa dữ liệu avatarUrl hợp lệ
        throw new Error(response.data?.message || 'Máy chủ không phản hồi đường dẫn ảnh hợp lệ');
      }
    } catch (err: unknown) {
      // Bắt các mã lỗi và hiển thị thông điệp phù hợp
      let errorText = 'Tải lên ảnh đại diện thất bại. Vui lòng thử lại!';

      // Nếu lỗi trả về từ Axios phản hồi của Backend
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        const status = axiosErr.response?.status;
        const serverMsg = axiosErr.response?.data?.message;

        // Phân loại xử lý các mã trạng thái HTTP chuẩn mực theo giáo trình
        if (status === 400) {
          errorText = serverMsg || 'Tệp ảnh không hợp lệ hoặc nội dung tệp giả mạo (400 Bad Request)!';
        } else if (status === 401) {
          errorText = 'Phiên đăng nhập đã hết hạn hoặc chưa xác thực (401 Unauthorized). Vui lòng đăng nhập lại!';
        } else if (status === 413) {
          errorText = 'Dung lượng tệp vượt quá giới hạn 2MB của máy chủ (413 Payload Too Large)!';
        } else if (status === 500) {
          errorText = 'Lỗi máy chủ nội bộ khi lưu trữ ảnh (500 Internal Server Error)!';
        } else if (serverMsg) {
          errorText = serverMsg;
        }
      } else if (err instanceof Error) {
        // Lỗi kết nối mạng hoặc lỗi client
        errorText = err.message;
      }

      // Lưu thông điệp lỗi vào state để hiển thị
      setErrorMessage(errorText);
    } finally {
      // Tắt cờ trạng thái đang tải
      setUploading(false);
    }
  };

  return (
    <div className="avatar-upload-box">
      {/* Tiêu đề chức năng cập nhật ảnh */}
      <h4 className="avatar-upload-title">📷 Cập Nhật Ảnh Đại Diện Mới</h4>

      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="alert alert-danger avatar-alert" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Thông báo thành công nếu có */}
      {successMessage && (
        <div className="alert alert-success avatar-alert" role="alert">
          <span className="alert-icon">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form upload ảnh */}
      <form onSubmit={handleUploadSubmit} className="avatar-upload-form">
        {/* Khung chọn tệp từ máy tính */}
        <div className="file-input-wrapper">
          <label htmlFor="avatar-file-input" className="file-input-label">
            📁 Chọn tệp ảnh (PNG, JPEG ≤ 2MB):
          </label>
          <input
            id="avatar-file-input"
            ref={fileInputRef}
            type="file"
            // Chỉ định bộ lọc tập tin cho phép người dùng chọn ảnh PNG và JPEG
            accept="image/png,image/jpeg"
            // Gọi hàm xử lý khi có tệp được chọn
            onChange={handleFileChange}
            // Vô hiệu hóa khi đang tải lên
            disabled={uploading}
            className="file-input-control"
          />
        </div>

        {/* Khung xem trước hình ảnh trước khi tải lên (Preview) */}
        {previewUrl && selectedFile && (
          <div className="avatar-preview-container">
            <p className="preview-label">Xem trước hình ảnh đã chọn:</p>
            <div className="preview-content">
              {/* Ảnh xem trước cục bộ */}
              <img
                src={previewUrl}
                alt="Xem trước ảnh đại diện"
                className="avatar-preview-img"
              />
              {/* Thông tin chi tiết của tập tin */}
              <div className="preview-info">
                <span className="preview-filename font-bold">{selectedFile.name}</span>
                <span className="preview-filesize">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
                {/* Nút hủy bỏ chọn ảnh */}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger btn-cancel-preview"
                  onClick={handleCancelSelection}
                  disabled={uploading}
                >
                  ✖ Bỏ chọn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nút gửi form tải lên */}
        <div className="avatar-upload-actions">
          <button
            type="submit"
            className="btn btn-primary btn-upload"
            // Vô hiệu hóa nút khi chưa chọn file hoặc đang trong tiến trình upload
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <span className="upload-spinner"></span>
                <span>Đang tải lên máy chủ...</span>
              </>
            ) : (
              <>
                <span>🚀 Tải Lên Ảnh Đại Diện</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Xuất mặc định component AvatarUpload
export default AvatarUpload;
