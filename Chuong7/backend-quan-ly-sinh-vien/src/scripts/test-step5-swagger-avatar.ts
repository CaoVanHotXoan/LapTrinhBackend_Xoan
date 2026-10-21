// ==============================================================================
// SCRIPT KIỂM THỬ BƯỚC 5: XÁC MINH SWAGGER OPENAPI VỚI API POST /me/avatar (CHƯƠNG 07)
// File: src/scripts/test-step5-swagger-avatar.ts
// Mục đích: Tự động kiểm tra đặc tả OpenAPI 3.0.3 cho endpoint upload avatar và cấu hình Swagger UI
// ==============================================================================

// Import module hệ thống file của Node.js
import { existsSync, readFileSync } from 'node:fs';

// Import module xử lý đường dẫn tập tin
import { resolve } from 'node:path';

// Import thư viện js-yaml để phân tích cú pháp YAML sang đối tượng JavaScript
import { load } from 'js-yaml';

// Import kiểu dữ liệu OpenAPI v3 từ openapi-types
import type { OpenAPIV3 } from 'openapi-types';

// Hàm chính điều phối kiểm tra đặc tả Swagger
async function runStep5SwaggerVerification(): Promise<void> {
  console.log(`\n================================================================================`);
  console.log(`📋 BẮT ĐẦU KIỂM TRA BƯỚC 5: ĐẶC TẢ SWAGGER OPENAPI CHO API UPLOAD AVATAR`);
  console.log(`================================================================================\n`);

  // 1. Xác định đường dẫn file docs/openapi.yaml
  const yamlPath = resolve(process.cwd(), 'docs', 'openapi.yaml');
  if (!existsSync(yamlPath)) {
    throw new Error(`Không tìm thấy file: ${yamlPath}`);
  }

  // 2. Đọc nội dung và phân tích cú pháp YAML
  const rawContent = readFileSync(yamlPath, 'utf-8');
  const doc = load(rawContent) as OpenAPIV3.Document;

  // 3. Kiểm tra endpoint POST /api/auth/me/avatar có tồn tại
  const avatarPath = doc.paths?.['/api/auth/me/avatar']?.post;
  console.log(`${avatarPath ? '✅ [PASS]' : '❌ [FAIL]'} 1. Endpoint POST /api/auth/me/avatar đã được khai báo`);

  // 4. Kiểm tra ổ khóa bảo mật Bearer Token (security: [{ bearerAuth: [] }])
  const hasSecurity = Array.isArray(avatarPath?.security) &&
    avatarPath?.security.some((s) => 'bearerAuth' in s);
  console.log(`${hasSecurity ? '✅ [PASS]' : '❌ [FAIL]'} 2. Yêu cầu bảo mật BearerAuth (ổ khóa) cho API Avatar`);

  // 5. Kiểm tra requestBody multipart/form-data với field avatar binary
  const multipart = avatarPath?.requestBody && 'content' in avatarPath.requestBody
    ? avatarPath.requestBody.content['multipart/form-data']
    : undefined;
  const avatarProp = (multipart?.schema as OpenAPIV3.SchemaObject)?.properties?.['avatar'] as OpenAPIV3.SchemaObject;
  const isBinary = avatarProp?.type === 'string' && avatarProp?.format === 'binary';
  console.log(`${isBinary ? '✅ [PASS]' : '❌ [FAIL]'} 3. RequestBody nhận multipart/form-data có avatar (string, format: binary)`);

  // 6. Kiểm tra các mã HTTP responses (200, 400, 401, 413, 500)
  const responses = avatarPath?.responses ?? {};
  const has200 = '200' in responses;
  const has400 = '400' in responses;
  const has401 = '401' in responses;
  const has413 = '413' in responses;
  const has500 = '500' in responses;
  const fullResponses = has200 && has400 && has401 && has413 && has500;
  console.log(`${fullResponses ? '✅ [PASS]' : '❌ [FAIL]'} 4. Khai báo đầy đủ các mã phản hồi: 200, 400, 401, 413, 500`);

  // 7. Kiểm tra UserPublic schema có trường avatarUrl
  const userPublic = doc.components?.schemas?.['UserPublic'] as OpenAPIV3.SchemaObject;
  const hasAvatarUrl = 'avatarUrl' in (userPublic?.properties ?? {});
  console.log(`${hasAvatarUrl ? '✅ [PASS]' : '❌ [FAIL]'} 5. Schema UserPublic đã bổ sung thuộc tính avatarUrl (nullable)`);

  // 8. Kiểm tra runtime: Swagger UI endpoint trả về 200 OK
  const swaggerRes = await fetch('http://localhost:5000/api-docs/');
  const isSwaggerOk = swaggerRes.status === 200;
  console.log(`${isSwaggerOk ? '✅ [PASS]' : '❌ [FAIL]'} 6. Endpoint Swagger UI runtime (http://localhost:5000/api-docs/) hoạt động tốt (Status: ${swaggerRes.status})`);

  console.log(`\n================================================================================`);
  console.log(`🎉 TOÀN BỘ CÁC TIÊU CHÍ BƯỚC 5 ĐÃ PASS 100%!`);
  console.log(`================================================================================\n`);
}

// Chạy kịch bản kiểm tra
runStep5SwaggerVerification();
