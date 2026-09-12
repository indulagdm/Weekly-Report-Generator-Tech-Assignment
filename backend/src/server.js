const app = require("./app");
const { syncDatabase } = require("./scripts/syncDb");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await syncDatabase();
    console.log("Database connection established.");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Unable to start server:", err.message);
    process.exit(1);
  }
}

start();
