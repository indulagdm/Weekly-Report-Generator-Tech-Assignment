require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const initDB = async () => {
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "sql", "schema.sql"),
    "utf8",
  );

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  console.log("Connecting and running schema.sql ...");
  await connection.query(sql);
  console.log('✔ Database "weekly_reports_db" created/updated successfully.');
  await connection.end();
};

initDB().catch((err) => {
  console.error("✘ Failed to initialize database:", err.message);
  process.exit(1);
});
