const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.MYSQLDATABASE || "tradeshowdb",
  process.env.MYSQLPASSWORD || "",
  {
    user: process.env.MYSQLUSER || "root",
    host: process.env.MYSQLHOST || "localhost",
    port: process.env.MYSQLPORT || 3306,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

module.exports = sequelize;
