const { Sequelize } = require("sequelize");
require("dotenv").config();

// Priority order:
// 1. Public proxy URL (for local dev and external access)
// 2. Railway full connection string (internal access in production)
// 3. explicit host/port config
const connectionUri =
  process.env.MYSQL_PUBLIC_URL ||
  process.env.MYSQL_URL ||
  process.env.MYSQLPUBLICURL ||
  process.env.DATABASE_URL;

let sequelize;
if (connectionUri) {
  sequelize = new Sequelize(connectionUri, {
    dialect: "mysql",
    dialectOptions: {
      connectTimeout: 10000,
    },
    logging: false,
  });
  console.log("DB ENV CHECK: using URI", connectionUri.split("@")[0] + "@***");
} else {
  sequelize = new Sequelize({
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || "tradeshowdb",
    username: process.env.MYSQLUSER || process.env.DB_USER || "root",
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
    host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    dialect: "mysql",
    dialectOptions: {
      connectTimeout: 10000,
    },
    logging: false,
  });
  console.log("DB ENV CHECK:", {
    host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
    user: process.env.MYSQLUSER || process.env.DB_USER || "root",
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || "tradeshowdb",
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
  });
}

module.exports = sequelize;
