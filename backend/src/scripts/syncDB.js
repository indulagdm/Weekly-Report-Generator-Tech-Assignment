// One-time / dev convenience script: creates all tables from the
// Sequelize models. For a production project you'd normally swap
// this for proper migrations (sequelize-cli); noted as a possible
// future improvement in the backend report.
require("dotenv").config();
const { pool } = require("../config/database");

const force = process.argv.includes("--force");

const syncDatabase = async () => {
  try {
    const [rows] = await pool.execute(
      `
  SELECT SCHEMA_NAME
  FROM INFORMATION_SCHEMA.SCHEMATA
  WHERE SCHEMA_NAME = ?
  `,
      [process.env.DB_NAME],
    );

    if (rows.length === 0) {
      console.log("Database does not exist");
    }
    console.log("Database already exists");
  } catch (err) {
    console.error("Sync failed:", err);
    process.exit(1);
  }
};

module.exports = { syncDatabase };
