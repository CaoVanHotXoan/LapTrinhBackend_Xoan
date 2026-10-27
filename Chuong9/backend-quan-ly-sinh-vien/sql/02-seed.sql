-- ==============================================================================
-- FILE SQL SEED DỮ LIỆU SINH VIÊN MẪU (CHƯƠNG 08)
-- File: sql/02-seed.sql
-- Mục đích: Chèn 5 sinh viên mẫu có thứ tự maSV tăng dần và chứa tên "Anh"
-- ==============================================================================

-- 1. Chuyển ngữ cảnh làm việc sang cơ sở dữ liệu QuanLySinhVienDB
USE QuanLySinhVienDB;
GO

-- 2. Chèn sinh viên mẫu SV001 nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM dbo.SinhVien WHERE maSV = 'SV001')
BEGIN
    INSERT INTO dbo.SinhVien (maSV, hoTen, email, maLop)
    VALUES ('SV001', N'Nguyễn Minh Nhật', 'minhnhat@example.com', '25CT114');
END
GO

-- 3. Chèn sinh viên mẫu SV002 (chứa chữ "Anh" phục vụ test tìm kiếm) nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM dbo.SinhVien WHERE maSV = 'SV002')
BEGIN
    INSERT INTO dbo.SinhVien (maSV, hoTen, email, maLop)
    VALUES ('SV002', N'Trần Lan Anh', 'lananh@example.com', '25CT114');
END
GO

-- 4. Chèn sinh viên mẫu SV003 (chứa chữ "Anh" thứ hai) nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM dbo.SinhVien WHERE maSV = 'SV003')
BEGIN
    INSERT INTO dbo.SinhVien (maSV, hoTen, email, maLop)
    VALUES ('SV003', N'Lê Tuấn Anh', 'tuananh@example.com', '25CT115');
END
GO

-- 5. Chèn sinh viên mẫu SV004 nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM dbo.SinhVien WHERE maSV = 'SV004')
BEGIN
    INSERT INTO dbo.SinhVien (maSV, hoTen, email, maLop)
    VALUES ('SV004', N'Hoàng Minh Ngọc', 'minhngoc@example.com', '25CT114');
END
GO

-- 6. Chèn sinh viên mẫu SV005 nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM dbo.SinhVien WHERE maSV = 'SV005')
BEGIN
    INSERT INTO dbo.SinhVien (maSV, hoTen, email, maLop)
    VALUES ('SV005', N'Phạm Quốc Bảo', 'quocbao@example.com', '25CT115');
END
GO

-- 7. Truy vấn kiểm chứng: Đếm tổng số bản ghi và hiển thị danh sách sắp xếp theo maSV
SELECT COUNT(*) AS totalStudents FROM dbo.SinhVien;
SELECT maSV, hoTen, email, maLop FROM dbo.SinhVien ORDER BY maSV ASC;
GO
