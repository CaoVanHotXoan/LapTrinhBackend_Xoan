// Import các kiểu dữ liệu Request, Response, NextFunction từ framework Express
import type { Request, Response, NextFunction } from 'express';

// Import các hàm xử lý nghiệp vụ đăng ký, đăng nhập, lấy hồ sơ và cập nhật avatar từ tầng Service
import { registerUser, loginUser, getUserProfile, updateUserAvatar } from '../services/auth.service.js';

// Import hàm hỗ trợ xóa file an toàn từ upload middleware để dọn file khi gặp sự cố
import { removeFileSafely } from '../middlewares/upload.middleware.js';

// Controller xử lý yêu cầu đăng ký tài khoản mới (POST /api/auth/register)
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Chuyển giao dữ liệu từ body của Request sang tầng Service để xử lý băm mật khẩu và lưu vào CSDL
    const newUser = await registerUser(req.body);

    // Trả về mã HTTP 201 (Created) cùng cấu trúc response thống nhất của hệ thống
    res.status(201).json({
      // Trạng thái thành công
      success: true,
      // Thông báo phản hồi cho client
      message: 'Đăng ký tài khoản thành công',
      // Dữ liệu người dùng công khai (không chứa password hay passwordHash)
      data: newUser
    });
  } catch (error) {
    // Bắt và chuyển tiếp lỗi (AppError 409 hoặc lỗi khác) sang errorMiddleware xử lý tập trung
    next(error);
  }
}

// Controller xử lý yêu cầu đăng nhập tài khoản (POST /api/auth/login)
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Chuyển giao thông tin email/password sang tầng Service để xác thực và cấp mã JWT
    const authData = await loginUser(req.body);

    // Trả về mã HTTP 200 (OK) cùng token truy cập
    res.status(200).json({
      // Trạng thái phản hồi thành công
      success: true,
      // Thông báo phản hồi cho client
      message: 'Đăng nhập thành công',
      // Dữ liệu bao gồm accessToken, tokenType và expiresIn
      data: authData
    });
  } catch (error) {
    // Chuyển tiếp lỗi xác thực (AppError 401 hoặc lỗi hệ thống) sang middleware xử lý lỗi tập trung
    next(error);
  }
}

// Controller xử lý yêu cầu xem hồ sơ người dùng hiện tại (GET /api/auth/profile)
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Kiểm tra an toàn: nếu đối tượng req.user chưa được gán bởi middleware isAuth
    if (!req.user) {
      // Phản hồi mã HTTP 401 khi người dùng chưa được xác thực
      res.status(401).json({
        // Trạng thái thất bại
        success: false,
        // Thông điệp lỗi
        message: 'Chưa xác thực người dùng'
      });
      // Dừng xử lý
      return;
    }

    // Gọi tầng Service để lấy thông tin hồ sơ của người dùng dựa vào req.user.id
    const userProfile = await getUserProfile(req.user.id);

    // Trả về mã HTTP 200 (OK) cùng dữ liệu hồ sơ công khai (không chứa passwordHash)
    res.status(200).json({
      // Trạng thái thành công
      success: true,
      // Thông điệp thành công
      message: 'Lấy thông tin hồ sơ thành công',
      // Dữ liệu hồ sơ
      data: userProfile
    });
  } catch (error) {
    // Chuyển tiếp lỗi nếu có sang errorMiddleware xử lý
    next(error);
  }
}

// Controller xử lý yêu cầu tải lên ảnh đại diện của người dùng (POST /api/auth/me/avatar)
export async function uploadAvatar(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 1. Kiểm tra xác thực danh tính: nếu req.user chưa tồn tại (chưa qua isAuth)
  if (!req.user) {
    // Nếu Multer đã lưu file vào thư mục công khai, xóa ngay để tránh tệp mồ côi
    if (req.file) {
      removeFileSafely(req.file.path);
    }
    // Trả về mã lỗi 401 Unauthorized
    res.status(401).json({
      success: false,
      message: 'Chưa xác thực người dùng'
    });
    return;
  }

  // 2. Kiểm tra tập tin tải lên: nếu client không gửi file hoặc gửi sai field name
  if (!req.file) {
    // Trả về mã lỗi 400 Bad Request theo đúng hợp đồng API bài lab
    res.status(400).json({
      success: false,
      message: 'Vui lòng chọn tập tin ảnh đại diện để tải lên (tên trường "avatar")'
    });
    return;
  }

  try {
    // 3. Lấy định danh User ID từ Token JWT đã xác thực (tuyệt đối không đọc req.body.userId)
    const currentUserId = req.user.id;

    // 4. Gọi Service cập nhật đường dẫn ảnh avatarUrl vào cơ sở dữ liệu
    const result = await updateUserAvatar(currentUserId, req.file.filename);

    // 5. Trả về mã HTTP 200 OK cùng đường dẫn URL tương đối theo cấu trúc hợp đồng
    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: {
        avatarUrl: result.avatarUrl
      }
    });
  } catch (error) {
    // 6. Xử lý sự cố CSDL: Nếu cập nhật DB thất bại, xóa ngay file ảnh vừa lưu để tránh file mồ côi
    if (req.file) {
      removeFileSafely(req.file.path);
    }
    // Chuyển lỗi sang errorMiddleware xử lý tập trung
    next(error);
  }
}

