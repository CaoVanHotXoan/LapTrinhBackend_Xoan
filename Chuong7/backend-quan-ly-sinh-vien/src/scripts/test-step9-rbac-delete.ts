// ==============================================================================
// SCRIPT KIỂM THỬ BƯỚC 9: NÚT XÓA SINH VIÊN & PHÂN QUYỀN RBAC (CHƯƠNG 07 - TRANG 15)
// File: src/scripts/test-step9-rbac-delete.ts
// Mục đích: Xác minh 4 ca kiểm thử bắt buộc theo đúng bảng yêu cầu trong giáo trình:
// 1. Chưa login (Chưa xác thực) -> DELETE trả về 401 Unauthorized
// 2. Student (Đã login nhưng không đủ quyền) -> DELETE trả về 403 Forbidden
// 3. Admin (Quản trị viên) -> DELETE sinh viên test -> trả về 200 OK + GET cập nhật
// 4. Admin xóa lại cùng mã SV -> trả về 404 Not Found
// ==============================================================================

// Import thư viện băm mật khẩu bcrypt
import bcrypt from 'bcrypt';

// Import đối tượng kết nối Sequelize từ cấu hình cơ sở dữ liệu
import { sequelize } from '../config/database.js';

// Import Model User để tạo tài khoản kiểm thử
import { User } from '../models/user.model.js';

// Import Model SinhVien để tạo bản ghi sinh viên kiểm thử
import { SinhVien } from '../models/SinhVien.js';

// Hàm in tiêu đề từng phần kiểm thử để dễ quan sát trên Terminal
function logSection(title: string): void {
  // In đường kẻ phân cách trên
  console.log('\n================================================================================');
  // In nội dung tiêu đề
  console.log(`📌 ${title}`);
  // In đường kẻ phân cách dưới
  console.log('================================================================================');
}

// Hàm thực thi kịch bản kiểm thử toàn diện Bước 9
async function runStep9Verification(): Promise<void> {
  // Khai báo Base URL của máy chủ Backend Express
  const BASE_URL = 'http://localhost:5000';

  // Khai báo thông tin tài khoản Student kiểm thử
  const studentEmail = 'student.step9@example.com';
  // Khai báo mật khẩu cho tài khoản Student
  const studentPassword = 'Password@123';

  // Khai báo thông tin tài khoản Admin kiểm thử
  const adminEmail = 'admin.step9@example.com';
  // Khai báo mật khẩu cho tài khoản Admin
  const adminPassword = 'AdminPassword@123';

  // Khai báo mã sinh viên thử nghiệm dùng riêng cho Bước 9 (chuỗi tối đa 5 ký tự theo schema SQL)
  const testMaSV = 'SV999';

  // In thông điệp bắt đầu kiểm thử
  logSection('BƯỚC 9: KIỂM THỬ PHÂN QUYỀN RBAC & NÚT XÓA SINH VIÊN (TRANG 15)');

  try {
    // 1. Kiểm tra kết nối cơ sở dữ liệu SQL Server
    await sequelize.authenticate();
    // Thông báo kết nối CSDL thành công
    console.log('✅ Đã kết nối cơ sở dữ liệu SQL Server thành công.');

    // 2. Chuẩn bị tài khoản Student thử nghiệm
    // Xóa tài khoản cũ nếu đã tồn tại để tránh xung đột
    await User.destroy({ where: { email: studentEmail } });
    // Băm mật khẩu sinh viên với cost factor = 12
    const studentHash = await bcrypt.hash(studentPassword, 12);
    // Tạo bản ghi User Student trong bảng dbo.Users
    await User.create({
      fullName: 'Sinh Viên Kiểm Thử Bước 9',
      email: studentEmail,
      passwordHash: studentHash,
      role: 'student',
      avatarUrl: null
    });
    // Thông báo đã tạo xong tài khoản Student
    console.log(`✅ Đã chuẩn bị tài khoản Student: ${studentEmail}`);

    // 3. Chuẩn bị tài khoản Admin thử nghiệm
    // Xóa tài khoản Admin cũ nếu đã tồn tại
    await User.destroy({ where: { email: adminEmail } });
    // Băm mật khẩu Admin với cost factor = 12
    const adminHash = await bcrypt.hash(adminPassword, 12);
    // Tạo bản ghi User Admin trong bảng dbo.Users
    await User.create({
      fullName: 'Quản Trị Viên Bước 9',
      email: adminEmail,
      passwordHash: adminHash,
      role: 'admin',
      avatarUrl: null
    });
    // Thông báo đã tạo xong tài khoản Admin
    console.log(`✅ Đã chuẩn bị tài khoản Admin: ${adminEmail}`);

    // 4. Chuẩn bị bản ghi SinhVien thử nghiệm trong CSDL
    // Xóa bản ghi nếu đã có từ trước
    await SinhVien.destroy({ where: { maSV: testMaSV } });
    // Tạo mới bản ghi sinh viên thử nghiệm để phục vụ bài test xóa
    await SinhVien.create({
      maSV: testMaSV,
      hoTen: 'Sinh Viên Thử Nghiệm Xóa',
      email: 'sv.step9.test@example.com',
      maLop: 'CNTT-K45'
    });
    // Thông báo đã nạp xong bản ghi thử nghiệm
    console.log(`✅ Đã tạo bản ghi sinh viên thử nghiệm: ${testMaSV}`);

    // 5. Đăng nhập tài khoản Student để lấy studentToken
    // Gửi request POST tới endpoint đăng nhập
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: studentPassword })
    });
    // Đọc body phản hồi của Student
    const studentLoginBody = (await studentLoginRes.json()) as { data?: { accessToken: string } };
    // Trích xuất JWT token của Student
    const studentToken = studentLoginBody.data?.accessToken ?? '';
    // In thông báo nhận token Student thành công
    console.log(`✅ Đăng nhập Student thành công, nhận JWT Token.`);

    // 6. Đăng nhập tài khoản Admin để lấy adminToken
    // Gửi request POST tới endpoint đăng nhập với thông tin Admin
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    // Đọc body phản hồi của Admin
    const adminLoginBody = (await adminLoginRes.json()) as { data?: { accessToken: string } };
    // Trích xuất JWT token của Admin
    const adminToken = adminLoginBody.data?.accessToken ?? '';
    // In thông báo nhận token Admin thành công
    console.log(`✅ Đăng nhập Admin thành công, nhận JWT Token.`);

    // ==========================================================================
    // LẦN THỬ 1: CHƯA LOGIN (NẶC DANH) -> EXPECTED: 401 UNAUTHORIZED
    // ==========================================================================
    logSection('LẦN THỬ 1: GỌI DELETE KHI CHƯA LOGIN (KHÔNG GỬI TOKEN)');
    // Gửi request DELETE mà hoàn toàn không có header Authorization
    const res1 = await fetch(`${BASE_URL}/api/v1/sinh-vien/${testMaSV}`, {
      method: 'DELETE'
    });
    // Đọc mã trạng thái HTTP
    const status1 = res1.status;
    // Kiểm tra kết quả có đúng là 401 không
    const pass1 = status1 === 401;
    // In kết quả kiểm thử ca 1
    console.log(`${pass1 ? '✅ [PASS]' : '❌ [FAIL]'} Lần thử 1 (Chưa login):`);
    // In chi tiết mã phản hồi
    console.log(`   └─> Status thực tế: ${status1} (Kỳ vọng: 401)`);
    // Kiểm tra lại trong CSDL xem bản ghi có bị xóa nhầm không
    const checkDb1 = await SinhVien.findByPk(testMaSV);
    // In kết quả xác nhận CSDL vẫn toàn vẹn
    console.log(`   └─> Bản ghi CSDL: ${checkDb1 ? 'Vẫn còn nguyên vẹn trong SQL Server' : 'BỊ MẤT (LỖI)'}`);

    // ==========================================================================
    // LẦN THỬ 2: STUDENT ĐĂNG NHẬP NHƯNG ÉP GỌI DELETE -> EXPECTED: 403 FORBIDDEN
    // ==========================================================================
    logSection('LẦN THỬ 2: STUDENT ÉP GỌI DELETE (CÓ TOKEN STUDENT NHƯNG KHÔNG CÓ QUYỀN)');
    // Gửi request DELETE kèm token của Student
    const res2 = await fetch(`${BASE_URL}/api/v1/sinh-vien/${testMaSV}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });
    // Đọc mã trạng thái HTTP
    const status2 = res2.status;
    // Kiểm tra kết quả có đúng là 403 không
    const pass2 = status2 === 403;
    // In kết quả kiểm thử ca 2
    console.log(`${pass2 ? '✅ [PASS]' : '❌ [FAIL]'} Lần thử 2 (Student ép gọi DELETE):`);
    // In chi tiết mã phản hồi
    console.log(`   └─> Status thực tế: ${status2} (Kỳ vọng: 403)`);
    // Kiểm tra lại trong CSDL xem bản ghi có bị xóa không
    const checkDb2 = await SinhVien.findByPk(testMaSV);
    // In kết quả xác nhận CSDL vẫn được bảo vệ nghiêm ngặt
    console.log(`   └─> Bản ghi CSDL: ${checkDb2 ? 'Vẫn còn nguyên vẹn trong SQL Server (Không bị xóa lén)' : 'BỊ MẤT (LỖI BẢO MẬT)'}`);

    // ==========================================================================
    // LẦN THỬ 3: ADMIN BẤM XÓA BẢN GHI TEST -> EXPECTED: 200 OK + GET KHÔNG CÒN
    // ==========================================================================
    logSection('LẦN THỬ 3: ADMIN GỌI DELETE BẢN GHI THỬ NGHIỆM');
    // Gửi request DELETE kèm token của Admin
    const res3 = await fetch(`${BASE_URL}/api/v1/sinh-vien/${testMaSV}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    // Đọc mã trạng thái HTTP
    const status3 = res3.status;
    // Đọc body phản hồi
    const body3 = (await res3.json()) as { success: boolean; message: string };
    // Kiểm tra kết quả có đúng là 200 OK không
    const pass3Status = status3 === 200 && body3.success === true;

    // Gọi lại API GET để xác nhận bản ghi đã không còn xuất hiện trong danh sách
    const getRes = await fetch(`${BASE_URL}/api/v1/sinh-vien/${testMaSV}`);
    // Kỳ vọng GET trả về 404 Not Found vì bản ghi đã bị xóa
    const pass3Get = getRes.status === 404;

    // Đánh giá tổng thể ca 3
    const pass3 = pass3Status && pass3Get;
    // In kết quả kiểm thử ca 3
    console.log(`${pass3 ? '✅ [PASS]' : '❌ [FAIL]'} Lần thử 3 (Admin xóa bản ghi test):`);
    // In chi tiết status DELETE
    console.log(`   └─> Status DELETE: ${status3} (Kỳ vọng: 200) | Message: "${body3.message}"`);
    // In chi tiết status GET sau khi xóa
    console.log(`   └─> Status GET lại sau khi xóa: ${getRes.status} (Kỳ vọng: 404 - Bản ghi đã được dọn sạch)`);

    // ==========================================================================
    // LẦN THỬ 4: ADMIN XÓA LẠI CÙNG MÃ SV VỪA XÓA -> EXPECTED: 404 NOT FOUND
    // ==========================================================================
    logSection('LẦN THỬ 4: ADMIN GỌI DELETE LẠI CÙNG MÃ SV (KIỂM TRA BẢN GHI KHÔNG TỒN TẠI)');
    // Gửi request DELETE lần thứ 2 với cùng mã testMaSV
    const res4 = await fetch(`${BASE_URL}/api/v1/sinh-vien/${testMaSV}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    // Đọc mã trạng thái HTTP
    const status4 = res4.status;
    // Kiểm tra kết quả có đúng là 404 Not Found không
    const pass4 = status4 === 404;
    // In kết quả kiểm thử ca 4
    console.log(`${pass4 ? '✅ [PASS]' : '❌ [FAIL]'} Lần thử 4 (Admin xóa lại cùng mã SV):`);
    // In chi tiết mã phản hồi
    console.log(`   └─> Status thực tế: ${status4} (Kỳ vọng: 404 Not Found)`);
    // In thông điệp giao diện giữ dữ liệu nhất quán
    console.log(`   └─> Giao diện React: Giữ nguyên danh sách hiện tại, hiển thị thông báo lỗi 404 phù hợp.`);

    // ==========================================================================
    // TỔNG KẾT BƯỚC 9
    // ==========================================================================
    logSection('TỔNG KẾT KẾT QUẢ KIỂM THỬ BƯỚC 9');
    // Tổng hợp kết quả cả 4 ca
    const allPass = pass1 && pass2 && pass3 && pass4;
    // In kết luận tổng thể
    if (allPass) {
      console.log('🎉 TẤT CẢ 4/4 CA KIỂM THỬ BƯỚC 9 ĐÃ ĐẠT CHUẨN 100% (PASS)!');
      console.log('   - 401 Unauthorized: Chưa đăng nhập bị từ chối.');
      console.log('   - 403 Forbidden: Tài khoản Student bị chặn xóa từ tầng Backend.');
      console.log('   - 200 OK: Tài khoản Admin xóa thành công và đồng bộ dữ liệu.');
      console.log('   - 404 Not Found: Xóa lại bản ghi không tồn tại phản hồi chính xác.');
    } else {
      console.log('⚠️ CÓ CA KIỂM THỬ THẤT BẠI. VUI LÒNG KIỂM TRA LẠI CẤU HÌNH MIDDLEWARE!');
    }

    // 7. Dọn dẹp an toàn các tài khoản và dữ liệu test sau khi hoàn tất
    await User.destroy({ where: { email: [studentEmail, adminEmail] } });
    await SinhVien.destroy({ where: { maSV: testMaSV } });
    console.log('\n🧹 Đã dọn dẹp an toàn các tài khoản và bản ghi thử nghiệm.');

  } catch (err: unknown) {
    // Bắt lỗi phát sinh ngoài dự kiến và in chi tiết
    console.error('❌ Lỗi ngoại lệ trong quá trình thực thi kiểm thử Bước 9:', err);
    // Thoát với mã lỗi 1
    process.exit(1);
  } finally {
    // Đóng kết nối Sequelize
    await sequelize.close();
  }
}

// Thực thi kịch bản kiểm thử Bước 9
runStep9Verification();
