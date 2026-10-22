// ==============================================================================
// SCRIPT TỰ ĐỘNG SINH POSTMAN COLLECTION CHO CHƯƠNG 08 - LAB 2 (MA TRẬN LỖI E01 - E10)
// File: src/scripts/generate-chuong8-buoc9-postman.ts
// Mục đích: Khởi tạo file Chuong8_Buoc9_postman.json trong thư mục postman/
// ==============================================================================

// 1. Import module fs và path từ Node.js
import fs from 'node:fs';
import path from 'node:path';

// 2. Định nghĩa cấu trúc Postman Collection v2.1.0 cho Lab 2
const collection = {
  info: {
    _postman_id: 'chuong8-buoc9-error-handling-e01-e10',
    name: 'Chương 08 - Lab 2: Ma Trận Xử Lý Lỗi Tập Trung (E01 - E10)',
    description: 'Bộ sưu tập Postman Collection hoàn chỉnh kiểm thử 10 ca lỗi E01 - E10 theo đúng tài liệu giáo trình Chương 08 Trang 18. Bao gồm: 400 Bad Request, 404 Not Found, 500 che lỗi bảo mật, 401 Unauthorized và 403 Forbidden RBAC.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  event: [
    {
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: [
          '// Tự động kiểm tra và đăng nhập cấp Token nếu biến adminToken hoặc studentToken bị rỗng',
          'const baseUrl = pm.variables.get("baseUrl") || "http://localhost:5000";',
          '',
          '// 1. Tự động lấy adminToken nếu chưa có',
          'const adminTok = pm.variables.get("adminToken");',
          'if (!adminTok || adminTok.trim() === "") {',
          '    pm.sendRequest({',
          '        url: baseUrl + "/api/auth/login",',
          '        method: "POST",',
          '        header: { "Content-Type": "application/json" },',
          '        body: {',
          '            mode: "raw",',
          '            raw: JSON.stringify({',
          '                email: pm.variables.get("adminEmail") || "admin.lab@example.com",',
          '                password: pm.variables.get("adminPassword") || "Admin@123456"',
          '            })',
          '        }',
          '    }, function (err, res) {',
          '        if (!err && res.code === 200) {',
          '            const json = res.json();',
          '            if (json.data && json.data.accessToken) {',
          '                pm.collectionVariables.set("adminToken", json.data.accessToken);',
          '                pm.environment.set("adminToken", json.data.accessToken);',
          '                console.log("🔑 [Auto-Auth] Cấp adminToken thành công!");',
          '            }',
          '        }',
          '    });',
          '}',
          '',
          '// 2. Tự động lấy studentToken nếu chưa có',
          'const studentTok = pm.variables.get("studentToken");',
          'if (!studentTok || studentTok.trim() === "") {',
          '    pm.sendRequest({',
          '        url: baseUrl + "/api/auth/login",',
          '        method: "POST",',
          '        header: { "Content-Type": "application/json" },',
          '        body: {',
          '            mode: "raw",',
          '            raw: JSON.stringify({',
          '                email: pm.variables.get("studentEmail") || "student.lab@example.com",',
          '                password: pm.variables.get("studentPassword") || "Student@123456"',
          '            })',
          '        }',
          '    }, function (err, res) {',
          '        if (!err && res.code === 200) {',
          '            const json = res.json();',
          '            if (json.data && json.data.accessToken) {',
          '                pm.collectionVariables.set("studentToken", json.data.accessToken);',
          '                pm.environment.set("studentToken", json.data.accessToken);',
          '                console.log("🎓 [Auto-Auth] Cấp studentToken thành công!");',
          '            }',
          '        }',
          '    });',
          '}'
        ]
      }
    }
  ],
  variable: [
    {
      key: 'baseUrl',
      value: 'http://localhost:5000',
      type: 'string'
    },
    {
      key: 'adminToken',
      value: '',
      type: 'string'
    },
    {
      key: 'studentToken',
      value: '',
      type: 'string'
    },
    {
      key: 'adminEmail',
      value: 'admin.lab@example.com',
      type: 'string'
    },
    {
      key: 'adminPassword',
      value: 'Admin@123456',
      type: 'string'
    },
    {
      key: 'studentEmail',
      value: 'student.lab@example.com',
      type: 'string'
    },
    {
      key: 'studentPassword',
      value: 'Student@123456',
      type: 'string'
    }
  ],
  item: [
    // --- 00. ĐĂNG NHẬP THỦ CÔNG (TÙY CHỌN NẾU MUỐN LẤY TOKEN BẰNG TAY) ---
    {
      name: '00.1 - Đăng nhập tài khoản Admin (Lấy Token Quản trị)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("00.1 - Đăng nhập Admin thành công (200 OK)", function () {',
              '    pm.response.to.have.status(200);',
              '    const json = pm.response.json();',
              '    pm.expect(json.success).to.eql(true);',
              '    pm.collectionVariables.set("adminToken", json.data.accessToken);',
              '    pm.environment.set("adminToken", json.data.accessToken);',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: '{\n  "email": "{{adminEmail}}",\n  "password": "{{adminPassword}}"\n}'
        },
        url: {
          raw: '{{baseUrl}}/api/auth/login',
          host: ['{{baseUrl}}'],
          path: ['api', 'auth', 'login']
        }
      }
    },
    {
      name: '00.2 - Đăng nhập tài khoản Student (Lấy Token Sinh viên)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("00.2 - Đăng nhập Student thành công (200 OK)", function () {',
              '    pm.response.to.have.status(200);',
              '    const json = pm.response.json();',
              '    pm.expect(json.success).to.eql(true);',
              '    pm.collectionVariables.set("studentToken", json.data.accessToken);',
              '    pm.environment.set("studentToken", json.data.accessToken);',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: '{\n  "email": "{{studentEmail}}",\n  "password": "{{studentPassword}}"\n}'
        },
        url: {
          raw: '{{baseUrl}}/api/auth/login',
          host: ['{{baseUrl}}'],
          path: ['api', 'auth', 'login']
        }
      }
    },

    // --- E01: GET ?page=-5 ---
    {
      name: 'E01 - GET ?page=-5 (HTTP 400: Kiểm tra số âm)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("E01 - Status code phải là HTTP 400 Bad Request", function () {',
              '    pm.response.to.have.status(400);',
              '});',
              'pm.test("E01 - Cấu trúc chuẩn hóa: success=false, status=400, data=null", function () {',
              '    const json = pm.response.json();',
              '    pm.expect(json.success).to.eql(false);',
              '    pm.expect(json.status).to.eql(400);',
              '    pm.expect(json.data).to.be.null;',
              '    pm.expect(json.message).to.be.a("string");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/api/v1/sinh-vien?page=-5',
          host: ['{{baseUrl}}'],
          path: ['api', 'v1', 'sinh-vien'],
          query: [{ key: 'page', value: '-5' }]
        }
      }
    },

    // --- E02: GET ?limit=abc ---
    {
      name: 'E02 - GET ?limit=abc (HTTP 400: Kiểm tra limit là chữ)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("E02 - Status code phải là HTTP 400 Bad Request", function () {',
              '    pm.response.to.have.status(400);',
              '});',
              'pm.test("E02 - Zod schema chặn trước Database; data=null", function () {',
              '    const json = pm.response.json();',
              '    pm.expect(json.success).to.eql(false);',
              '    pm.expect(json.status).to.eql(400);',
              '    pm.expect(json.data).to.be.null;',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/api/v1/sinh-vien?limit=abc',
          host: ['{{baseUrl}}'],
          path: ['api', 'v1', 'sinh-vien'],
          query: [{ key: 'limit', value: 'abc' }]
        }
      }
    },

    // --- E03: GET /api/v1/sinh-vien/SV999 ---
    {
      name: 'E03 - GET /api/v1/sinh-vien/SV999 (HTTP 404: Không tìm thấy sinh viên)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("E03 - Status code phải là HTTP 404 Not Found", function () {',
              '    pm.response.to.have.status(404);',
              '});',
              'pm.test("E03 - Thông báo không tìm thấy nhất quán", function () {',
              '    const json = pm.response.json();',
              '    pm.expect(json.success).to.eql(false);',
              '    pm.expect(json.status).to.eql(404);',
              '    pm.expect(json.message).to.eql("Không tìm thấy sinh viên");',
              '    pm.expect(json.data).to.be.null;',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/api/v1/sinh-vien/SV999',
          host: ['{{baseUrl}}'],
          path: ['api', 'v1', 'sinh-vien', 'SV999']
        }
      }
    },

    // --- E04: GET /duong-dan-khong-co ---
    {
      name: 'E04 - GET /duong-dan-khong-co (HTTP 404: Fallback route không tồn tại)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("E04 - Status code phải là HTTP 404 Not Found", function () {',
              '    pm.response.to.have.status(404);',
              '});',
              'pm.test("E04 - Fallback 404 chuẩn hóa: success=false, status=404", function () {',
              '    const json = pm.response.json();',
              '    pm.expect(json.success).to.eql(false);',
              '    pm.expect(json.status).to.eql(404);',
              '    pm.expect(json.message).to.eql("Không tìm thấy đường dẫn");',
              '    pm.expect(json.data).to.be.null;',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/duong-dan-khong-co',
          host: ['{{baseUrl}}'],
          path: ['duong-dan-khong-co']
        }
      }
    },

    // --- E05: Lỗi 500 mô phỏng trong development ---
    {
      name: 'E05 - GET /api/test-500-error (HTTP 500: Mô phỏng lỗi hệ thống an toàn)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("E05 - Status code phải là HTTP 500 Internal Server Error", function () {',
              '    pm.response.to.have.status(500);',
              '});',
              'pm.test("E05 - Thông điệp an toàn, không lộ SQL hay mật khẩu", function () {',
              '    const json = pm.response.json();',
              '    pm.expect(json.success).to.eql(false);',
              '    pm.expect(json.status).to.eql(500);',
              '    pm.expect(json.message).to.eql("Lỗi hệ thống, vui lòng thử lại sau");',
              '    pm.expect(json.data).to.be.null;',
              '    const raw = pm.response.text().toLowerCase();',
              '    pm.expect(raw).to.not.include("password");',
              '    pm.expect(raw).to.not.include("select ");',
              '    pm.expect(raw).to.not.include("dbo.");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/api/test-500-error',
          host: ['{{baseUrl}}'],
          path: ['api', 'test-500-error']
        }
      }
    },

    // --- E06: Chuẩn bảo mật Production (Không lộ stack trace) ---
    {
      name: 'E06 - Kiểm tra tiêu chuẩn bảo mật Production (Che giấu Stack Trace)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("E06 - HTTP status là 500 và thông báo an toàn", function () {',
              '    pm.response.to.have.status(500);',
              '    const json = pm.response.json();',
              '    pm.expect(json.message).to.eql("Lỗi hệ thống, vui lòng thử lại sau");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/api/test-500-error',
          host: ['{{baseUrl}}'],
          path: ['api', 'test-500-error']
        }
      }
    },

    // --- E07: Chế độ Development (Hỗ trợ stack trace cục bộ) ---
    {
      name: 'E07 - Kiểm tra chế độ Development (Hỗ trợ Debug cục bộ)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("E07 - Phản hồi 500 thành công trong môi trường cục bộ", function () {',
              '    pm.response.to.have.status(500);',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/api/test-500-error',
          host: ['{{baseUrl}}'],
          path: ['api', 'test-500-error']
        }
      }
    },

    // --- E08: GET /api/auth/profile thiếu token ---
    {
      name: 'E08 - GET /api/auth/profile không gửi Token (HTTP 401 Unauthorized)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("E08 - Trả về HTTP 401 Unauthorized khi thiếu Token", function () {',
              '    pm.response.to.have.status(401);',
              '    const json = pm.response.json();',
              '    pm.expect(json.success).to.eql(false);',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/api/auth/profile',
          host: ['{{baseUrl}}'],
          path: ['api', 'auth', 'profile']
        }
      }
    },

    // --- E09: Student ép DELETE bản ghi test ---
    {
      name: 'E09 - Student DELETE /api/v1/sinh-vien/SV001 (HTTP 403 Forbidden)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("E09 - Trả về HTTP 403 Forbidden từ chối quyền Sinh viên", function () {',
              '    pm.response.to.have.status(403);',
              '    const json = pm.response.json();',
              '    pm.expect(json.success).to.eql(false);',
              '    pm.expect(json.message).to.include("Admin");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'DELETE',
        header: [
          { key: 'Authorization', value: 'Bearer {{studentToken}}' }
        ],
        url: {
          raw: '{{baseUrl}}/api/v1/sinh-vien/SV001',
          host: ['{{baseUrl}}'],
          path: ['api', 'v1', 'sinh-vien', 'SV001']
        }
      }
    },

    // --- E10: Upload sai trường file ---
    {
      name: 'E10 - Upload sai trường file Avatar (HTTP 400 Bad Request)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("E10 - Bắt lỗi thiếu field avatar trả về HTTP 400", function () {',
              '    pm.expect([400, 422]).to.include(pm.response.code);',
              '    const json = pm.response.json();',
              '    pm.expect(json.success).to.eql(false);',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          { key: 'Authorization', value: 'Bearer {{adminToken}}' },
          { key: 'Content-Type', value: 'application/json' }
        ],
        body: {
          mode: 'raw',
          raw: '{\n  "saiTruong": "khong_phai_file"\n}'
        },
        url: {
          raw: '{{baseUrl}}/api/auth/me/avatar',
          host: ['{{baseUrl}}'],
          path: ['api', 'auth', 'me', 'avatar']
        }
      }
    }
  ]
};

// 3. Đường dẫn lưu file duy nhất tại backend-quan-ly-sinh-vien/postman
const outputDirBackend = path.resolve('postman');

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(outputDirBackend)) fs.mkdirSync(outputDirBackend, { recursive: true });

// Nội dung JSON format đẹp
const jsonContent = JSON.stringify(collection, null, 2);

// Ghi ra các file trong backend-quan-ly-sinh-vien/postman
fs.writeFileSync(path.join(outputDirBackend, 'Chuong8_Buoc9_postman.json'), jsonContent, 'utf8');
fs.writeFileSync(path.join(outputDirBackend, 'Chuong8_Buoc9_postman.postman_collection.json'), jsonContent, 'utf8');

console.log('✅ Đã tạo thành công file Postman Collection Lab 2 (E01 - E10) tại:');
console.log(`   📁 ${path.join(outputDirBackend, 'Chuong8_Buoc9_postman.json')}`);
console.log(`   📁 ${path.join(outputDirBackend, 'Chuong8_Buoc9_postman.postman_collection.json')}`);
console.log(`🎉 Tổng số ca kiểm thử được cấu hình: ${collection.item.length} requests (Gồm 00 Đăng nhập + E01 đến E10)`);
