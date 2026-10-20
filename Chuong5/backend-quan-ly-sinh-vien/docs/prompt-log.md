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
