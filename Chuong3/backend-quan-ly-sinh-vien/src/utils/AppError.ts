// Định nghĩa class AppError tùy chỉnh kế thừa từ class Error có sẵn của JavaScript
export class AppError extends Error {
  // Khai báo thuộc tính lưu mã trạng thái HTTP (ví dụ: 400, 404, 409, 500)
  public statusCode: number;

  // Constructor khởi tạo đối tượng AppError với mã trạng thái và thông điệp lỗi
  constructor(statusCode: number, message: string) {
    // Gọi constructor của lớp cha Error để thiết lập message
    super(message);

    // Gán mã lỗi HTTP tương ứng cho thuộc tính statusCode
    this.statusCode = statusCode;

    // Đặt tên định danh cho lỗi này
    this.name = 'AppError';

    // Giữ lại stack trace chuẩn của V8 engine
    Error.captureStackTrace(this, this.constructor);
  }
}
