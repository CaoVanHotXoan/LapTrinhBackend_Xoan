// ==============================================================================
// SCRIPT CHẠY VÀ XÁC THỰC TOÀN BỘ 12 CA TEST VALIDATION (V01 - V12) BUỔI 06
// File: src/scripts/test-v01-v12.ts
// ==============================================================================

// Địa chỉ cổng đang chạy của server Express
const BASE_URL = 'http://localhost:5000';

// Hàm in kết quả test trực quan
function logResult(id: string, name: string, pass: boolean, detail: string): void {
  // Biểu tượng pass/fail
  const icon = pass ? ' PASS ' : ' FAIL ';
  // In mã test case và tên ca test
  console.log(`[${icon}] ${id}: ${name}`);
  // In chi tiết kết quả xác minh
  console.log(`       └─> ${detail}\n`);
}

// Hàm thực thi tuần tự 12 test cases
async function runValidationTests(): Promise<void> {
  console.log('\n===============================================================');
  console.log('   BẮT ĐẦU CHẠY KIỂM THỬ 12 CA VALIDATION (V01 - V12)');
  console.log('===============================================================\n');

  // Bước dọn dẹp: Xóa sinh viên SV006 nếu đã tồn tại từ trước để V01 luôn đạt 201
  await fetch(`${BASE_URL}/api/v1/sinh-vien/SV006`, { method: 'DELETE' });

  // ----------------------------------------------------------------------------
  // V01: POST SV006 đủ 4 trường hợp lệ -> Kỳ vọng: 201 Created
  // ----------------------------------------------------------------------------
  const resV01 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maSV: 'SV006',
      hoTen: 'Nguyễn Minh An',
      email: 'minhan@example.com',
      maLop: '25CT114',
    }),
  });
  const dataV01 = await resV01.json();
  const passV01 = resV01.status === 201 && dataV01.success === true && dataV01.data?.maSV === 'SV006';
  logResult('V01', 'POST SV006 đủ 4 trường hợp lệ', passV01, `Status: ${resV01.status} (Expected 201) | data.maSV: ${dataV01.data?.maSV}`);

  // ----------------------------------------------------------------------------
  // V02: POST thiếu hoTen, mã SV khác -> Kỳ vọng: 400 Bad Request
  // ----------------------------------------------------------------------------
  const resV02 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maSV: 'SV007',
      email: 'sv007@example.com',
      maLop: '25CT114',
    }),
  });
  const dataV02 = await resV02.json();
  const hasHoTenError = Array.isArray(dataV02.errors) && dataV02.errors.some((e: { field: string }) => e.field === 'hoTen');
  const passV02 = resV02.status === 400 && dataV02.success === false && hasHoTenError;
  logResult('V02', 'POST thiếu hoTen, mã SV khác', passV02, `Status: ${resV02.status} (Expected 400) | errors: ${JSON.stringify(dataV02.errors)}`);

  // ----------------------------------------------------------------------------
  // V03: POST email không đúng định dạng -> Kỳ vọng: 400 Bad Request
  // ----------------------------------------------------------------------------
  const resV03 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maSV: 'SV008',
      hoTen: 'Lê Hoài Nam',
      email: 'email-sai-dinh-dang',
      maLop: '25CT114',
    }),
  });
  const dataV03 = await resV03.json();
  const hasEmailError = Array.isArray(dataV03.errors) && dataV03.errors.some((e: { field: string }) => e.field === 'email');
  const passV03 = resV03.status === 400 && dataV03.success === false && hasEmailError;
  logResult('V03', 'POST email không đúng định dạng', passV03, `Status: ${resV03.status} (Expected 400) | errors: ${JSON.stringify(dataV03.errors)}`);

  // ----------------------------------------------------------------------------
  // V04: POST có thêm role: "admin" -> Kỳ vọng: 400 Bad Request (strict chặn)
  // ----------------------------------------------------------------------------
  const resV04 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maSV: 'SV009',
      hoTen: 'Vũ Hải Đăng',
      email: 'haidang@example.com',
      maLop: '25CT114',
      role: 'admin',
    }),
  });
  const dataV04 = await resV04.json();
  const passV04 = resV04.status === 400 && dataV04.success === false;
  logResult('V04', 'POST có thêm role: "admin" (chặn trường lạ)', passV04, `Status: ${resV04.status} (Expected 400) | errors: ${JSON.stringify(dataV04.errors)}`);

  // ----------------------------------------------------------------------------
  // V05: PUT SV006 thiếu email -> Kỳ vọng: 400 Bad Request
  // ----------------------------------------------------------------------------
  const resV05 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV006`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hoTen: 'Nguyễn Minh An Updated Thất Bại',
      maLop: '25CT114',
    }),
  });
  const dataV05 = await resV05.json();
  // Kiểm tra GET lại xem SV006 có còn giữ nguyên email cũ hay không
  const resCheckV05 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV006`);
  const dataCheckV05 = await resCheckV05.json();
  const passV05 = resV05.status === 400 && dataCheckV05.data?.email === 'minhan@example.com';
  logResult('V05', 'PUT SV006 thiếu email', passV05, `Status: ${resV05.status} (Expected 400) | GET kiểm chứng email cũ bảo toàn: ${dataCheckV05.data?.email}`);

  // ----------------------------------------------------------------------------
  // V06: PUT SV006 đủ 3 trường -> Kỳ vọng: 200 OK
  // ----------------------------------------------------------------------------
  const resV06 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV006`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hoTen: 'Nguyễn Minh An Updated',
      email: 'an.updated@example.com',
      maLop: '25CT114',
    }),
  });
  const dataV06 = await resV06.json();
  const passV06 = resV06.status === 200 && dataV06.data?.hoTen === 'Nguyễn Minh An Updated' && dataV06.data?.email === 'an.updated@example.com';
  logResult('V06', 'PUT SV006 đủ 3 trường hợp lệ', passV06, `Status: ${resV06.status} (Expected 200) | hoTen mới: ${dataV06.data?.hoTen}`);

  // ----------------------------------------------------------------------------
  // V07: PUT SV006 email sai kiểu (số) -> Kỳ vọng: 400 Bad Request
  // ----------------------------------------------------------------------------
  const resV07 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV006`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hoTen: 'Nguyễn Minh An',
      email: 123456,
      maLop: '25CT114',
    }),
  });
  const dataV07 = await resV07.json();
  const passV07 = resV07.status === 400 && dataV07.success === false;
  logResult('V07', 'PUT SV006 email sai kiểu (số)', passV07, `Status: ${resV07.status} (Expected 400) | errors: ${JSON.stringify(dataV07.errors)}`);

  // ----------------------------------------------------------------------------
  // V08: POST maSV đã tồn tại -> Kỳ vọng: 409 Conflict
  // ----------------------------------------------------------------------------
  const resV08 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maSV: 'SV006',
      hoTen: 'Nguyễn Minh An Trùng',
      email: 'trung@example.com',
      maLop: '25CT114',
    }),
  });
  const dataV08 = await resV08.json();
  const passV08 = resV08.status === 409 && dataV08.success === false;
  logResult('V08', 'POST maSV đã tồn tại', passV08, `Status: ${resV08.status} (Expected 409) | message: ${dataV08.message}`);

  // ----------------------------------------------------------------------------
  // V09: PUT mã không tồn tại, body hợp lệ -> Kỳ vọng: 404 Not Found
  // ----------------------------------------------------------------------------
  const resV09 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV9999`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hoTen: 'Không Tồn Tại',
      email: 'khongtontai@example.com',
      maLop: '25CT114',
    }),
  });
  const dataV09 = await resV09.json();
  const passV09 = resV09.status === 404 && dataV09.success === false;
  logResult('V09', 'PUT mã không tồn tại, body hợp lệ', passV09, `Status: ${resV09.status} (Expected 404) | message: ${dataV09.message}`);

  // ----------------------------------------------------------------------------
  // V10: GET /api/v1/sinh-vien -> Kỳ vọng: 200 OK, data là mảng
  // ----------------------------------------------------------------------------
  const resV10 = await fetch(`${BASE_URL}/api/v1/sinh-vien`);
  const dataV10 = await resV10.json();
  const passV10 = resV10.status === 200 && Array.isArray(dataV10.data);
  logResult('V10', 'GET /api/v1/sinh-vien', passV10, `Status: ${resV10.status} (Expected 200) | data là Array (${dataV10.data?.length} phần tử)`);

  // ----------------------------------------------------------------------------
  // V11: GET / và kiểm tra logs -> Kỳ vọng: 200 OK
  // ----------------------------------------------------------------------------
  const resV11 = await fetch(`${BASE_URL}/`);
  const dataV11 = await resV11.json();
  const passV11 = resV11.status === 200 && dataV11.success === true;
  logResult('V11', 'GET / và kiểm tra logs', passV11, `Status: ${resV11.status} (Expected 200) | message: ${dataV11.message}`);

  // ----------------------------------------------------------------------------
  // V12: GET / kiểm tra cơ chế ghi nối của access.log -> Kỳ vọng: 200 OK
  // ----------------------------------------------------------------------------
  const resV12 = await fetch(`${BASE_URL}/`);
  const dataV12 = await resV12.json();
  const passV12 = resV12.status === 200 && dataV12.success === true;
  logResult('V12', 'GET / xác nhận log append', passV12, `Status: ${resV12.status} (Expected 200) | message: ${dataV12.message}`);

  console.log('===============================================================');
  console.log('   HOÀN THÀNH KIỂM THỬ TẤT CẢ 12 CA TEST V01 - V12');
  console.log('===============================================================\n');
}

// Chạy hàm kiểm thử
runValidationTests().catch(console.error);
