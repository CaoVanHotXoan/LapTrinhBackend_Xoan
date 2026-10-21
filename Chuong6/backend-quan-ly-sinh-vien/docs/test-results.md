# Bảng Kết Quả Kiểm Thử (12 Test Cases Bắt Buộc) - Buổi 5

> **Môi trường thử nghiệm**: Node.js + Express + TypeScript + SQL Server (Sequelize)  
> **Base URL**: `http://localhost:5000`  
> **Giao thức**: HTTP RESTful JSON API

---

## 📋 Bảng tổng hợp 12 Test Cases

| ID | Thao tác / Điều kiện thử nghiệm | Method & URL | Body Request (JSON) | Expected Status | Actual Status | Xác nhận thêm & Kiểm chứng dữ liệu | Kết luận |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **T01** | Lấy danh sách toàn bộ sinh viên | `GET /api/v1/sinh-vien` | *Không có* | **200** | **200** | `data` trả về là một mảng danh sách sinh viên (kể cả mảng `[]`). | **PASS** |
| **T02** | Thêm mới sinh viên `SV003` hợp lệ (chưa tồn tại) | `POST /api/v1/sinh-vien` | `{"maSV":"SV003","hoTen":"Ngọc Mai","email":"ngocmai@example.com","maLop":"25CT114"}` | **201** | **201** | Trả về `success: true`, `GET /api/v1/sinh-vien/SV003` đọc được đúng thông tin vừa tạo. | **PASS** |
| **T03** | Thêm lại sinh viên `SV003` lần 2 (trùng mã khóa chính) | `POST /api/v1/sinh-vien` | `{"maSV":"SV003","hoTen":"Ngọc Mai","email":"ngocmai@example.com","maLop":"25CT114"}` | **409** | **409** | Báo lỗi trùng mã `Mã sinh viên đã tồn tại`, chỉ tồn tại duy nhất 1 bản ghi `SV003`. | **PASS** |
| **T04** | Thêm sinh viên mới thiếu trường `hoTen` | `POST /api/v1/sinh-vien` | `{"maSV":"SV004","email":"test@example.com","maLop":"25CT114"}` | **400** | **400** | Báo lỗi dữ liệu không hợp lệ, không tạo thêm bản ghi mới `SV004` trong CSDL. | **PASS** |
| **T05** | Lấy chi tiết `SV003` vừa tạo | `GET /api/v1/sinh-vien/SV003` | *Không có* | **200** | **200** | Trả về đúng 4 trường: `maSV`, `hoTen`, `email`, `maLop`. | **PASS** |
| **T06** | Cập nhật `SV003` với đầy đủ 3 trường | `PUT /api/v1/sinh-vien/SV003` | `{"hoTen":"Ngọc Mai Updated","email":"ngocmai@example.com","maLop":"25CT114"}` | **200** | **200** | `GET /api/v1/sinh-vien/SV003` kiểm chứng thấy `hoTen` đã đổi thành `Ngọc Mai Updated`. | **PASS** |
| **T07** | Cập nhật `SV003` nhưng thiếu trường `email` | `PUT /api/v1/sinh-vien/SV003` | `{"hoTen":"Ngọc Mai Loi","maLop":"25CT114"}` | **400** | **400** | Từ chối cập nhật, `GET` lại thấy dữ liệu cũ của `SV003` được giữ nguyên vẹn. | **PASS** |
| **T08** | Cập nhật mã không tồn tại `SV9999` với body hợp lệ | `PUT /api/v1/sinh-vien/SV9999` | `{"hoTen":"Khong Co","email":"none@example.com","maLop":"25CT114"}` | **404** | **404** | Báo lỗi không tìm thấy sinh viên, không tự ý chèn thêm bản ghi mới. | **PASS** |
| **T09** | Lấy thông tin sinh viên không tồn tại `SV9999` | `GET /api/v1/sinh-vien/SV9999` | *Không có* | **404** | **404** | Trả về `success: false`, `data: null` hoặc thông báo lỗi phù hợp. | **PASS** |
| **T10** | Xóa sinh viên thử nghiệm `SV003` | `DELETE /api/v1/sinh-vien/SV003` | *Không có* | **200** | **200** | Trả về `{"success": true, "message": "Xóa sinh viên thành công"}` (không có `data`). | **PASS** |
| **T11** | Lấy lại thông tin `SV003` sau khi đã xóa | `GET /api/v1/sinh-vien/SV003` | *Không có* | **404** | **404** | Trả về 404 chứng minh bản ghi đã thực sự bị xóa khỏi CSDL. | **PASS** |
| **T12** | Xóa lại `SV003` lần 2 (đã xóa trước đó) | `DELETE /api/v1/sinh-vien/SV003` | *Không có* | **404** | **404** | Báo lỗi không tìm thấy sinh viên, không gây ảnh hưởng tới các dữ liệu khác. | **PASS** |

---

## 🔍 Giải thích các câu hỏi kiểm chứng (Validation & Persistence)
1. **Tại sao phải thực hiện `GET` lại sau khi `POST`, `PUT`, `DELETE`?**
   - Phản hồi HTTP `200/201` của request chỉ phản ánh kết quả trả về từ controller. Việc gọi lại `GET` giúp kiểm chứng thực tế dữ liệu đã được ghi, cập nhật hoặc xóa vĩnh viễn trong CSDL hay chưa, tránh trường hợp server chỉ trả JSON giả lập.
2. **Tại sao `DELETE` lần 2 trả về `404` là đúng?**
   - Vì bản ghi đã bị xóa ở lần 1 nên không còn tồn tại trong hệ thống. Lần gọi thứ hai không tìm thấy đối tượng cần xóa nên việc trả về `404 Not Found` là chính xác theo chuẩn RESTful.

---

# Bảng Kết Quả Kiểm Thử Validation & Logging (V01 - V12) - Buổi 6

> **Môi trường thử nghiệm**: Node.js 20+ + Express + TypeScript + Zod + Morgan + SQL Server  
> **Base URL**: `http://localhost:5000`  
> **File nhật ký**: `logs/access.log` (chế độ append)

## 📋 Bảng tổng hợp 12 Test Cases Validation (V01 – V12)

| Mã | Request / Tình huống | Method & Endpoint | Payload Body | Kỳ vọng | Thực tế | Xác minh thêm & Kiểm chứng dữ liệu | Kết luận |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **V01** | POST SV006 đủ 4 trường hợp lệ | `POST /api/v1/sinh-vien` | `{"maSV":"SV006","hoTen":"Nguyễn Minh An","email":"minhan@example.com","maLop":"25CT114"}` | **201** | **201** | `GET /api/v1/sinh-vien/SV006` đọc được đúng dữ liệu SV006 vừa tạo. | **PASS** |
| **V02** | POST thiếu hoTen, mã SV khác | `POST /api/v1/sinh-vien` | `{"maSV":"SV007","email":"sv007@example.com","maLop":"25CT114"}` | **400** | **400** | Không thêm sinh viên; `errors` có `field=hoTen`. | **PASS** |
| **V03** | POST email không đúng định dạng | `POST /api/v1/sinh-vien` | `{"maSV":"SV008","hoTen":"Lê Hoài Nam","email":"email-sai-dinh-dang","maLop":"25CT114"}` | **400** | **400** | `errors` có `field=email`, message="Email không hợp lệ". | **PASS** |
| **V04** | POST có thêm `role: "admin"` | `POST /api/v1/sinh-vien` | `{"maSV":"SV009","hoTen":"Vũ Hải Đăng","email":"haidang@example.com","maLop":"25CT114","role":"admin"}` | **400** | **400** | Zod `.strict()` chặn và từ chối trường lạ `role`. | **PASS** |
| **V05** | PUT SV006 thiếu email | `PUT /api/v1/sinh-vien/SV006` | `{"hoTen":"Nguyễn Minh An Updated","maLop":"25CT114"}` | **400** | **400** | `GET /api/v1/sinh-vien/SV006` kiểm chứng email cũ `minhan@example.com` vẫn bảo toàn. | **PASS** |
| **V06** | PUT SV006 đủ 3 trường hợp lệ | `PUT /api/v1/sinh-vien/SV006` | `{"hoTen":"Nguyễn Minh An Updated","email":"an.updated@example.com","maLop":"25CT114"}` | **200** | **200** | `GET /api/v1/sinh-vien/SV006` thấy dữ liệu mới (`Nguyễn Minh An Updated`, `an.updated@example.com`). | **PASS** |
| **V07** | PUT SV006 email sai kiểu (số) | `PUT /api/v1/sinh-vien/SV006` | `{"hoTen":"Nguyễn Minh An","email":123456,"maLop":"25CT114"}` | **400** | **400** | Không ghi dữ liệu sai; `errors` báo kiểu chuỗi không hợp lệ. | **PASS** |
| **V08** | POST maSV đã tồn tại | `POST /api/v1/sinh-vien` | `{"maSV":"SV006","hoTen":"Nguyễn Minh An Trùng","email":"trung@example.com","maLop":"25CT114"}` | **409** | **409** | Không tạo trùng; tầng Database/Service báo mã sinh viên đã tồn tại. | **PASS** |
| **V09** | PUT mã không tồn tại, body hợp lệ | `PUT /api/v1/sinh-vien/SV9999` | `{"hoTen":"Không Tồn Tại","email":"khongtontai@example.com","maLop":"25CT114"}` | **404** | **404** | Báo không tìm thấy sinh viên; không tạo thêm bản ghi mới. | **PASS** |
| **V10** | GET danh sách sinh viên | `GET /api/v1/sinh-vien` | *Không có* | **200** | **200** | `data` trả về là một mảng Array danh sách sinh viên. | **PASS** |
| **V11** | GET / và kiểm tra logs | `GET /` | *Không có* | **200** | **200** | `logs/access.log` có thêm dòng log mới theo chuẩn Morgan combined. | **PASS** |
| **V12** | Restart server, gọi GET lần nữa | `GET /` | *Không có* | **200** | **200** | `logs/access.log` được ghi nối (append với `flags: 'a'`), không bị mất log cũ. | **PASS** |

---

# Bảng Kết Quả Kiểm Thử Authentication & JWT (A01 - A12) - Buổi 7

> **Môi trường thử nghiệm**: Node.js + Express + TypeScript + SQL Server (Sequelize) + Bcrypt + JWT (HS256)  
> **Base URL**: `http://localhost:5000`  
> **Chuẩn mã hóa**: Bcrypt salt rounds 12, JWT hạn dùng 1h (`expiresIn: 3600`)

## 📋 Bảng tổng hợp kết quả kiểm thử Register & Login (A01 – A12)

| Mã | Request / Tình huống | Method & Endpoint | Payload Body (JSON) | Kỳ vọng | Thực tế | Bằng chứng kiểm chứng | PASS/FAIL | Nguyên nhân nếu FAIL |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- | :---: | :--- |
| **A01** | Register email mới, body hợp lệ | `POST /api/auth/register` | `{"fullName":"Nguyen Minh An","email":"an.lab@example.com","password":"SinhVien@123"}` | **201** | **201** | User tồn tại trong DB, `role=student`, `passwordHash` dạng `$2b$12$...` (không lưu plaintext), response không chứa password/hash. | **PASS** | Không |
| **A02** | Register trùng email A01 | `POST /api/auth/register` | `{"fullName":"Nguyen Minh An Trùng","email":"an.lab@example.com","password":"OtherPassword@123"}` | **409** | **409** | Báo lỗi `Email đã tồn tại trong hệ thống`, số lượng User trong DB không tăng. | **PASS** | Không |
| **A03** | Register body thêm `role=admin` | `POST /api/auth/register` | `{"fullName":"Attacker","email":"attacker@example.com","password":"Password@123","role":"admin"}` | **400** | **400** | Zod `.strict()` chặn và từ chối trường lạ `role`, không tạo tài khoản Admin. | **PASS** | Không |
| **A04** | Register thiếu password / email sai định dạng | `POST /api/auth/register` | `{"fullName":"Test User","email":"not-an-email"}` | **400** | **400** | Zod schema từ chối với mảng lỗi chi tiết, không ghi dữ liệu lỗi vào CSDL. | **PASS** | Không |
| **A05** | Login đúng tài khoản student | `POST /api/auth/login` | `{"email":"an.lab@example.com","password":"SinhVien@123"}` | **200** | **200** | Cấp `data.accessToken` JWT hợp lệ có 3 phần (`header.payload.signature`), `tokenType: "Bearer"`, `expiresIn: 3600`, payload có `sub` (id) và `role: student`. | **PASS** | Không |
| **A06** | Login sai password | `POST /api/auth/login` | `{"email":"an.lab@example.com","password":"SaiMatKhau@999"}` | **401** | **401** | Báo lỗi `Email hoặc mật khẩu không chính xác`, không trả accessToken. | **PASS** | Không |
| **A07** | Login email không tồn tại | `POST /api/auth/login` | `{"email":"khongtontai@example.com","password":"BatKyPassword@123"}` | **401** | **401** | Báo lỗi `Email hoặc mật khẩu không chính xác` (trùng thông báo với A06, không làm lộ thông tin tài khoản tồn tại). | **PASS** | Không |
| **A08** | GET /api/auth/profile không có token | `GET /api/auth/profile` | *Không có* | **401** | **401** | Báo lỗi `Vui lòng cung cấp mã xác thực Bearer Token hợp lệ`, không nhận data hồ sơ. | **PASS** | Không |
| **A09** | Profile với token bị sửa 1 ký tự | `GET /api/auth/profile` | *Không có* (Header: `Bearer <tamperedToken>`) | **401** | **401** | Báo lỗi `Mã xác thực không hợp lệ hoặc đã hết hạn`, chữ ký không qua xác minh. | **PASS** | Không |
| **A10** | Profile với JWT student hợp lệ | `GET /api/auth/profile` | *Không có* (Header: `Bearer <validToken>`) | **200** | **200** | Trả về thông tin hồ sơ đúng user (`Nguyen Minh An`, role `student`), tuyệt đối không chứa `passwordHash`. | **PASS** | Không |
| **A11** | Token hết hạn gọi Profile | `GET /api/auth/profile` | *Không có* (Header: `Bearer <expiredToken>`) | **401** | **401** | Báo lỗi `Mã xác thực không hợp lệ hoặc đã hết hạn`, bắt lỗi token hết hạn chính xác. | **PASS** | Không |
| **A12** | Register/login và xem SQL Server | `GET /api/auth/profile` & SSMS | *Không có* | **PASS** | **PASS** | CSDL chỉ lưu chuỗi băm bcrypt `$2b$12$...` (không lưu plaintext password), console và access.log không log JWT secret hay mã nhạy cảm. | **PASS** | Không |

---

# Bảng Kết Quả Kiểm Thử Phân Quyền RBAC SinhVien (B01 - B12) - Buổi 7

> **Môi trường thử nghiệm**: Node.js + Express + TypeScript + SQL Server (Sequelize) + isAuth + isAdmin  
> **Base URL**: `http://localhost:5000`  
> **Nguyên tắc phân quyền**: GET công khai (Public), POST / PUT / DELETE bắt buộc Bearer Token role `admin`

## 📋 Bảng tổng hợp kết quả kiểm thử phân quyền SinhVien (B01 – B12)

| Mã | Request / Tình huống | Method & Endpoint | Header & Body (JSON) | Kỳ vọng | Thực tế | Kiểm chứng thêm (Database / State) | PASS/FAIL | Nguyên nhân nếu FAIL |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- | :---: | :--- |
| **B01** | GET danh sách, không JWT | `GET /api/v1/sinh-vien` | *Không có header / body* | **200** | **200** | `data` trả về là một mảng danh sách sinh viên, giữ public hoàn toàn. | **PASS** | Không |
| **B02** | POST SinhVien, không JWT | `POST /api/v1/sinh-vien` | Body SV099, không có Authorization header | **401** | **401** | Bị chặn bởi `isAuth`, SELECT DB kiểm chứng bản ghi SV099 KHÔNG được chèn vào DB. | **PASS** | Không |
| **B03** | PUT SinhVien, token không hợp lệ | `PUT /api/v1/sinh-vien/SV001` | Header `Bearer token-sai`, Body sửa tên | **401** | **401** | Bị chặn bởi `isAuth`, SELECT DB kiểm chứng họ tên SV001 giữ nguyên vẹn không bị đổi. | **PASS** | Không |
| **B04** | DELETE SinhVien, JWT student | `DELETE /api/v1/sinh-vien/SV001` | Header `Bearer <studentToken>` | **403** | **403** | Bị chặn bởi `isAdmin`, SELECT DB kiểm chứng bản ghi SV001 vẫn tồn tại trong CSDL. | **PASS** | Không |
| **B05** | POST SinhVien, JWT student | `POST /api/v1/sinh-vien` | Header `Bearer <studentToken>`, Body SV099 | **403** | **403** | Bị chặn bởi `isAdmin`, SELECT DB kiểm chứng KHÔNG có bản ghi SV099 nào được tạo. | **PASS** | Không |
| **B06** | PUT SinhVien, JWT student | `PUT /api/v1/sinh-vien/SV001` | Header `Bearer <studentToken>`, Body sửa tên | **403** | **403** | Bị chặn bởi `isAdmin`, SELECT DB kiểm chứng dữ liệu SV001 không hề bị UPDATE. | **PASS** | Không |
| **B07** | POST SinhVien hợp lệ, JWT admin | `POST /api/v1/sinh-vien` | Header `Bearer <adminToken>`, Body SV088 | **201** | **201** | `isAuth` và `isAdmin` cho qua, GET lại / SELECT DB tìm thấy đúng bản ghi SV088 mới. | **PASS** | Không |
| **B08** | PUT SinhVien hợp lệ, JWT admin | `PUT /api/v1/sinh-vien/SV088` | Header `Bearer <adminToken>`, Body tên mới | **200** | **200** | Cập nhật thành công, GET lại / SELECT DB thấy họ tên SV088 đã thực sự thay đổi. | **PASS** | Không |
| **B09** | DELETE SinhVien, JWT admin | `DELETE /api/v1/sinh-vien/SV088` | Header `Bearer <adminToken>` | **200** | **200** | Xóa thành công, GET lại SV088 trả về mã 404 (chứng minh đã bị xóa khỏi DB). | **PASS** | Không |
| **B10** | Admin POST body sai Zod | `POST /api/v1/sinh-vien` | Header `Bearer <adminToken>`, Body rỗng hoTen | **400** | **400** | Vượt qua isAuth và isAdmin nhưng bị Zod validation chặn, trường `errors` chỉ ra lỗi. | **PASS** | Không |
| **B11** | Admin POST mã bị trùng | `POST /api/v1/sinh-vien` | Header `Bearer <adminToken>`, Body mã SV001 | **409** | **409** | Báo lỗi trùng mã `Mã sinh viên đã tồn tại`, không tạo thêm bản ghi trùng lặp. | **PASS** | Không |
| **B12** | DELETE cùng mã lần thứ 2 bằng Admin | `DELETE /api/v1/sinh-vien/SV088` | Header `Bearer <adminToken>` | **404** | **404** | Báo lỗi `Không tìm thấy sinh viên` (chuẩn RESTful vì không còn dữ liệu để xóa). | **PASS** | Không |

---

# Bảng Kết Quả Kiểm Thử Swagger UI & OpenAPI 3.0.3 (SW01 - SW15) - Buổi 7 (Bước 9)

> **Môi trường thử nghiệm**: Node.js + Express + TypeScript + Swagger UI + js-yaml + OpenAPI 3.0.3  
> **Base URL**: `http://localhost:5000`  
> **Đường dẫn Swagger UI**: `http://localhost:5000/api-docs`  
> **Đặc tả API**: `docs/openapi.yaml`

## 📋 Bảng tổng hợp kết quả kiểm thử Swagger OpenAPI (SW-01 – SW-15)

| Mã | Hạng mục kiểm tra | Chi tiết kiểm chứng | Kỳ vọng | Thực tế | PASS/FAIL |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **SW-01** | Kiểm tra sự tồn tại của file YAML | `docs/openapi.yaml` tồn tại | File tồn tại | File tồn tại | **PASS** |
| **SW-02** | Phân tích cú pháp YAML | `js-yaml.load(content)` | Parse thành công | Parse thành công | **PASS** |
| **SW-03** | Chuẩn OpenAPI | Thuộc tính `openapi` | `3.0.3` | `3.0.3` | **PASS** |
| **SW-04** | Thông tin tổng quan (Info) | `info.title`, `info.version` | Khai báo đầy đủ | Khai báo đầy đủ | **PASS** |
| **SW-05** | Cấu hình Security Scheme | `components.securitySchemes.bearerAuth` | `http`, `bearer`, `JWT` | `http`, `bearer`, `JWT` | **PASS** |
| **SW-06** | Endpoint POST Register | `/api/auth/register` | 201, 400, 409 | 201, 400, 409 | **PASS** |
| **SW-07** | Endpoint POST Login | `/api/auth/login` | 200, 400, 401 | 200, 400, 401 | **PASS** |
| **SW-08** | Endpoint GET Profile | `/api/auth/profile` có security bearerAuth | 200, 401 | 200, 401 | **PASS** |
| **SW-09** | GET Danh sách sinh viên | `/api/v1/sinh-vien` | Public (không security) | Public (không security) | **PASS** |
| **SW-10** | GET Chi tiết sinh viên | `/api/v1/sinh-vien/{maSV}` | Public (không security) | Public (không security) | **PASS** |
| **SW-11** | POST Thêm mới sinh viên | `/api/v1/sinh-vien` | Security bearerAuth, 401, 403 | Security bearerAuth, 401, 403 | **PASS** |
| **SW-12** | PUT Cập nhật sinh viên | `/api/v1/sinh-vien/{maSV}` | Security bearerAuth, 401, 403 | Security bearerAuth, 401, 403 | **PASS** |
| **SW-13** | DELETE Xóa sinh viên | `/api/v1/sinh-vien/{maSV}` | Security bearerAuth, 401, 403 | Security bearerAuth, 401, 403 | **PASS** |
| **SW-14** | Khai báo các Schemas cốt lõi | Register, Login, UserPublic, SinhVien, ErrorResponse | Đầy đủ Schemas | Đầy đủ Schemas | **PASS** |
| **SW-15** | Endpoint Swagger UI Runtime | `GET http://localhost:5000/api-docs/` | HTTP 200 OK | HTTP 200 OK | **PASS** |

---

# Bảng Kết Quả Kiểm Thử An Ninh Bảo Mật (SEC01 - SEC06) - Buổi 7 (Bước 11)

> **Môi trường thử nghiệm**: Node.js + Express + TypeScript + Bcrypt + JWT (HS256) + Zod .strict()  
> **Mục tiêu**: Rà soát và ngăn chặn 6 lỗ hổng bảo mật kinh điển do AI sinh mã sai lầm (Trang 18)  
> **Script kiểm thử**: `pnpm test:step11` (`src/scripts/test-step11-security.ts`)

## 📋 Bảng tổng hợp kết quả Security Audit (SEC-01 – SEC-06)

| Mã | Tiêu chí bảo mật | Chi tiết kiểm chứng | Kỳ vọng | Thực tế | PASS/FAIL |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **SEC-01** | Chống Plaintext Password | CSDL chỉ lưu chuỗi băm `bcrypt` cost 12 (`$2b$12$`), xác thực bằng `bcrypt.compare` | Không lưu plaintext | `$2b$12$...` (60 ký tự) | **PASS** |
| **SEC-02** | Chống Khóa Bí mật Yếu | `JWT_SECRET` đọc từ `.env`, không hard-code và độ dài >= 32 ký tự | Secret mạnh, >= 32 ký tự | Secret 53 ký tự | **PASS** |
| **SEC-03** | Chống Token Vĩnh viễn | Token có trường `exp` xác định, hết hạn chính xác sau 1 giờ (`exp - iat = 3600`) | `expiresIn: 3600s` | `expiresIn: 3600s` | **PASS** |
| **SEC-04** | Chống Leo thang Đặc quyền | Zod schema với `.strict()` từ chối mọi request đăng ký cố tình gửi kèm `role: "admin"` | Bị chặn 400 Bad Request | Bị chặn 400 Bad Request | **PASS** |
| **SEC-05** | Chống Giả mạo Chữ ký JWT | Bắt buộc dùng `jwt.verify` (từ chối token sửa đổi payload/chữ ký, `jwt.decode` bị lừa) | Ném lỗi `invalid signature` | Ném lỗi `invalid signature` | **PASS** |
| **SEC-06** | Chống Rò rỉ Dữ liệu Nhạy cảm | Phản hồi từ các endpoint Register, Login, Profile không bao giờ chứa `password` hay `passwordHash` | Tuyệt đối không lộ hash | Không lộ hash/password | **PASS** |



