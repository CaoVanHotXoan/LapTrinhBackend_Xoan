// Import kiểu RequestHandler từ Express để định kiểu cho middleware trả về
import type { RequestHandler } from 'express';

// Import kiểu 'z' từ Zod để nhận schema truyền vào hàm validate
import type { z } from 'zod';

/**
 * Higher-order middleware function nhận vào một Zod Schema và trả về một Express middleware
 * @param schema - Zod Schema cần kiểm tra đối với req.body
 */
export const validate = (schema: z.ZodType): RequestHandler => {
  // Trả về hàm middleware tiêu chuẩn của Express với 3 tham số (req, res, next)
  return (req, res, next) => {
    // safeParse: Kiểm tra req.body với schema mà KHÔNG throw Exception, trả về kết quả dạng { success, data } hoặc { success, error }
    const parsed = schema.safeParse(req.body);

    // Kiểm tra nếu dữ liệu đầu vào không hợp lệ (success === false)
    if (!parsed.success) {
      // Phản hồi ngay lập tức về Client với HTTP status code 400 Bad Request
      res.status(400).json({
        // Báo hiệu trạng thái thất bại
        success: false,
        // Thông điệp lỗi chuẩn hóa theo hợp đồng API Chương 04/05
        message: 'Dữ liệu đầu vào không hợp lệ',
        // Giữ thuộc tính data là null theo đúng format quy định
        data: null,
        // Danh sách mảng chi tiết các trường bị vi phạm
        errors: parsed.error.issues.map((issue) => ({
          // field: Đường dẫn đến trường bị sai (vd: 'email', 'hoTen'), nếu không xác định được thì fallback về 'body'
          field: issue.path.join('.') || 'body',
          // message: Lời nhắn thông báo lỗi do schema định nghĩa (vd: 'Email không hợp lệ')
          message: issue.message,
        })),
      });
      // Short-circuit: return để dừng luồng xử lý tại đây, không cho gọi tiếp sang Controller
      return;
    }

    // Gán dữ liệu đã được Zod xác thực và chuẩn hóa (đã trim khoảng trắng) ngược lại vào req.body
    req.body = parsed.data;

    // Gọi hàm next() để chuyển quyền xử lý cho Middleware kế tiếp hoặc Controller
    next();
  };
};

/**
 * Middleware kiểm thực dữ liệu Query String (req.query) qua Zod Schema (Chương 08 - Bước 2)
 * @param schema - Zod Schema cần kiểm tra đối với req.query (page, limit, search)
 */
export const validateQuery = (schema: z.ZodType): RequestHandler => {
  // Trả về Express middleware chuẩn
  return (req, res, next) => {
    // 1. safeParse: Phân tích req.query theo schema mà không gây văng Exception
    const parsed = schema.safeParse(req.query);

    // 2. Nếu dữ liệu query không hợp lệ (ví dụ page=-1, limit=abc,...)
    if (!parsed.success) {
      // Lấy lỗi đầu tiên để làm thông điệp chính hiển thị cho client
      const firstIssue = parsed.error.issues[0];
      const mainMessage = firstIssue ? firstIssue.message : 'Tham số query string không hợp lệ';

      // Phản hồi ngay mã lỗi HTTP 400 Bad Request theo chuẩn thống nhất của Chương 08
      res.status(400).json({
        // Trạng thái thất bại
        success: false,
        // Mã trạng thái HTTP 400
        status: 400,
        // Thông báo lỗi chi tiết, rõ ràng
        message: mainMessage,
        // Dữ liệu data trả về là null
        data: null,
        // Danh sách mảng các trường lỗi
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'query',
          message: issue.message,
        })),
      });
      // Dừng luồng xử lý tại đây, không cho gọi tiếp tới Controller
      return;
    }

    // 3. Nếu hợp lệ: Ép và cập nhật dữ liệu đã được parse (kiểu number) vào req.query và res.locals
    Object.assign(req.query, parsed.data);
    res.locals.validatedQuery = parsed.data;

    // 4. Chuyển tiếp sang controller hoặc middleware tiếp theo
    next();
  };
};

