// ==============================================================================
// SCRIPT KIỂM THỬ BƯỚC 9: XÁC MINH ĐẶC TẢ SWAGGER OPENAPI 3.0.3 VÀ BEARER AUTH
// File: src/scripts/test-step9-swagger.ts
// Mục đích: Tự động kiểm tra cấu trúc file docs/openapi.yaml và tính năng Swagger UI
// ==============================================================================

// Import module fs để kiểm tra sự tồn tại và đọc nội dung file docs/openapi.yaml
import { existsSync, readFileSync } from 'node:fs';

// Import hàm resolve từ module path để định vị đường dẫn tuyệt đối chuẩn xác
import { resolve } from 'node:path';

// Import hàm load từ thư viện js-yaml để phân tích cú pháp chuỗi YAML
import { load } from 'js-yaml';

// Import OpenAPIV3 từ thư viện openapi-types để ép kiểu định nghĩa chuẩn
import type { OpenAPIV3 } from 'openapi-types';

// Hàm in tiêu đề cho từng mục kiểm tra
function logSection(title: string): void {
  // In đường kẻ phân cách trước tiêu đề
  console.log('\n' + '='.repeat(80));
  // In nội dung tiêu đề
  console.log(`📋 ${title}`);
  // In đường kẻ phân cách sau tiêu đề
  console.log('='.repeat(80));
}

// Hàm in kết quả của từng ca kiểm tra
function logTestResult(id: string, description: string, pass: boolean, detail?: string): void {
  // Biểu tượng PASS hoặc FAIL
  const symbol = pass ? '✅ [PASS]' : '❌ [FAIL]';
  // In mã ca kiểm thử và mô tả
  console.log(`${symbol} ${id}: ${description}`);
  // Nếu có thông tin chi tiết thì in thụt lề
  if (detail) {
    console.log(`         Chi tiết: ${detail}`);
  }
}

// Hàm thực thi kịch bản kiểm tra toàn diện Bước 9
async function runStep9Verification(): Promise<void> {
  // Biến đếm tổng số ca kiểm tra
  let totalTests = 0;
  // Biến đếm số ca kiểm tra thành công
  let passedTests = 0;

  // Helper ghi nhận kết quả
  const assert = (id: string, description: string, condition: boolean, detail?: string) => {
    totalTests++;
    if (condition) {
      passedTests++;
      logTestResult(id, description, true, detail);
    } else {
      logTestResult(id, description, false, detail);
    }
  };

  logSection('BƯỚC 9: KIỂM TRA ĐẶC TẢ OPENAPI 3.0.3 (docs/openapi.yaml)');

  // 1. Kiểm tra sự tồn tại của file docs/openapi.yaml
  const yamlPath = resolve(process.cwd(), 'docs/openapi.yaml');
  const fileExists = existsSync(yamlPath);
  assert('SW-01', 'File docs/openapi.yaml tồn tại trên hệ thống', fileExists, yamlPath);

  if (!fileExists) {
    console.error('Dừng kiểm tra do không tìm thấy file docs/openapi.yaml');
    process.exit(1);
  }

  // 2. Đọc và parse nội dung YAML
  const rawYaml = readFileSync(yamlPath, 'utf8');
  let doc: OpenAPIV3.Document;
  try {
    doc = load(rawYaml) as OpenAPIV3.Document;
    assert('SW-02', 'Cú pháp YAML hợp lệ và parse thành công sang JS Object', true, `Độ dài file: ${rawYaml.length} bytes`);
  } catch (err) {
    assert('SW-02', 'Cú pháp YAML hợp lệ và parse thành công sang JS Object', false, (err as Error).message);
    process.exit(1);
  }

  // 3. Kiểm tra phiên bản OpenAPI và thông tin Info
  assert('SW-03', 'Phiên bản đặc tả chính xác là OpenAPI 3.0.3', doc.openapi === '3.0.3', `openapi: ${doc.openapi}`);
  assert('SW-04', 'Khai báo thông tin tài liệu (info.title, info.version)', !!doc.info?.title && !!doc.info?.version, `Title: "${doc.info?.title}", Version: "${doc.info?.version}"`);

  // 4. Kiểm tra cấu hình Security Schemes Bearer JWT
  const securitySchemes = doc.components?.securitySchemes as Record<string, OpenAPIV3.SecuritySchemeObject> | undefined;
  const bearerScheme = securitySchemes?.bearerAuth;
  const isBearerValid = bearerScheme?.type === 'http' && bearerScheme?.scheme === 'bearer' && bearerScheme?.bearerFormat === 'JWT';
  assert(
    'SW-05',
    'Cấu hình securitySchemes.bearerAuth chuẩn (type=http, scheme=bearer, bearerFormat=JWT)',
    isBearerValid,
    JSON.stringify(bearerScheme)
  );

  // 5. Kiểm tra nhóm API Auth (/api/auth/register, /api/auth/login, /api/auth/profile)
  const paths = doc.paths || {};
  const regPath = paths['/api/auth/register']?.post;
  assert('SW-06', 'Khai báo endpoint POST /api/auth/register (mã 201, 400, 409)', !!regPath && !!regPath.responses['201'] && !!regPath.responses['400'] && !!regPath.responses['409']);

  const loginPath = paths['/api/auth/login']?.post;
  assert('SW-07', 'Khai báo endpoint POST /api/auth/login (mã 200, 400, 401)', !!loginPath && !!loginPath.responses['200'] && !!loginPath.responses['401']);

  const profilePath = paths['/api/auth/profile']?.get;
  const hasProfileSecurity = Array.isArray(profilePath?.security) && profilePath?.security.some((s: Record<string, string[]>) => 'bearerAuth' in s);
  assert(
    'SW-08',
    'Khai báo endpoint GET /api/auth/profile có gắn security bearerAuth và response 401',
    !!profilePath && hasProfileSecurity && !!profilePath.responses['401'],
    `Security: ${JSON.stringify(profilePath?.security)}`
  );

  // 6. Kiểm tra các API SinhVien: Phân định rõ ràng Public và Protected RBAC
  const svListGet = paths['/api/v1/sinh-vien']?.get;
  assert('SW-09', 'GET /api/v1/sinh-vien là PUBLIC (không yêu cầu security bearerAuth)', !!svListGet && !svListGet.security);

  const svDetailGet = paths['/api/v1/sinh-vien/{maSV}']?.get;
  assert('SW-10', 'GET /api/v1/sinh-vien/{maSV} là PUBLIC (không yêu cầu security bearerAuth)', !!svDetailGet && !svDetailGet.security);

  const svCreatePost = paths['/api/v1/sinh-vien']?.post;
  const svCreateSec = Array.isArray(svCreatePost?.security) && svCreatePost?.security.some((s: Record<string, string[]>) => 'bearerAuth' in s);
  assert(
    'SW-11',
    'POST /api/v1/sinh-vien có security bearerAuth và đầy đủ response 401, 403',
    !!svCreatePost && svCreateSec && !!svCreatePost.responses['401'] && !!svCreatePost.responses['403']
  );

  const svUpdatePut = paths['/api/v1/sinh-vien/{maSV}']?.put;
  const svUpdateSec = Array.isArray(svUpdatePut?.security) && svUpdatePut?.security.some((s: Record<string, string[]>) => 'bearerAuth' in s);
  assert(
    'SW-12',
    'PUT /api/v1/sinh-vien/{maSV} có security bearerAuth và đầy đủ response 401, 403',
    !!svUpdatePut && svUpdateSec && !!svUpdatePut.responses['401'] && !!svUpdatePut.responses['403']
  );

  const svDeleteDel = paths['/api/v1/sinh-vien/{maSV}']?.delete;
  const svDeleteSec = Array.isArray(svDeleteDel?.security) && svDeleteDel?.security.some((s: Record<string, string[]>) => 'bearerAuth' in s);
  assert(
    'SW-13',
    'DELETE /api/v1/sinh-vien/{maSV} có security bearerAuth và đầy đủ response 401, 403',
    !!svDeleteDel && svDeleteSec && !!svDeleteDel.responses['401'] && !!svDeleteDel.responses['403']
  );

  // 7. Kiểm tra các components.schemas cốt lõi
  const schemas = doc.components?.schemas || {};
  const hasSchemas =
    !!schemas['RegisterInput'] &&
    !!schemas['LoginInput'] &&
    !!schemas['UserPublic'] &&
    !!schemas['SinhVien'] &&
    !!schemas['SinhVienUpdate'] &&
    !!schemas['ErrorResponse'];
  assert('SW-14', 'Khai báo đầy đủ các Schemas tái sử dụng (Register, Login, UserPublic, SinhVien, ErrorResponse)', hasSchemas);

  // 8. Kiểm tra kết nối trực tiếp tới Swagger UI runtime endpoint
  logSection('KIỂM TRA RUNTIME SWAGGER UI ENDPOINT (/api-docs/)');
  try {
    const res = await fetch('http://localhost:5000/api-docs/');
    assert('SW-15', 'Endpoint Swagger UI runtime http://localhost:5000/api-docs/ phản hồi mã HTTP 200 OK', res.status === 200, `HTTP status: ${res.status}`);
  } catch (err) {
    assert('SW-15', 'Endpoint Swagger UI runtime http://localhost:5000/api-docs/ phản hồi mã HTTP 200 OK', false, `Lỗi kết nối: ${(err as Error).message}`);
  }

  // Tổng kết kết quả kiểm thử
  logSection('TỔNG KẾT KẾT QUẢ KIỂM THỬ BƯỚC 9');
  console.log(`🎯 Kết quả: ${passedTests}/${totalTests} ca kiểm thử ĐẠT (${Math.round((passedTests / totalTests) * 100)}%)`);

  if (passedTests === totalTests) {
    console.log('🎉 BƯỚC 9 HOÀN THÀNH XUẤT SẮC - TÀI LIỆU OPENAPI 3.0.3 VÀ SWAGGER UI ĐẠT CHUẨN 100%!');
  } else {
    console.error('⚠️ Có ca kiểm thử chưa đạt, vui lòng rà soát lại file docs/openapi.yaml!');
    process.exitCode = 1;
  }
}

// Chạy hàm kiểm thử
runStep9Verification();
