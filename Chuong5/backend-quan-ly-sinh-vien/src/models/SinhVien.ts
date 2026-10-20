// Import các kiểu và class cần thiết từ Sequelize
import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes
} from 'sequelize';

// Import instance sequelize từ config database (lưu ý đuôi .js)
import { sequelize } from '../config/database.js';

// Khai báo Model SinhVien kế thừa từ Sequelize Model với type safety
export class SinhVien extends Model<
  InferAttributes<SinhVien>,
  InferCreationAttributes<SinhVien>
> {
  // Dùng declare để TypeScript hiểu các property mà không che lấp getter/setter của Sequelize
  declare maSV: string;
  declare hoTen: string;
  declare email: string;
  declare maLop: string;
}

// Khởi tạo định nghĩa ánh xạ bảng dbo.SinhVien
SinhVien.init(
  {
    maSV: {
      type: DataTypes.STRING(5),
      primaryKey: true,
      allowNull: false
    },
    hoTen: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(254),
      allowNull: false
    },
    maLop: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'SinhVien',
    schema: 'dbo',
    timestamps: false // Không tự động sinh createdAt, updatedAt
  }
);
