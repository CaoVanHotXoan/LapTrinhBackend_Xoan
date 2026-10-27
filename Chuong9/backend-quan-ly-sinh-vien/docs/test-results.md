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

---

# Bảng Kết Quả Kiểm Thử Upload Hình Ảnh & Multer (U01 – U12) - Chương 07 (Bước 4)

> **Môi trường thử nghiệm**: Node.js v24 + Express + TypeScript + Multer + SQL Server (Sequelize)  
> **Base URL**: `http://localhost:5000`  
> **Thư mục lưu trữ**: `public/uploads` (công khai ảnh hợp lệ), `temp_uploads` (thư mục tạm kiểm tra chữ ký)  
> **Script kiểm thử tự động**: `pnpm run test:u12` (`src/scripts/test-u01-u12.ts`)  
> **Bộ sưu tập Postman**: `postman/Chuong7-Upload-Avatar.postman_collection.json`

## 📋 Ma trận 12 Ca Kiểm thử Multer, JWT và Lưu trữ

| Mã ca | Method / URL | Dữ liệu kiểm thử | Expected | Actual | PASS/FAIL | Ba lớp bằng chứng (HTTP, Đĩa, SQL) | Lỗi và cách xử lý |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **U01** | `POST /api/auth/me/avatar` | Form-data `avatar`: ảnh PNG hợp lệ + Bearer Token Student | **200** | **200** | **PASS** | 1. HTTP: `success: true`, `data.avatarUrl` bắt đầu bằng `/uploads/`<br>2. Đĩa: file mới sinh bằng UUID trong `public/uploads`<br>3. SQL: `SELECT avatarUrl FROM dbo.Users` khớp chính xác | Không có lỗi. |
| **U02** | `GET /uploads/<filename>` | Truy cập đường dẫn tĩnh của file JPEG vừa upload thành công | **200** | **200** | **PASS** | Trình duyệt và client tải được toàn bộ nội dung nhị phân của ảnh tĩnh qua Express static. | Cấu hình Helmet `crossOriginResourcePolicy: { policy: 'cross-origin' }`. |
| **U03** | `POST /api/auth/me/avatar` | Form-data `avatar`: file PNG hợp lệ nhưng **không có Header Authorization** | **401** | **401** | **PASS** | `isAuth` chặn trước khi vào Multer. Số lượng file trên đĩa không tăng, DB không bị UPDATE. | Không có lỗi. |
| **U04** | `POST /api/auth/me/avatar` | Token giả mạo hoặc chữ ký bị sửa đổi (`invalid.token.signature`) | **401** | **401** | **PASS** | `jwt.verify` phát hiện chữ ký sai, từ chối cấp quyền, không sinh URL mới. | Không có lỗi. |
| **U05** | `POST /api/auth/me/avatar` | Token hợp lệ nhưng Body không đính kèm file | **400** | **400** | **PASS** | Controller phát hiện `!req.file`, trả lỗi `400 Bad Request`, SQL không thay đổi. | Không có lỗi. |
| **U06** | `POST /api/auth/me/avatar` | Dùng tên field `photo` thay vì `avatar` | **400** | **400** | **PASS** | Multer ném `LIMIT_UNEXPECTED_FILE`, error middleware trả về `400 Bad Request`. | Bắt `MulterError` trong `error.middleware.ts`. |
| **U07** | `POST /api/auth/me/avatar` | File ảnh kích thước > 2MB (mẫu 2.5MB) | **413** | **413** | **PASS** | Multer ném `LIMIT_FILE_SIZE`, error middleware chuyển đổi thành HTTP 413, không để lại file rác. | Bắt đúng mã `LIMIT_FILE_SIZE` và trả status 413. |
| **U08** | `POST /api/auth/me/avatar` | Tệp văn bản plain text nhưng đổi tên thành `avatar.png` | **400** | **400** | **PASS** | Middleware đọc 8 byte đầu (Magic Bytes), phát hiện không phải PNG/JPEG, xóa file tạm ngay lập tức. | Kiểm tra chữ ký file thực, xóa sạch file tạm rác. |
| **U09** | `POST /api/auth/me/avatar` | Định dạng file `.gif` hoặc MIME lạ không được cấp phép | **400** | **400** | **PASS** | Bộ lọc sơ bộ `fileFilter` từ chối ngay từ đầu, không cho lưu vào thư mục công khai. | Không có lỗi. |
| **U10** | `POST /api/auth/me/avatar` | Upload ảnh lần 2 cho cùng 1 tài khoản | **200** | **200** | **PASS** | Sinh tên file mới độc lập bằng UUID (`v4`), cập nhật URL mới trên DB, không ghi đè bất ngờ. | Dùng `crypto.randomUUID()` sinh tên file. |
| **U11** | `POST /api/auth/me/avatar` | Student A upload kèm `userId` của Student B trong body | **200** | **200** | **PASS** | Chỉ User A được cập nhật avatar mới; `SELECT avatarUrl FROM dbo.Users WHERE id = B` vẫn giữ nguyên. | Luôn lấy `userId` từ `req.user.id`, tuyệt đối bỏ qua `req.body.userId`. |
| **U12** | `GET /api/auth/profile` | Truy vấn lại hồ sơ sau khi server restart | **200** | **200** | **PASS** | `avatarUrl` vẫn được lưu bền vững trong SQL Server, URL tĩnh mở được, tuyệt đối không lộ `passwordHash`. | Không có lỗi. |

---

# Bảng Kết Quả Kiểm Thử Nút Xóa Sinh Viên & Phân Quyền RBAC - Chương 07 (Bước 9)

> **Môi trường thử nghiệm**: Node.js v24 + Express + TypeScript + SQL Server (Sequelize) + React Vite Frontend  
> **Base URL**: `http://localhost:5000` (Backend), `http://localhost:5173` (Frontend)  
> **Endpoint kiểm thử**: `DELETE /api/v1/sinh-vien/:maSV`  
> **Script kiểm thử tự động**: `pnpm run test:delete:step9` (`src/scripts/test-step9-rbac-delete.ts`)

## 📋 Trình tự 4 Lần thử Kiểm thử Bắt buộc (Trang 15)

| Lần thử | Vai trò | Thao tác thực hiện | Expected Status | Actual Status | PASS/FAIL | Bằng chứng bảo mật & Nhất quán dữ liệu |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **1** | **Chưa login** | Gọi `DELETE /api/v1/sinh-vien/SV999` mà **không gửi Token** | **401 Unauthorized** | **401 Unauthorized** | **PASS** | Phía Frontend: Chưa đăng nhập không hiển thị nút xóa. Nếu client gọi trực tiếp qua Postman/cURL, `isAuth` chặn đứng ngay từ tầng HTTP, bản ghi SQL Server nguyên vẹn 100%. |
| **2** | **Student** | Login bằng tài khoản Student (`role: 'student'`), ép gọi `DELETE /api/v1/sinh-vien/SV999` qua Network/API | **403 Forbidden** | **403 Forbidden** | **PASS** | Phía Frontend: Không render nút Xóa khi `role !== 'admin'`. Phía Backend: Middleware `isAdmin` chặn lại với mã 403 Forbidden, bản ghi SQL Server không bị xóa lén (Bảo vệ thật nằm ở Backend). |
| **3** | **Admin** | Login bằng tài khoản Admin (`role: 'admin'`), bấm nút **🗑️ Xóa** trên giao diện React (mã `SV999`) | **200 OK** | **200 OK** | **PASS** | 1. Hộp thoại xác nhận hiển thị chính xác mã SV `[SV999]`.<br>2. Gọi `DELETE` thành công nhận 200 OK.<br>3. Banner thông báo xanh hiển thị thành công.<br>4. Tự động gọi lại `GET` làm mới danh sách; gọi `GET /api/v1/sinh-vien/SV999` trả về 404 (bản ghi đã biến mất khỏi CSDL). |
| **4** | **Admin** | Admin cố tình gọi lại `DELETE /api/v1/sinh-vien/SV999` lần thứ 2 với cùng mã vừa xóa | **404 Not Found** | **404 Not Found** | **PASS** | Backend trả về 404 Not Found vì bản ghi không tồn tại trong CSDL. Phía Frontend: Banner hiển thị cảnh báo đỏ thân thiện, giữ nguyên danh sách hiện tại (không xóa dòng giả lập), bảo toàn tính nhất quán dữ liệu. |

---

# Bảng Kết Quả Kiểm Thử Upload Avatar Trực Tiếp Trên React - Chương 07 (Bước 10)

> **Môi trường thử nghiệm**: Node.js v24 + Express + TypeScript + Multer + SQL Server + React Vite + Axios  
> **Base URL**: `http://localhost:5000` (Backend), `http://localhost:5173` (Frontend)  
> **Endpoint kiểm thử**: `POST /api/auth/me/avatar` & `GET /api/auth/profile`  
> **Script kiểm thử tự động**: `pnpm run test:upload:step10` (`src/scripts/test-step10-avatar-upload.ts`)

## 📋 Ma trận Kiểm thử Luồng Upload Avatar End-to-End (Trang 16 & Ca F11)

| Ca kiểm thử | Nội dung kiểm tra | Dữ liệu gửi / Thao tác | Expected Status | Actual Status | PASS/FAIL | Bằng chứng ba lớp (Network, Đĩa, SQL) |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **T10-01** | Upload ảnh PNG hợp lệ với Bearer Token | `FormData` trường `avatar` chứa ảnh PNG thật + `Authorization: Bearer <token>` | **200 OK** | **200 OK** | **PASS** | 1. Network: Request `multipart/form-data` có boundary tự động, nhận `avatarUrl` dạng `/uploads/<uuid>.png`.<br>2. SQL Server: CSDL cập nhật `dbo.Users.avatarUrl`.<br>3. UI: Hiển thị thông báo thành công và kích hoạt refresh. |
| **T10-02** | Làm mới hồ sơ tự động từ SQL Server | Sau khi 200 OK, gọi `GET /api/auth/profile` lấy lại hồ sơ | **200 OK** | **200 OK** | **PASS** | `profile.avatarUrl` trong SQL Server khớp 100% với URL vừa tải lên. Ảnh hiển thị tức thì trên thẻ hồ sơ cá nhân và thanh Header. |
| **T10-03** | Phục vụ ảnh tĩnh qua Express Static | Trình duyệt truy cập `GET http://localhost:5000/uploads/<filename>` | **200 OK** | **200 OK** | **PASS** | Express Static phục vụ đúng tệp nhị phân, Header `Content-Type: image/png`, mở được trực tiếp trên trình duyệt. |
| **T10-04** | Kiểm chứng tệp vật lý lưu trên ổ đĩa | Kiểm tra thư mục `public/uploads/` trên hệ điều hành | **Tệp tồn tại** | **Tệp tồn tại** | **PASS** | Tệp tin ảnh được ghi nhận đầy đủ dung lượng và tên file an toàn bằng `UUID v4` không trùng lặp. |
| **T10-05** | Ngăn chặn tệp kích thước lớn > 2MB | Gửi tệp có dung lượng 2.5MB (kiểm tra cả Frontend và Backend) | **413 Payload Too Large** | **413 Payload Too Large** | **PASS** | Phía Frontend: Báo lỗi ngay lập tức không gửi đi. Phía Backend: Multer bắt `LIMIT_FILE_SIZE` trả về HTTP 413, không sinh tệp rác. |
| **T10-06** | Ngăn chặn tệp giả mạo đổi đuôi | Tệp văn bản thuần đổi tên thành `fake.png` | **400 Bad Request** | **400 Bad Request** | **PASS** | Middleware đọc Magic Bytes, phát hiện không có chữ ký ảnh hợp lệ, xóa sạch file tạm và từ chối với status 400. |

---

# Bảng Kết Quả Ma Trận 12 Ca Kiểm Thử Frontend (F01 – F12) - Chương 07 (Trang 18)

> **Môi trường thử nghiệm**: Trình duyệt Chrome / Edge (DevTools Network) & Script tự động Node.js  
> **Origin Frontend**: `http://localhost:5173` (Vite + React + Axios)  
> **Backend URL**: `http://localhost:5000` (Express + CORS + JWT + Multer + SQL Server)  
> **Script kiểm thử tự động**: `pnpm run test:f12` (`src/scripts/test-f01-f12.ts`)

## 📋 Kết Quả 12 Ca Kiểm Thử Vite, Axios, CORS và Phân Quyền

| Mã ca | Tình huống kiểm thử | Thao tác thực tế | Kỳ vọng (Expected) | Thực tế (Actual) | PASS/FAIL | Bằng chứng xác minh (DevTools Network / Console) |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **F01** | Vite chạy, Backend bật | Mở trình duyệt truy cập `http://localhost:5173` | **Trang mở thành công** | **Trang mở thành công** | **PASS** | Network: Request `GET http://localhost:5000/api/v1/sinh-vien` trả về **HTTP 200 OK**, Header `Access-Control-Allow-Origin: http://localhost:5173`. |
| **F02** | GET danh sách có dữ liệu | Quan sát bảng sinh viên trên giao diện | **Render đủ 4 cột** | **Render đủ 4 cột** | **PASS** | Bảng hiển thị 4 cột: Mã SV, Họ và tên, Email, Mã lớp. Dữ liệu khớp 100% các bản ghi từ bảng `dbo.SinhVien` trong SQL Server. |
| **F03** | GET data = [] | Khi Backend trả mảng dữ liệu rỗng `data: []` | **Empty State** | **Empty State** | **PASS** | Giao diện hiển thị thông báo thân thiện: *"Hiện tại chưa có sinh viên nào trong hệ thống"*, trang không bị crash hay trắng màn hình. |
| **F04** | Backend tắt khi GET | Tắt Backend hoặc gọi sai cổng khi đang tải | **Error State** | **Error State** | **PASS** | Component bắt lỗi kết nối, tắt spinner loading, hiển thị khung cảnh báo màu vàng *"Lỗi kết nối máy chủ"* kèm nút **"🔄 Thử lại"**, không bị xoay loading vô hạn. |
| **F05** | Bật lại Backend, bấm thử lại | Khởi động lại Backend và nhấn nút **"🔄 Thử lại"** | **HTTP 200 OK** | **HTTP 200 OK** | **PASS** | Network gửi lại `GET /api/v1/sinh-vien` thành công trả về 200 OK. Bảng dữ liệu tự động phục hồi hiển thị danh sách sinh viên. |
| **F06** | Login đúng student | Nhập tài khoản sinh viên hợp lệ và bấm Đăng nhập | **HTTP 200 OK** | **HTTP 200 OK** | **PASS** | `POST /api/auth/login` trả về 200 OK + `accessToken`. Gọi tiếp `GET /api/auth/profile` nhận dữ liệu thật từ JWT, render Thẻ hồ sơ và huy hiệu `🎓 Sinh Viên`. |
| **F07** | Login sai mật khẩu | Nhập mật khẩu sai và bấm Đăng nhập | **HTTP 401 Unauthorized** | **HTTP 401 Unauthorized** | **PASS** | Network trả về 401. State token giữ nguyên `null` (không lưu token rác), hiển thị alert đỏ: *"Sai email hoặc mật khẩu đăng nhập!"*. |
| **F08** | GET Profile thiếu token | Gửi request `GET /api/auth/profile` không kèm header Bearer | **HTTP 401 Unauthorized** | **HTTP 401 Unauthorized** | **PASS** | `isAuth` chặn đứng ngay từ tầng HTTP, trả về 401. Giao diện yêu cầu đăng nhập lại, tuyệt đối không rò rỉ dữ liệu hồ sơ cá nhân. |
| **F09** | Student ép gọi DELETE | Tài khoản Sinh viên mở Console/Postman ép gửi `DELETE /api/v1/sinh-vien/:maSV` | **HTTP 403 Forbidden** | **HTTP 403 Forbidden** | **PASS** | Giao diện không render nút Xóa. Khi bị ép request, `isAdmin` chặn lại với mã 403. Dữ liệu CSDL SQL Server được bảo toàn 100% (không tin cậy UI). |
| **F10** | Admin bấm DELETE bản ghi test | Đăng nhập Admin, bấm nút **"🗑️ Xóa"** trên dòng sinh viên test | **HTTP 200 OK** | **HTTP 200 OK** | **PASS** | Hộp thoại `window.confirm` hiển thị đúng mã SV -> DELETE trả 200 OK -> Banner xanh thành công -> Tự động gọi lại GET loại bỏ bản ghi khỏi bảng. |
| **F11** | Avatar hợp lệ upload từ React | Chọn ảnh PNG ≤ 2MB và bấm **"🚀 Tải Lên Ảnh Đại Diện"** | **HTTP 200 OK** | **HTTP 200 OK** | **PASS** | Network gửi `multipart/form-data` có boundary tự động, trả về 200 OK + `avatarUrl`. Thẻ hồ sơ và Header lập tức cập nhật ảnh mới, file vật lý lưu trong `public/uploads/`. |
| **F12** | Origin khác Origin allowlist | Gửi request từ một Origin không được phép (ví dụ `http://untrusted.com`) | **CORS chặn** | **CORS chặn** | **PASS** | Trình duyệt chặn request vì Backend không cấp header `Access-Control-Allow-Origin` cho Origin lạ. Chứng minh tính năng bảo mật CORS thật của trình duyệt. |

---

# Bảng Kết Quả Ma Trận 17 Ca Kiểm Thử Pagination & Search (P01 – P17) - Chương 08 (Trang 13 - 14)

> **Môi trường thử nghiệm**: Node.js v24 + Express 5 + TypeScript + Sequelize 6 + SQL Server  
> **Base URL**: `http://localhost:5000`  
> **Endpoint kiểm thử**: `GET /api/v1/sinh-vien`  
> **Script kiểm thử tự động**: `pnpm run test:p17` (`src/scripts/test-p01-p17.ts`)  
> **Dữ liệu kiểm chứng**: Bảng `dbo.SinhVien` có 5 sinh viên: SV001 (Nguyễn Minh Nhật), SV002 (Trần Lan Anh), SV003 (Lê Tuấn Anh), SV004 (Hoàng Minh Ngọc), SV005 (Phạm Quốc Bảo).

## 📋 Bảng tổng hợp 17 Test Cases Ma trận Lab 1 (P01 – P17)

| Mã | Request / Tình huống | Method & Endpoint | Kỳ vọng (Expected) | Thực tế (Actual) | PASS/FAIL | Bằng chứng xác minh & Chi tiết phản hồi |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **P01** | GET danh sách mặc định (không truyền query) | `GET /api/v1/sinh-vien` | **200 OK** | **200 OK** | **PASS** | `data` là mảng 5 sinh viên; `pagination`: `page=1`, `limit=10`, `totalItems=5`, `totalPages=1`. |
| **P02** | Phân trang: lấy trang 1 với limit = 2 | `GET ?page=1&limit=2` | **200 OK** | **200 OK** | **PASS** | Tối đa 2 bản ghi đầu theo `maSV ASC`: `[SV001, SV002]`, `totalItems=5`, `totalPages=3`. |
| **P03** | Phân trang: lấy trang 2 với limit = 2 | `GET ?page=2&limit=2` | **200 OK** | **200 OK** | **PASS** | Tối đa 2 bản ghi tiếp theo: `[SV003, SV004]`; hoàn toàn không trùng lặp với trang 1 (P02). |
| **P04** | Phân trang: lấy trang 3 (trang cuối) | `GET ?page=3&limit=2` | **200 OK** | **200 OK** | **PASS** | Trang cuối lấy 1 bản ghi dư duy nhất: `[SV005]`, đúng phép tính $5 - (2 \times 2) = 1$. |
| **P05** | Phân trang: trang vượt quá tổng số trang | `GET ?page=999&limit=2` | **200 OK** | **200 OK** | **PASS** | `data=[]` (mảng rỗng, không báo lỗi 500); `totalItems=5` và `totalPages=3` vẫn chính xác. |
| **P06** | Query validation: page là số nguyên âm | `GET ?page=-1` | **400 Bad Request** | **400 Bad Request** | **PASS** | Bị chặn trước Database. `message: "Tham số page phải là số nguyên dương lớn hơn hoặc bằng 1"`. |
| **P07** | Query validation: page = 0 | `GET ?page=0` | **400 Bad Request** | **400 Bad Request** | **PASS** | Trang bắt đầu từ 1. `message: "Tham số page phải là số nguyên dương lớn hơn hoặc bằng 1"`. |
| **P08** | Query validation: page là số thập phân | `GET ?page=1.5` | **400 Bad Request** | **400 Bad Request** | **PASS** | Không chấp nhận số thập phân. Bị chặn bởi Regex `/^[1-9]\d*$/`. |
| **P09** | Query validation: limit là chuỗi ký tự | `GET ?limit=abc` | **400 Bad Request** | **400 Bad Request** | **PASS** | Không trả 500; `message: "Tham số limit phải là số nguyên dương"`. |
| **P10** | Query validation: limit vượt quá 50 | `GET ?limit=51` | **400 Bad Request** | **400 Bad Request** | **PASS** | Chặn limit vượt ngưỡng. `message: "Tham số limit phải nằm trong khoảng từ 1 đến 50"`. |
| **P11** | Tìm kiếm theo tên: `search=Anh` | `GET ?search=Anh` | **200 OK** | **200 OK** | **PASS** | Trả về đúng 2 sinh viên chứa "Anh": `[SV002 - Trần Lan Anh, SV003 - Lê Tuấn Anh]`. |
| **P12** | Tìm kiếm kết hợp phân trang | `GET ?search=Anh&page=2&limit=2` | **200 OK** | **200 OK** | **PASS** | `totalItems=2` là tổng KẾT QUẢ LỌC (không phải 5 của toàn bảng); `totalPages=1`; trang 2 trả về `data=[]`. |
| **P13** | Tìm kiếm từ khóa không có kết quả | `GET ?search=khongco` | **200 OK** | **200 OK** | **PASS** | `data=[]`, `totalItems=0`, `totalPages=0` theo đúng quy ước bài lab khi không có dữ liệu. |
| **P14** | Tìm kiếm có khoảng trắng thừa | `GET ?search=%20Anh%20` | **200 OK** | **200 OK** | **PASS** | Được tự động trim thành `"Anh"`, kết quả trả về 2 sinh viên khớp 100% với P11. |
| **P15** | Tìm kiếm từ khóa vượt quá 80 ký tự | `GET ?search=[81 ký tự]` | **400 Bad Request** | **400 Bad Request** | **PASS** | Chặn từ khóa quá dài. `message: "Từ khóa tìm kiếm không được vượt quá 80 ký tự"`. |
| **P16** | Kiểm chứng câu lệnh SQL Server thật | `GET ?page=2&limit=2` | **200 OK** | **200 OK** | **PASS** | SQL log chứng minh thực thi `ORDER BY [maSV] ASC OFFSET 2 ROWS FETCH NEXT 2 ROWS ONLY`. |
| **P17** | Kiểm thử hồi quy chức năng Chương 07 | `CRUD + JWT Auth Profile` | **Như cũ** | **Như cũ** | **PASS** | `GET /:maSV` (200), `POST` (201), `PUT` (200), `DELETE` (200), `GET /profile` (200). Không bị hồi quy. |

## 💡 Tự giải thích câu hỏi cốt lõi Bước 5 (Trang 11)
> **Câu hỏi**: *"Một sinh viên 'Lan Anh' đang ở vị trí thứ 30 theo maSV. Vì sao cách lấy 10 dòng đầu rồi mới filter sẽ không tìm thấy bạn ấy?"*  
> **Trả lời**:  
> Nếu Backend hoặc Frontend thực hiện lấy 10 dòng đầu tiên (Trang 1: từ vị trí 1 đến 10 theo `maSV`) rồi mới dùng hàm `.filter()` trên mảng JavaScript để tìm kiếm, thì tập dữ liệu đang xét chỉ vỏn vẹn gồm 10 sinh viên đầu.  
> Trong khi đó, sinh viên "Lan Anh" đang nằm ở vị trí thứ 30 (thuộc Trang 3), nên hoàn toàn không nằm trong tập 10 dòng được lấy về. Kết quả filter khi đó sẽ trả về mảng rỗng `[]`, gây sai lệch dữ liệu nghiêm trọng và bỏ sót bản ghi.  
> **Nguyên tắc kỹ thuật đúng**: Mệnh đề điều kiện `WHERE hoTen LIKE '%Lan Anh%'` bắt buộc phải được áp dụng trực tiếp tại CSDL SQL Server **TRƯỚC** khi thực hiện đếm `COUNT` và chia trang `OFFSET / FETCH`.

---

# Bảng Kết Quả Ma Trận 10 Ca Kiểm Thử Lỗi (E01 – E10) - Chương 08 Lab 2 (Trang 18)

> **Môi trường thử nghiệm**: Node.js v24 + Express 5 (Async Error Flow) + TypeScript + Sequelize 6 + SQL Server  
> **Base URL**: `http://localhost:5000`  
> **Scripts kiểm thử tự động**:  
> - `pnpm run test:buoc7` (`src/scripts/test-buoc7-audit-error-handling.ts`): Khảo sát & kiểm toán hệ thống  
> - `pnpm run test:buoc8` (`src/scripts/test-buoc8-error-standardization.ts`): Kiểm thử chuẩn hóa phản hồi lỗi  
> - `pnpm run test:e10` (`src/scripts/test-e01-e10.ts`): Ma trận kiểm thử lỗi E01 - E10  

## 📋 Bảng tổng hợp 10 Test Cases Ma trận Lab 2 (E01 – E10)

| Mã | Tình huống kiểm thử | Method & Endpoint | HTTP Kỳ vọng | HTTP Thực tế | PASS/FAIL | Bằng chứng xác minh & Chi tiết phản hồi an toàn |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **E01** | `GET ?page=-5` | `GET /api/v1/sinh-vien?page=-5` | **400 Bad Request** | **400 Bad Request** | **PASS** | `success=false`; `status=400`; `data=null`; `message: "Tham số page phải là số nguyên dương lớn hơn hoặc bằng 1"`. |
| **E02** | `GET ?limit=abc` | `GET /api/v1/sinh-vien?limit=abc` | **400 Bad Request** | **400 Bad Request** | **PASS** | Bị Zod schema chặn trước Database; `status=400`; `message: "Tham số limit phải là số nguyên dương"`. |
| **E03** | `GET /api/v1/sinh-vien/SV999` | `GET /api/v1/sinh-vien/SV999` | **404 Not Found** | **404 Not Found** | **PASS** | Không tìm thấy sinh viên; Controller ném `AppError(404)` qua Async Flow của Express 5; `message: "Không tìm thấy sinh viên"`. |
| **E04** | `GET /duong-dan-khong-co` | `GET /duong-dan-khong-co` | **404 Not Found** | **404 Not Found** | **PASS** | Fallback 404 hoạt động chuẩn xác; `status=404`; `data=null`; `message: "Không tìm thấy đường dẫn"`. |
| **E05** | Lỗi 500 mô phỏng trong development | `GET /api/test-500-error` | **500 Internal Error** | **500 Internal Error** | **PASS** | Tuyệt đối không rò rỉ SQL query text, mật khẩu, biến môi trường hay connection string; thông điệp công khai: *"Lỗi hệ thống, vui lòng thử lại sau"*. |
| **E06** | `NODE_ENV=production, test 500` | Mô phỏng Production | **500 Internal Error** | **500 Internal Error** | **PASS** | Môi trường Production chặn hoàn toàn stack trace gửi về Client, bảo đảm an toàn thông tin máy chủ. |
| **E07** | `NODE_ENV=development, test 500` | Môi trường Development | **500 Internal Error** | **500 Internal Error** | **PASS** | Cho phép đính kèm trường `stack` cục bộ để phục vụ lập trình viên gỡ lỗi nhanh. |
| **E08** | `GET /api/auth/profile` thiếu token | `GET /api/auth/profile` | **401 Unauthorized** | **401 Unauthorized** | **PASS** | Middleware `isAuth` cũ vẫn chặn chuẩn xác; `message: "Vui lòng cung cấp mã xác thực Bearer Token hợp lệ"`. |
| **E09** | Student ép DELETE bản ghi test | `DELETE /api/v1/sinh-vien/SV001` | **403 Forbidden** | **403 Forbidden** | **PASS** | Middleware `isAdmin` từ chối quyền student; CSDL SQL Server được bảo toàn nguyên vẹn 100%. |
| **E10** | Upload sai trường file (Multer) | `POST /api/auth/me/avatar` | **400 Bad Request** | **400 Bad Request** | **PASS** | Bắt lỗi thiếu field hoặc sai field file; thông báo rõ ràng: *"Vui lòng chọn tập tin ảnh đại diện để tải lên (tên trường "avatar")"*. |

---

## 🎯 Tổng kết Kiểm thử Lab 2: 10/10 ca PASSED (100%)
- Hệ thống xử lý lỗi tập trung toàn diện, chuẩn hóa hợp đồng API `{ success: false, status, message, data: null }`.
- Tận dụng triệt để Async Error Flow của Express 5, loại bỏ hoàn toàn các khối `try/catch` bọc lặp máy móc.
- Bảo mật thông tin tuyệt đối: không rò rỉ chi tiết nội bộ hệ thống ở mã lỗi 500.

---

# BÁO CÁO KẾT QUẢ KIỂM THỬ AUTOMATED TESTING (CHƯƠNG 09 - LAB 1)

> **Môi trường thử nghiệm**: Node.js v24.21.0 + Express 5.2.1 + TypeScript 5.9.3 + ESM/NodeNext  
> **Thư viện kiểm thử**: Jest 30.5.2, ts-jest 29.4.15, Supertest 7.3.1  
> **Kiến trúc ứng dụng**: Tách riêng `src/app.ts` (Express instance) và `src/server.ts` (Port & DB listener)  
> **Cấu hình Jest**: `jest.config.mjs` + `tsconfig.spec.json`  

---

## 1. 📋 Bảng 5 Unit Test cho nghiệp vụ Đăng nhập (T01 – T05)
*Vị trí file: `tests/unit/login.test.ts` (Kỹ thuật Mock: `jest.spyOn(User, 'findOne')`, `jest.spyOn(bcrypt, 'compare')`)*

| ID | Tình huống kiểm thử | Dữ liệu đầu vào (Input) | Expected Result | Actual Result | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **T01** | Tài khoản có, mật khẩu đúng | Email hợp lệ, mật khẩu đúng | Xác thực thành công, cấp Token Bearer, thời hạn 3600s | Trả về `{ accessToken, tokenType: 'Bearer', expiresIn: 3600 }` | **PASS** |
| **T02** | Tài khoản có, mật khẩu sai | Email có, mật khẩu sai (`compare => false`) | Từ chối, ném AppError(401), không cấp JWT | Ném AppError(401, 'Email hoặc mật khẩu không chính xác') | **PASS** |
| **T03** | Tài khoản không tồn tại | Email chưa đăng ký (`findOne => null`) | Từ chối, ném AppError(401), không cấp JWT, không gọi bcrypt | Ném AppError 401, bcrypt.compare không được kích hoạt | **PASS** |
| **T04** | Thiếu email hoặc password | Object rỗng `{}` hoặc email sai định dạng | Validation Zod Schema từ chối trước khi xử lý | `loginSchema.safeParse` trả về `success: false` | **PASS** |
| **T05** | Lỗi Database / kết nối | Giả lập `User.findOne` ném `Error('SQL Server timeout')` | Xử lý an toàn, ném lỗi hệ thống không lộ cấu trúc | Ném ngoại lệ an toàn cho Express Global Error Handler | **PASS** |

---

## 2. 📋 Bảng 7 API Test HTTP/JWT với Supertest (A01 – A07)
*Vị trí file: `tests/api/auth.api.test.ts` (Gọi HTTP trực tiếp qua `supertest(app)`, không mở PORT)*

| ID | Tình huống kiểm thử | Method & Endpoint | Payload / Header | HTTP Kỳ vọng | HTTP Thực tế | Bằng chứng xác minh | Trạng thái |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **A01** | Login hợp lệ | `POST /api/auth/login` | `{ email, password }` đúng | **200** | **200** | `body.success=true`, `body.data.accessToken` tồn tại dạng JWT chuỗi | **PASS** |
| **A02** | Sai mật khẩu | `POST /api/auth/login` | Mật khẩu sai | **401** | **401** | `body.success=false`, `data=null`, không chứa token | **PASS** |
| **A03** | User không tồn tại | `POST /api/auth/login` | Email lạ | **401** | **401** | `body.success=false`, `data=null`, thông điệp an toàn | **PASS** |
| **A04** | Thiếu trường bắt buộc | `POST /api/auth/login` | `{}` (thiếu cả email và password) | **400** | **400** | Validation middleware chặn lại, trả thông báo lỗi Zod | **PASS** |
| **A05** | GET Profile thiếu JWT | `GET /api/auth/profile` | Không gửi Header `Authorization` | **401** | **401** | Middleware `isAuth` chặn: *"Vui lòng cung cấp mã xác thực Bearer Token hợp lệ"* | **PASS** |
| **A06** | GET Profile có JWT hợp lệ | `GET /api/auth/profile` | `Authorization: Bearer <token_hợp_lệ>` | **200** | **200** | Trả về đúng thông tin `id: 101`, `email`, `role: 'student'` | **PASS** |
| **A07** | Lỗi hệ thống giả lập | `GET /api/test-500-error` | Không có | **500** | **500** | Phản hồi *"Lỗi hệ thống, vui lòng thử lại sau"*, không rò rỉ secret/SQL | **PASS** |

---

## 3. 🔍 Nhật ký phân tích tình huống FAIL có chủ đích và khắc phục (Trang 12 & 16)
- **Tình huống xảy ra**: Khi cấu hình `ts-jest` cho dự án TypeScript ESM (`NodeNext`), ban đầu file `tsconfig.spec.json` đặt `"noEmit": true`. Khi chạy `pnpm test`, `ts-compiler` gặp lỗi:
  ```
  FAIL tests/unit/login.test.ts
  Unable to process '...tests/unit/login.test.ts', please make sure that `outDir` in your tsconfig is neither '' or '.'.
  ```
- **Nguyên nhân kỹ thuật**: Khi `noEmit: true` kích hoạt trong `tsconfig`, trình biên dịch TypeScript luôn đánh dấu `emitSkipped: true`. `ts-jest` khi thấy cờ `emitSkipped: true` sẽ coi là không thể xử lý file `.ts` và báo lỗi. Đồng thời, thiếu gói `@jest/globals` trực tiếp để nạp kiểu dữ liệu `describe/test/expect`.
- **Biện pháp khắc phục**:
  1. Điều chỉnh `tsconfig.spec.json` sang `"noEmit": false` và `"outDir": "./dist-test"` để cho phép TypeScript sinh mã trung gian trong bộ nhớ cho `ts-jest`.
  2. Bổ sung gói devDependency `@jest/globals`.
  3. Cấu hình `diagnostics.ignoreCodes: [151002]` trong `jest.config.mjs` để triệt tiêu cảnh báo `isolatedModules`.
- **Kết quả sau khi khắc phục**: Chạy lại `pnpm test` đạt **100% PASS** (13/13 ca kiểm thử).

---

## 4. 📊 Báo cáo đo lường Coverage thực tế (`pnpm test:coverage`)

```text
---------------------------|---------|----------|---------|---------|---------------------------
File                       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s         
---------------------------|---------|----------|---------|---------|---------------------------
All files                  |   33.96 |    22.43 |   27.27 |    34.2 |                           
 src                       |   88.23 |      100 |   33.33 |   88.23 |                           
  app.ts                   |   88.23 |      100 |   33.33 |   88.23 | 79,106                    
 src/config                |      80 |    70.83 |     100 |      80 |                           
  database.ts              |   76.47 |       60 |     100 |   76.47 | 16,19,22,28               
  swagger.config.ts        |    87.5 |    88.88 |     100 |    87.5 | 40                        
 src/controllers           |   17.39 |     8.33 |   22.22 |   17.39 |                           
  auth.controller.ts       |   26.66 |       10 |      50 |   26.66 | 16-31,70-77,94-149        
 src/middlewares           |   36.84 |    30.58 |   41.17 |   36.84 |                           
  isAuth.ts                |   66.66 |    81.81 |     100 |   66.66 | 34-41,51-58,73-80         
  error.middleware.ts      |   43.47 |    44.44 |     100 |   43.47 | 30,64-92,99-105,112-118   
 src/services              |   12.39 |     7.14 |   18.75 |    12.5 |                           
  auth.service.ts          |   46.42 |       50 |      50 |   46.42 | 27-57,125,149-167         
 src/utils                 |   84.21 |       60 |     100 |   84.21 |                           
  AppError.ts              |     100 |      100 |     100 |     100 |                           
  jwt.ts                   |   78.57 |       60 |     100 |   78.57 | 31,62-64                  
 src/validations           |   33.33 |        0 |       0 |   33.33 |                           
  auth.schema.ts           |     100 |      100 |     100 |     100 |                           
---------------------------|---------|----------|---------|---------|---------------------------
Test Suites: 3 passed, 3 total
Tests:       13 passed, 13 total
Snapshots:   0 total
```



