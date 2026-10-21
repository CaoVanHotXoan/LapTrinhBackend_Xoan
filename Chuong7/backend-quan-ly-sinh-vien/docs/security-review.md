# BÁO CÁO ĐÁNH GIÁ AN NINH & BẢO MẬT (SECURITY REVIEW) - BƯỚC 11
**Tài liệu theo chuẩn Giáo trình Thực hành Chương 06 (Trang 18)**  
**Dự án**: Backend Quản lý sinh viên & Authentication JWT  
**Người thực hiện**: Sinh viên thực hành / Đóng vai trò Security Reviewer  

---

## 1. Bối cảnh & Mục tiêu (Context & Task)
Trước khi nộp bài thực hành Chương 06, việc thực hiện rà soát an ninh (Security Audit) là yêu cầu bắt buộc nhằm phát hiện các lỗ hổng bảo mật kinh điển thường bị AI sinh mã sai lầm hoặc do lập trình viên bất cẩn tạo ra.

Tài liệu này thực hiện:
1. Đánh giá đoạn mã cố tình viết sai của AI ở Trang 18 giáo trình.
2. Lập bảng đối chiếu chi tiết 6 lỗ hổng bảo mật: **Vị trí - Dấu hiệu - Nguy cơ - Cách sửa - Test chứng minh**.
3. Cung cấp bản vá mã nguồn an toàn có chú thích từng dòng.
4. Rà soát đối chiếu toàn bộ dự án hiện tại để đảm bảo hệ thống đạt chuẩn an toàn 100%.

---

## 2. Phân tích đoạn mã sai điển hình của AI (Trang 18)

### Đoạn mã lỗi:
```javascript
// DOAN CODE SAI CỦA AI - CHỈ DÙNG ĐỂ REVIEW, KHÔNG SAO CHÉP VÀO DỰ ÁN
if (user.password === password) {
  const token = jwt.sign(
    { id: user.id, role: req.body.role },
    '123456'
  );
  return res.json({ token, user });
}

const payload = jwt.decode(req.headers.authorization);
if (payload.role === 'admin') next();
```

---

## 3. Bảng đối chiếu 6 lỗ hổng bảo mật cốt lõi

| STT | Dấu hiệu cần tìm | Đoạn code AI sai (Vấn đề) | Nguy cơ bảo mật (Rủi ro) | Cách sửa chuẩn (Bản vá) | Test chứng minh thực tế |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Password plaintext** | `if (user.password === password)` | Mật khẩu được lưu hoặc so sánh dạng chuỗi rõ (Plaintext). Nếu CSDL bị tấn công SQL Injection hoặc rò rỉ backup, toàn bộ mật khẩu người dùng bị lộ 100%. | Sử dụng `await bcrypt.compare(password, user.passwordHash)` với mật khẩu đã băm bằng `bcrypt.hash(password, 12)`. | Test `A01`, `A06`, `A12`: Trong SQL Server chỉ lưu chuỗi `$2b$12$...`, không thể dịch ngược. |
| **2** | **JWT_SECRET hard-code và yếu** | Ký token bằng chuỗi `'123456'` | Chuỗi bí mật quá ngắn (6 ký tự), nằm lộ trực tiếp trong mã nguồn Git. Kẻ xấu dễ dàng tấn công từ điển (Dictionary/Brute-force) để tìm ra secret và tự tạo token admin giả mạo. | Đặt `JWT_SECRET` vào file `.env`, dùng chuỗi ngẫu nhiên có độ dài tối thiểu 32 ký tự, nạp an toàn qua `process.env.JWT_SECRET`. | File `.env.example`, Test `test:step4`: Không hard-code, báo lỗi nếu secret rỗng. |
| **3** | **Thiếu thời hạn expiresIn** | `jwt.sign({ ... }, '123456')` không có `expiresIn` | Token sinh ra có giá trị vĩnh viễn (Immortal Token). Nếu token bị rò rỉ trên mạng hoặc bị đánh cắp qua tấn công Man-in-the-Middle, kẻ gian có thể sử dụng mãi mãi. | Bắt buộc cấu hình thời hạn ngắn: `{ expiresIn: '1h', algorithm: 'HS256' }`. | Test `A11`: Gửi token đã quá hạn bị `verifyToken` chặn đứng với mã HTTP 401. |
| **4** | **Tin tưởng role do Client gửi** | `{ id: user.id, role: req.body.role }` | Lỗ hổng leo thang đặc quyền (Privilege Escalation). Người dùng nặc danh hoặc sinh viên chỉ cần gửi kèm `role: "admin"` trong body khi đăng ký/đăng nhập là cướp quyền quản trị hệ thống. | Tuyệt đối lấy role từ CSDL (`role: user.role`). Schema Zod dùng `.strict()` từ chối mọi trường `role` client cố tình truyền lên. | Test `A03`, `B05`: Zod từ chối 400 Bad Request nếu có trường lạ `role`. |
| **5** | **Dùng jwt.decode thay cho jwt.verify** | `jwt.decode(req.headers.authorization)` | `jwt.decode` CHỈ giải mã chuỗi Base64 thành JSON, **HOÀN TOÀN KHÔNG kiểm tra chữ ký số và hạn dùng**. Hacker chỉ cần sửa payload thành `role: "admin"` là qua mặt kiểm tra! | Luôn dùng `jwt.verify(token, secret, { algorithms: ['HS256'] })` để kiểm tra chữ ký và hạn dùng. | Test `JWT-04`, `A09`, `B03`: Sửa đổi bất kỳ ký tự nào trong token đều bị từ chối 401. |
| **6** | **Trả nguyên object user** | `return res.json({ token, user })` | Vô tình làm lộ toàn bộ thuộc tính nhạy cảm của người dùng (bao gồm `passwordHash`, thông tin nội bộ) ra ngoài client. | Sử dụng DTO hoặc chọn lọc tường minh các trường công khai an toàn: `{ id, fullName, email, role }`. | Test `A01`, `A05`, `A10`: Response JSON không bao giờ xuất hiện `password` hay `passwordHash`. |

---

## 4. Bản vá mã nguồn an toàn (Mã chuẩn có chú thích từng dòng)

### 🔹 4.1 Hàm xác thực Đăng nhập & Cấp Token an toàn (`src/services/auth.service.ts`)
```typescript
// ==============================================================================
// BẢN VÁ AN TOÀN CHO HÀM ĐĂNG NHẬP (KHẮC PHỤC LỖ HỔNG 1, 2, 3, 4, 6)
// ==============================================================================

export async function loginUser(dto: ILoginDTO): Promise<ILoginResponseDTO> {
  // 1. Chuẩn hóa email về dạng chữ thường và xóa khoảng trắng thừa
  const normalizedEmail = dto.email.trim().toLowerCase();

  // 2. Tìm kiếm người dùng trong CSDL bằng Sequelize
  const user = await User.findOne({ where: { email: normalizedEmail } });

  // 3. Chống enumeration: Nếu không tìm thấy user, trả về thông báo chung 401
  if (!user) {
    throw new AppError('Email hoặc mật khẩu không chính xác', 401);
  }

  // 4. So sánh mật khẩu bằng bcrypt.compare an toàn (KHẮC PHỤC LỖ HỔNG 1)
  const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

  // 5. Nếu sai mật khẩu, trả về thông báo lỗi chung trùng khớp bước 3
  if (!isPasswordValid) {
    throw new AppError('Email hoặc mật khẩu không chính xác', 401);
  }

  // 6. Lấy vai trò role TRỰC TIẾP TỪ DATABASE, không tin req.body (KHẮC PHỤC LỖ HỔNG 4)
  const userRole = user.role;

  // 7. Ký token JWT với Secret mạnh từ .env và thời hạn sống 1 giờ (KHẮC PHỤC LỖ HỔNG 2, 3)
  const accessToken = generateToken({
    sub: String(user.id), // Định danh duy nhất của người dùng
    role: userRole        // Vai trò được CSDL xác nhận
  });

  // 8. Trả về thông tin an toàn, tuyệt đối không trả passwordHash (KHẮC PHỤC LỖ HỔNG 6)
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 3600
  };
}
```

### 🔹 4.2 Middleware Xác thực Danh tính an toàn (`src/middlewares/isAuth.ts`)
```typescript
// ==============================================================================
// BẢN VÁ AN TOÀN CHO MIDDLEWARE ISAUTH (KHẮC PHỤC LỖ HỔNG 5)
// ==============================================================================

export function isAuth(req: Request, res: Response, next: NextFunction): void {
  // 1. Đọc header Authorization gửi lên từ phía Client
  const authHeader = req.headers.authorization;

  // 2. Kiểm tra định dạng bắt buộc: phải bắt đầu bằng tiền tố 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Vui lòng cung cấp mã xác thực Bearer Token hợp lệ',
      data: null
    });
    return;
  }

  // 3. Tách chuỗi để lấy phần token thực tế
  const token = authHeader.split(' ')[1];

  // 4. Bắt lỗi token rỗng
  if (!token || token.trim() === '') {
    res.status(401).json({
      success: false,
      message: 'Mã xác thực Bearer Token không được để trống',
      data: null
    });
    return;
  }

  try {
    // 5. BẮT BUỘC DÙNG jwt.verify KIỂM TRA CHỮ KÝ SỐ VÀ HẠN DÙNG (KHẮC PHỤC LỖ HỔNG 5)
    // Tuyệt đối không dùng jwt.decode vì decode không thể phát hiện chữ ký giả mạo
    const decoded = verifyToken(token);

    // 6. Gán thông tin đã được chứng thực vào req.user một cách an toàn
    req.user = {
      id: decoded.sub,
      role: decoded.role
    };

    // 7. Chuyển quyền xử lý sang middleware hoặc controller tiếp theo
    return next();
  } catch (error) {
    // 8. Khi chữ ký sai hoặc token hết hạn, jwt.verify ném lỗi -> Trả về 401 Unauthorized
    res.status(401).json({
      success: false,
      message: 'Mã xác thực không hợp lệ hoặc đã hết hạn',
      data: null
    });
    return;
  }
}
```

### 🔹 4.3 Middleware Phân quyền Quản trị viên (`src/middlewares/isAdmin.ts`)
```typescript
// ==============================================================================
// BẢN VÁ AN TOÀN CHO MIDDLEWARE ISADMIN (PHÂN QUYỀN RBAC)
// ==============================================================================

export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  // 1. Kiểm tra an toàn: req.user phải tồn tại từ isAuth (tránh crash 500)
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Yêu cầu xác thực danh tính trước khi kiểm tra quyền',
      data: null
    });
    return;
  }

  // 2. Kiểm tra vai trò: Phải có role là 'admin' mới được qua
  if (req.user.role !== 'admin') {
    // 3. Đã xác thực danh tính nhưng không đủ quyền -> Trả về chuẩn 403 Forbidden
    res.status(403).json({
      success: false,
      message: 'Từ chối truy cập: Thao tác này yêu cầu quyền quản trị (Admin)',
      data: null
    });
    return;
  }

  // 4. Đủ quyền quản trị -> Cho phép đi tiếp vào controller
  return next();
}
```

---

## 5. Kết luận đánh giá đối chiếu với Project hiện tại

Toàn bộ 6 lỗ hổng bảo mật trên đã được kiểm tra và rà soát chéo (Cross-check) trên toàn bộ mã nguồn của dự án `backend-quan-ly-sinh-vien`:
- `src/models/user.model.ts`: Lưu trữ trường `passwordHash`, không lưu mật khẩu rõ.
- `src/validations/auth.schema.ts`: Dùng Zod `.strict()` loại bỏ trường lạ `role`.
- `src/services/auth.service.ts`: Dùng `bcrypt.hash(..., 12)` và `bcrypt.compare()`.
- `src/utils/jwt.ts`: Sử dụng `process.env.JWT_SECRET`, ký `HS256`, hạn 1 giờ, dùng `jwt.verify` kiểm tra chữ ký.
- `src/middlewares/isAuth.ts` & `src/middlewares/isAdmin.ts`: Phân định rạch ròi giữa **401 Unauthorized** và **403 Forbidden**, đảm bảo nguyên tắc Gatekeeper an toàn.

**Kết luận**: Hệ thống đạt chuẩn an ninh bảo mật 100%, sẵn sàng cho nghiệm thu bài thực hành.
