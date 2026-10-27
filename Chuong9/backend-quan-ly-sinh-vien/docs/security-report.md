# Security Review – Chapter 09

> **Dự án**: `backend-quan-ly-sinh-vien` (Express 5 + TypeScript + Sequelize 6 + SQL Server)  
> **Nguồn code đã kiểm tra**:  
> - `src/app.ts` & `src/server.ts`  
> - `src/middlewares/rate-limit.middleware.ts`, `src/middlewares/isAuth.ts`, `src/middlewares/isAdmin.ts`, `src/middlewares/error.middleware.ts`, `src/middlewares/validate.middleware.ts`, `src/middlewares/upload.middleware.ts`  
> - `src/routes/auth.routes.ts`, `src/routes/sinhVien.routes.ts`  
> - `src/controllers/auth.controller.ts`, `src/controllers/sinhVien.controller.ts`  
> - `src/services/auth.service.ts`, `src/services/sinhVien.service.ts`  
> - `src/repositories/sinhVien.repository.ts`  
> - `src/validations/auth.schema.ts`, `src/validations/sinhVien.schema.ts`, `src/validations/sinhVien.query.ts`  

---

## 1. Phạm vi và phương pháp review

### 1.1. Phạm vi kiểm tra (Scope)
Kiểm tra an ninh toàn diện 5 nhóm rủi ro theo yêu cầu của Giáo trình Thực hành Chương 09 (Trang 21):
1. **SQL Injection**: Kiểm tra việc sử dụng ORM Sequelize, các câu lệnh Raw SQL và cơ chế bind/replacements tham số.
2. **Cross-Site Scripting (XSS)**: Kiểm tra cơ chế render và xử lý dữ liệu từ client truyền lên, thiết lập CSP từ Helmet.
3. **Lộ lọt thông tin bí mật & Stack trace**: Kiểm tra biến môi trường `.env`, log Morgan/Console, cấu trúc response ở HTTP 500.
4. **Kiểm soát truy cập & Phân quyền (Authentication / RBAC)**: Thứ tự các middleware trên route ghi (`POST`, `PUT`, `DELETE`), việc chặn quyền `student`.
5. **Chống Brute-force / Spam Login (Rate Limiting)**: Kiểm tra cấu hình và hoạt động của middleware `loginLimiter`.

### 1.2. Phương pháp thực hiện
- **Static Code Analysis (Phân tích mã nguồn tĩnh)**: Soát từng file, kiểm tra thứ tự middleware pipeline, cấu hình Zod validation, kiểm tra sanitize đầu vào.
- **Dynamic Testing (Kiểm thử động)**: Sử dụng Jest và Supertest tự động hóa gửi request hợp lệ, request bất thường, request spam và request vượt quyền để đối chiếu response thực tế.

---

## 2. Bảng phát hiện chi tiết (Findings)

| ID | Nhóm rủi ro | Vị trí (File & Dòng) | Hiện trạng trong mã nguồn | Mức độ rủi ro | Đánh giá & Bằng chứng kỹ thuật |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **SEC-01** | **SQL Injection** | `src/repositories/sinhVien.repository.ts` | Sử dụng Sequelize ORM `findAndCountAll`, `findByPk`, `create`, `update`, `destroy` với cấu trúc `where: { hoTen: { [Op.like]: ... } }` | **AN TOÀN (Thấp)** | **ĐÃ XỬ LÝ TỐT**: Không hề sử dụng ghép chuỗi thô (String concatenation). Sequelize tự động chuyển đổi tham số sang Parameterized Query (`@p0`, `@p1`) trên TDS Protocol của SQL Server, vô hiệu hóa hoàn toàn SQL Injection. |
| **SEC-02** | **XSS** | `src/app.ts` (Helmet) & Frontend React | `app.use(helmet())` thiết lập HTTP Headers; React JSX tự động escape text | **AN TOÀN (Thấp)** | **ĐÃ XỬ LÝ TỐT**: Helmet tự động thêm `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`. Frontend React không sử dụng `dangerouslySetInnerHTML`. |
| **SEC-03** | **Lộ bí mật / Log / 500** | `src/middlewares/error.middleware.ts` (Dòng 124-140) | Khi lỗi 500 không xác định phát sinh, response trả về: `{ success: false, status: 500, message: 'Lỗi hệ thống, vui lòng thử lại sau', data: null }` | **AN TOÀN (Thấp)** | **ĐÃ XỬ LÝ TỐT**: Thông điệp lỗi hoàn toàn trung lập; không tiết lộ câu truy vấn SQL, tên bảng, user DB hay mật khẩu. Ở môi trường Production (`NODE_ENV=production`), thuộc tính `stack` bị loại bỏ 100%. |
| **SEC-04** | **Phân quyền RBAC** | `src/routes/sinhVien.routes.ts` (Dòng 47-85) | `router.delete('/:maSV', isAuth, isAdmin, xoaSinhVien)` | **AN TOÀN (Thấp)** | **ĐÃ XỬ LÝ TỐT**: Middleware `isAuth` chạy trước để xác thực token và giải mã payload, tiếp theo `isAdmin` kiểm tra `req.user.role === 'admin'`. Nếu student gọi sẽ bị chặn với mã **HTTP 403 Forbidden**. |
| **SEC-05** | **Spam Login / Brute-force** | `src/routes/auth.routes.ts` (Trước Lab 2) | Route `POST /api/auth/login` trước đó chưa có bộ đếm giới hạn request | **TRUNG BÌNH (Cần khắc phục)** | Kẻ tấn công có thể dùng công cụ tự động gửi hàng nghìn mật khẩu để dò mật khẩu tài khoản người dùng hoặc làm cạn kiệt tài nguyên CPU do thuật toán băm Bcrypt tốn nhiều chi phí tính toán. |

---

## 3. Điều chỉnh đã thực hiện trong Lab 2

1. **Cài đặt thư viện bảo vệ tần suất**: Cài đặt `express-rate-limit`.
2. **Tạo mới `src/middlewares/rate-limit.middleware.ts`**:
   - Cấu hình cửa sổ thời gian: `windowMs: 60 * 1000` (60 giây).
   - Ngưỡng giới hạn: tối đa **5 request** từ cùng một địa chỉ IP.
   - Chuẩn Header: `standardHeaders: 'draft-7'` xuất header `RateLimit`.
   - Phản hồi chuẩn hóa: Mã HTTP **429 Too Many Requests**, body `{ success: false, status: 429, message: 'Bạn đã gửi quá nhiều yêu cầu', data: null }`.
3. **Gắn vào pipeline của route Login trong `src/routes/auth.routes.ts`**:
   ```typescript
   router.post('/login', loginLimiter, validate(loginSchema), login);
   ```
   *Thứ tự bảo vệ nghiêm ngặt*: `loginLimiter` (chặn 429 nếu spam) ➔ `validate(loginSchema)` (chặn 400 nếu sai kiểu) ➔ `login` controller (xử lý xác thực 200/401).

---

## 4. Kết quả kiểm thử trước và sau điều chỉnh

| Ca kiểm thử | Trước khi cấu hình `loginLimiter` | Sau khi cấu hình `loginLimiter` (Hiện tại) | Kết luận |
| :--- | :---: | :---: | :---: |
| **Gửi 5 request login liên tiếp trong 60s** | HTTP 200 / 401 | HTTP 200 / 401 (Xử lý bình thường) | **PASS** |
| **Gửi request thứ 6 trong cùng 60s** | Vẫn được xử lý (Nguy cơ brute-force) | Bị chặn ngay với **HTTP 429 Too Many Requests** | **PASS (Đã vá thành công)** |
| **GET /api/v1/sinh-vien khi login bị 429** | HTTP 200 | Vẫn nhận **HTTP 200 OK** (Không bị ảnh hưởng chéo) | **PASS** |
| **Độ phủ kiểm thử bảo mật tự động** | Chưa có file test bảo mật riêng | Đạt **100% PASS** bộ kiểm thử `tests/api/security.api.test.ts` (S01–S07) | **PASS** |

---

## 5. Các rủi ro còn lại và khuyến nghị cho Production
1. **Lưu trữ bộ đếm trong Memory (Memory Store)**: Hiện tại `express-rate-limit` lưu trữ bộ đếm số lần gọi trong bộ nhớ RAM của tiến trình Node.js hiện tại. Khi triển khai hệ thống có nhiều container chạy song song (Scale ngang) hoặc chạy sau Reverse Proxy (Nginx, Cloudflare), cần cấu hình `app.set('trust proxy', 1)` và kết nối sang Redis Store (`rate-limit-redis`) để chia sẻ bộ đếm tập trung.
2. **Thời hạn hết hạn của Token**: Access Token hiện có thời hạn 3600s (1 giờ). Với môi trường sản xuất có độ nhạy cảm cao, khuyến nghị giảm xuống 15 phút kết hợp cơ chế Refresh Token xoay vòng (Token Rotation).
