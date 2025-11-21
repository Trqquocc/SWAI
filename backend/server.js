const express = require("express");
const sql = require("mssql");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/auth", authRoutes);
app.use(express.static(path.join(__dirname, "../frontend")));

// Route chính
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Cấu hình kết nối SQL Server
const config = {
  user: "sa",
  password: "0Quenmatkhau",
  server: "localhost",
  database: "LoginDB",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Hàm kết nối database
async function connectDB() {
  try {
    await sql.connect(config);
    console.log("Kết nối SQL Server thành công!");
    return sql;
  } catch (err) {
    console.error("Lỗi kết nối database:", err);
    throw err;
  }
}

// Khởi tạo kết nối khi start server
connectDB();

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/register.html"));
});

// Route đăng ký
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin!",
      });
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message:
          "Username chỉ được chứa chữ cái, số và dấu gạch dưới (3-20 ký tự)!",
      });
    }

    if (
      password.length < 6 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số!",
      });
    }

    const checkUserQuery = "SELECT * FROM Users WHERE Username = @username";
    const checkRequest = new sql.Request();
    checkRequest.input("username", sql.NVarChar, username);
    const existingUser = await checkRequest.query(checkUserQuery);

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username đã được sử dụng!",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert chỉ Username và Password
    const insertQuery = `
            INSERT INTO Users (Username, Password) 
            OUTPUT INSERTED.ID, INSERTED.Username, INSERTED.CreatedDate
            VALUES (@username, @password)
        `;

    const insertRequest = new sql.Request();
    insertRequest.input("username", sql.NVarChar, username);
    insertRequest.input("password", sql.NVarChar, hashedPassword);

    const result = await insertRequest.query(insertQuery);
    const newUser = result.recordset[0];

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
      data: {
        id: newUser.ID,
        username: newUser.Username,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server! Vui lòng thử lại.",
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Có lỗi xảy ra!",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Không tìm thấy trang!",
  });
});

// Chay server
app.listen(PORT, () => {
  console.log(`Server chạy thành công:http://localhost:${PORT}`);
});

// Tắt server
process.on("SIGINT", async () => {
  console.log("\n Đang tắt server...");
  await sql.close();
  process.exit(0);
});
