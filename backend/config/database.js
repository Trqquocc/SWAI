const sql = require("mssql");

const config = {
  user: "sa",
  password: "0Quenmatkhau",
  server: "localhost",
  database: "LoginDB",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Connected to SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });

module.exports = {
  sql,
  query: async (text, params) => {
    const pool = await poolPromise;
    try {
      const request = pool.request();

      if (params) {
        Object.keys(params).forEach((key) => {
          request.input(key, params[key]);
        });
      }

      const result = await request.query(text);
      return result;
    } catch (err) {
      console.error("Query error:", err);
      throw err;
    }
  },
};
