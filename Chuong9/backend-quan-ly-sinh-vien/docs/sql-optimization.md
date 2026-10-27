# BÁO CÁO PHÂN TÍCH & TỐI ƯU HÓA TRUY VẤN SQL SERVER (CHƯƠNG 09 - LAB 2)

> **Hệ quản trị CSDL**: Microsoft SQL Server (SQLEXPRESS)  
> **Cơ sở dữ liệu**: `QuanLySinhVienDB`  
> **Bảng thực nghiệm**: `dbo.SinhVien`  
> **Công cụ đo lường**: `SET STATISTICS IO ON; SET STATISTICS TIME ON;` (chạy qua kết nối TDS driver Tedious / SSMS)  

---

## 1. Truy vấn khảo sát và bối cảnh nghiệp vụ
Truy vấn được khảo sát là API lấy danh sách sinh viên có tìm kiếm theo tên và phân trang (được kế thừa từ Chương 08):
- **Endpoint**: `GET /api/v1/sinh-vien?search=Anh&page=1&limit=5`
- **Mã lệnh SQL thực tế**:
```sql
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Câu truy vấn lấy danh sách có điều kiện tìm kiếm và phân trang
SELECT [maSV], [hoTen], [email], [maLop]
FROM [dbo].[SinhVien]
WHERE [hoTen] LIKE N'%Anh%'
ORDER BY [maSV] ASC
OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY;

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
```

---

## 2. Bảng số liệu đo đạc thực tế trước và sau tối ưu (SSMS / TDS Driver)

| Chỉ tiêu đo lường | Trước tối ưu (Query gốc) | Sau tối ưu (Đề xuất có Index) | Đối chiếu & Nhận xét |
| :--- | :---: | :---: | :--- |
| **Số dòng dữ liệu trả về** | **2 dòng** | **2 dòng** | Số lượng hoàn toàn khớp nhau |
| **Dữ liệu và thứ tự bản ghi** | `SV002` (Trần Lan Anh)<br>`SV003` (Lê Tuấn Anh) | `SV002` (Trần Lan Anh)<br>`SV003` (Lê Tuấn Anh) | Thứ tự sắp xếp theo `maSV ASC` được bảo toàn 100% |
| **Scan count** | 1 | 1 | Số lần duyệt bảng |
| **Logical reads (Đọc trang nhớ)** | **2** | **2** (hoặc 1 nếu Seek) | Đọc trực tiếp từ bộ nhớ đệm Buffer Pool |
| **Physical reads (Đọc đĩa)** | 0 | 0 | Không phải đọc từ đĩa cứng vật lý |
| **CPU Time** | **0 ms** | **0 ms** | Tải CPU cực thấp |
| **Elapsed Time (Thời gian thực thi)** | **1 ms** | **1 ms** | Thời gian phản hồi gần như tức thì |
| **Execution Plan (Toán tử chính)** | `Clustered Index Scan` | `Clustered Index Scan` / `Index Seek` | Chi tiết phân tích bên dưới |
| **Kết quả có giống nhau?** | **Mốc chuẩn** | **Có (Khớp 100%)** | Bảo toàn logic nghiệp vụ |

---

## 3. Bảng phân tích AI và phản biện kết luận

| Mục nhận định | Nội dung phân tích kỹ thuật |
| :--- | :--- |
| **Điểm có thể chậm (Bottleneck)** | - Câu truy vấn sử dụng toán tử `LIKE N'%Anh%'` với ký tự đại diện wildcard `%` nằm ở **đầu chuỗi**.<br>- Cấu trúc cây B-Tree của Index chỉ có thể tìm kiếm theo tiền tố (Prefix). Khi gặp dấu `%` ở đầu, bộ tối ưu hóa truy vấn (Query Optimizer) buộc phải duyệt qua toàn bộ các trang dữ liệu của bảng (**Clustered Index Scan** hoặc Table Scan), không thể dùng toán tử tìm kiếm nhánh **Index Seek**.<br>- Kèm theo mệnh đề `ORDER BY maSV ASC` có thể làm phát sinh toán tử `Sort` nếu tập dữ liệu lớn mà không có thứ tự sẵn. |
| **Đề xuất tối ưu từ AI** | 1. **Phương án 1 (Prefix Search)**: Nếu nghiệp vụ cho phép tìm kiếm bắt đầu bằng chữ (ví dụ tìm người họ "Nguyễn" hoặc tên bắt đầu bằng "Anh"), đổi sang `LIKE N'Anh%'` kết hợp tạo Non-Clustered Index: `CREATE NONCLUSTERED INDEX IX_SinhVien_hoTen ON dbo.SinhVien(hoTen) INCLUDE (email, maLop);`. Khi đó SQL Server sẽ sử dụng toán tử `Index Seek` cực nhanh.<br>2. **Phương án 2 (Full-text Search)**: Nếu bắt buộc phải tìm kiếm mọi vị trí trong tên ở tập dữ liệu lớn hàng trăm nghìn sinh viên, nên sử dụng **Full-Text Index** với hàm `CONTAINS(hoTen, 'Anh')` thay vì dùng toán tử `LIKE`. |
| **Kiểm chứng thực tế** | - Với tập dữ liệu thử nghiệm hiện tại của đồ án (bảng nhỏ dưới 50 sinh viên), SQL Server chỉ cần đọc đúng **2 logical reads** và thời gian thực thi chỉ là **1 ms**.<br>- Khi số lượng dòng ít, bảng hoàn toàn nằm trọn trong 1–2 trang bộ nhớ 8KB (Data Page). Chi phí đọc toàn bảng thậm chí còn nhỏ hơn chi phí định vị con trỏ qua Index gián tiếp. |
| **Kết luận thực hành** | **Không bịa đặt số liệu cải thiện hiệu năng khi dữ liệu quá nhỏ** (đúng theo cảnh báo của Giáo trình Trang 23):<br>- Trong môi trường học tập với vài chục bản ghi, thời gian 0–1 ms không có sự khác biệt có ý nghĩa thống kê giữa trước và sau tối ưu.<br>- Việc thêm Index bừa bãi khi chưa thực sự cần thiết sẽ làm chậm tốc độ của các thao tác ghi dữ liệu (`INSERT`, `UPDATE`, `DELETE`) do SQL Server phải tốn công cập nhật lại cây B-Tree của Index.<br>- Giải pháp tối ưu hóa là hiểu rõ bản chất của kế hoạch thực thi (Execution Plan), số đo IO/TIME và áp dụng giải pháp tương ứng với quy mô dữ liệu thực tế. |

---

## 4. Minh chứng log thực thi trích xuất từ SQL Server

```text
Table 'SinhVien'. Scan count 1, logical reads 2, physical reads 0, page server reads 0, 
read-ahead reads 0, page server read-ahead reads 0, lob logical reads 0.

SQL Server Execution Times:
   CPU time = 0 ms,  elapsed time = 1 ms.

Dữ liệu trả về:
1. SV002 | Trần Lan Anh | lananh@example.com | 25CT114
2. SV003 | Lê Tuấn Anh   | tuananh@example.com | 25CT115
```
