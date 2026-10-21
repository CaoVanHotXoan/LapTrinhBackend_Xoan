-- 01-quan-ly-sinh-vien.sql
-- Tạo cơ sở dữ liệu QuanLySinhVienDB và bảng dbo.SinhVien

-- 1. Kiểm tra và tạo cơ sở dữ liệu nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'QuanLySinhVienDB')
BEGIN
    CREATE DATABASE QuanLySinhVienDB;
END
GO

-- 2. Chuyển ngữ cảnh sang cơ sở dữ liệu QuanLySinhVienDB
USE QuanLySinhVienDB;
GO

-- 3. Kiểm tra và tạo bảng SinhVien nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SinhVien' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.SinhVien (
        maSV VARCHAR(5) NOT NULL,
        hoTen NVARCHAR(150) NOT NULL,
        email NVARCHAR(254) NOT NULL,
        maLop NVARCHAR(50) NOT NULL,
        CONSTRAINT PK_SinhVien PRIMARY KEY (maSV)
    );
END
GO
