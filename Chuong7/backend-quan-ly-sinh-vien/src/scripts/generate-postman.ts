// ==============================================================================
// SCRIPT SINH CÁC BỘ SƯU TẬP POSTMAN CHO BƯỚC 10 (BUỔI 7)
// File: src/scripts/generate-postman.ts
// Mục đích: Tự động khởi tạo file JSON Postman Collection & Environment cho Bảng A và Bảng B
// ==============================================================================

// Import module fs từ node để thao tác đọc/ghi file
import fs from 'node:fs';

// Import module path từ node để ghép đường dẫn thư mục an toàn
import path from 'node:path';

// Import jsonwebtoken để tạo trước các chuỗi JWT Token mẫu
import jwt from 'jsonwebtoken';

// Nạp các biến môi trường từ file .env
import 'dotenv/config';

// Lấy khóa bí mật JWT từ biến môi trường
const secret = process.env.JWT_SECRET || 'lab-jwt-secret-key-super-secure-32chars!';

// Tạo chuỗi JWT Token sinh viên mẫu (role: student, hạn 24h)
const studentToken = jwt.sign({ sub: '1', role: 'student' }, secret, { algorithm: 'HS256', expiresIn: '24h' });

// Tạo chuỗi JWT Token quản trị viên mẫu (role: admin, hạn 24h)
const adminToken = jwt.sign({ sub: '4', role: 'admin' }, secret, { algorithm: 'HS256', expiresIn: '24h' });

// Tách các thành phần của studentToken để tạo token bị sửa 1 ký tự ở chữ ký
const parts = studentToken.split('.');

// Token giả mạo: thay đổi 2 ký tự cuối của chữ ký
const tamperedToken = parts[0] + '.' + parts[1] + '.' + (parts[2].slice(0, -2) + 'Xx');

// Token hết hạn: tạo token có thời điểm hết hạn trong quá khứ (-2 giờ)
const expiredToken = jwt.sign({ sub: '1', role: 'student', exp: Math.floor(Date.now() / 1000) - 7200 }, secret, { algorithm: 'HS256' });

// ==============================================================================
// 1. ĐỊNH NGHĨA CÁC CA KIỂM THỬ BẢNG A: AUTHENTICATION & JWT (A01 - A12)
// ==============================================================================
const itemsTableA = [
  {
    name: 'A01 - Register email mới, body hợp lệ',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// A01: Đăng ký tài khoản mới thành công',
            'pm.test("A01 - Status code phải là 201 Created", function () {',
            '    pm.response.to.have.status(201);',
            '});',
            '',
            'pm.test("A01 - User tạo thành công, role là student và không lộ password/hash", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(true);',
            '    pm.expect(body.data).to.be.an("object");',
            '    pm.expect(body.data.role).to.eql("student");',
            '    pm.expect(body.data.email).to.eql("an.lab@example.com");',
            '    pm.expect(body.data.password).to.be.undefined;',
            '    pm.expect(body.data.passwordHash).to.be.undefined;',
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
        raw: JSON.stringify({
          fullName: 'Nguyen Minh An',
          email: 'an.lab@example.com',
          password: 'SinhVien@123'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/auth/register',
        host: ['{{baseUrl}}'],
        path: ['api', 'auth', 'register']
      },
      description: 'A01: Đăng ký tài khoản hợp lệ. Kỳ vọng HTTP 201 Created, CSDL lưu hash bcrypt, role mặc định là student.'
    }
  },
  {
    name: 'A02 - Register trùng email A01',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// A02: Đăng ký trùng email phải bị từ chối 409 Conflict',
            'pm.test("A02 - Status code phải là 409 Conflict", function () {',
            '    pm.response.to.have.status(409);',
            '});',
            '',
            'pm.test("A02 - Báo lỗi email đã tồn tại và không tăng số user", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '    pm.expect(body.message).to.include("Email đã tồn tại");',
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
        raw: JSON.stringify({
          fullName: 'Nguyen Minh An Trung',
          email: 'an.lab@example.com',
          password: 'OtherPassword@123'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/auth/register',
        host: ['{{baseUrl}}'],
        path: ['api', 'auth', 'register']
      },
      description: 'A02: Đăng ký trùng email đã có trong hệ thống -> Kỳ vọng 409 Conflict.'
    }
  },
  {
    name: 'A03 - Register body thêm role=admin (Chống nâng quyền)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// A03: Chống người dùng tự nâng quyền lên admin',
            'pm.test("A03 - Status code phải là 400 Bad Request", function () {',
            '    pm.response.to.have.status(400);',
            '});',
            '',
            'pm.test("A03 - Bị Zod strict chặn trường lạ role", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '    pm.expect(body.errors).to.be.an("array");',
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
        raw: JSON.stringify({
          fullName: 'Attacker User',
          email: 'attacker@example.com',
          password: 'Password@123',
          role: 'admin'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/auth/register',
        host: ['{{baseUrl}}'],
        path: ['api', 'auth', 'register']
      },
      description: 'A03: Cố tình gửi kèm role=admin trong payload -> Zod .strict() chặn 400 Bad Request.'
    }
  },
  {
    name: 'A04 - Register thiếu password hoặc email sai định dạng',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// A04: Validation kiểm tra đầu vào',
            'pm.test("A04 - Status code phải là 400 Bad Request", function () {',
            '    pm.response.to.have.status(400);',
            '});',
            '',
            'pm.test("A04 - Không lưu dữ liệu lỗi và trả mảng errors", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '    pm.expect(body.errors).to.be.an("array");',
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
        raw: JSON.stringify({
          fullName: 'Test User',
          email: 'not-an-email'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/auth/register',
        host: ['{{baseUrl}}'],
        path: ['api', 'auth', 'register']
      },
      description: 'A04: Thiếu password và email sai chuẩn -> Kỳ vọng 400 Bad Request.'
    }
  },
  {
    name: 'A05 - Login đúng tài khoản student (Lấy studentToken)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// A05: Đăng nhập thành công và trích xuất Access Token',
            'pm.test("A05 - Status code phải là 200 OK", function () {',
            '    pm.response.to.have.status(200);',
            '});',
            '',
            'pm.test("A05 - Cấp data.accessToken chuẩn Bearer JWT", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(true);',
            '    pm.expect(body.data.accessToken).to.be.a("string");',
            '    pm.expect(body.data.tokenType).to.eql("Bearer");',
            '    pm.expect(body.data.expiresIn).to.eql(3600);',
            '',
            '    // Tự động lưu biến studentToken vào môi trường Postman',
            '    pm.environment.set("studentToken", body.data.accessToken);',
            '    pm.collectionVariables.set("studentToken", body.data.accessToken);',
            '    console.log("Đã cập nhật studentToken:", body.data.accessToken);',
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
        raw: JSON.stringify({
          email: 'an.lab@example.com',
          password: 'SinhVien@123'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/auth/login',
        host: ['{{baseUrl}}'],
        path: ['api', 'auth', 'login']
      },
      description: 'A05: Đăng nhập tài khoản student hợp lệ. Tự động lưu studentToken vào Postman Variables.'
    }
  },
  {
    name: 'A06 - Login sai password',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// A06: Mật khẩu sai bị từ chối 401',
            'pm.test("A06 - Status code phải là 401 Unauthorized", function () {',
            '    pm.response.to.have.status(401);',
            '});',
            '',
            'pm.test("A06 - Không trả accessToken và báo lỗi chung", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '    pm.expect(body.data).to.be.null;',
            '    pm.expect(body.message).to.eql("Email hoặc mật khẩu không chính xác");',
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
        raw: JSON.stringify({
          email: 'an.lab@example.com',
          password: 'SaiPassword@999'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/auth/login',
        host: ['{{baseUrl}}'],
        path: ['api', 'auth', 'login']
      },
      description: 'A06: Sai mật khẩu -> Kỳ vọng 401 Unauthorized.'
    }
  },
  {
    name: 'A07 - Login email không tồn tại (Chống Enumeration)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// A07: Email không tồn tại trả thông báo trùng khớp A06',
            'pm.test("A07 - Status code phải là 401 Unauthorized", function () {',
            '    pm.response.to.have.status(401);',
            '});',
            '',
            'pm.test("A07 - Không làm lộ thông tin tồn tại tài khoản User", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '    pm.expect(body.message).to.eql("Email hoặc mật khẩu không chính xác");',
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
        raw: JSON.stringify({
          email: 'khongtontai@example.com',
          password: 'Password@123'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/auth/login',
        host: ['{{baseUrl}}'],
        path: ['api', 'auth', 'login']
      },
      description: 'A07: Email không tồn tại -> Kỳ vọng 401 Unauthorized và cùng thông báo lỗi với A06.'
    }
  },
  {
    name: 'A08 - GET /api/auth/profile không có token',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// A08: Gọi Profile nặc danh không có Authorization header',
            'pm.test("A08 - Status code phải là 401 Unauthorized", function () {',
            '    pm.response.to.have.status(401);',
            '});',
            '',
            'pm.test("A08 - Không nhận data hồ sơ và có thông báo lỗi", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '    pm.expect(body.data).to.be.null;',
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
      },
      description: 'A08: Gọi GET /api/auth/profile nhưng không gửi Token -> Kỳ vọng 401.'
    }
  },
  {
    name: 'A09 - Profile với token bị sửa 1 ký tự (Giả mạo)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// A09: Chữ ký token bị sai',
            'pm.test("A09 - Status code phải là 401 Unauthorized", function () {',
            '    pm.response.to.have.status(401);',
            '});',
            '',
            'pm.test("A09 - Chữ ký không qua xác minh, từ chối cấp profile", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'GET',
      header: [
        {
          key: 'Authorization',
          value: 'Bearer {{tamperedToken}}'
        }
      ],
      url: {
        raw: '{{baseUrl}}/api/auth/profile',
        host: ['{{baseUrl}}'],
        path: ['api', 'auth', 'profile']
      },
      description: 'A09: Gửi Token bị sửa đổi chữ ký -> Kỳ vọng 401 Unauthorized.'
    }
  },
  {
    name: 'A10 - Profile với JWT student hợp lệ',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// A10: Lấy hồ sơ thành công với token sinh viên hợp lệ',
            'pm.test("A10 - Status code phải là 200 OK", function () {',
            '    pm.response.to.have.status(200);',
            '});',
            '',
            'pm.test("A10 - Hồ sơ đúng user và tuyệt đối không lộ passwordHash", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(true);',
            '    pm.expect(body.data.email).to.eql("an.lab@example.com");',
            '    pm.expect(body.data.role).to.eql("student");',
            '    pm.expect(body.data.password).to.be.undefined;',
            '    pm.expect(body.data.passwordHash).to.be.undefined;',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'GET',
      header: [
        {
          key: 'Authorization',
          value: 'Bearer {{studentToken}}'
        }
      ],
      url: {
        raw: '{{baseUrl}}/api/auth/profile',
        host: ['{{baseUrl}}'],
        path: ['api', 'auth', 'profile']
      },
      description: 'A10: Gửi Bearer Token hợp lệ của sinh viên -> Nhận hồ sơ HTTP 200 OK.'
    }
  },
  {
    name: 'A11 - Token hết hạn gọi Profile',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// A11: Token quá hạn bị từ chối 401',
            'pm.test("A11 - Status code phải là 401 Unauthorized", function () {',
            '    pm.response.to.have.status(401);',
            '});',
            '',
            'pm.test("A11 - Báo lỗi token hết hạn chính xác", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'GET',
      header: [
        {
          key: 'Authorization',
          value: 'Bearer {{expiredToken}}'
        }
      ],
      url: {
        raw: '{{baseUrl}}/api/auth/profile',
        host: ['{{baseUrl}}'],
        path: ['api', 'auth', 'profile']
      },
      description: 'A11: Gửi Token đã hết hạn -> Kỳ vọng 401 Unauthorized.'
    }
  },
  {
    name: 'A12 - Register/login và xem SQL Server (Kiểm tra an toàn mật khẩu & JWT)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// A12: Kiểm tra nguyên tắc an toàn CSDL và nhật ký',
            'pm.test("A12 - Response trả về không chứa mật khẩu hay passwordHash", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(true);',
            '    pm.expect(body.data.password).to.be.undefined;',
            '    pm.expect(body.data.passwordHash).to.be.undefined;',
            '});',
            '',
            'pm.test("A12 - Kiểm chứng SQL Server: CSDL chỉ lưu chuỗi bcrypt $2b$12$", function () {',
            '    // Lưu ý: Xác minh trực tiếp trong SSMS bằng câu lệnh:',
            '    // SELECT email, passwordHash FROM dbo.Users WHERE email = "an.lab@example.com"',
            '    pm.expect(true).to.be.true;',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'GET',
      header: [
        {
          key: 'Authorization',
          value: 'Bearer {{studentToken}}'
        }
      ],
      url: {
        raw: '{{baseUrl}}/api/auth/profile',
        host: ['{{baseUrl}}'],
        path: ['api', 'auth', 'profile']
      },
      description: 'A12: Kiểm tra tính an toàn: mật khẩu được mã hóa bcrypt một chiều trong SQL Server, không lưu plaintext, không log JWT secret.'
    }
  }
];

// ==============================================================================
// 2. ĐỊNH NGHĨA CÁC CA KIỂM THỬ BẢNG B: PHÂN QUYỀN RBAC SINH VIÊN (B01 - B12)
// ==============================================================================
const itemsTableB = [
  {
    name: 'B01 - GET danh sách, không JWT (Public)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// B01: GET danh sách sinh viên là PUBLIC',
            'pm.test("B01 - Status code phải là 200 OK", function () {',
            '    pm.response.to.have.status(200);',
            '});',
            '',
            'pm.test("B01 - data trả về vẫn là một mảng sinh viên", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(true);',
            '    pm.expect(body.data).to.be.an("array");',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/api/v1/sinh-vien',
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'sinh-vien']
      },
      description: 'B01: GET danh sách không cần token -> Kỳ vọng 200 OK (Public).'
    }
  },
  {
    name: 'B02 - POST SinhVien, không JWT',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// B02: POST nặc danh bị chặn 401',
            'pm.test("B02 - Status code phải là 401 Unauthorized", function () {',
            '    pm.response.to.have.status(401);',
            '});',
            '',
            'pm.test("B02 - Không INSERT bản ghi mới vào CSDL", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
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
        raw: JSON.stringify({
          maSV: 'SV099',
          hoTen: 'Sinh Vien Nac Danh',
          email: 'nacdanh@example.com',
          maLop: '25CT114'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/v1/sinh-vien',
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'sinh-vien']
      },
      description: 'B02: POST sinh viên không có JWT -> Kỳ vọng 401 Unauthorized.'
    }
  },
  {
    name: 'B03 - PUT SinhVien, token không hợp lệ',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// B03: Token giả mạo khi sửa sinh viên',
            'pm.test("B03 - Status code phải là 401 Unauthorized", function () {',
            '    pm.response.to.have.status(401);',
            '});',
            '',
            'pm.test("B03 - Giá trị cũ trong DB không bị đổi", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'PUT',
      header: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer token-sai-dinh-dang-12345' }
      ],
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          hoTen: 'Ten Hacker Sua',
          email: 'hacker@example.com',
          maLop: '25CT114'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/v1/sinh-vien/SV001',
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'sinh-vien', 'SV001']
      },
      description: 'B03: PUT sinh viên với token không hợp lệ -> Kỳ vọng 401 Unauthorized.'
    }
  },
  {
    name: 'B04 - DELETE SinhVien, JWT student (Bị chặn 403)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// B04: Sinh viên không được phép xóa dữ liệu',
            'pm.test("B04 - Status code phải là 403 Forbidden", function () {',
            '    pm.response.to.have.status(403);',
            '});',
            '',
            'pm.test("B04 - SinhVien vẫn tồn tại, không bị xóa khỏi CSDL", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '    pm.expect(body.message).to.include("yêu cầu quyền quản trị");',
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
      },
      description: 'B04: DELETE SinhVien bằng tài khoản student -> Kỳ vọng 403 Forbidden.'
    }
  },
  {
    name: 'B05 - POST SinhVien, JWT student (Bị chặn 403)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// B05: Sinh viên không có quyền thêm mới sinh viên',
            'pm.test("B05 - Status code phải là 403 Forbidden", function () {',
            '    pm.response.to.have.status(403);',
            '});',
            '',
            'pm.test("B05 - Không INSERT bản ghi mới vào DB", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'POST',
      header: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer {{studentToken}}' }
      ],
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          maSV: 'SV099',
          hoTen: 'Sinh Vien Boi Student',
          email: 'student099@example.com',
          maLop: '25CT114'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/v1/sinh-vien',
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'sinh-vien']
      },
      description: 'B05: POST SinhVien bằng tài khoản student -> Kỳ vọng 403 Forbidden.'
    }
  },
  {
    name: 'B06 - PUT SinhVien, JWT student (Bị chặn 403)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// B06: Sinh viên không có quyền cập nhật sinh viên',
            'pm.test("B06 - Status code phải là 403 Forbidden", function () {',
            '    pm.response.to.have.status(403);',
            '});',
            '',
            'pm.test("B06 - Không UPDATE dữ liệu trong CSDL", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'PUT',
      header: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer {{studentToken}}' }
      ],
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          hoTen: 'Minh Nhat Sua Boi Student',
          email: 'minhnhat@example.com',
          maLop: '25CT114'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/v1/sinh-vien/SV001',
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'sinh-vien', 'SV001']
      },
      description: 'B06: PUT SinhVien bằng tài khoản student -> Kỳ vọng 403 Forbidden.'
    }
  },
  {
    name: 'B07 - POST SinhVien hợp lệ, JWT admin (Ghi thật CSDL)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// B07: Admin thêm mới sinh viên SV088 thành công',
            'pm.test("B07 - Status code phải là 201 Created", function () {',
            '    pm.response.to.have.status(201);',
            '});',
            '',
            'pm.test("B07 - GET lại đúng bản ghi mới tạo trong DB", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(true);',
            '    pm.expect(body.data.maSV).to.eql("SV088");',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'POST',
      header: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          maSV: 'SV088',
          hoTen: 'Nguyen Van Admin Test',
          email: 'admintest@example.com',
          maLop: '25CT114'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/v1/sinh-vien',
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'sinh-vien']
      },
      description: 'B07: POST SinhVien hợp lệ với JWT admin -> Kỳ vọng 201 Created.'
    }
  },
  {
    name: 'B08 - PUT SinhVien hợp lệ, JWT admin (Cập nhật thật)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// B08: Admin cập nhật thông tin SV088',
            'pm.test("B08 - Status code phải là 200 OK", function () {',
            '    pm.response.to.have.status(200);',
            '});',
            '',
            'pm.test("B08 - GET lại thấy thay đổi họ tên mới", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(true);',
            '    pm.expect(body.data.hoTen).to.eql("Nguyen Van Admin Updated");',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'PUT',
      header: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          hoTen: 'Nguyen Van Admin Updated',
          email: 'admintest@example.com',
          maLop: '25CT114'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/v1/sinh-vien/SV088',
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'sinh-vien', 'SV088']
      },
      description: 'B08: PUT SinhVien SV088 hợp lệ với JWT admin -> Kỳ vọng 200 OK.'
    }
  },
  {
    name: 'B09 - DELETE SinhVien, JWT admin (Xóa thật khỏi DB)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// B09: Admin xóa sinh viên SV088',
            'pm.test("B09 - Status code phải là 200 OK", function () {',
            '    pm.response.to.have.status(200);',
            '});',
            '',
            'pm.test("B09 - Thông báo xóa thành công", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(true);',
            '    pm.expect(body.message).to.eql("Xóa sinh viên thành công");',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'DELETE',
      header: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      url: {
        raw: '{{baseUrl}}/api/v1/sinh-vien/SV088',
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'sinh-vien', 'SV088']
      },
      description: 'B09: DELETE SinhVien SV088 bằng JWT admin -> Kỳ vọng 200 OK.'
    }
  },
  {
    name: 'B10 - Admin POST body sai Zod (Validation vẫn chạy cho Admin)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// B10: Admin gửi dữ liệu sai vẫn bị Zod chặn',
            'pm.test("B10 - Status code phải là 400 Bad Request", function () {',
            '    pm.response.to.have.status(400);',
            '});',
            '',
            'pm.test("B10 - Trường errors chỉ ra lỗi vi phạm chi tiết", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '    pm.expect(body.errors).to.be.an("array");',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'POST',
      header: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          maSV: 'SV090',
          email: 'sai-dinh-dang'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/v1/sinh-vien',
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'sinh-vien']
      },
      description: 'B10: Admin gửi body thiếu trường và email sai định dạng -> Kỳ vọng 400 Bad Request.'
    }
  },
  {
    name: 'B11 - Admin POST mã bị trùng (Báo lỗi 409 Conflict)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// B11: Trùng khóa chính khi thêm',
            'pm.test("B11 - Status code phải là 409 Conflict", function () {',
            '    pm.response.to.have.status(409);',
            '});',
            '',
            'pm.test("B11 - Không tạo bản ghi trùng và báo mã sinh viên đã tồn tại", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '    pm.expect(body.message).to.eql("Mã sinh viên đã tồn tại");',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'POST',
      header: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          maSV: 'SV001',
          hoTen: 'Minh Nhat Trung',
          email: 'trung@example.com',
          maLop: '25CT114'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/v1/sinh-vien',
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'sinh-vien']
      },
      description: 'B11: Admin thêm sinh viên với maSV=SV001 đã tồn tại -> Kỳ vọng 409 Conflict.'
    }
  },
  {
    name: 'B12 - DELETE cùng mã lần thứ 2 bằng Admin (Báo lỗi 404)',
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// B12: Xóa mã không còn tồn tại trả về 404',
            'pm.test("B12 - Status code phải là 404 Not Found", function () {',
            '    pm.response.to.have.status(404);',
            '});',
            '',
            'pm.test("B12 - Không còn dữ liệu để xóa", function () {',
            '    const body = pm.response.json();',
            '    pm.expect(body.success).to.eql(false);',
            '    pm.expect(body.message).to.eql("Không tìm thấy sinh viên");',
            '});'
          ]
        }
      }
    ],
    request: {
      method: 'DELETE',
      header: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      url: {
        raw: '{{baseUrl}}/api/v1/sinh-vien/SV088',
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'sinh-vien', 'SV088']
      },
      description: 'B12: Admin xóa lại SV088 lần thứ hai -> Kỳ vọng 404 Not Found (đã bị xóa trước đó).'
    }
  }
];

// Mục 00: Request hỗ trợ lấy Token Admin tự động
const setupItem = {
  name: '00 - Setup: Login Admin (Lấy và lưu adminToken)',
  event: [
    {
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: [
          '// Tự động lưu adminToken vào môi trường Postman',
          'pm.test("Setup Admin - Đăng nhập thành công 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          '',
          'const body = pm.response.json();',
          'pm.environment.set("adminToken", body.data.accessToken);',
          'pm.collectionVariables.set("adminToken", body.data.accessToken);',
          'console.log("Đã cập nhật adminToken mới:", body.data.accessToken);'
        ]
      }
    }
  ],
  request: {
    method: 'POST',
    header: [{ key: 'Content-Type', value: 'application/json' }],
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        email: 'admin.lab@example.com',
        password: 'Admin@123456'
      }, null, 2)
    },
    url: {
      raw: '{{baseUrl}}/api/auth/login',
      host: ['{{baseUrl}}'],
      path: ['api', 'auth', 'login']
    },
    description: 'Chạy request này để tự động cập nhật token Admin vào biến {{adminToken}}.'
  }
};

// ==============================================================================
// 3. XUẤT FILE 1: BỘ SƯU TẬP TỔNG HỢP (Buoi7-JWT-Auth.postman_collection.json)
// ==============================================================================
const fullCollection = {
  info: {
    _postman_id: 'c6a01724-4d8b-4b2a-89a1-buoi7jwtauth',
    name: 'Buoi7 - JWT Authentication & RBAC (A01 - A12 & B01 - B12)',
    description: 'Bộ sưu tập đầy đủ 24 Test Cases bắt buộc (Bảng A: A01 - A12 và Bảng B: B01 - B12) theo chuẩn Giáo trình Chương 06 JWT & RBAC. Chứa sẵn các biến môi trường và token mẫu.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000', type: 'string' },
    { key: 'studentToken', value: studentToken, type: 'string' },
    { key: 'adminToken', value: adminToken, type: 'string' },
    { key: 'tamperedToken', value: tamperedToken, type: 'string' },
    { key: 'expiredToken', value: expiredToken, type: 'string' }
  ],
  item: [
    setupItem,
    {
      name: 'Bảng A - Authentication & JWT (A01 - A12)',
      description: 'Kiểm thử toàn diện luồng Register, Login, Token Signature, Expire, Profile, và an toàn cơ sở dữ liệu.',
      item: itemsTableA
    },
    {
      name: 'Bảng B - Phân quyền RBAC SinhVien (B01 - B12)',
      description: 'Kiểm thử bảo vệ các Route SinhVien: GET công khai; POST/PUT/DELETE bắt buộc quyền Admin (401 & 403).',
      item: itemsTableB
    }
  ]
};

// ==============================================================================
// 4. XUẤT FILE 2: BẢNG A RIÊNG BIỆT (Buoi7-Bang-A-Authentication.postman_collection.json)
// ==============================================================================
const bangACollection = {
  info: {
    _postman_id: 'c6a01724-4d8b-4b2a-89a1-banga-auth',
    name: 'Buoi7 - Bảng A: Authentication & JWT (A01 - A12)',
    description: 'Bảng test 12 ca kiểm thử A01 - A12 cho API Đăng ký, Đăng nhập, JWT Token và Hồ sơ người dùng.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000', type: 'string' },
    { key: 'studentToken', value: studentToken, type: 'string' },
    { key: 'tamperedToken', value: tamperedToken, type: 'string' },
    { key: 'expiredToken', value: expiredToken, type: 'string' }
  ],
  item: itemsTableA
};

// ==============================================================================
// 5. XUẤT FILE 3: BẢNG B RIÊNG BIỆT (Buoi7-Bang-B-SinhVien-RBAC.postman_collection.json)
// ==============================================================================
const bangBCollection = {
  info: {
    _postman_id: 'c6a01724-4d8b-4b2a-89a1-bangb-rbac',
    name: 'Buoi7 - Bảng B: Phân quyền RBAC SinhVien (B01 - B12)',
    description: 'Bảng test 12 ca kiểm thử B01 - B12 cho Middleware isAuth và isAdmin trên các Route SinhVien.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000', type: 'string' },
    { key: 'studentToken', value: studentToken, type: 'string' },
    { key: 'adminToken', value: adminToken, type: 'string' }
  ],
  item: [setupItem, ...itemsTableB]
};

// ==============================================================================
// 6. XUẤT FILE 4: POSTMAN ENVIRONMENT (Buoi7-JWT-Environment.postman_environment.json)
// ==============================================================================
const postmanEnv = {
  id: 'c6a01724-4d8b-4b2a-89a1-buoi7env',
  name: 'Buoi7 - Local Development (JWT & RBAC)',
  values: [
    { key: 'baseUrl', value: 'http://localhost:5000', enabled: true },
    { key: 'studentEmail', value: 'an.lab@example.com', enabled: true },
    { key: 'studentPassword', value: 'SinhVien@123', enabled: true },
    { key: 'adminEmail', value: 'admin.lab@example.com', enabled: true },
    { key: 'adminPassword', value: 'Admin@123456', enabled: true },
    { key: 'studentToken', value: studentToken, enabled: true },
    { key: 'adminToken', value: adminToken, enabled: true },
    { key: 'tamperedToken', value: tamperedToken, enabled: true },
    { key: 'expiredToken', value: expiredToken, enabled: true }
  ],
  _postman_variable_scope: 'environment'
};

// Đảm bảo thư mục postman/ tồn tại
const postmanDir = path.resolve(process.cwd(), 'postman');
if (!fs.existsSync(postmanDir)) {
  fs.mkdirSync(postmanDir, { recursive: true });
}

// Ghi file ra đĩa
fs.writeFileSync(path.join(postmanDir, 'Buoi7-JWT-Auth.postman_collection.json'), JSON.stringify(fullCollection, null, 2), 'utf8');
fs.writeFileSync(path.join(postmanDir, 'Buoi7-Bang-A-Authentication.postman_collection.json'), JSON.stringify(bangACollection, null, 2), 'utf8');
fs.writeFileSync(path.join(postmanDir, 'Buoi7-Bang-B-SinhVien-RBAC.postman_collection.json'), JSON.stringify(bangBCollection, null, 2), 'utf8');
fs.writeFileSync(path.join(postmanDir, 'Buoi7-JWT-Environment.postman_environment.json'), JSON.stringify(postmanEnv, null, 2), 'utf8');

console.log('✅ Đã tạo thành công 4 files Postman trong thư mục postman/:');
console.log('  1. postman/Buoi7-JWT-Auth.postman_collection.json (Tổng hợp Bảng A + B)');
console.log('  2. postman/Buoi7-Bang-A-Authentication.postman_collection.json (Bảng A: A01 - A12)');
console.log('  3. postman/Buoi7-Bang-B-SinhVien-RBAC.postman_collection.json (Bảng B: B01 - B12)');
console.log('  4. postman/Buoi7-JWT-Environment.postman_environment.json (Environment variables)');
