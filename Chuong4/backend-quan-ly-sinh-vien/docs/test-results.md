# Bảng Kết Quả Kiểm Thử (12 Test Cases Bắt Buộc) - Buổi 5

> **Môi trường thử nghiệm**: Node.js + Express + TypeScript + SQL Server (Sequelize)  
> **Base URL**: `http://localhost:5000`  
> **Giao thức**: HTTP RESTful JSON API

---

## 📋 Bảng tổng hợp 12 Test Cases

| ID | Thao tác / Điều kiện thử nghiệm | Method & URL | Body Request (JSON) | Expected Status | Actual Status | Xác nhận thêm & Kiểm chứng dữ liệu | Kết luận |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **T01** | Lấy danh sách toàn bộ sinh viên | `GET /api/v1/sinh-vien` | *Không có* | **200** | **200** | `data` trả về là một mảng danh sách sinh viên (kể cả mảng `[]`). | **PASS** |
| **T02** | Thêm mới sinh viên `SV003` hợp lệ (chưa tồn tại) | `POST /api/v1/sinh-vien` | `{"maSV":"SV003","hoTen":"Ngọc Mai","email":"ngocmai@example.com","maLop":"25CT114"}` | **201** | **201** | Trả về `success: true`, `GET /api/v1/sinh-vien/SV003` đọc được đúng thông tin vừa tạo. | **PASS** |
| **T03** | Thêm lại sinh viên `SV003` lần 2 (trùng mã khóa chính) | `POST /api/v1/sinh-vien` | `{"maSV":"SV003","hoTen":"Ngọc Mai","email":"ngocmai@example.com","maLop":"25CT114"}` | **409** | **409** | Báo lỗi trùng mã `Mã sinh viên đã tồn tại`, chỉ tồn tại duy nhất 1 bản ghi `SV003`. | **PASS** |
| **T04** | Thêm sinh viên mới thiếu trường `hoTen` | `POST /api/v1/sinh-vien` | `{"maSV":"SV004","email":"test@example.com","maLop":"25CT114"}` | **400** | **400** | Báo lỗi dữ liệu không hợp lệ, không tạo thêm bản ghi mới `SV004` trong CSDL. | **PASS** |
| **T05** | Lấy chi tiết `SV003` vừa tạo | `GET /api/v1/sinh-vien/SV003` | *Không có* | **200** | **200** | Trả về đúng 4 trường: `maSV`, `hoTen`, `email`, `maLop`. | **PASS** |
| **T06** | Cập nhật `SV003` với đầy đủ 3 trường | `PUT /api/v1/sinh-vien/SV003` | `{"hoTen":"Ngọc Mai Updated","email":"ngocmai@example.com","maLop":"25CT114"}` | **200** | **200** | `GET /api/v1/sinh-vien/SV003` kiểm chứng thấy `hoTen` đã đổi thành `Ngọc Mai Updated`. | **PASS** |
| **T07** | Cập nhật `SV003` nhưng thiếu trường `email` | `PUT /api/v1/sinh-vien/SV003` | `{"hoTen":"Ngọc Mai Loi","maLop":"25CT114"}` | **400** | **400** | Từ chối cập nhật, `GET` lại thấy dữ liệu cũ của `SV003` được giữ nguyên vẹn. | **PASS** |
| **T08** | Cập nhật mã không tồn tại `SV9999` với body hợp lệ | `PUT /api/v1/sinh-vien/SV9999` | `{"hoTen":"Khong Co","email":"none@example.com","maLop":"25CT114"}` | **404** | **404** | Báo lỗi không tìm thấy sinh viên, không tự ý chèn thêm bản ghi mới. | **PASS** |
| **T09** | Lấy thông tin sinh viên không tồn tại `SV9999` | `GET /api/v1/sinh-vien/SV9999` | *Không có* | **404** | **404** | Trả về `success: false`, `data: null` hoặc thông báo lỗi phù hợp. | **PASS** |
| **T10** | Xóa sinh viên thử nghiệm `SV003` | `DELETE /api/v1/sinh-vien/SV003` | *Không có* | **200** | **200** | Trả về `{"success": true, "message": "Xóa sinh viên thành công"}` (không có `data`). | **PASS** |
| **T11** | Lấy lại thông tin `SV003` sau khi đã xóa | `GET /api/v1/sinh-vien/SV003` | *Không có* | **404** | **404** | Trả về 404 chứng minh bản ghi đã thực sự bị xóa khỏi CSDL. | **PASS** |
| **T12** | Xóa lại `SV003` lần 2 (đã xóa trước đó) | `DELETE /api/v1/sinh-vien/SV003` | *Không có* | **404** | **404** | Báo lỗi không tìm thấy sinh viên, không gây ảnh hưởng tới các dữ liệu khác. | **PASS** |

---

## 🔍 Giải thích các câu hỏi kiểm chứng (Validation & Persistence)
1. **Tại sao phải thực hiện `GET` lại sau khi `POST`, `PUT`, `DELETE`?**
   - Phản hồi HTTP `200/201` của request chỉ phản ánh kết quả trả về từ controller. Việc gọi lại `GET` giúp kiểm chứng thực tế dữ liệu đã được ghi, cập nhật hoặc xóa vĩnh viễn trong CSDL hay chưa, tránh trường hợp server chỉ trả JSON giả lập.
2. **Tại sao `DELETE` lần 2 trả về `404` là đúng?**
   - Vì bản ghi đã bị xóa ở lần 1 nên không còn tồn tại trong hệ thống. Lần gọi thứ hai không tìm thấy đối tượng cần xóa nên việc trả về `404 Not Found` là chính xác theo chuẩn RESTful.
