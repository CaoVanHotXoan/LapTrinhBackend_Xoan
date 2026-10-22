// ==============================================================================
// BƯỚC 6: TÍCH HỢP SWAGGER BẰNG TYPESCRIPT (CẤU HÌNH ĐỌC FILE OPENAPI YAML)
// File: src/config/swagger.config.ts
// Mục đích: Đọc file docs/openapi.yaml, parse sang JavaScript Object và export swaggerSpec
// ==============================================================================

// Import hàm readFileSync từ module file system (fs) của Node.js để đọc file đồng bộ lúc khởi động server
import { readFileSync } from 'node:fs';

// Import hàm resolve từ module path của Node.js để xây dựng đường dẫn tuyệt đối chuẩn xác theo OS
import { resolve } from 'node:path';

// Import hàm load từ thư viện js-yaml để phân tích cú pháp chuỗi YAML thành JavaScript Object
import { load } from 'js-yaml';

// Import kiểu dữ liệu OpenAPIV3 từ thư viện openapi-types để định kiểu mạnh trong TypeScript
import type { OpenAPIV3 } from 'openapi-types';

// 1. Xác định đường dẫn tuyệt đối đến file đặc tả docs/openapi.yaml tính từ thư mục gốc của project
const yamlPath = resolve(process.cwd(), 'docs/openapi.yaml');

// 2. Đọc toàn bộ nội dung file openapi.yaml dưới định dạng văn bản UTF-8
const rawContent = readFileSync(yamlPath, 'utf8');

// 3. Dùng js-yaml để chuyển đổi cấu trúc YAML sang Plain JavaScript Object
const parsedYaml: unknown = load(rawContent);

// Hàm Type Guard kiểm tra xem một giá trị có phải là một plain JavaScript Object (không null, không array)
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// 4. Kiểm tra (Validate) các cấu trúc cốt lõi bắt buộc theo chuẩn OpenAPI 3.0.3
// Nếu file YAML bị thiếu các khóa gốc (openapi, info, paths) hoặc sai cú pháp thì ném lỗi ngay khi khởi động
if (
  !isObject(parsedYaml) ||
  parsedYaml.openapi !== '3.0.3' ||
  !isObject(parsedYaml.info) ||
  !isObject(parsedYaml.paths)
) {
  throw new Error('File docs/openapi.yaml không hợp lệ hoặc thiếu cấu trúc bắt buộc của OpenAPI 3.0.3 (openapi, info, paths)');
}

// 5. Ép kiểu an toàn sang OpenAPIV3.Document và export để server.ts nạp vào middleware Swagger UI
export const swaggerSpec = (parsedYaml as unknown) as OpenAPIV3.Document;
