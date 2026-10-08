// Import các kiểu Request, Response, NextFunction từ Express
import type { Request, Response, NextFunction } from 'express';

// Middleware ghi nhật ký các request gửi đến server
export function loggerMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // In ra phương thức HTTP (GET, POST, ...) và đường dẫn được yêu cầu
  console.log(`[LOG] ${req.method} ${req.path}`);

  // Gọi hàm next() để chuyển tiếp yêu cầu đến middleware hoặc controller tiếp theo
  next();
}
