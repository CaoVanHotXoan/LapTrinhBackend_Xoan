// ==============================================================================
// MODEL SEQUELIZE ÁNH XẠ BẢNG DBO.USERS
// File: src/models/user.model.ts
// Mục đích: Định nghĩa thực thể User với type safety phục vụ Authentication & RBAC
// ==============================================================================

// Import các interface và kiểu dữ liệu phục vụ định nghĩa Model từ thư viện Sequelize
import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional
} from 'sequelize';

// Import đối tượng kết nối Sequelize từ file cấu hình cơ sở dữ liệu (đuôi .js theo chuẩn ESM)
import { sequelize } from '../config/database.js';

// Khai báo lớp User kế thừa từ Sequelize Model với cấu hình Type Safety tuyệt đối
export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  // Định danh tài khoản id, tự tăng khi tạo nên được bọc bởi CreationOptional
  declare id: CreationOptional<number>;

  // Họ và tên người dùng, kiểu chuỗi bắt buộc
  declare fullName: string;

  // Địa chỉ email của người dùng, duy nhất trong hệ thống
  declare email: string;

  // Chuỗi băm mật khẩu bcrypt, không lưu mật khẩu dạng rõ
  declare passwordHash: string;

  // Vai trò người dùng (student / admin), có giá trị mặc định nên dùng CreationOptional
  declare role: CreationOptional<string>;

  // Đường dẫn ảnh đại diện của tài khoản (cho phép null và tùy chọn khi tạo mới)
  declare avatarUrl: CreationOptional<string | null>;
}

// Khởi tạo ánh xạ giữa class User và bảng dbo.Users trong SQL Server
User.init(
  {
    // Cấu hình cột id làm khóa chính, tự động tăng
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    // Cấu hình cột fullName lưu họ tên, độ dài tối đa 150 ký tự
    fullName: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    // Cấu hình cột email, độ dài tối đa 254 ký tự, có ràng buộc duy nhất (unique)
    email: {
      type: DataTypes.STRING(254),
      allowNull: false,
      unique: true
    },
    // Cấu hình cột passwordHash lưu kết quả băm mật khẩu, độ dài tối đa 255 ký tự
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    // Cấu hình cột role với giá trị mặc định là 'student'
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'student'
    },
    // Cấu hình cột avatarUrl lưu đường dẫn ảnh đại diện, tối đa 255 ký tự, cho phép nhận giá trị null
    avatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    // Instance sequelize quản lý kết nối cơ sở dữ liệu
    sequelize,
    // Tên bảng thực tế trong cơ sở dữ liệu SQL Server
    tableName: 'Users',
    // Schema chứa bảng trong SQL Server
    schema: 'dbo',
    // Tắt tính năng tự động quản lý thời gian vì bảng không có createdAt/updatedAt
    timestamps: false
  }
);

// Export mặc định User để thuận tiện import ở các module khác
export default User;
