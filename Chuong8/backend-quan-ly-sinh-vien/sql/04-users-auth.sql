-- ==============================================================================
-- TẬP LỆNH SQL TẠO BẢNG DBO.USERS VÀ PHÂN QUYỀN TRUY CẬP CHO BACKEND AUTHENTICATION
-- File: sql/04-users-auth.sql
-- Mục đích: Lưu trữ tài khoản người dùng, phân tách với dữ liệu sinh viên
-- ==============================================================================

-- 1. Chuyển ngữ cảnh làm việc sang cơ sở dữ liệu QuanLySinhVienDB
USE QuanLySinhVienDB;
GO

-- 2. Kiểm tra nếu bảng dbo.Users chưa tồn tại thì mới tiến hành tạo mới (không DROP để bảo vệ dữ liệu cũ)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    -- Tạo bảng Users thuộc schema dbo
    CREATE TABLE dbo.Users (
        -- Cột id: Định danh duy nhất của tài khoản, kiểu số nguyên tự tăng IDENTITY(1,1), đóng vai trò Khóa chính
        id INT IDENTITY(1,1) NOT NULL,

        -- Cột fullName: Lưu họ và tên đầy đủ của người dùng, kiểu chuỗi Unicode tối đa 150 ký tự, bắt buộc nhập
        fullName NVARCHAR(150) NOT NULL,

        -- Cột email: Địa chỉ email của tài khoản, kiểu chuỗi Unicode tối đa 254 ký tự, bắt buộc nhập
        email NVARCHAR(254) NOT NULL,

        -- Cột passwordHash: Chuỗi băm mật khẩu được tạo bởi thuật toán bcrypt, tối đa 255 ký tự, không lưu mật khẩu gốc
        passwordHash NVARCHAR(255) NOT NULL,

        -- Cột role: Vai trò người dùng (student/admin), mặc định khi đăng ký là 'student', bắt buộc nhập
        role NVARCHAR(20) NOT NULL CONSTRAINT DF_Users_role DEFAULT 'student',

        -- Khai báo ràng buộc Khóa chính trên cột id
        CONSTRAINT PK_Users PRIMARY KEY (id),

        -- Khai báo ràng buộc UNIQUE trên cột email để ngăn chặn việc đăng ký trùng email
        CONSTRAINT UQ_Users_email UNIQUE (email),

        -- Khai báo ràng buộc CHECK đảm bảo vai trò chỉ nhận một trong hai giá trị hợp lệ: 'student' hoặc 'admin'
        CONSTRAINT CK_Users_role CHECK (role IN ('student', 'admin'))
    );
END
GO

-- 3. Phân quyền thao tác trên bảng dbo.Users cho tài khoản dịch vụ sv_app (dùng kết nối từ backend)
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'sv_app')
BEGIN
    -- Cấp các quyền SELECT, INSERT, UPDATE, DELETE trên bảng dbo.Users cho user sv_app
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Users TO sv_app;
END
GO

-- 4. Câu lệnh kiểm tra xác minh cấu trúc các cột của bảng dbo.Users
SELECT 
    COLUMN_NAME AS TenCot, 
    DATA_TYPE AS KieuDuLieu, 
    CHARACTER_MAXIMUM_LENGTH AS DoDaiToiDa, 
    IS_NULLABLE AS ChoPhepNull, 
    COLUMN_DEFAULT AS GiaTriMacDinh
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Users'
ORDER BY ORDINAL_POSITION;
GO
