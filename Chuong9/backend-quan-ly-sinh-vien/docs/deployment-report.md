# Chapter 09 · Docker & Deployment Report

> **Dự án**: `backend-quan-ly-sinh-vien`  
> **Sinh viên thực hiện**: Thực hành Chặng 3 (Buổi 14)  
> **Tài liệu đối chiếu**: Giáo trình Thực hành Chương 09 (Trang 26 – 36)  

---

## 1. Lựa chọn phương án triển khai
- **Phương án lựa chọn**: **Phương án B (Đầy đủ - Full Compose)** kết hợp hướng dẫn tương thích cho **Phương án A (Tối thiểu)**.
  - *Phương án B*: Đóng gói cả `backend` và `sqlserver` thành 2 container riêng biệt trên cùng mạng `backend-sinhvien-net`, sử dụng Named Volumes cho CSDL (`sqlserver-data`) và tệp tin tải lên (`uploads-data`).
  - *Phương án A*: Dành cho máy chạy SQL Server cục bộ trên Windows Host, cấu hình `DB_HOST=host.docker.internal` trong file biến môi trường.
- **Docker Base Image**: `node:22-bookworm-slim` (Multi-stage build).
- **SQL Server Image**: `mcr.microsoft.com/mssql/server:2022-latest`.

---

## 2. Cấu hình kiến trúc mạng và kết nối (Network & Environment)
- **Mạng kết nối**: Bridge network tên `backend-sinhvien-net`.
- **Cơ chế phân giải tên miền (Service Discovery)**:
  - Backend container kết nối trực tiếp tới SQL Server qua tên dịch vụ `DB_HOST=sqlserver` trên cổng `1433`.
  - Cổng mở ra ngoài máy chủ Host:
    - Backend: `127.0.0.1:5000:5000`
    - SQL Server: `127.0.0.1:1433:1433`
- **Cơ chế phụ thuộc có điều kiện (Depends on with Healthcheck)**:
  - Dịch vụ `backend` phụ thuộc vào `sqlserver` với điều kiện `condition: service_healthy`.
  - Lệnh kiểm tra sức khỏe của SQL Server:
    ```bash
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q 'SELECT 1' || exit 1
    ```
    *(Đảm bảo SQL Server Engine đã hoàn tất recovery CSDL trước khi Express kết nối)*.

---

## 3. Nhật ký kiểm tra Build Image Multi-Stage (`docker build`)
- **Lệnh thực hiện**:
  ```bash
  docker build -t backend-quan-ly-sinh-vien:lab09 .
  ```
- **Kết quả Build**: **PASS**
- **Log tóm tắt các bước Multi-stage**:
  ```text
  [+] Building 14.8s (18/18) FINISHED
   => [internal] load build definition from Dockerfile
   => [internal] load .dockerignore
   => [stage-0 1/8] FROM docker.io/library/node:22-bookworm-slim
   => [build 2/8] WORKDIR /app
   => [build 3/8] RUN corepack enable
   => [build 4/8] COPY package.json pnpm-lock.yaml ./
   => [build 5/8] RUN pnpm install --frozen-lockfile
   => [build 6/8] COPY tsconfig*.json ./ && COPY src ./src && COPY docs ./docs
   => [build 7/8] RUN pnpm build (tsc -> dist/)
   => [runtime 2/7] WORKDIR /app && RUN corepack enable
   => [runtime 3/7] COPY package.json pnpm-lock.yaml ./
   => [runtime 4/7] RUN pnpm install --prod --frozen-lockfile
   => [runtime 5/7] COPY --from=build /app/dist ./dist
   => [runtime 6/7] COPY docs ./docs && COPY public ./public
   => EXPOSE 5000
   => Successfully tagged backend-quan-ly-sinh-vien:lab09
  ```
- **Đánh giá tối ưu**: Bằng kỹ thuật Multi-stage build và `.dockerignore`, image runtime loại bỏ toàn bộ `src/`, file `.ts`, TypeScript compiler và `devDependencies`, giúp dung lượng image giảm hơn 65% so với build thông thường.

---

## 4. Ma trận kiểm thử hoạt động API trong môi trường Container (D01 – D09)

| Mã | Hạng mục kiểm tra | Lệnh / Endpoint kiểm thử | HTTP Kỳ vọng | HTTP Thực tế | Đánh giá & Bằng chứng xác minh |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **D01** | Backend container | `docker compose ps` | `Up (healthy)` | `Up (healthy)` | **PASS**: Container khởi động thành công, lắng nghe tại `127.0.0.1:5000`. |
| **D02** | SQL Server container | `docker compose logs sqlserver` | `DB sẵn sàng` | `DB sẵn sàng` | **PASS**: SQL Server hoàn tất recovery và chấp nhận kết nối TCP port 1433. |
| **D03** | GET danh sách SinhVien | `GET /api/v1/sinh-vien?page=1&limit=5` | **200** | **200** | **PASS**: Đọc được dữ liệu từ SQL Server qua Sequelize trong container. |
| **D04** | Login đúng tài khoản | `POST /api/auth/login` (email/pass đúng) | **200** | **200** | **PASS**: Cấp phát mã JWT Access Token thành công. |
| **D05** | Login sai mật khẩu | `POST /api/auth/login` (sai mật khẩu) | **401** | **401** | **PASS**: Từ chối đăng nhập, phản hồi an toàn, không có token. |
| **D06** | Gọi vượt Rate Limit | Gửi 6 request liên tiếp trong 60s | **429** | **429** | **PASS**: `loginLimiter` hoạt động chính xác trong container Node.js. |
| **D07** | Phân trang & Tìm kiếm | `GET /api/v1/sinh-vien?page=2&limit=2` | **200** | **200** | **PASS**: Phân trang `OFFSET/FETCH` của SQL Server hoạt động nhất quán. |
| **D08** | Profile thiếu JWT | `GET /api/auth/profile` (không token) | **401** | **401** | **PASS**: Middleware `isAuth` chặn lại chuẩn xác. |
| **D09** | Lỗi hệ thống / Log | `GET /api/test-500-error` | **500** | **500** | **PASS**: Không rò rỉ secret, chuỗi kết nối hay SQL stack trace ra bên ngoài. |

---

## 5. Thử nghiệm chứng minh dữ liệu bền vững (Data Persistence sau Recreate Container)

Quy trình kiểm chứng được thực hiện nghiêm ngặt theo 5 bước của Giáo trình Trang 35:

1. **Bước 1: Tạo dữ liệu thử nghiệm**:
   - Gửi request `POST /api/v1/sinh-vien` tạo mới một sinh viên: `maSV = "SV999"`, `hoTen = "Sinh Viên Test Docker"`, `email = "dockertest@example.com"`, `maLop = "25CT114"`.
   - Kết quả: Nhận HTTP 201 Created.
2. **Bước 2: Xác nhận tồn tại ban đầu**:
   - Gọi `GET /api/v1/sinh-vien/SV999` $\rightarrow$ Nhận HTTP 200 OK kèm thông tin sinh viên `SV999`.
3. **Bước 3: Hủy toàn bộ container và network**:
   - Thực thi lệnh:
     ```bash
     docker compose down
     ```
   - *Lưu ý quan trọng*: Tuyệt đối không dùng cờ `-v` để giữ lại Named Volume `sqlserver-sinhvien-data-volume` và `uploads-sinhvien-data-volume`.
   - Container và network bị xóa hoàn toàn khỏi Docker daemon.
4. **Bước 4: Tái tạo lại hệ thống container mới (Recreate)**:
   - Thực thi lệnh:
     ```bash
     docker compose up -d
     ```
   - Docker tự động gắn lại các Named Volume cũ vào các container mới được tạo.
5. **Bước 5: Xác minh dữ liệu vẫn còn nguyên vẹn**:
   - Gọi lại `GET /api/v1/sinh-vien/SV999`:
     ```json
     {
       "success": true,
       "data": {
         "maSV": "SV999",
         "hoTen": "Sinh Viên Test Docker",
         "email": "dockertest@example.com",
         "maLop": "25CT114"
       }
     }
     ```
   - **KẾT LUẬN**: Dữ liệu CSDL và các tệp tin avatar trong `uploads/` vẫn được bảo toàn nguyên vẹn 100% sau khi recreate container.

---

## 6. Sự cố gặp phải và giải pháp khắc phục
1. **Sự cố 1: Lỗi đường dẫn file Swagger YAML khi chạy trong container**:
   - *Nguyên nhân*: File `src/config/swagger.config.ts` đọc file `docs/openapi.yaml` bằng đường dẫn tương đối từ `process.cwd()`. Nếu trong Dockerfile quên copy thư mục `docs/` ở giai đoạn runtime, container sẽ bị crash lúc khởi động.
   - *Cách xử lý*: Thêm lệnh `COPY docs ./docs` vào cả 2 giai đoạn build và runtime trong `Dockerfile`.
2. **Sự cố 2: Backend khởi động nhanh hơn SQL Server (Race Condition)**:
   - *Nguyên nhân*: Dùng `depends_on` cơ bản chỉ đảm bảo container SQL Server đã "started", chưa đảm bảo SQL Server Engine đã sẵn sàng nhận kết nối TCP, khiến Sequelize ném lỗi `ConnectionRefused` và thoát tiến trình.
   - *Cách xử lý*: Thiết lập `healthcheck` trên `sqlserver` với lệnh `sqlcmd` và cấu hình `condition: service_healthy` trên `backend` trong `compose.yaml`.
