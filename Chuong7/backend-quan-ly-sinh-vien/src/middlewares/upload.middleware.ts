// ==============================================================================
// MIDDLEWARE XỬ LÝ UPLOAD HÌNH ẢNH AVATAR BẰNG MULTER (CHƯƠNG 07 - BƯỚC 2)
// File: src/middlewares/upload.middleware.ts
// Mục đích: Tiếp nhận, kiểm tra dung lượng <= 2MB, xác thực chữ ký thực JPEG/PNG
// An toàn: Không lưu file rác, sinh tên file ngẫu nhiên an toàn, thư mục tạm cô lập
// ==============================================================================

// Import module hệ thống tập tin (File System) từ Node.js để thao tác đọc/ghi/xóa file
import fs from 'node:fs';

// Import module đường dẫn từ Node.js để xử lý đường dẫn thư mục chuẩn đa nền tảng
import path from 'node:path';

// Import hàm sinh định danh ngẫu nhiên chuẩn UUID v4 từ module crypto của Node.js
import { randomUUID } from 'node:crypto';

// Import thư viện Multer để bóc tách dữ liệu multipart/form-data
import multer from 'multer';

// Import các kiểu Request, Response, NextFunction từ Express
import type { Request, Response, NextFunction } from 'express';

// Import lớp xử lý lỗi tùy biến AppError của hệ thống
import { AppError } from '../utils/AppError.js';

// Định nghĩa hằng số dung lượng tối đa cho phép: đúng 2MB (2 * 1024 * 1024 = 2.097.152 byte)
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

// Đường dẫn tuyệt đối tới thư mục lưu tạm (cô lập an toàn, tuyệt đối không phục vụ public)
const TEMP_UPLOAD_DIR = path.resolve(process.cwd(), 'temp_uploads');

// Đường dẫn tuyệt đối tới thư mục lưu trữ ảnh công khai hợp lệ
const PUBLIC_UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads');

// Đảm bảo thư mục lưu tạm luôn tồn tại khi ứng dụng khởi chạy
if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
  // Tạo thư mục tạm nếu chưa có (recursive: true để tạo cả thư mục cha nếu cần)
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
}

// Đảm bảo thư mục lưu trữ ảnh công khai luôn tồn tại
if (!fs.existsSync(PUBLIC_UPLOAD_DIR)) {
  // Tạo thư mục public/uploads nếu chưa có
  fs.mkdirSync(PUBLIC_UPLOAD_DIR, { recursive: true });
}

// Cấu hình vị trí lưu trữ tạm thời cho Multer (diskStorage)
const storage = multer.diskStorage({
  // Thiết lập thư mục đích lưu tạm thời trước khi kiểm tra chữ ký file thực
  destination: (_req, _file, callback) => {
    // Trả về đường dẫn thư mục tạm thời
    callback(null, TEMP_UPLOAD_DIR);
  },
  // Thiết lập quy tắc sinh tên file tạm thời ngẫu nhiên để tránh xung đột
  filename: (_req, file, callback) => {
    // Lấy phần mở rộng gốc của client gửi lên (chỉ dùng tạm thời)
    const clientExt = path.extname(file.originalname).toLowerCase();
    // Sinh tên file tạm duy nhất bằng UUID kèm tiền tố 'temp_'
    const tempFileName = `temp_${randomUUID()}${clientExt}`;
    // Trả về tên file tạm thời cho Multer
    callback(null, tempFileName);
  }
});

// Bộ lọc sơ bộ (pre-filter) kiểm tra phần mở rộng và MIME type client khai báo
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void => {
  // Danh sách các MIME type hợp lệ được phép tải lên
  const allowedMimeTypes = ['image/jpeg', 'image/png'];
  // Danh sách các phần mở rộng hợp lệ
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  // Lấy phần mở rộng thực tế của tên file client gửi lên
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // Kiểm tra nếu MIME type hoặc extension không nằm trong danh sách được phép
  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(fileExtension)) {
    // Từ chối tiếp nhận file ngay lập tức với mã lỗi HTTP 400 Bad Request
    callback(new AppError(400, 'Chỉ chấp nhận tập tin hình ảnh có định dạng JPEG hoặc PNG (.jpg, .jpeg, .png)'));
    return;
  }

  // Chấp nhận file để Multer ghi tạm vào ổ đĩa
  callback(null, true);
};

// Khởi tạo instance multer với cấu hình giới hạn kích thước và bộ lọc sơ bộ
const multerUpload = multer({
  // Sử dụng cấu hình lưu trữ tạm thời đã khai báo
  storage: storage,
  // Cấu hình giới hạn kỹ thuật theo quy ước bài lab
  limits: {
    // Giới hạn kích thước file tối đa đúng 2MB
    fileSize: MAX_AVATAR_SIZE_BYTES,
    // Chỉ cho phép tải lên đúng 1 file trong request
    files: 1
  },
  // Áp dụng bộ lọc kiểm tra sơ bộ
  fileFilter: fileFilter
});

// Khởi tạo middleware Multer nhận trường file duy nhất có tên là 'avatar'
const uploadSingleAvatar = multerUpload.single('avatar');

// Hàm kiểm tra chữ ký thực (Magic Bytes / File Signature) của file ảnh
function verifyFileSignature(filePath: string): { isValid: boolean; extension: string } {
  // Mở file ở chế độ chỉ đọc để lấy file descriptor
  const fd = fs.openSync(filePath, 'r');
  // Cấp phát vùng đệm 8 byte đầu tiên để đọc chữ ký tệp
  const buffer = Buffer.alloc(8);
  // Đọc 8 byte đầu tiên từ vị trí offset 0 của file
  fs.readSync(fd, buffer, 0, 8, 0);
  // Đóng file descriptor sau khi đã đọc xong
  fs.closeSync(fd);

  // Chữ ký chuẩn của file JPEG: bắt đầu bằng 3 byte FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  // Chữ ký chuẩn của file PNG: bắt đầu bằng 8 byte 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  // Nếu là file PNG thật, trả về kết quả hợp lệ cùng đuôi mở rộng .png
  if (isPng) {
    return { isValid: true, extension: '.png' };
  }

  // Nếu là file JPEG thật, trả về kết quả hợp lệ cùng đuôi mở rộng .jpg
  if (isJpeg) {
    return { isValid: true, extension: '.jpg' };
  }

  // Nếu không khớp chữ ký của bất kỳ định dạng nào, trả về không hợp lệ
  return { isValid: false, extension: '' };
}

// Hàm hỗ trợ xóa một file vật lý trên ổ đĩa nếu tồn tại (tránh để lại file rác)
export function removeFileSafely(filePath: string | undefined): void {
  // Kiểm tra nếu đường dẫn hợp lệ và file thực sự tồn tại trên ổ đĩa
  if (filePath && fs.existsSync(filePath)) {
    try {
      // Tiến hành xóa file khỏi hệ thống tập tin
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      // In cảnh báo nếu không thể xóa file nhưng không làm sập tiến trình
      console.warn(`[WARN] Không thể xóa file rác: ${filePath}`, cleanupError);
    }
  }
}

// Middleware hoàn chỉnh tích hợp Multer + Kiểm tra chữ ký an toàn + Chuyển vào thư mục công khai
export function avatarUploadMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Kích hoạt middleware của Multer để hứng dữ liệu multipart/form-data
  uploadSingleAvatar(req, res, (err: unknown) => {
    // Nếu Multer ném ra lỗi (ví dụ vượt quá kích thước hoặc sai loại file)
    if (err) {
      // Chuyển lỗi sang errorMiddleware xử lý tập trung
      return next(err);
    }

    // Nếu không có file nào được đính kèm trong request
    if (!req.file) {
      // Bỏ qua bước kiểm tra chữ ký và chuyển tiếp cho Controller xử lý tiếp
      return next();
    }

    // Lấy đường dẫn file tạm vừa được ghi vào thư mục temp_uploads
    const tempFilePath = req.file.path;

    try {
      // Tiến hành kiểm tra chữ ký nội dung thực tế (magic bytes) của file
      const { isValid, extension } = verifyFileSignature(tempFilePath);

      // Nếu nội dung thực không phải ảnh JPEG/PNG hợp lệ (ví dụ file .txt đổi tên thành .png)
      if (!isValid) {
        // XÓA NGAY LẬP TỨC file tạm để đảm bảo không để lại file rác trên ổ đĩa
        removeFileSafely(tempFilePath);
        // Ném lỗi 400 Bad Request thông báo tệp giả mạo
        return next(
          new AppError(
            400,
            'Nội dung tập tin không phải ảnh JPEG hoặc PNG hợp lệ (sai chữ ký tệp tin / Magic Bytes)'
          )
        );
      }

      // Sinh tên file chính thức duy nhất bằng UUID v4 kèm đuôi chuẩn được phát hiện từ chữ ký thực
      const secureFileName = `${randomUUID()}${extension}`;

      // Xác định đường dẫn file đích trong thư mục public/uploads
      const finalFilePath = path.join(PUBLIC_UPLOAD_DIR, secureFileName);

      // Di chuyển (move / rename) file từ thư mục tạm sang thư mục công khai chính thức
      fs.renameSync(tempFilePath, finalFilePath);

      // Cập nhật lại các thông tin của file trong đối tượng req.file để Controller sử dụng
      req.file.destination = PUBLIC_UPLOAD_DIR;
      // Gán tên file an toàn do server tự sinh (tuyệt đối không dùng tên client gửi)
      req.file.filename = secureFileName;
      // Gán đường dẫn tuyệt đối mới của file
      req.file.path = finalFilePath;

      // Chuyển sang middleware hoặc controller tiếp theo
      return next();
    } catch (checkError) {
      // Nếu có lỗi phát sinh bất ngờ trong quá trình kiểm tra, luôn dọn dẹp file tạm
      removeFileSafely(tempFilePath);
      // Chuyển lỗi sang errorMiddleware
      return next(checkError);
    }
  });
}
