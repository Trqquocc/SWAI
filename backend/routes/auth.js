const express = require("express");
const bcrypt = require("bcrypt");
const sql = require("mssql");
const router = express.Router();
const db = require("../config/database");

// Đăng ký
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }

    // Check if user exists
    const userCheck = await db.query(
      "SELECT * FROM Users WHERE Username = @username",
      { username }
    );

    if (userCheck.recordset.length > 0) {
      return res.status(400).json({ error: "Username đã tồn tại" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.query(
      `INSERT INTO Users (Username, Password) 
             OUTPUT INSERTED.ID, INSERTED.Username
             VALUES (@username, @password)`,
      { username, password: hashedPassword }
    );

    res.status(201).json({
      message: "Đăng ký thành công",
      user: result.recordset[0],
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng nhập đầy đủ username và password",
      });
    }

    // Find user in database
    const userResult = await db.query(
      "SELECT * FROM Users WHERE Username = @username",
      { username }
    );

    if (userResult.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Tài khoản không tồn tại",
      });
    }

    const user = userResult.recordset[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Mật khẩu không chính xác",
      });
    }

    // Login successful
    res.json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        id: user.ID,
        username: user.Username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server khi xử lý đăng nhập",
    });
  }
});

//Route đăng xuất
router.get("/logout", (req, res) => {
  res.redirect("/login.html");
});

module.exports = router;
