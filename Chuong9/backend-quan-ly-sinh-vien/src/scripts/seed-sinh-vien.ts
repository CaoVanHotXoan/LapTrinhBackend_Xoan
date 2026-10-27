// ==============================================================================
// SCRIPT KHỞI TẠO 5 BẢN GHI SINH VIÊN MẪU CHO CHƯƠNG 08
// File: src/scripts/seed-sinh-vien.ts
// Mục đích: Chèn tối thiểu 5 sinh viên có maSV tăng dần và chứa ít nhất một tên "Anh"
// ==============================================================================

// 1. Nạp các biến môi trường từ file .env (chứa cấu hình DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
import 'dotenv/config';

// 2. Import đối tượng kết nối Sequelize từ cấu hình database
import { sequelize } from '../config/database.js';

// 3. Import model SinhVien để thao tác với bảng dbo.SinhVien
import { SinhVien } from '../models/SinhVien.js';

// 4. Định nghĩa danh sách 5 sinh viên mẫu theo đúng quy ước của Chương 08:
//    - Mã sinh viên sắp xếp tăng dần từ SV001 đến SV005
//    - Có ít nhất một tên chứa từ khóa "Anh" (ở đây có cả "Lan Anh" và "Tuấn Anh")
//    - Đầy đủ 4 trường bắt buộc: maSV, hoTen, email, maLop
const danhSachSinhVienMau = [
  {
    // Bản ghi 1: Sinh viên SV001
    maSV: 'SV001',
    hoTen: 'Nguyễn Minh Nhật',
    email: 'minhnhat@example.com',
    maLop: '25CT114'
  },
  {
    // Bản ghi 2: Sinh viên SV002 - Chứa chữ "Anh" phục vụ kiểm thử tìm kiếm P11, P12, P14
    maSV: 'SV002',
    hoTen: 'Trần Lan Anh',
    email: 'lananh@example.com',
    maLop: '25CT114'
  },
  {
    // Bản ghi 3: Sinh viên SV003 - Chứa chữ "Anh" thứ hai
    maSV: 'SV003',
    hoTen: 'Lê Tuấn Anh',
    email: 'tuananh@example.com',
    maLop: '25CT115'
  },
  {
    // Bản ghi 4: Sinh viên SV004
    maSV: 'SV004',
    hoTen: 'Hoàng Minh Ngọc',
    email: 'minhngoc@example.com',
    maLop: '25CT114'
  },
  {
    // Bản ghi 5: Sinh viên SV005
    maSV: 'SV005',
    hoTen: 'Phạm Quốc Bảo',
    email: 'quocbao@example.com',
    maLop: '25CT115'
  }
];

// 5. Hàm chính thực hiện chèn dữ liệu vào SQL Server
async function seedSinhVien(): Promise<void> {
  try {
    // Bước 5.1: Xác thực kết nối tới cơ sở dữ liệu SQL Server
    await sequelize.authenticate();
    console.log('✅ 1. Kết nối cơ sở dữ liệu SQL Server thành công!');

    // Bước 5.2: Duyệt qua từng sinh viên trong danh sách mẫu
    console.log('⏳ 2. Đang kiểm tra và chèn dữ liệu sinh viên mẫu...');
    for (const sv of danhSachSinhVienMau) {
      // Tìm xem mã sinh viên này đã có trong bảng dbo.SinhVien chưa
      const daTonTai = await SinhVien.findByPk(sv.maSV);

      if (!daTonTai) {
        // Nếu chưa tồn tại, tạo mới bản ghi sinh viên
        await SinhVien.create(sv);
        console.log(`   ➕ Đã thêm mới sinh viên: [${sv.maSV}] ${sv.hoTen} (${sv.email})`);
      } else {
        // Nếu đã tồn tại, cập nhật lại thông tin để bảo đảm dữ liệu chuẩn xác
        await daTonTai.update({
          hoTen: sv.hoTen,
          email: sv.email,
          maLop: sv.maLop
        });
        console.log(`   🔄 Đã cập nhật sinh viên: [${sv.maSV}] ${sv.hoTen} (${sv.email})`);
      }
    }

    // Bước 5.3: Đếm tổng số bản ghi hiện có trong bảng dbo.SinhVien
    const tongSo = await SinhVien.count();
    console.log(`\n🎉 3. Hoàn tất seed dữ liệu! Tổng số sinh viên hiện có trong CSDL: ${tongSo}`);

    // Bước 5.4: Đọc lại toàn bộ danh sách sắp theo maSV ASC để kiểm chứng thực tế
    const danhSachThucTe = await SinhVien.findAll({
      order: [['maSV', 'ASC']]
    });

    console.log('\n📋 BẢNG DỮ LIỆU SINH VIÊN HIỆN CÓ TRONG SQL SERVER (SẮP THEO maSV ASC):');
    console.log('--------------------------------------------------------------------------------');
    console.table(danhSachThucTe.map((item) => ({
      'Mã SV': item.maSV,
      'Họ và Tên': item.hoTen,
      'Email': item.email,
      'Mã Lớp': item.maLop
    })));
    console.log('--------------------------------------------------------------------------------');
  } catch (error) {
    // Bắt lỗi và in chi tiết nếu có sự cố
    console.error('❌ Lỗi khi chèn dữ liệu sinh viên:', error);
    process.exitCode = 1;
  } finally {
    // Đóng kết nối database an toàn
    await sequelize.close();
  }
}

// 6. Thực thi hàm seedSinhVien
seedSinhVien();
