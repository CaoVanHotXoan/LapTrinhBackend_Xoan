-- 02-seed.sql
-- Thêm dữ liệu mẫu vào bảng dbo.SinhVien (chỉ INSERT nếu mã chưa tồn tại)

USE QuanLySinhVienDB;
GO

-- 1. Chèn sinh viên mẫu SV001 nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM dbo.SinhVien WHERE maSV = 'SV001')
BEGIN
    INSERT INTO dbo.SinhVien (maSV, hoTen, email, maLop)
    VALUES ('SV001', N'Minh Nhật', 'minhnhat@example.com', '25CT114');
END
GO

-- 2. Chèn sinh viên mẫu SV002 nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM dbo.SinhVien WHERE maSV = 'SV002')
BEGIN
    INSERT INTO dbo.SinhVien (maSV, hoTen, email, maLop)
    VALUES ('SV002', N'Lan Anh', 'lananh@example.com', '25CT114');
END
GO

-- 3. Xem danh sách sinh viên hiện có trong bảng
SELECT maSV, hoTen, email, maLop
FROM dbo.SinhVien
ORDER BY maSV ASC;
GO
