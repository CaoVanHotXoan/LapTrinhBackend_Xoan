-- 03-app-login.sql
-- Tạo SQL Login và Database User sv_app với quyền hạn tối thiểu (SELECT, INSERT)

-- 1. Tạo SQL Server Login ở cấp độ Server (master) nếu chưa tồn tại
USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'sv_app')
BEGIN
    -- Lưu ý: Bạn có thể đổi '123456' thành mật khẩu mong muốn
    CREATE LOGIN sv_app WITH PASSWORD = 'YourSecurePassword123!', CHECK_POLICY = OFF;
END
GO

-- 2. Tạo User sv_app trong database QuanLySinhVienDB và cấp quyền
USE QuanLySinhVienDB;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'sv_app')
BEGIN
    CREATE USER sv_app FOR LOGIN sv_app;
END
GO

-- 3. Chỉ cấp quyền SELECT và INSERT trên bảng dbo.SinhVien cho user sv_app (nguyên tắc đặc quyền tối thiểu)
GRANT SELECT, INSERT ON dbo.SinhVien TO sv_app;
GO
