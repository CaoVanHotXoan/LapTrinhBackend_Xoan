// ==============================================================================
// SCRIPT ĐO ĐẠC HIỆU NĂNG TRUY VẤN SQL SERVER (STATISTICS IO & TIME) - LAB 2
// File: src/scripts/measure-sql-performance.ts
// Mục đích: Đo đạc và đối chiếu số liệu Logical Reads, CPU Time, Elapsed Time
// ==============================================================================

// Nạp cấu hình các biến môi trường
import 'dotenv/config';

// Import Connection và Request từ tedious để bắt sự kiện infoMessage từ SQL Server
import { Connection, Request } from 'tedious';

// Cấu hình kết nối SQL Server
const config = {
  server: process.env.DB_HOST ?? '127.0.0.1',
  authentication: {
    type: 'default' as const,
    options: {
      userName: process.env.DB_USER ?? 'sa',
      password: process.env.DB_PASSWORD ?? '123456',
    }
  },
  options: {
    port: Number(process.env.DB_PORT ?? 1433),
    database: process.env.DB_NAME ?? 'QuanLySinhVienDB',
    encrypt: process.env.DB_ENCRYPT !== 'false',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
  }
};

// Khởi tạo kết nối
const connection = new Connection(config);

// Mảng gom các thông báo STATISTICS trả về từ SQL Server
const statsMessages: string[] = [];

connection.on('connect', (err) => {
  if (err) {
    console.error('Lỗi kết nối CSDL:', err.message);
    process.exit(1);
  }
  console.log('✅ Đã kết nối SQL Server thành công!');

  // Bắt sự kiện infoMessage để thu thập STATISTICS IO và STATISTICS TIME
  connection.on('infoMessage', (info) => {
    statsMessages.push(info.message);
  });

  // Kịch bản đo lường: Bật thống kê IO, TIME -> Chạy truy vấn phân trang -> Tắt thống kê
  const sql = `
    SET STATISTICS IO ON;
    SET STATISTICS TIME ON;

    -- Truy vấn phân trang và tìm kiếm theo họ tên (Chương 08)
    SELECT [maSV], [hoTen], [email], [maLop]
    FROM [dbo].[SinhVien]
    WHERE [hoTen] LIKE N'%Anh%'
    ORDER BY [maSV] ASC
    OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY;

    SET STATISTICS IO OFF;
    SET STATISTICS TIME OFF;
  `;

  let rowCount = 0;
  const sampleRows: any[] = [];

  const req = new Request(sql, (error) => {
    if (error) {
      console.error('Lỗi thực thi truy vấn:', error.message);
    } else {
      console.log('\n--- KẾT QUẢ ĐO ĐẠC HIỆU NĂNG THỰC TẾ ---');
      console.log(`Số dòng dữ liệu trả về: ${rowCount}`);
      console.log('Dữ liệu mẫu:', JSON.stringify(sampleRows, null, 2));
      console.log('\n--- BẢNG THÔNG SỐ STATISTICS IO & TIME TỪ SQL SERVER ---');
      statsMessages.forEach((msg) => {
        if (msg.includes('Table') || msg.includes('SQL Server Execution Times') || msg.includes('CPU time')) {
          console.log(`> ${msg}`);
        }
      });
    }
    connection.close();
  });

  req.on('row', (columns) => {
    rowCount++;
    if (sampleRows.length < 3) {
      const rowObj: Record<string, unknown> = {};
      columns.forEach((col: { metadata: { colName: string }; value: unknown }) => {
        rowObj[col.metadata.colName] = col.value;
      });
      sampleRows.push(rowObj);
    }
  });

  connection.execSql(req);
});

connection.connect();
