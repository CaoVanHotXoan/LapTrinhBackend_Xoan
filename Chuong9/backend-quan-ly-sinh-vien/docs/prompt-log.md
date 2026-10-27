# Prompt Log - Buổi 5: RESTful CRUD & Swagger

## 1. Nhật ký Prompt: Bước 0 - Đọc hiểu dự án
- **Khung CTCO**:
  - **Context (Bối cảnh)**: Dự án Backend Quản lý sinh viên sử dụng Node.js, Express, TypeScript, Sequelize và SQL Server.
  - **Task (Nhiệm vụ)**: Đọc hiểu cấu trúc project, kiểm tra kết nối DB và phân tích luồng request `GET`.
  - **Constraint (Ràng buộc)**: Giữ nguyên kiến trúc hiện tại, không tạo Express App thứ hai, không lộ mật khẩu `.env`.
  - **Output (Đầu ra)**: Bảng phân tích: File - Trách nhiệm - Việc cần làm.
- **Prompt đã sử dụng**:
  > Tôi đang tiếp tục project quản lý sinh viên bằng Express và TypeScript. Hãy đọc các file Route, Controller, Service, server.ts, package.json và tsconfig.json. Chỉ ra đường đi của request GET và xác định file cần sửa để thêm PUT và DELETE. Trình bày thành bảng: file - trách nhiệm - việc cần làm.

---

## 2. Nhật ký Prompt: Bước 1 - Bổ sung API PUT
- **Nhiệm vụ**: Bổ sung chức năng `PUT /api/v1/sinh-vien/:maSV`
- **Bối cảnh và file đã đưa cho AI**: `src/routes/sinhVien.routes.ts`, `src/controllers/sinhVien.controller.ts`, `src/services/sinhVien.service.ts`, `src/repositories/sinhVien.repository.ts`, `src/dtos/sinhVien.dto.ts`.
- **Prompt do tôi viết (theo khung CTCO)**:
  > Tôi đang làm dự án quản lý sinh viên bằng Express và TypeScript theo kiến trúc Route -> Controller -> Service -> Repository. Hãy bổ sung PUT /api/v1/sinh-vien/:maSV:
  > 1. Lấy maSV từ URL, body có đủ hoTen, email, maLop.
  > 2. Body sai trả 400, không có mã trả 404, thành công trả 200.
  > 3. Giữ nguồn dữ liệu SQL Server và kiến trúc hiện tại.
  > Chỉ ra file cần sửa, cung cấp code và giải thích luồng xử lý.
- **AI đề xuất thay đổi**:
  - Thêm `ISinhVienUpdateDTO` trong `sinhVien.dto.ts`.
  - Thêm hàm `update` trong `sinhVien.repository.ts`.
  - Thêm logic validation (kiểm tra kiểu, regex email, độ dài cột, kiểm tra tồn tại 404) trong `sinhVien.service.ts`.
  - Thêm controller `capNhatSinhVien` trong `sinhVien.controller.ts`.
  - Đăng ký route `router.put('/:maSV', capNhatSinhVien)` trong `sinhVien.routes.ts`.
- **Build thực tế**: `pnpm build` biên dịch thành công 0 lỗi.
- **Test T06/T07/T08**:
  - `T06 (PUT SV003 hợp lệ)`: expected 200; actual 200 (PASS).
  - `T07 (PUT SV003 thiếu email)`: expected 400; actual 400 (PASS).
  - `T08 (PUT SV9999)`: expected 404; actual 404 (PASS).
- **Cách tôi xác nhận dữ liệu**: Sau khi PUT thành công, thực hiện `GET /api/v1/sinh-vien/SV003` để kiểm chứng dữ liệu cột `hoTen` trong CSDL đã thực sự được đổi thành `Ngọc Mai Updated`.
- **Tôi giải thích được điều gì**:
  - `maSV` phải lấy từ URL param (`req.params`), không được ghi đè từ body.
  - Tầng Service chịu trách nhiệm toàn bộ logic kiểm tra hợp lệ dữ liệu trước khi đẩy xuống Repository.


---

## 3. Nhật ký Prompt: Bước 2 - Bổ sung API DELETE
- **Nhiệm vụ**: Bổ sung chức năng `DELETE /api/v1/sinh-vien/:maSV`
- **Prompt do tôi viết**:
  > Tiếp tục project trên. Hãy bổ sung DELETE /api/v1/sinh-vien/:maSV.
  > 1. Lấy maSV từ URL và xóa qua Service hiện có.
  > 2. Không tìm thấy trả 404; xóa thành công trả 200 với thông báo {"success": true, "message": "Xóa sinh viên thành công"}.
  > 3. Không thay đổi các API khác và không tạo nguồn dữ liệu mới.
- **File / đoạn code đã đọc và sửa**:
  - `src/repositories/sinhVien.repository.ts`: thêm hàm `delete` gọi `record.destroy()`.
  - `src/services/sinhVien.service.ts`: thêm hàm `xoaSinhVien` kiểm tra tồn tại trước khi xóa.
  - `src/controllers/sinhVien.controller.ts`: thêm `xoaSinhVien` trả về HTTP 200 (không trả trường `data`).
  - `src/routes/sinhVien.routes.ts`: đăng ký `router.delete('/:maSV', xoaSinhVien)`.
- **Test T10/T11/T12**:
  - `T10 (DELETE SV003)`: expected 200; actual 200 (PASS).
  - `T11 (GET SV003 sau xóa)`: expected 404; actual 404 (PASS).
  - `T12 (DELETE lại SV003 lần 2)`: expected 404; actual 404 (PASS).

---

## 4. Nhật ký Prompt: Bước 4, 5 & 6 - Swagger UI & OpenAPI Specification
- **Prompt đã viết**:
  > Dự án Express + TypeScript của tôi đã có 5 API CRUD sinh viên. Hãy tạo docs/openapi.yaml chuẩn OpenAPI 3.0.3 mô tả GET list, GET detail, POST, PUT, DELETE có đầy đủ tham số maSV, requestBody, schema và status code phù hợp. Tái dùng components/$ref; không dùng JSDoc. Sau đó cấu hình Swagger UI tại /api-docs đọc YAML bằng js-yaml.
- **Kết quả**: File `docs/openapi.yaml` tạo chuẩn xác, giao diện Swagger UI hoạt động tại `http://localhost:5000/api-docs`.

---

## 5. Bài tự viết Prompt theo CTCO (Tính năng mở rộng: Tìm kiếm sinh viên theo lớp)

### Giải thích lý do chọn Endpoint:
- **Endpoint đề xuất**: `GET /api/v1/sinh-vien/lop/:maLop`
- **Lý do**:
  1. Đây là thao tác **đọc dữ liệu (Read)** nên bắt buộc dùng phương thức **GET** (đảm bảo tính An toàn - Safe & Idempotent).
  2. Đường dẫn tường minh phân cấp tài nguyên: tài nguyên `sinh-vien` được lọc theo `lop/:maLop`, tránh xung đột với route `GET /:maSV`.

### Prompt hoàn chỉnh theo khung CTCO:
> **[Context]**: Tôi đang phát triển dự án Backend Quản lý sinh viên bằng Node.js, Express, TypeScript, Sequelize và SQL Server theo kiến trúc phân tầng Route -> Controller -> Service -> Repository.
> 
> **[Task]**: Hãy bổ sung API tìm kiếm danh sách sinh viên theo mã lớp: `GET /api/v1/sinh-vien/lop/:maLop`.
> 
> **[Constraint]**:
> - Tham số `maLop` lấy từ URL params, kiểm tra không được để rỗng.
> - Truy vấn CSDL bằng Sequelize `findAll({ where: { maLop } })`.
> - Nếu tìm thấy sinh viên, trả về HTTP 200 kèm danh sách sinh viên. Nếu không có sinh viên nào thuộc lớp này, trả về HTTP 200 kèm mảng rỗng `[]`.
> - Giữ nguyên kiến trúc hiện tại, không làm hỏng 5 API CRUD đã có.
> 
> **[Output]**: Chỉ rõ các file cần sửa (`routes`, `controllers`, `services`, `repositories`), cung cấp code có chú thích tiếng Việt và hướng dẫn cách viết test case trên Postman.

---

## 6. Trả lời 4 câu hỏi trọng tâm của Giảng viên

### Câu 1: Trong prompt của bạn, đâu là Context? Task? Constraint? Output?
- **Context**: Cung cấp thông tin nền tảng về công nghệ và cấu trúc dự án (Node.js, Express, TypeScript, kiến trúc 4 tầng, SQL Server/Sequelize).
- **Task**: Mô tả công việc cụ thể cần AI thực hiện (bổ sung API PUT / DELETE / Tìm kiếm).
- **Constraint**: Các giới hạn và quy tắc bắt buộc AI phải tuân thủ (mã HTTP status code, format response JSON, không đổi nguồn dữ liệu, validate dữ liệu).
- **Output**: Định dạng kết quả mong muốn nhận được (code kèm chú thích tiếng Việt, giải thích luồng, bảng test).

### Câu 2: AI đã đổi những file nào? Vì sao không nên viết truy vấn DB ở Route?
- **Các file đã đổi**: `dtos/sinhVien.dto.ts`, `repositories/sinhVien.repository.ts`, `services/sinhVien.service.ts`, `controllers/sinhVien.controller.ts`, `routes/sinhVien.routes.ts`, `config/swagger.config.ts`, `server.ts`.
- **Vì sao không viết truy vấn DB ở Route**:
  - Route chỉ làm nhiệm vụ **định tuyến (Routing)** URL và HTTP method tới controller tương ứng.
  - Viết truy vấn DB trực tiếp ở Route làm vi phạm nguyên lý **Đơn trách nhiệm (Single Responsibility Principle)**, khiến mã nguồn bị rối, khó bảo trì, không tái sử dụng được logic nghiệp vụ và cực kỳ khó khăn khi viết Unit Test.

### Câu 3: Mã HTTP 400, 404, 409 khác nhau ra sao?
- **`400 Bad Request`**: Lỗi do dữ liệu client gửi lên không hợp lệ (sai kiểu dữ liệu, thiếu trường bắt buộc, sai định dạng regex email).
- **`404 Not Found`**: Lỗi không tìm thấy tài nguyên trên server (mã sinh viên không tồn tại trong CSDL hoặc đường dẫn URL sai).
- **`409 Conflict`**: Lỗi xung đột trạng thái dữ liệu (cố tình thêm mới một bản ghi có khóa chính `maSV` đã tồn tại trong CSDL).

### Câu 4: Test nào chứng minh dữ liệu đã ghi thật, không chỉ trả response đẹp?
- **Test chứng minh**: Thực hiện **`GET` lại ngay sau thao tác ghi**:
  - `POST` tạo mới `SV003` . Gọi `GET /api/v1/sinh-vien/SV003` đọc được đúng `SV003` trong DB.
  - `PUT` sửa tên  Gọi `GET /api/v1/sinh-vien/SV003` đọc được đúng tên mới `Ngọc Mai Updated`.
  - `DELETE` xóa . Gọi `GET /api/v1/sinh-vien/SV003` nhận được mã `404 Not Found`.
- Ngoài ra, việc restart server rồi `GET` lại vẫn thấy dữ liệu (nhờ SQL Server) là minh chứng dữ liệu được lưu bền vững (Persistent Data).

---

# Prompt Log - Chương 06 (Buổi 07): Authentication & Authorization (JWT & RBAC)

## 7. Nhật ký Prompt: Bước 0 - Khảo sát dự án trước khi code
- **Khung CTCO**:
  - **Context (C)**: Tôi tiếp tục project quản lý sinh viên sau Chương 05, dùng Express, TypeScript, pnpm, SQL Server + Sequelize; có Zod, Morgan và docs/openapi.yaml.
  - **Task (T)**: Đọc các file cung cấp; mô tả luồng Request hiện tại, cách DB kết nối và các vị trí nên thêm register/login, JWT Middleware.
  - **Constraint (C)**: Chưa sửa hay tạo file mới, không tạo project mới, không đoán nội dung file thiếu, không yêu cầu mật khẩu hoặc toàn bộ .env.
  - **Output (O)**: Bảng "file / đang làm gì / cần giữ hay sửa / lý do" và danh sách thông tin còn thiếu trước khi triển khai.
- **Kết quả khảo sát**:
  - `node -v`: `v24.21.0`, `pnpm -v`: `10.34.6`.
  - `pnpm build`: Biên dịch TypeScript thành công 100%, không phát sinh lỗi.
  - Kết nối CSDL SQL Server qua Sequelize hoạt động tốt (`DB connected: QuanLySinhVienDB`).
  - Toàn bộ 5 API CRUD sinh viên, Zod validation và Swagger UI tại `/api-docs` đang hoạt động ổn định.

---

## 8. Nhật ký Prompt: Bước 1 - Thiết kế bảng tài khoản trong SQL Server (dbo.Users) & User Model
- **Khung CTCO**:
  - **Context (C)**: Backend hiện dùng SQL Server + Sequelize 6 và có bảng SinhVien thật; cần bổ sung riêng bảng dbo.Users để học JWT.
  - **Task (T)**: Đề xuất script SQL tạo dbo.Users an toàn nếu chưa có và Model Sequelize gồm id, fullName, email, passwordHash, role; rà soát quyền DB cần thiết.
  - **Constraint (C)**: Không DROP/truncate/sync force/alter; không sửa bảng SinhVien, không lưu mật khẩu rõ; email unique; role mặc định student; giữ ESM/NodeNext; chú thích từng dòng code.
  - **Output (O)**: Liệt kê file, script SQL có điều kiện bảo vệ (`sql/04-users-auth.sql`), Model TypeScript (`src/models/user.model.ts`), lệnh chạy trong SSMS và câu lệnh SELECT dùng để xác minh cấu trúc.
- **Thực thi và kiểm chứng**:
  - Đã tạo `sql/04-users-auth.sql` với điều kiện bảo vệ `IF NOT EXISTS` và cấp quyền truy cập bảng cho user `sv_app`.
  - Đã tạo `src/models/user.model.ts` ánh xạ đúng bảng `dbo.Users`, tắt timestamps (`timestamps: false`).
  - Đã chạy kiểm tra xác minh: Bảng `dbo.Users` đã tạo thành công với các cột `id` (PK, IDENTITY), `fullName`, `email` (UNIQUE), `passwordHash`, `role` (DEFAULT 'student').
  - `pnpm build`: Thành công 0 lỗi.

---

## 9. Nhật ký Prompt: Bước 2 - Đăng ký tài khoản và băm mật khẩu (Register với bcrypt)
- **Khung CTCO**:
  - **Context (C)**: Dự án đã có User Model (`src/models/user.model.ts`), Zod Middleware (`validate`) và mẫu response success/message/data; cần làm `POST /api/auth/register`.
  - **Task (T)**: Viết Schema, Service, Controller và khai báo Route đăng ký; kiểm tra email trùng, hash bcrypt cost 12 rồi lưu User.
  - **Constraint (C)**: Giữ kiến trúc cũ và SQL Server/Sequelize, không tạo project mới; người đăng ký chỉ là student; từ chối field role; không trả passwordHash; chú thích code từng dòng.
  - **Output (O)**: Trả danh sách file thay đổi, code đầy đủ đúng từng file, các status 201/400/409 và script test tự động kiểm chứng dữ liệu.
- **Các file đã thêm / cập nhật**:
  - `src/validations/auth.schema.ts`: Schema `registerSchema` với `.strict()` chặn trường `role`.
  - `src/dtos/auth.dto.ts`: Interface `IRegisterDTO` và `IUserResponseDTO`.
  - `src/services/auth.service.ts`: Hàm `registerUser` chuẩn hóa email, băm mật khẩu bằng `bcrypt.hash(password, 12)` và lưu User.
  - `src/controllers/auth.controller.ts`: Controller `register` trả về HTTP 201 và dữ liệu người dùng mới.
  - `src/routes/auth.routes.ts`: Route `POST /register` có middleware `validate(registerSchema)`.
  - `src/server.ts`: Gắn `authRouter` tại prefix `/api/auth`.
- **Kết quả kiểm thử thực tế**:
  - `A01 (Register hợp lệ)`: Trả về HTTP 201, `dbo.Users` lưu chuỗi hash `$2b$12$...`, response không lộ mật khẩu (PASS).
  - `A02 (Register trùng email)`: Trả về HTTP 409 `Email đã tồn tại trong hệ thống`, số User không đổi (PASS).
  - `A03 (Register kèm role=admin)`: Bị Zod `.strict()` chặn với HTTP 400 (PASS).
  - `A04 (Register thiếu password)`: Bị chặn với HTTP 400 (PASS).

---

## 10. Nhật ký Prompt: Bước 3 - Xác thực mật khẩu và cấp Access Token (Login)
- **Khung CTCO**:
  - **Context (C)**: Đã hoàn thành Register, lưu passwordHash trong SQL Server và cần đăng nhập bằng email/password.
  - **Task (T)**: Viết login Service/Controller: tìm User, dùng bcrypt.compare, đúng thì gọi generateToken và trả accessToken; sai thì 401.
  - **Constraint (C)**: Không lưu plaintext; không log mật khẩu; không phân biệt “email không tồn tại” với “mật khẩu sai”; không dùng jwt.decode để xác minh; chú thích code từng dòng.
  - **Output (O)**: Trả file cần sửa, code TypeScript, ví dụ Request/Response 200 và 401, cùng hướng dẫn kiểm thử bằng Postman.
- **Các file đã thêm / cập nhật**:
  - `src/utils/jwt.ts`: Module tạo và ký token JWT chuẩn HS256 với `expiresIn: '1h'`, payload gồm `sub` (id) và `role`.
  - `src/validations/auth.schema.ts`: Bổ sung `loginSchema` kiểm tra email và password.
  - `src/dtos/auth.dto.ts`: Bổ sung `ILoginDTO` và `ILoginResponseDTO`.
  - `src/services/auth.service.ts`: Bổ sung hàm `loginUser` xác thực bằng `bcrypt.compare` và cấp accessToken.
  - `src/controllers/auth.controller.ts`: Bổ sung controller `login` trả về HTTP 200.
  - `src/routes/auth.routes.ts`: Khai báo route `POST /login` với middleware `validate(loginSchema)`.
- **Kết quả kiểm thử thực tế**:
  - `A05 (Login đúng mật khẩu)`: Trả về HTTP 200 + `accessToken` JWT 3 phần hợp lệ, `tokenType: "Bearer"`, `expiresIn: 3600` (PASS).
  - `A06 (Login sai mật khẩu)`: Trả về HTTP 401 `Email hoặc mật khẩu không chính xác`, không cấp token (PASS).
  - `A07 (Login email không tồn tại)`: Trả về HTTP 401 với thông báo chung giống A06, chống dò quét tài khoản (PASS).

---

## 11. Nhật ký Prompt: Bước 4 - Tạo và xác minh JWT đúng cấu hình (JWT Utility)
- **Khung CTCO**:
  - **Context (C)**: Project Express + TypeScript ESM, đã có User Model và login; cần module `src/utils/jwt.ts` dùng jsonwebtoken.
  - **Task (T)**: Viết `generateToken` nhận id/role, ký HS256 hết hạn 1 giờ; viết `verifyToken` xác minh chữ ký, hạn dùng và kiểu claims.
  - **Constraint (C)**: Bí mật lấy từ `process.env.JWT_SECRET`; không hard-code; chỉ chấp nhận thuật toán HS256; không tin `jwt.decode`; giữ import `.js` của ESM; chú thích code từng dòng.
  - **Output (O)**: Trả code module, hướng dẫn cấu hình `.env.example` an toàn, vị trí gọi từ login và các trường hợp ký/xác minh thất bại.
- **Các file đã thêm / cập nhật**:
  - `src/utils/jwt.ts`: Triển khai đầy đủ `generateToken` (ký HS256, hạn 1h, payload sub/role, hỗ trợ overload) và `verifyToken` (kiểm tra chặt chẽ chữ ký với thuật toán HS256), hàm `getJwtSecret` kiểm tra biến môi trường.
  - `package.json`: Cài đặt thư viện `jsonwebtoken` và `@types/jsonwebtoken`, thêm script `test:step4`.
  - `.env` & `.env.example`: Khai báo biến `JWT_SECRET`.
  - `src/scripts/test-step4-jwt.ts`: Bộ test tự động kiểm thử cấu trúc 3 phần, tính toàn vẹn chữ ký và chống giả mạo payload.
- **Kết quả kiểm thử thực tế (Điểm dừng Bước 4)**:
  - `JWT-01`: Chuỗi JWT sinh ra gồm chính xác 3 phần tách biệt bởi dấu chấm (`header.payload.signature`) (PASS).
  - `JWT-02`: Xác minh token nguyên bản thành công, giải mã đúng `sub: 10`, `role: student` (PASS).
  - `JWT-03 [Điểm dừng]`: Thay đổi 1 ký tự trong token -> `verifyToken` ném ngoại lệ `JsonWebTokenError: invalid signature` từ chối ngay lập tức (PASS).
  - `JWT-04`: Giả mạo đổi role từ `student` thành `admin` trong payload base64url -> chữ ký không khớp, bị chặn với `invalid signature` (PASS).
  - `JWT-05`: Overload `generateToken(id, role)` hoạt động chính xác (PASS).

---

## 12. Nhật ký Prompt: Bước 5 - Viết Middleware isAuth và bảo vệ API Profile
- **Khung CTCO**:
  - **Context (C)**: Tôi đã có `verifyToken`, TypeScript Express và `GET /api/auth/profile` chưa được bảo vệ.
  - **Task (T)**: Viết Middleware `isAuth` kiểm tra header Bearer, `jwt.verify`, xác minh payload rồi gán `req.user`; minh họa khai báo TypeScript cho `req.user`.
  - **Constraint (C)**: 401 cho thiếu/sai/hết hạn token; không gọi `next()` sau khi gửi lỗi; không trust payload chưa verify; không dùng `any` hay in secret ra log; chú thích code từng dòng.
  - **Output (O)**: Trả các file cần thêm/sửa và cách test: không token -> 401, token hợp lệ -> `req.user`; giải thích vì sao phải đặt `isAuth` trước controller.
- **Các file đã thêm / cập nhật**:
  - `src/types/express.d.ts`: Khai báo mở rộng type-safe `req.user` (`AuthUser { id: string, role: string }`), không dùng `any`.
  - `src/middlewares/isAuth.ts`: Trạm kiểm tra danh tính trung tâm: xác minh header `Authorization: Bearer <token>`, gọi `verifyToken`, kiểm tra role hợp lệ và gán `req.user`.
  - `src/services/auth.service.ts`: Bổ sung hàm `getUserProfile` truy vấn dữ liệu an toàn theo `id` (loại bỏ trường mật khẩu).
  - `src/controllers/auth.controller.ts`: Bổ sung controller `getProfile` trả về HTTP 200 kèm hồ sơ người dùng.
  - `src/routes/auth.routes.ts`: Đăng ký route `GET /profile` được bảo vệ qua chuỗi middleware: `isAuth -> getProfile`.
  - `src/scripts/test-step5-isauth.ts`: Kịch bản test tự động 4 ca: A08, A09, A10, A11.
- **Kết quả kiểm thử thực tế**:
  - `A08`: GET `/api/auth/profile` không có token -> Bị chặn với mã HTTP 401 (PASS).
  - `A09`: Profile với token bị sửa 1 ký tự -> Bị chặn với mã HTTP 401 (PASS).
  - `A10`: Profile với JWT student hợp lệ -> Trả HTTP 200 + dữ liệu hồ sơ, không chứa password/hash (PASS).
  - `A11`: Token hết hạn gọi Profile -> Bị chặn với mã HTTP 401 (PASS).
- **Vì sao phải đặt `isAuth` trước Controller**:
  - `isAuth` đóng vai trò là "người gác cổng" (Gatekeeper). Nếu không đặt trước controller, controller sẽ thực thi nghiệp vụ ngay cả khi người gửi request là nặc danh hoặc gửi token giả mạo, dẫn đến lộ thông tin nhạy cảm.
  - Việc đặt trước giúp xác thực danh tính và chuẩn bị sẵn đối tượng `req.user` an toàn và đầy đủ kiểu dữ liệu để controller chỉ việc khai thác.

---

## 13. Nhật ký Prompt: Bước 6 - Viết Middleware isAdmin và phân quyền Authorization (403 Forbidden)
- **Khung CTCO**:
  - **Context (C)**: Middleware `isAuth` đã gán `req.user` từ JWT được xác minh; hệ thống học vụ có role `student`/`admin`.
  - **Task (T)**: Viết `isAdmin` kiểm tra role là `admin`, không đủ quyền trả 403; nếu hợp lệ gọi `next()`; minh họa dùng chung với `isAuth`.
  - **Constraint (C)**: Không nhận role từ `req.body`/`req.query`; không đổi 403 thành 401; nếu thiếu `req.user` phải xử lý an toàn, không gây lỗi 500; chú thích code từng dòng.
  - **Output (O)**: Cung cấp code `src/middlewares/isAdmin.ts`, ví dụ gắn vào một Route cũ và 3 ca test thiếu token / student / admin, giải thích câu hỏi bảo vệ.
- **Các file đã thêm / cập nhật**:
  - `src/middlewares/isAdmin.ts`: Middleware kiểm tra quyền admin. Kiểm tra `!req.user` an toàn (tránh văng lỗi 500), kiểm tra `req.user.role !== 'admin'` trả mã HTTP 403 Forbidden.
  - `package.json`: Bổ sung script `test:step6`.
  - `src/scripts/test-step6-isadmin.ts`: Bộ test tự động kiểm chứng 4 tình huống.
- **Kết quả kiểm thử thực tế**:
  - `CASE-01`: Người gọi không có JWT -> `isAuth` chặn 401, `isAdmin` không chạy (PASS).
  - `CASE-02`: Người gọi role `student` gửi JWT hợp lệ -> `isAuth` cho qua, `isAdmin` từ chối với mã **403 Forbidden** (PASS).
  - `CASE-03`: Người gọi role `admin` gửi JWT hợp lệ -> Cả hai middleware cho qua -> Vào controller thành công với mã **200 OK** (PASS).
  - `CASE-04`: Thiếu `req.user` -> Xử lý an toàn với HTTP 401, không bị crash ứng dụng lỗi 500 (PASS).
- **Trả lời câu hỏi: Nếu đưa `isAdmin` lên trước `isAuth`, điều gì có thể xảy ra khi `req.user` chưa được gán?**:
  - `isAuth` chịu trách nhiệm **Authentication (Xác thực danh tính)** để giải mã token và gán vào `req.user`.
  - `isAdmin` chịu trách nhiệm **Authorization (Phân quyền vai trò)** dựa trên thuộc tính `req.user.role`.
  - Nếu đảo thứ tự đặt `isAdmin` trước `isAuth`:
    1. Khi `isAdmin` chạy, `req.user` vẫn đang là `undefined`. Nếu truy cập trực tiếp `req.user.role`, chương trình sẽ bắn lỗi ngoại lệ `TypeError: Cannot read properties of undefined (reading 'role')` dẫn đến lỗi máy chủ **500 Internal Server Error**.
    2. Kể cả khi có điều kiện `if (!req.user)`, request của tài khoản Admin hợp lệ cũng sẽ bị chặn lại ngay từ đầu vì chưa kịp được `isAuth` giải mã token.
  - Do đó, quy tắc bất biến là: **Luôn đặt `isAuth` trước `isAdmin`**.

---

## 14. Nhật ký Prompt: Bước 7 - Ghép Middleware bảo vệ các Route SinhVien (Tích hợp không làm hỏng CRUD)
- **Khung CTCO**:
  - **Context (C)**: Tôi có `routes/sinhVien.routes.ts` của Chương 05 với năm API CRUD và Zod Validation; nay đã có `isAuth`/`isAdmin`.
  - **Task (T)**: Đặt `isAuth` rồi `isAdmin` vào `POST/PUT/DELETE`; giữ `GET` public, giữ nguyên handler, Service, endpoint và quy tắc dữ liệu cũ.
  - **Constraint (C)**: Không tạo router, bảng, database hay app Express thứ hai; không bỏ Zod/Morgan/Swagger; không sửa response thành công của Admin; chú thích code từng dòng.
  - **Output (O)**: Trả diff/file Route sau khi ghép và bảng ca test bảo đảm Admin đúng quyền, student bị chặn, CRUD cũ không hồi quy.
- **Các file đã thêm / cập nhật**:
  - `src/routes/sinhVien.routes.ts`: Gắn `isAuth` và `isAdmin` trước `validate` và controller cho các phương thức `POST`, `PUT`, `DELETE`. Giữ nguyên hai route `GET /` và `GET /:maSV` là công khai.
  - `src/scripts/test-crud-api.ts`: Bổ sung header Admin Bearer Token để thực hiện kiểm thử hồi quy thành công 100% cho 12 ca CRUD cũ.
  - `package.json`: Thêm script `test:step7`.
  - `src/scripts/test-step7-rbac.ts`: Bộ test tự động kiểm thử toàn diện 12 ca kiểm thử ma trận phân quyền B01 - B12.
- **Kết quả kiểm thử thực tế (Điểm dừng Bước 7)**:
  - `B01`: GET danh sách sinh viên không cần JWT -> Giữ PUBLIC 200 OK (PASS).
  - `B02`: POST SinhVien không có JWT -> Bị chặn 401, không INSERT bản ghi vào DB (PASS).
  - `B03`: PUT SinhVien với token không hợp lệ -> Bị chặn 401, dữ liệu cũ giữ nguyên (PASS).
  - `B04`: DELETE SinhVien với JWT student -> Bị chặn 403, bản ghi vẫn tồn tại (PASS).
  - `B05`: POST SinhVien với JWT student -> Bị chặn 403, không INSERT (PASS).
  - `B06`: PUT SinhVien với JWT student -> Bị chặn 403, không UPDATE (PASS).
  - `B07`: POST SinhVien hợp lệ với JWT admin -> 201 Created, ghi thật vào DB (PASS).
  - `B08`: PUT SinhVien hợp lệ với JWT admin -> 200 OK, GET lại thấy cập nhật (PASS).
  - `B09`: DELETE SinhVien với JWT admin -> 200 OK, GET lại trả 404 (PASS).
  - `B10`: Admin POST body sai Zod -> Bị chặn 400 Bad Request kèm mảng errors (PASS).
  - `B11`: Admin POST trùng mã SV001 -> Báo lỗi 409 Conflict, không tạo trùng lặp (PASS).
  - `B12`: DELETE cùng mã lần 2 bằng Admin -> Báo lỗi 404 Not Found (PASS).
- **Chứng minh điểm dừng Bước 7**:
  - Khi tài khoản `student` thực hiện POST, PUT, DELETE đều bị chặn đứng với mã HTTP 403 Forbidden.
  - Kiểm chứng trực tiếp qua câu lệnh SELECT cơ sở dữ liệu xác nhận trạng thái dữ liệu trước và sau request của `student` được bảo toàn nguyên vẹn 100%, không bị chèn, sửa hay xóa trái phép.
  - Chỉ khi có token của `admin`, các thao tác nghiệp vụ mới được cấp quyền ghi và làm thay đổi CSDL thật.

---

## 15. Nhật ký Prompt: Bước 8 - Chuẩn bị tài khoản Admin kiểm thử phân quyền (Seed Admin an toàn)
- **Khung CTCO**:
  - **Context (C)**: Tôi cần tài khoản `admin-test` để kiểm thử RBAC trên môi trường phát triển; User Model đã hoạt động với Sequelize.
  - **Task (T)**: Tạo script `seed-admin.ts` chạy thủ công: kiểm tra email, bcrypt hash password, tạo User role `admin`; hướng dẫn sử dụng và xác minh.
  - **Constraint (C)**: Không tạo route cấp quyền public; không đưa password mặc định vào source/SQL hay commit; không cập nhật role người dùng hiện có nếu chưa cho phép; chú thích code từng dòng.
  - **Output (O)**: Cung cấp file seed (`src/scripts/seed-admin.ts`), lệnh chạy tương thích `tsx` / `pnpm`, cách xác nhận dữ liệu trong SSMS, cách xóa dữ liệu thử an toàn.
- **Các file đã thêm / cập nhật**:
  - `src/scripts/seed-admin.ts`: Script khởi tạo tài khoản quản trị viên an toàn:
    1. Kiểm tra tồn tại trước khi thêm: nếu email đã tồn tại, tuyệt đối không tự ý ghi đè hay nâng quyền.
    2. Băm mật khẩu bằng `bcrypt` với cost factor 12.
    3. Gán cứng role `admin` trong mã nội bộ, không mở API công khai cấp quyền hoặc set-role.
    4. Hỗ trợ cờ `--clean` để xóa tài khoản test an toàn sau khi hoàn tất kiểm thử.
  - `package.json`: Bổ sung script `"seed:admin": "tsx src/scripts/seed-admin.ts"`.
- **Kết quả kiểm thử thực tế**:
  - Chạy `pnpm seed:admin`: Tạo thành công tài khoản `admin.lab@example.com` với `role='admin'` và `passwordHash` chuẩn bcrypt `$2b$12$...` trong SQL Server.
  - Chạy lại lần 2: Hệ thống phát hiện tài khoản đã tồn tại và giữ nguyên vẹn, không ghi đè, tuân thủ nghiêm ngặt nguyên tắc bảo mật.
  - Kiểm thử đăng nhập: `POST /api/auth/login` với tài khoản Admin vừa seed trả về HTTP 200 OK và JWT Token hợp lệ chứa `role: "admin"`.
- **Hướng dẫn truy vấn kiểm chứng và dọn dẹp**:
  - **Truy vấn trong SSMS**:
    ```sql
    SELECT id, fullName, email, role, passwordHash FROM dbo.Users WHERE email = 'admin.lab@example.com';
    ```
  - **Lệnh dọn dẹp an toàn**:
    ```bash
    pnpm seed:admin --clean
    ```
    hoặc câu lệnh SQL:
    ```sql
    DELETE FROM dbo.Users WHERE email = 'admin.lab@example.com';
    ```

---

## 16. Nhật ký Prompt: Bước 9 - Cập nhật Swagger OpenAPI 3.0.3 và tích hợp Bearer Authentication
- **Khung CTCO**:
  - **Context (C)**: Dự án Express + TypeScript đã có sẵn tài liệu `docs/openapi.yaml` của Chương 05 và Swagger UI mount tại `/api-docs`. Nay hệ thống đã hoàn tất các chức năng xác thực JWT (Register, Login, Profile) và bảo vệ RBAC cho các route SinhVien.
  - **Task (T)**: Cập nhật `docs/openapi.yaml` lên chuẩn OpenAPI 3.0.3 hoàn chỉnh:
    1. Cấu hình `components.securitySchemes.bearerAuth` chuẩn HTTP Bearer JWT.
    2. Bổ sung các endpoint xác thực: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile` (gắn security `bearerAuth`).
    3. Cập nhật các thao tác ghi của SinhVien (`POST`, `PUT`, `DELETE`): gắn `security: - bearerAuth: []` và khai báo đầy đủ các mã phản hồi lỗi `401 Unauthorized` và `403 Forbidden`.
    4. Giữ nguyên các thao tác đọc (`GET /api/v1/sinh-vien` và `GET /api/v1/sinh-vien/{maSV}`) ở trạng thái Public (không yêu cầu security).
    5. Khai báo đầy đủ các Schemas đầu vào/đầu ra và các responses lỗi dùng chung ($ref).
  - **Constraint (C)**: Tuân thủ chuẩn OpenAPI 3.0.3; phân định rành mạch 401 (chưa xác thực) và 403 (không đủ quyền); không dùng JSDoc phân tán; chú thích từng dòng YAML.
  - **Output (O)**: File `docs/openapi.yaml` có chú thích chi tiết, script kiểm thử tự động `test:step9` xác minh 15 tiêu chí và hướng dẫn thao tác nút Authorize trên giao diện Swagger UI.
- **Các file đã thêm / cập nhật**:
  - `docs/openapi.yaml`: Đặc tả OpenAPI 3.0.3 đầy đủ với `securitySchemes.bearerAuth`, 3 endpoints Auth, 5 endpoints SinhVien có phân quyền RBAC và các component schemas/responses.
  - `src/scripts/test-step9-swagger.ts`: Script kiểm thử tự động xác minh cấu trúc YAML và endpoint runtime `/api-docs/`.
  - `package.json`: Bổ sung script `"test:step9": "tsx src/scripts/test-step9-swagger.ts"`.
- **Kết quả kiểm thử thực tế (15/15 ca PASS - 100%)**:
  - `SW-01`: File `docs/openapi.yaml` tồn tại trên hệ thống (PASS).
  - `SW-02`: Cú pháp YAML hợp lệ, parse thành công sang JavaScript Object (PASS).
  - `SW-03`: Phiên bản đặc tả chính xác là `openapi: 3.0.3` (PASS).
  - `SW-04`: Thông tin API `info.title`, `info.version` đầy đủ (PASS).
  - `SW-05`: Khai báo `securitySchemes.bearerAuth` chuẩn `type: http`, `scheme: bearer`, `bearerFormat: JWT` (PASS).
  - `SW-06`: Khai báo endpoint `POST /api/auth/register` (các mã 201, 400, 409) (PASS).
  - `SW-07`: Khai báo endpoint `POST /api/auth/login` (các mã 200, 400, 401) (PASS).
  - `SW-08`: Khai báo `GET /api/auth/profile` có `security: bearerAuth` và response 401 (PASS).
  - `SW-09`: `GET /api/v1/sinh-vien` là Public, không gắn security (PASS).
  - `SW-10`: `GET /api/v1/sinh-vien/{maSV}` là Public, không gắn security (PASS).
  - `SW-11`: `POST /api/v1/sinh-vien` có security `bearerAuth`, response 401 và 403 (PASS).
  - `SW-12`: `PUT /api/v1/sinh-vien/{maSV}` có security `bearerAuth`, response 401 và 403 (PASS).
  - `SW-13`: `DELETE /api/v1/sinh-vien/{maSV}` có security `bearerAuth`, response 401 và 403 (PASS).
  - `SW-14`: Đầy đủ các Schemas: `RegisterInput`, `LoginInput`, `UserPublic`, `SinhVien`, `SinhVienUpdate`, `ErrorResponse` (PASS).
  - `SW-15`: Endpoint Swagger UI runtime `http://localhost:5000/api-docs/` phản hồi HTTP 200 OK (PASS).
- **Hướng dẫn sử dụng nút Authorize trên Swagger UI**:
  1. Truy cập `http://localhost:5000/api-docs`.
  2. Thực hiện gọi API `POST /api/auth/login` với tài khoản admin (`admin.lab@example.com` / `Admin@123456`) để lấy chuỗi `accessToken`.
  3. Nhấn vào nút **Authorize** màu xanh (có biểu tượng ổ khóa mở) ở góc trên bên phải giao diện Swagger UI.
  4. Trong hộp thoại *Available authorizations*, dán trực tiếp chuỗi token vừa nhận vào ô `Value` (Swagger UI sẽ tự động ghép tiền tố `Bearer `, không cần gõ chữ "Bearer").
  5. Nhấn nút **Authorize** rồi nhấn **Close**. Biểu tượng ổ khóa tại các endpoint được bảo vệ sẽ chuyển sang trạng thái đã khóa (Locked).
  6. Giờ đây mọi thao tác gọi `POST`, `PUT`, `DELETE` sinh viên hoặc `GET /api/auth/profile` sẽ tự động mang theo header `Authorization: Bearer <token>`.

---

## 17. Nhật ký Prompt: Bước 10 - Xây dựng Bộ sưu tập Postman Collection & Kiểm thử 24 Test Cases (Bảng A & Bảng B)
- **Khung CTCO**:
  - **Context (C)**: Dự án Express + TypeScript đã hoàn thành toàn bộ API xác thực (Register, Login, Profile) và phân quyền RBAC (isAuth, isAdmin) bảo vệ các route SinhVien. Cần chuyển giao sang Postman để phục vụ kiểm thử thủ công và kiểm thử tự động trực quan.
  - **Task (T)**:
    1. Tạo đầy đủ các file Postman Collection và Environment trong thư mục `postman/` cho 2 bảng:
       - **Bảng A (A01 – A12)**: Kiểm thử Authentication & JWT (Register, Login, Chữ ký, Token hết hạn, Profile, Bảo mật CSDL).
       - **Bảng B (B01 – B12)**: Kiểm thử isAuth và isAdmin trên SinhVien (GET công khai, 401 nặc danh, 403 sinh viên, 201/200 admin, 400 Zod, 409 Conflict, 404 NotFound).
    2. Viết Postman Tests script tự động kiểm tra status code, cấu trúc body và tự động trích xuất / lưu biến môi trường `studentToken`, `adminToken`.
    3. Tạo script tự động hóa chạy độc lập `pnpm test:step10` mô phỏng Postman Collection Runner trên toàn bộ 24 ca test.
  - **Constraint (C)**: Giữ nguyên chuẩn Postman Collection Schema v2.1.0; có chú thích code từng dòng trong Tests script; bảo toàn nguyên tắc an toàn dữ liệu, tự động dọn dẹp các bản ghi test; không hard-code khóa bí mật ra ngoài file môi trường.
  - **Output (O)**: 4 file trong thư mục `postman/`, script `src/scripts/test-step10-postman.ts` đạt kết quả 24/24 ca PASS (100%), và hướng dẫn chi tiết các bước nhập (Import) và thực thi (Run) trên Postman.
- **Các file đã thêm / cập nhật**:
  - `postman/Buoi7-JWT-Auth.postman_collection.json`: Bộ sưu tập tổng hợp chứa đầy đủ Bảng A (A01 - A12) và Bảng B (B01 - B12) chia theo từng thư mục trực quan.
  - `postman/Buoi7-Bang-A-Authentication.postman_collection.json`: Bộ sưu tập chuyên biệt cho Bảng A.
  - `postman/Buoi7-Bang-B-SinhVien-RBAC.postman_collection.json`: Bộ sưu tập chuyên biệt cho Bảng B.
  - `postman/Buoi7-JWT-Environment.postman_environment.json`: File biến môi trường Postman (baseUrl, studentToken, adminToken, tamperedToken, expiredToken).
  - `src/scripts/generate-postman.ts`: Script TypeScript tự động sinh và cập nhật các file Postman.
  - `src/scripts/test-step10-postman.ts`: Bộ test tự động kiểm thử 24/24 ca kiểm thử Bảng A và Bảng B.
  - `package.json`: Bổ sung 2 lệnh chạy `"generate:postman"` và `"test:step10"`.
- **Kết quả kiểm thử thực tế (24/24 ca PASS - 100%)**:
  - `A01`: Register email mới hợp lệ -> 201 Created (PASS).
  - `A02`: Register trùng email -> 409 Conflict (PASS).
  - `A03`: Register thêm role=admin -> 400 Bad Request (PASS).
  - `A04`: Register thiếu password/email sai -> 400 Bad Request (PASS).
  - `A05`: Login đúng student -> 200 OK + JWT Bearer Token (PASS).
  - `A06`: Login sai password -> 401 Unauthorized (PASS).
  - `A07`: Login email không tồn tại -> 401 Unauthorized (PASS).
  - `A08`: GET Profile không token -> 401 Unauthorized (PASS).
  - `A09`: Profile token sửa 1 ký tự -> 401 Unauthorized (PASS).
  - `A10`: Profile với JWT student hợp lệ -> 200 OK (PASS).
  - `A11`: Token hết hạn gọi Profile -> 401 Unauthorized (PASS).
  - `A12`: Kiểm chứng an toàn CSDL -> Bcrypt $2b$12$, không plaintext (PASS).
  - `B01`: GET danh sách không JWT -> 200 OK (Public) (PASS).
  - `B02`: POST SinhVien không JWT -> 401 Unauthorized (PASS).
  - `B03`: PUT SinhVien token sai -> 401 Unauthorized (PASS).
  - `B04`: DELETE SinhVien bằng student -> 403 Forbidden (PASS).
  - `B05`: POST SinhVien bằng student -> 403 Forbidden (PASS).
  - `B06`: PUT SinhVien bằng student -> 403 Forbidden (PASS).
  - `B07`: POST SinhVien bằng admin -> 201 Created (PASS).
  - `B08`: PUT SinhVien bằng admin -> 200 OK (PASS).
  - `B09`: DELETE SinhVien bằng admin -> 200 OK (PASS).
  - `B10`: Admin POST body sai Zod -> 400 Bad Request (PASS).
  - `B11`: Admin POST mã bị trùng -> 409 Conflict (PASS).
  - `B12`: DELETE mã lần 2 bằng Admin -> 404 Not Found (PASS).

---

## 18. Nhật ký Prompt: Bước 11 - Đóng vai Security Reviewer (Phát hiện lỗi từ code AI sinh ra)
- **Khung CTCO**:
  - **Context (C)**: Dự án Backend Quản lý sinh viên đã hoàn thành Register, Login, isAuth, isAdmin; cần thực hiện Security Audit (rà soát an ninh) theo đúng yêu cầu tại Trang 18 Giáo trình Chương 06.
  - **Task (T)**: Đóng vai Security Reviewer, phân tích đoạn code sai điển hình do AI sinh ra, chỉ rõ 6 lỗ hổng bảo mật chết người, lập bảng đối chiếu nguy cơ và cung cấp bản vá code chuẩn có chú thích từng dòng.
  - **Constraint (C)**: Phân biệt rõ ranh giới 401 và 403; không hạ chuẩn bảo mật; chú thích từng dòng code của bản vá; đối chiếu với code thực tế của project.
  - **Output (O)**: Bảng phân tích chi tiết 6 lỗ hổng bảo mật và bản code vá an toàn chuẩn mực.

### Bảng phân tích 6 lỗ hổng bảo mật từ đoạn code AI sinh ra (Trang 18)

| STT | Dấu hiệu cần tìm | Đoạn code AI sai (Vấn đề) | Nguy cơ bảo mật (Rủi ro) | Cách sửa chuẩn (Bản vá) | Test chứng minh |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Password plaintext** | `if (user.password === password)` | Mật khẩu lưu hoặc so sánh dạng rõ (Plaintext). Nếu CSDL bị rò rỉ, toàn bộ mật khẩu người dùng bị lộ 100%. | Dùng `await bcrypt.compare(password, user.passwordHash)` với mật khẩu đã băm cost 12. | Test A01/A06/A12: CSDL chỉ lưu chuỗi `$2b$12$...`. |
| **2** | **JWT_SECRET hard-code và yếu** | Ký token với secret `'123456'` cố định | Khóa bí mật quá ngắn, nằm lộ trong mã nguồn Git, kẻ tấn công dễ dàng brute-force hoặc giả mạo chữ ký token. | Lưu `JWT_SECRET` trong file `.env` với chuỗi ngẫu nhiên tối thiểu 32 ký tự, nạp qua `process.env.JWT_SECRET`. | Test SW-05 & `test:step4`: Đọc secret an toàn, không hard-code. |
| **3** | **Thiếu expiresIn** | `jwt.sign({ ... }, '123456')` không có `expiresIn` | Token có giá trị vĩnh viễn (Immortal Token). Nếu token bị rò rỉ hoặc đánh cắp, kẻ gian có thể dùng mãi mãi mà không bị hủy. | Đặt thời hạn hết hạn cụ thể: `{ expiresIn: '1h', algorithm: 'HS256' }`. | Test A11: Sau 1 giờ token tự hết hạn, server từ chối 401. |
| **4** | **Tin role từ Request** | `{ id: user.id, role: req.body.role }` | Lỗ hổng leo thang đặc quyền (Privilege Escalation). Kẻ xấu chỉ cần gửi `role: "admin"` khi đăng nhập/đăng ký là chiếm quyền quản trị. | Tuyệt đối lấy role từ CSDL (`role: user.role`). Schema Zod dùng `.strict()` từ chối trường `role` từ client. | Test A03 & B05: Zod chặn role từ client; role do server quản lý. |
| **5** | **jwt.decode thay vì jwt.verify** | `jwt.decode(req.headers.authorization)` | `jwt.decode` CHỈ giải mã chuỗi Base64 ra JSON, HOÀN TOÀN KHÔNG kiểm tra chữ ký hay hạn dùng. Hacker sửa role thành `admin` là vượt qua kiểm tra! | Luôn dùng `jwt.verify(token, secret, { algorithms: ['HS256'] })` để kiểm tra chữ ký số và thời hạn. | Test JWT-04, A09, B03: Sửa 1 ký tự hoặc giả mạo role bị chặn ngay 401. |
| **6** | **Trả nguyên object user** | `return res.json({ token, user })` | Vô tình trả toàn bộ thông tin nhạy cảm của người dùng (bao gồm `passwordHash`, thông tin nội bộ) ra phía Client. | Dùng DTO hoặc lọc rõ các trường công khai: `{ id, fullName, email, role }`. | Test A01, A05, A10: Response không bao giờ chứa `password` hay `passwordHash`. |

---

## 19. Nhật ký Prompt: Bước 12 - Xử lý lỗi & 8 Câu hỏi bảo vệ bài thực hành (Vấn đáp 10 điểm)
- **Khung CTCO**:
  - **Context (C)**: Chuẩn bị hồ sơ nộp bài thực hành Chương 06 và bảo vệ vấn đáp trước Giảng viên (Trang 19-21 Giáo trình).
  - **Task (T)**: Tổng hợp bảng xử lý 6 triệu chứng lỗi kinh điển khi code JWT/RBAC và trả lời chi tiết, chuẩn xác 8 câu hỏi bảo vệ bài thực hành kèm code minh họa có chú thích từng dòng.
  - **Constraint (C)**: Trả lời đúng bản chất kỹ thuật, không sáo rỗng, đối chiếu trực tiếp với mã nguồn dự án đang chạy.
  - **Output (O)**: Cẩm nang xử lý lỗi và 8 câu trả lời bảo vệ xuất sắc.

### 📋 Bảng 6 triệu chứng lỗi kinh điển và cách xử lý (Trang 19)

1. **401 dù đã Login**:
   - *Nguyên nhân*: Header gửi thiếu tiền tố `Bearer `, có khoảng trắng thừa/thiếu, hoặc copy token bị thiếu ký tự, hoặc `JWT_SECRET` lúc ký khác lúc verify.
   - *Cách kiểm tra*: Kiểm tra `req.headers.authorization.startsWith('Bearer ')`, lấy token bằng `.split(' ')[1]`, kiểm tra biến môi trường `.env`.
2. **403 với Admin**:
   - *Nguyên nhân*: Tài khoản admin chưa có `role: 'admin'` trong DB, hoặc sau khi seed admin chưa đăng nhập lại để lấy token mới mang role admin.
   - *Cách kiểm tra*: Đăng nhập lại `POST /api/auth/login` với tài khoản admin để cấp JWT mới; kiểm tra `req.user.role === 'admin'`.
3. **TypeScript báo `req.user` không có**:
   - *Nguyên nhân*: Express.Request mặc định chưa có thuộc tính `user`.
   - *Cách kiểm tra*: Khai báo mở rộng type-safe trong `src/types/express.d.ts` kế thừa `Express.Request`.
4. **500 khi Register**:
   - *Nguyên nhân*: Lỗi kết nối CSDL, tên bảng hoặc cột trong Model Sequelize không khớp với SQL Server (`dbo.Users`), hoặc lỗi trùng email (Unique constraint) chưa được bắt để map sang mã 409.
   - *Cách kiểm tra*: Bắt `UniqueConstraintError` trong Service/Controller và ném lỗi 409 thay vì để văng lỗi 500.
5. **Swagger 404**:
   - *Nguyên nhân*: Đường dẫn trên YAML không khớp với URL runtime được mount trong `server.ts`.
   - *Cách kiểm tra*: Kiểm tra prefix `/api/auth` và `/api/v1/sinh-vien` trong file `docs/openapi.yaml`.
6. **API cũ hỏng sau khi ghép Middleware**:
   - *Nguyên nhân*: Đặt sai thứ tự Middleware (ví dụ đặt `isAdmin` trước `isAuth`, hoặc quên gọi `next()`).
   - *Cách kiểm tra*: Luôn đảm bảo thứ tự chuỗi pipeline: `isAuth -> isAdmin -> validate -> controller`.

---

### 🎓 Trả lời 8 Câu hỏi bảo vệ bài thực hành (Trang 21)

#### ❓ Câu 1: Vì sao Register dùng `bcrypt.hash()` nhưng Login phải dùng `bcrypt.compare()`?
- **Trả lời**:
  - `bcrypt` là thuật toán băm mật khẩu **một chiều (One-way Hash)** kết hợp muối ngẫu nhiên (Salt).
  - Khi **Register**: Ta dùng `bcrypt.hash(password, 12)` để sinh ra chuỗi hash mới kèm salt ngẫu nhiên và lưu vào CSDL. Mỗi lần băm, dù cùng một mật khẩu, chuỗi hash sinh ra sẽ hoàn toàn khác nhau do salt ngẫu nhiên.
  - Khi **Login**: Ta **không thể** băm lại mật khẩu nhập vào rồi so sánh bằng dấu `===` (vì salt mới sẽ tạo hash khác). Do đó bắt buộc phải dùng `bcrypt.compare(password, user.passwordHash)`. Hàm này sẽ trích xuất salt đã nhúng sẵn trong `passwordHash` cũ để băm lại mật khẩu vừa nhập và so sánh an toàn trong thời gian cố định (Constant-time comparison), chống tấn công Timing Attack.

#### ❓ Câu 2: Vì sao JWT có chữ ký số mà vẫn không nên chứa `passwordHash` trong payload?
- **Trả lời**:
  - Phần Payload của JWT chỉ được mã hóa dạng **Base64Url**, tức là bất kỳ ai có được token đều có thể dễ dàng giải mã (decode) và đọc được toàn bộ nội dung bên trong mà không cần có khóa bí mật (`JWT_SECRET`).
  - Chữ ký số (`Signature`) của JWT chỉ có tác dụng bảo đảm **tính toàn vẹn (Integrity)** - giúp phát hiện token có bị sửa đổi hay không, chứ **không có tác dụng bảo mật bí mật thông tin (Confidentiality)**.
  - Nếu đưa `passwordHash` vào payload, kẻ xấu chỉ cần decode token là lấy được chuỗi hash để tiến hành bẻ khóa offline (Brute-force / Rainbow table), vi phạm nghiêm trọng nguyên tắc an toàn thông tin.

#### ❓ Câu 3: Nếu User sửa chữ `student` thành `admin` trong payload JWT, điều gì xảy ra khi `isAuth` gọi `jwt.verify`?
- **Trả lời**:
  - Chữ ký của JWT được tính toán dựa trên công thức: `HMACSHA256(Base64(Header) + "." + Base64(Payload), Secret)`.
  - Khi người dùng tự ý đổi `student` thành `admin` trong payload, chuỗi `Base64(Payload)` bị thay đổi.
  - Khi `isAuth` gọi hàm `jwt.verify(token, secret)`: Hàm này sẽ tính lại chữ ký với secret bí mật trên server và so khớp với chữ ký đính kèm trong token. Vì kẻ tấn công không biết `JWT_SECRET` để ký lại, nên chữ ký tính lại sẽ **không khớp**.
  - `jwt.verify` sẽ lập tức ném ra ngoại lệ `JsonWebTokenError: invalid signature` và request bị chặn đứng với mã HTTP **`401 Unauthorized`**. Kẻ gian hoàn toàn không thể chiếm quyền admin.

#### ❓ Câu 4: Phân biệt 401 và 403 bằng hai Request cụ thể trong B04 và A08.
- **Trả lời**:
  - **`401 Unauthorized` (Chưa xác thực danh tính - Bạn là ai?)**:
    - *Ví dụ ca A08*: Client gửi `GET /api/auth/profile` nhưng **không đính kèm Token** (hoặc gửi token rác, token hết hạn). Server không thể xác định được người gửi request là ai, do đó trả về `401 Unauthorized`.
  - **`403 Forbidden` (Không đủ quyền hạn - Bạn không được phép làm điều này)**:
    - *Ví dụ ca B04*: Client gửi `DELETE /api/v1/sinh-vien/SV001` kèm Token hợp lệ của tài khoản **`student`**. Server đã xác thực được danh tính (biết đây là sinh viên Nguyễn Minh An hợp lệ), nhưng vai trò `student` không có quyền thực hiện hành vi xóa dữ liệu học vụ, do đó trả về `403 Forbidden`.

#### ❓ Câu 5: Tại sao phải gắn `isAuth` trước `isAdmin`? `req.user` được tạo ở đâu?
- **Trả lời**:
  - `isAuth` là bước **Authentication (Xác thực danh tính)**: Có nhiệm vụ kiểm tra token, giải mã payload và **gán đối tượng `{ id, role }` vào `req.user`**.
  - `isAdmin` là bước **Authorization (Phân quyền)**: Cần đọc thuộc tính `req.user.role` để kiểm tra xem có phải `'admin'` hay không.
  - Nếu gắn `isAdmin` trước `isAuth`: Khi `isAdmin` thực thi, `req.user` vẫn đang là `undefined`. Nếu truy cập `req.user.role`, chương trình sẽ bắn lỗi ngoại lệ `TypeError: Cannot read properties of undefined` gây sập máy chủ trả về **500 Internal Server Error**. Do đó bắt buộc `isAuth` phải chạy trước để tạo `req.user` sẵn sàng cho `isAdmin`.

#### ❓ Câu 6: Nếu Route DELETE chỉ được đánh dấu security trong Swagger nhưng không gắn `isAdmin` ở Express, có an toàn không?
- **Trả lời**:
  - **HOÀN TOÀN KHÔNG AN TOÀN!**
  - Swagger / OpenAPI (`docs/openapi.yaml`) chỉ là **tài liệu mô tả giao diện (API Documentation)** phía ngoài để lập trình viên và người dùng đọc, nó không có chức năng thực thi mã bảo vệ máy chủ.
  - Nếu bên code Express (`sinhVien.routes.ts`) không khai báo Middleware `isAdmin`, bất kỳ ai (kể cả người dùng nặc danh hoặc tài khoản sinh viên) dùng Postman, Curl hay ứng dụng di động gửi request `DELETE` lên thì server vẫn xử lý xóa bản ghi bình thường. Bảo mật bắt buộc phải được thực thi ở tầng Backend Middleware.

#### ❓ Câu 7: Nếu thay role của một User trong SQL Server sau khi đã cấp JWT, token cũ có cập nhật role ngay không? Muốn kiểm soát phải làm gì?
- **Trả lời**:
  - **KHÔNG cập nhật ngay**. Bởi vì JWT là cơ chế xác thực **Stateless (Phi trạng thái)**; mọi thông tin `role` đã được đóng gói và ký cứng trong payload của token tại thời điểm đăng nhập. Server khi nhận token chỉ kiểm tra chữ ký chứ không truy vấn lại DB mỗi lần kiểm tra role. Token cũ vẫn giữ quyền cũ cho đến khi hết hạn (ví dụ sau 1 giờ).
  - **Muốn kiểm soát tức thì**:
    1. *Cách 1*: Trong middleware `isAuth` hoặc `isAdmin`, thực hiện truy vấn nhanh `User.findByPk(req.user.id)` trong CSDL để lấy role mới nhất (đổi từ Pure Stateless sang Semi-Stateless).
    2. *Cách 2*: Dùng Token Blacklist (lưu trong Redis) để thu hồi (revoke) token cũ khi tài khoản thay đổi quyền, buộc người dùng đăng nhập lại nhận token mới.
    3. *Cách 3*: Rút ngắn thời hạn Access Token (ví dụ 10–15 phút) và dùng Refresh Token.

#### ❓ Câu 8: Tại sao test 403 cần gọi GET/SELECT lại và không thể chỉ nhìn status là đủ?
- **Trả lời**:
  - Status code `403` chỉ chứng minh rằng Middleware đã chặn lại ở tầng HTTP và gửi response về cho client.
  - Tuy nhiên, trong một số lỗi lập trình phổ biến (như quên return sau khi gửi lỗi, hoặc viết nhầm controller trước middleware), code controller phía sau vẫn có thể bị kích hoạt và âm thầm sửa/xóa dữ liệu trong CSDL trước khi trả về 403.
  - Do đó, việc gọi lại `GET /api/v1/sinh-vien/:maSV` hoặc chạy câu lệnh `SELECT` trực tiếp trong SQL Server là bằng chứng thép khẳng định **dữ liệu thực tế được bảo toàn nguyên vẹn 100%**, không có bất kỳ hành vi ghi trái phép nào lọt qua được.

---

## 20. Nhật ký Prompt: Chương 07 - Bước 9: Nút Xóa sinh viên - Chỉ Admin thực thi (Trang 15)
- **Khung CTCO**:
  - **Context (C)**: Bảng SinhVien phía React Frontend (`SinhVienTable.tsx`) đã hỗ trợ GET danh sách sinh viên qua Axios. Hệ thống Backend đã có sẵn API `DELETE /api/v1/sinh-vien/:maSV` được bảo vệ nghiêm ngặt bởi chuỗi middleware `isAuth` và `isAdmin`.
  - **Task (T)**:
    1. Bổ sung nút **🗑️ Xóa** vào từng hàng trong `SinhVienTable.tsx`, chỉ hiển thị khi tài khoản đang đăng nhập có vai trò `admin` (`isAdmin === true`).
    2. Trước khi gọi DELETE, hiển thị hộp thoại xác nhận rõ ràng mã sinh viên cần xóa (`window.confirm`).
    3. Gửi request `DELETE /api/v1/sinh-vien/:maSV` kèm Bearer JWT Token từ Axios client.
    4. Xử lý phản hồi mã HTTP chuẩn xác:
       - **200 OK**: Hiển thị thông báo thành công và tự động gọi lại hàm `fetchSinhViens` để làm mới danh sách từ CSDL.
       - **401 Unauthorized**: Thông báo phiên làm việc hết hạn hoặc chưa đăng nhập.
       - **403 Forbidden**: Thông báo từ chối truy cập (không có quyền Admin).
       - **404 Not Found**: Thông báo sinh viên không tồn tại trong CSDL, giữ nguyên danh sách hiện tại (không xóa dòng giả lập phía UI).
    5. Viết script kiểm thử tự động `test-step9-rbac-delete.ts` để kiểm chứng 4 lần thử: Chưa login (401), Student ép gọi DELETE (403), Admin xóa thành công (200), Admin xóa lại mã đã xóa (404).
  - **Constraint (C)**: Không che giấu lỗi 401/403/404; không coi việc ẩn nút trên UI là giải pháp bảo mật (bảo vệ cốt lõi nằm ở Backend `isAuth` + `isAdmin`); chú thích chi tiết từng dòng code.
  - **Output (O)**: Mã nguồn `SinhVienTable.tsx`, `App.tsx`, `App.css`, script `test-step9-rbac-delete.ts` đạt kết quả 4/4 ca PASS (100%), và bảng kết quả kiểm chứng.
- **Các file đã thêm / cập nhật**:
  - `frontend/src/components/SinhVienTable.tsx`: Thêm prop `isAdmin`, `onDelete`, hộp thoại xác nhận `window.confirm`, banner thông báo phản hồi và xử lý các status code 200/401/403/404.
  - `frontend/src/App.tsx`: Truyền cờ `isAdmin` (`userProfile.role === 'admin'`) và hàm `handleDeleteSinhVien` gọi Axios DELETE kèm header Authorization Bearer Token.
  - `frontend/src/App.css`: Thêm kiểu dáng nút `.btn-delete`, `.table-feedback-alert`, `.feedback-success`, `.feedback-error`.
  - `src/scripts/test-step9-rbac-delete.ts`: Script kiểm thử tự động 4 ca RBAC Delete.
  - `package.json`: Thêm lệnh `"test:delete:step9": "tsx src/scripts/test-step9-rbac-delete.ts"`.
  - `docs/test-results.md`: Cập nhật bảng kiểm thử Bước 9.
- **Kết quả kiểm thử thực tế (4/4 ca PASS - 100%)**:
  - `Lần thử 1 (Chưa login)`: Gọi DELETE không gửi token -> Trả về **401 Unauthorized**, bản ghi CSDL được bảo toàn (PASS).
  - `Lần thử 2 (Student)`: Dùng token Student ép gọi DELETE qua API -> Trả về **403 Forbidden**, bản ghi CSDL không bị xóa lén (PASS).
  - `Lần thử 3 (Admin)`: Dùng token Admin xóa sinh viên test -> Trả về **200 OK**, gọi lại GET trả về **404 Not Found** (đã dọn sạch khỏi SQL Server) (PASS).
  - `Lần thử 4 (Admin xóa lại)`: Gọi lại DELETE với cùng mã SV -> Trả về **404 Not Found**, giao diện giữ dữ liệu nhất quán (PASS).

---

## 21. Nhật ký Prompt: Chương 07 - Bước 10: Upload Avatar trực tiếp trên giao diện React (Trang 16)
- **Khung CTCO**:
  - **Context (C)**: Hệ thống Backend đã hoàn tất API `POST /api/auth/me/avatar` bảo vệ bởi `isAuth`, Multer giới hạn 2MB và kiểm tra Magic Bytes. Frontend React Vite đã có `LoginForm.tsx`, `UserProfileCard.tsx` và cơ chế quản lý Token JWT trong bộ nhớ ứng dụng.
  - **Task (T)**:
    1. Xây dựng component `AvatarUpload.tsx` với thẻ `<input type="file" accept="image/png,image/jpeg">`.
    2. Kiểm tra sơ bộ dung lượng 2MB và định dạng MIME phía Frontend để báo lỗi tức thì cho người dùng.
    3. Hỗ trợ xem trước ảnh (Preview) trước khi nhấn tải lên bằng `URL.createObjectURL(file)`.
    4. Đóng gói dữ liệu vào `FormData.append('avatar', file)`, gửi request `POST /api/auth/me/avatar` kèm Bearer JWT Token.
    5. Không tự đặt thủ công `Content-Type: multipart/form-data` để trình duyệt tự động đính kèm tham số `boundary`.
    6. Xử lý trạng thái `uploading` (hiển thị spinner, vô hiệu hóa nút submit), thông báo thành công hoặc lỗi chi tiết (400, 401, 413, 500).
    7. Sau khi nhận 200 OK, tự động kích hoạt gọi lại `GET /api/auth/profile` để cập nhật `avatarUrl` mới nhất từ SQL Server vào thẻ hồ sơ và thanh tiêu đề Header.
    8. Viết script kiểm thử tự động `test-step10-avatar-upload.ts` xác minh luồng end-to-end 6 ca kiểm thử.
  - **Constraint (C)**: Tên trường bắt buộc là `avatar`; không gửi kèm `userId` (tuân thủ bảo mật tuyệt đối, lấy ID từ JWT); giữ nguyên cấu trúc API cũ; chú thích code từng dòng.
  - **Output (O)**: Mã nguồn `AvatarUpload.tsx`, cập nhật `client.ts`, `App.tsx`, `App.css`, script `test-step10-avatar-upload.ts` đạt kết quả 6/6 ca PASS (100%), và bảng đối chiếu kết quả.
- **Các file đã thêm / cập nhật**:
  - `frontend/src/components/AvatarUpload.tsx`: Tạo mới component tải ảnh với preview, validation và gọi API.
  - `frontend/src/api/client.ts`: Tối ưu cấu hình tự động xóa Content-Type cố định khi dữ liệu là `FormData`.
  - `frontend/src/App.tsx`: Tích hợp `AvatarUpload` vào `UserProfileCard`, hiển thị ảnh đại diện thu nhỏ trên Header.
  - `frontend/src/App.css`: Bổ sung toàn bộ style cho preview ảnh, file picker, spinner và alert.
  - `src/scripts/test-step10-avatar-upload.ts`: Script kiểm thử tự động 6 ca kiểm chứng upload avatar.
  - `package.json`: Bổ sung script `"test:upload:step10": "tsx src/scripts/test-step10-avatar-upload.ts"`.
  - `docs/test-results.md`: Cập nhật bảng kết quả kiểm thử Bước 10.
- **Kết quả kiểm thử thực tế (6/6 ca PASS - 100%)**:
  - `TEST 1 (Upload hợp lệ)`: POST `avatar` thành công -> Trả về **HTTP 200 OK**, `data.avatarUrl` bắt đầu bằng `/uploads/` (PASS).
  - `TEST 2 (Cập nhật SQL)`: GET `/api/auth/profile` trả về đúng `avatarUrl` mới từ SQL Server (PASS).
  - `TEST 3 (Static Serv)`: Mở ảnh tĩnh `GET http://localhost:5000/uploads/...` trả về **HTTP 200 OK** (PASS).
  - `TEST 4 (File vật lý)`: Tệp tin tồn tại thực tế trên ổ cứng trong thư mục `public/uploads/` (PASS).
  - `TEST 5 (Chống quá 2MB)`: Gửi tệp 2.5MB bị chặn đứng với mã **HTTP 413 Payload Too Large** (PASS).
  - `TEST 6 (Chống giả mạo)`: Tệp văn bản đổi đuôi `.png` bị chặn với mã **HTTP 400 Bad Request** (PASS).
