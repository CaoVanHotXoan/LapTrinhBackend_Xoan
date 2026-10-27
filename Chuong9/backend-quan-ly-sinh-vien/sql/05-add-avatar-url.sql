-- ==============================================================================
-- BẢN VÁ CƠ SỞ DỮ LIỆU: BỔ SUNG CỘT avatarUrl VÀO BẢNG dbo.Users (CHƯƠNG 07)
-- File: sql/05-add-avatar-url.sql
-- Mục đích: Lưu trữ đường dẫn ảnh đại diện cho tài khoản người dùng
-- Đặc điểm: Idempotent (chạy nhiều lần không lỗi), bảo toàn dữ liệu hiện có
-- ==============================================================================

-- 1. Chuyển ngữ cảnh thực thi sang cơ sở dữ liệu QuanLySinhVienDB
USE QuanLySinhVienDB;
GO

-- 2. Kiểm tra bảng dbo.Users có tồn tại trong cơ sở dữ liệu hay không
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    -- Nếu chưa có bảng dbo.Users, ném lỗi cảnh báo và dừng thực thi (không tự ý tạo mới)
    THROW 50001, N'Lỗi: Chưa tồn tại bảng dbo.Users từ Chương 06!', 1;
END;
GO

-- 3. Kiểm tra xem cột avatarUrl đã tồn tại trong bảng dbo.Users hay chưa
IF COL_LENGTH('dbo.Users', 'avatarUrl') IS NULL
BEGIN
    -- Bổ sung cột avatarUrl kiểu chuỗi Unicode tối đa 255 ký tự, cho phép nhận giá trị NULL
    ALTER TABLE dbo.Users
    ADD avatarUrl NVARCHAR(255) NULL;

    -- In thông báo xác nhận đã thêm cột thành công ra cửa sổ Output của SSMS
    PRINT N'>> [THÀNH CÔNG] Đã bổ sung cột avatarUrl (NVARCHAR(255), NULL) vào bảng dbo.Users.';
END
ELSE
BEGIN
    -- Nếu cột avatarUrl đã tồn tại từ trước, thông báo bỏ qua để đảm bảo an toàn dữ liệu
    PRINT N'>> [BỎ QUA] Cột avatarUrl đã tồn tại trong bảng dbo.Users, không cần thêm lại.';
END;
GO

-- 4. Đảm bảo user sv_app có quyền truy cập và thao tác trên cột mới
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'sv_app')
BEGIN
    -- Cấp quyền SELECT, UPDATE trên bảng dbo.Users cho user kết nối sv_app
    GRANT SELECT, UPDATE ON dbo.Users TO sv_app;
    -- In thông báo đã cấp quyền thành công
    PRINT N'>> [THÀNH CÔNG] Đã xác nhận quyền SELECT, UPDATE trên dbo.Users cho sv_app.';
END;
GO

-- 5. LỆNH XÁC MINH 1: Kiểm tra cấu trúc kiểu dữ liệu và tính chất NULL của cột avatarUrl
SELECT 
    -- Tên bảng chứa cột
    TABLE_NAME AS TenBang,
    -- Tên cột vừa kiểm tra/bổ sung
    COLUMN_NAME AS TenCot,
    -- Kiểu dữ liệu lưu trữ
    DATA_TYPE AS KieuDuLieu,
    -- Độ dài ký tự tối đa được phép lưu trữ
    CHARACTER_MAXIMUM_LENGTH AS DoDaiToiDa,
    -- Cho phép giá trị NULL (phải là YES để tài khoản chưa upload không bị lỗi)
    IS_NULLABLE AS ChoPhepNull
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo' 
  AND TABLE_NAME = 'Users' 
  AND COLUMN_NAME = 'avatarUrl';
GO

-- 6. LỆNH XÁC MINH 2: Truy vấn danh sách 10 tài khoản đầu tiên để chứng minh dữ liệu cũ nguyên vẹn
SELECT TOP (10) 
    -- Khóa chính id của người dùng
    id, 
    -- Họ và tên tài khoản
    fullName, 
    -- Email đăng nhập
    email, 
    -- Vai trò trong hệ thống
    role, 
    -- Cột avatarUrl mới thêm (mặc định các tài khoản cũ sẽ có giá trị NULL)
    avatarUrl 
FROM dbo.Users;
GO
