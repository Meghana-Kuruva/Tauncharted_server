const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prospect = sequelize.define('Prospect', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  exhibitorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'exhibitor_id',
    references: {
      model: 'exhibitors',
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false, // Ensure you have a 'Name' column in your CSV/Sheet
  },
  // New fields matching your spreadsheet screenshot
  linkedinUrl: {
    type: DataTypes.STRING,
    field: 'linkedin_url',
  },
  website: {
    type: DataTypes.STRING,
  },
  city: {
    type: DataTypes.STRING(100),
  },
  state: {
    type: DataTypes.STRING(100),
  },
  country: {
    type: DataTypes.STRING(100),
  },
  eventName: {
    type: DataTypes.STRING,
    field: 'event_name',
  },
  eventDate: {
    type: DataTypes.STRING, // Using STRING because 'Jul 23rd' isn't a standard Date format
    field: 'event_date',
  },
  boothSize: {
    type: DataTypes.STRING(50),
    field: 'booth_size',
  },
  // Existing fields
  email: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.STRING(100),
  },
  notes: {
    type: DataTypes.TEXT,
  },
  extraFields: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'extra_fields',
  },
}, {
  tableName: 'prospects',
  timestamps: true,
  underscored: true,
});

module.exports = Prospect;