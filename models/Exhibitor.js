const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Exhibitor = sequelize.define('Exhibitor', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tradeShowId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'trade_show_id',
    references: {
      model: 'trade_shows',
      key: 'id',
    },
  },
  exhibitorName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'exhibitor_name',
  },
  boothNumber: {
    type: DataTypes.STRING(50),
    field: 'booth_number',
  },
  boothSize: {
    type: DataTypes.STRING(50),
    field: 'booth_size',
  },
  companyUrl: {
    type: DataTypes.STRING(500),
    field: 'company_url',
  },
  extraFields: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'extra_fields',
  },
}, {
  tableName: 'exhibitors',
  timestamps: true,
  underscored: true,
});

module.exports = Exhibitor;
