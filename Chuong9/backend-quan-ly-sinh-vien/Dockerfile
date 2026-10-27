# ==============================================================================
# DOCKERFILE ĐÓNG GÓI ỨNG DỤNG BACKEND NODE.JS + TYPESCRIPT (MULTI-STAGE BUILD)
# File: Dockerfile (Chương 09 - Lab 3 - Trang 28)
# ==============================================================================

# ==============================================================================
# GIAI ĐOẠN 1: BUILD STAGE (Biên dịch mã nguồn TypeScript sang JavaScript)
# ==============================================================================
# 1. Sử dụng image Node.js 22 chính thức phiên bản rút gọn Bookworm Slim làm base
FROM node:22-bookworm-slim AS build

# 2. Thiết lập thư mục làm việc mặc định bên trong container
WORKDIR /app

# 3. Kích hoạt Corepack tích hợp sẵn trong Node.js để quản lý trình quản lý gói pnpm
RUN corepack enable

# 4. Sao chép các file định nghĩa phụ thuộc package.json và pnpm-lock.yaml vào container trước
COPY package.json pnpm-lock.yaml ./

# 5. Cài đặt toàn bộ dependencies (bao gồm devDependencies để có tsc biên dịch mã)
RUN pnpm install --frozen-lockfile

# 6. Sao chép các file cấu hình TypeScript vào container
COPY tsconfig*.json ./

# 7. Sao chép toàn bộ thư mục mã nguồn TypeScript src/ vào container
COPY src ./src

# 8. Sao chép tài liệu Swagger openapi.yaml (được swagger.config.ts đọc khi build/start)
COPY docs ./docs

# 9. Thực thi lệnh biên dịch mã TypeScript sang JavaScript thuần đặt vào thư mục dist/
RUN pnpm build


# ==============================================================================
# GIAI ĐOẠN 2: RUNTIME STAGE (Môi trường thực thi tinh gọn phục vụ Production)
# ==============================================================================
# 10. Bắt đầu từ một base image Node.js 22 sạch hoàn toàn mới để giảm dung lượng image
FROM node:22-bookworm-slim AS runtime

# 11. Thiết lập thư mục làm việc chính của ứng dụng
WORKDIR /app

# 12. Thiết lập biến môi trường báo hiệu ứng dụng đang chạy ở môi trường Production
ENV NODE_ENV=production

# 13. Kích hoạt Corepack để dùng pnpm cài đặt các gói chạy Production
RUN corepack enable

# 14. Sao chép file mô tả gói để cài đặt duy nhất các thư viện runtime cần thiết
COPY package.json pnpm-lock.yaml ./

# 15. Cài đặt DUY NHẤT các dependencies cần cho runtime (--prod), bỏ qua devDependencies
RUN pnpm install --prod --frozen-lockfile

# 16. Sao chép thư mục mã JavaScript đã được biên dịch từ Giai đoạn 1 (build stage)
COPY --from=build /app/dist ./dist

# 17. Sao chép file đặc tả Swagger YAML để phục vụ giao diện tài liệu /api-docs lúc chạy
COPY docs ./docs

# 18. Sao chép thư mục public (chứa thư mục uploads phục vụ lưu trữ Avatar)
COPY public ./public

# 19. Khai báo cổng 5000 mà server Express sẽ lắng nghe kết nối
EXPOSE 5000

# 20. Lệnh khởi động ứng dụng chính thức bằng Node.js chạy file entrypoint đã biên dịch
CMD ["node", "dist/server.js"]
