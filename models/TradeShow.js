const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TradeShow = sequelize.define(
  "TradeShow",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Core Info
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dates: {
      type: DataTypes.STRING,
    },
    eventDate: {
      type: DataTypes.STRING,
      field: "event_date",
    },
    todaysDate: {
      type: DataTypes.STRING,
      field: "todays_date",
    },
    city: {
      type: DataTypes.STRING(100),
    },
    country: {
      type: DataTypes.STRING(100),
    },
    priority: {
      type: DataTypes.ENUM("Low", "Medium", "High", "Critical"),
      defaultValue: "Medium",
    },
    coreInfoExtra: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: "core_info_extra",
    },

    // Metrics
    lastYearData: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "last_year_data",
    },
    biStageDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "bi_stage_days",
    },
    biStageWeeks: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: "bi_stage_weeks",
    },
    biStageMonths: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: "bi_stage_months",
    },
    attendees: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalLeads: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_leads",
    },
    expectedAttendees: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "expected_attendees",
    },
    exhibitorsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "exhibitors_count",
    },
    firstExtractedDate: {
      type: DataTypes.STRING,
      field: "first_extracted_date",
    },
    exhibitorsExtracted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "exhibitors_extracted",
    },
    secondExtractedDate: {
      type: DataTypes.STRING,
      field: "second_extracted_date",
    },
    secondExhibitorsExtracted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "second_exhibitors_extracted",
    },
    boothSizeAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "booth_size_available",
    },
    bSize: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "b_size",
    },
    difference: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    variation: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    metricsExtra: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: "metrics_extra",
    },

    // Booth Tracking
    booth20x20Above: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "booth_20x20_above",
    },
    booth10x10And10x20: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "booth_10x10_and_10x20",
    },
    booth20x20Below: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "booth_20x20_below",
    },
    boothTrackingExtra: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: "booth_tracking_extra",
    },

    // Resources
    url: {
      type: DataTypes.STRING(500),
    },
    floorPlanUrl: {
      type: DataTypes.STRING(500),
      field: "floor_plan_url",
    },
    floorPlanYear: {
      type: DataTypes.STRING(100),
      field: "floor_plan_year",
    },
    directoryUrl: {
      type: DataTypes.STRING(500),
      field: "directory_url",
    },
    secondExtractionUrl: {
      type: DataTypes.STRING(500),
      field: "second_extraction_url",
    },
    comment: {
      type: DataTypes.TEXT,
    },
    resourcesExtra: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: "resources_extra",
    },

    // Workflow
    firstExtractionAssigned: {
      type: DataTypes.STRING,
      field: "first_extraction_assigned",
    },
    firstExtractionStatus: {
      type: DataTypes.ENUM("Pending", "In Progress", "Completed"),
      defaultValue: "Pending",
      field: "first_extraction_status",
    },
    secondExtractionAssigned: {
      type: DataTypes.STRING,
      field: "second_extraction_assigned",
    },
    secondExtractionStatus: {
      type: DataTypes.ENUM("Pending", "In Progress", "Completed"),
      defaultValue: "Pending",
      field: "second_extraction_status",
    },
    workflowExtra: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: "workflow_extra",
    },
  },
  {
    tableName: "trade_shows",
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: (tradeShow) => {
        // Variation Calculation
        const expected = tradeShow.exhibitorsCount || 0;
        const latestExtracted =
          tradeShow.secondExhibitorsExtracted > 0
            ? tradeShow.secondExhibitorsExtracted
            : tradeShow.exhibitorsExtracted || 0;

        tradeShow.difference = expected - latestExtracted;
        tradeShow.variation =
          expected > 0
            ? parseFloat(((tradeShow.difference / expected) * 100).toFixed(2))
            : 0;

        // BI Stage (Time to Event)
        if (tradeShow.eventDate) {
          const eventDateObj = new Date(tradeShow.eventDate);
          const today = new Date();
          // Calculate difference in time
          const timeDiff = eventDateObj.getTime() - today.getTime();
          // Calculate difference in days
          const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

          tradeShow.biStageDays = diffDays;
          tradeShow.biStageWeeks = parseFloat((diffDays / 7).toFixed(1));
          tradeShow.biStageMonths = parseFloat((diffDays / 30).toFixed(1));
        }
      },
    },
  },
);

module.exports = TradeShow;
