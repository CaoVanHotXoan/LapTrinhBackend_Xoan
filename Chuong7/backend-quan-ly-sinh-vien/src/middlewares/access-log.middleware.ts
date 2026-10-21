// Import module thao tác file hệ thống (fs) từ thư viện chuẩn Node.js
import fs from 'node:fs';

// Import module xử lý đường dẫn tệp tin và thư mục (path) từ thư viện chuẩn Node.js
import path from 'node:path';

// Import thư viện Morgan dùng để ghi nhật ký (log) các HTTP request
import morgan from 'morgan';

// Xác định đường dẫn tuyệt đối tới thư mục 'logs' tại thư mục gốc của dự án
const logsDir = path.resolve(process.cwd(), 'logs');

// Tạo thư mục 'logs' nếu chưa tồn tại (recursive: true giúp tránh lỗi nếu thư mục cha chưa có)
fs.mkdirSync(logsDir, { recursive: true });

// Xác định đường dẫn đầy đủ tới file lưu log: logs/access.log
const logFile = path.join(logsDir, 'access.log');

// Tạo một WriteStream để ghi dữ liệu vào file access.log
// flag: 'a' đại diện cho chế độ 'append' (ghi nối tiếp vào cuối file mỗi khi server khởi động lại)
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Khởi tạo và export middleware Morgan với định dạng 'combined' chuẩn Apache
// stream: logStream chỉ định đẩy toàn bộ nội dung log HTTP vào file thay vì in ra màn hình console
export const accessLogger = morgan('combined', {
  stream: logStream,
});
