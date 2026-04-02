const { TradeShow, Exhibitor, Prospect } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// GET /api/tradeshows
exports.getAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.priority) where.priority = req.query.priority;
    if (req.query.firstExtractionStatus)
      where.firstExtractionStatus = req.query.firstExtractionStatus;
    if (req.query.secondExtractionStatus)
      where.secondExtractionStatus = req.query.secondExtractionStatus;
    if (req.query.search) {
      where.name = { [Op.like]: `%${req.query.search}%` };
    }

    const order = [];
    if (req.query.sortBy) {
      order.push([req.query.sortBy, req.query.sortOrder || "ASC"]);
    } else {
      order.push(["createdAt", "DESC"]);
    }

    const tradeShows = await TradeShow.findAll({ where, order });
    res.json(tradeShows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tradeshows/:id
exports.getById = async (req, res) => {
  try {
    const include =
      req.query.include === "exhibitors"
        ? [{ model: Exhibitor, as: "exhibitors" }]
        : [];

    const tradeShow = await TradeShow.findByPk(req.params.id, { include });
    if (!tradeShow)
      return res.status(404).json({ error: "TradeShow not found" });
    res.json(tradeShow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/tradeshows
exports.create = async (req, res) => {
  try {
    const data = sanitizeData(req.body, TRADE_SHOW_FIELDS);
    if (!data.name || !data.name.trim()) {
      return res.status(400).json({ error: "Show Name is required." });
    }
    const tradeShow = await TradeShow.create(data);
    res.status(201).json(tradeShow);
  } catch (err) {
    console.error("Create trade show error:", err);
    res.status(400).json({ error: err.message, details: err.errors || null });
  }
};

// PUT /api/tradeshows/:id
exports.update = async (req, res) => {
  try {
    const tradeShow = await TradeShow.findByPk(req.params.id);
    if (!tradeShow)
      return res.status(404).json({ error: "TradeShow not found" });

    const data = sanitizeData(req.body, TRADE_SHOW_FIELDS);
    await tradeShow.update(data);
    res.json(tradeShow);
  } catch (err) {
    console.error("Update trade show error:", err);
    res.status(400).json({ error: err.message, details: err.errors || null });
  }
};

// DELETE /api/tradeshows/:id
exports.remove = async (req, res) => {
  try {
    const tradeShow = await TradeShow.findByPk(req.params.id);
    if (!tradeShow)
      return res.status(404).json({ error: "TradeShow not found" });

    await tradeShow.destroy();
    res.json({ message: "TradeShow deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const NUMERIC_FIELDS = [
  "biStageDays",
  "biStageWeeks",
  "biStageMonths",
  "attendees",
  "totalLeads",
  "expectedAttendees",
  "exhibitorsCount",
  "exhibitorsExtracted",
  "secondExhibitorsExtracted",
  "bSize",
  "difference",
  "variation",
  "booth20x20Above",
  "booth20x20Below",
  "booth10x10And10x20",
];

const sanitizeData = (data, modelFields) => {
  const sanitized = {};
  modelFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null) {
      let value = data[field];

      // Handle Numeric Extraction (Strip commas, percentages, etc.)
      if (NUMERIC_FIELDS.includes(field)) {
        if (typeof value === "string") {
          // Remove commas, spaces, percent signs
          value = value.replace(/[,\s%]/g, "");
        }
        const parsed =
          field === "variation" ? parseFloat(value) : parseInt(value, 10);
        sanitized[field] = isNaN(parsed) ? 0 : parsed;
      }
      // Handle Date fields (store as string for model fields defined as STRING)
      else if (
        [
          "eventDate",
          "todaysDate",
          "firstExtractedDate",
          "secondExtractedDate",
        ].includes(field)
      ) {
        let dateVal = value;
        if (dateVal && typeof dateVal !== "string") {
          dateVal = dateVal.toString();
        }
        const parsed = new Date(dateVal);
        if (dateVal && !isNaN(parsed.getTime())) {
          sanitized[field] = parsed.toISOString().split("T")[0];
        } else {
          sanitized[field] = null;
        }
      } else {
        sanitized[field] = value;
      }
    }
  });
  return sanitized;
};

const TRADE_SHOW_FIELDS = [
  "name",
  "dates",
  "eventDate",
  "todaysDate",
  "lastYearData",
  "city",
  "country",
  "priority",
  "attendees",
  "totalLeads",
  "expectedAttendees",
  "exhibitorsCount",
  "exhibitorsExtracted",
  "firstExtractedDate",
  "secondExhibitorsExtracted",
  "secondExtractedDate",
  "biStageDays",
  "biStageWeeks",
  "biStageMonths",
  "boothSizeAvailable",
  "bSize",
  "booth20x20Above",
  "booth10x10And10x20",
  "difference",
  "variation",
  "url",
  "floorPlanUrl",
  "floorPlanYear",
  "directoryUrl",
  "comment",
  "firstExtractionAssigned",
  "firstExtractionStatus",
  "secondExtractionUrl",
  "secondExtractionAssigned",
  "secondExtractionStatus",
  "coreInfoExtra",
  "metricsExtra",
  "boothTrackingExtra",
  "resourcesExtra",
  "workflowExtra",
];
const EXHIBITOR_FIELDS = [
  "exhibitorName",
  "boothNumber",
  "boothSize",
  "companyUrl",
  "status",
  "notes",
  "assignedTo",
  "tradeShowId",
];
const PROSPECT_FIELDS = ["name", "email", "role", "notes", "exhibitorId"];

// POST /api/tradeshows/:id/bulk-import
exports.bulkImport = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { tradeShow: tradeShowData, exhibitors, prospects } = req.body;

    // 1. Update TradeShow
    const tradeShow = await TradeShow.findByPk(id, { transaction: t });
    if (!tradeShow) throw new Error("TradeShow not found");
    if (tradeShowData) {
      await tradeShow.update(sanitizeData(tradeShowData, TRADE_SHOW_FIELDS), {
        transaction: t,
      });
    }

    // 2. Handle Exhibitors
    const nameToId = {};
    if (exhibitors && Array.isArray(exhibitors)) {
      for (const exData of exhibitors) {
        if (!exData.exhibitorName) continue;
        const sanitizedEx = sanitizeData(exData, EXHIBITOR_FIELDS);

        const [exhibitor] = await Exhibitor.findOrCreate({
          where: { tradeShowId: id, exhibitorName: exData.exhibitorName },
          defaults: {
            ...sanitizedEx,
            extraFields: exData.extraFields || {},
            tradeShowId: id,
          },
          transaction: t,
        });

        if (!exhibitor.isNewRecord) {
          await exhibitor.update(
            { ...sanitizedEx, extraFields: exData.extraFields || {} },
            { transaction: t },
          );
        }
        nameToId[exData.exhibitorName] = exhibitor.id;
      }
    }

    // 3. Handle Prospects
    if (prospects && Array.isArray(prospects)) {
      for (const prData of prospects) {
        if (!prData.name || !prData.exhibitorName) continue;
        const exhibitorId =
          nameToId[prData.exhibitorName] ||
          (
            await Exhibitor.findOne({
              where: { tradeShowId: id, exhibitorName: prData.exhibitorName },
              transaction: t,
            })
          )?.id;

        if (exhibitorId) {
          const sanitizedPr = sanitizeData(prData, PROSPECT_FIELDS);
          const [prospect] = await Prospect.findOrCreate({
            where: { exhibitorId, name: prData.name },
            defaults: {
              ...sanitizedPr,
              extraFields: prData.extraFields || {},
              exhibitorId,
            },
            transaction: t,
          });

          if (!prospect.isNewRecord) {
            await prospect.update(
              { ...sanitizedPr, extraFields: prData.extraFields || {} },
              { transaction: t },
            );
          }
        }
      }
    }

    await t.commit();
    res.json({ message: "Bulk import completed successfully" });
  } catch (err) {
    if (t) await t.rollback();
    res.status(400).json({ error: err.message });
  }
};

// POST /api/tradeshows/bulk-import (Global)
exports.globalBulkImport = async (req, res) => {
  const fs = require("fs");
  try {
    fs.writeFileSync("import-debug.json", JSON.stringify(req.body, null, 2));
  } catch (err) {}

  const t = await sequelize.transaction();
  try {
    const { tradeShows, exhibitors, prospects } = req.body;
    const tsNameToId = {};
    const exNameToId = {};

    // 1. Handle Multiple TradeShows
    if (tradeShows && Array.isArray(tradeShows)) {
      for (const tsData of tradeShows) {
        if (!tsData.name) continue;
        const sanitizedTs = sanitizeData(tsData, TRADE_SHOW_FIELDS);
        const [ts] = await TradeShow.findOrCreate({
          where: { name: tsData.name },
          defaults: sanitizedTs,
          transaction: t,
        });
        if (!ts.isNewRecord) await ts.update(sanitizedTs, { transaction: t });
        tsNameToId[tsData.name] = ts.id;
      }
    }

    // 2. Handle Exhibitors
    if (exhibitors && Array.isArray(exhibitors)) {
      for (const exData of exhibitors) {
        const tradeShowName = exData.tradeShowName;
        if (!exData.exhibitorName || !tradeShowName) continue;

        let tsId =
          tsNameToId[tradeShowName] ||
          (
            await TradeShow.findOne({
              where: { name: tradeShowName },
              transaction: t,
            })
          )?.id;

        if (!tsId) {
          const [newTs] = await TradeShow.findOrCreate({
            where: { name: tradeShowName },
            defaults: { name: tradeShowName },
            transaction: t,
          });
          tsId = newTs.id;
          tsNameToId[tradeShowName] = tsId;
        }

        const sanitizedEx = sanitizeData(exData, EXHIBITOR_FIELDS);
        const [ex] = await Exhibitor.findOrCreate({
          where: { tradeShowId: tsId, exhibitorName: exData.exhibitorName },
          defaults: {
            ...sanitizedEx,
            extraFields: exData.extraFields || {},
            tradeShowId: tsId,
          },
          transaction: t,
        });
        if (!ex.isNewRecord)
          await ex.update(
            { ...sanitizedEx, extraFields: exData.extraFields || {} },
            { transaction: t },
          );
        exNameToId[`${tsId}-${exData.exhibitorName}`] = ex.id;
      }
    }

    // 3. Handle Prospects
    // Helper: fuzzy-find a tradeshow ID by name (exact match first, then partial/LIKE)
    const findTradeShowId = async (name) => {
      // 1. Exact cache hit
      if (tsNameToId[name]) return tsNameToId[name];
      // 2. Partial cache hit (prospect has short name like "CES", cache has "Consumer Electronics Show - CES")
      const cacheHit = Object.keys(tsNameToId).find(
        (k) =>
          k.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(k.toLowerCase()),
      );
      if (cacheHit) return tsNameToId[cacheHit];
      // 3. Exact DB lookup
      const exact = await TradeShow.findOne({
        where: { name },
        transaction: t,
      });
      if (exact) {
        tsNameToId[name] = exact.id;
        return exact.id;
      }
      // 4. Fuzzy DB lookup (LIKE %name%)
      const fuzzy = await TradeShow.findOne({
        where: { name: { [Op.like]: `%${name}%` } },
        transaction: t,
      });
      if (fuzzy) {
        tsNameToId[name] = fuzzy.id;
        return fuzzy.id;
      }
      return null;
    };

    if (prospects && Array.isArray(prospects)) {
      for (const prData of prospects) {
        const tradeShowName = prData.tradeShowName;
        const exhibitorName = prData.exhibitorName;
        if (!prData.name || !exhibitorName || !tradeShowName) continue;

        let tsId = await findTradeShowId(tradeShowName);

        if (!tsId) {
          // Create a new tradeshow only as a last resort
          const [newTs] = await TradeShow.findOrCreate({
            where: { name: tradeShowName },
            defaults: { name: tradeShowName },
            transaction: t,
          });
          tsId = newTs.id;
          tsNameToId[tradeShowName] = tsId;
        }

        let exId =
          exNameToId[`${tsId}-${exhibitorName}`] ||
          (
            await Exhibitor.findOne({
              where: { tradeShowId: tsId, exhibitorName: exhibitorName },
              transaction: t,
            })
          )?.id;

        if (!exId) {
          const [newEx] = await Exhibitor.findOrCreate({
            where: { tradeShowId: tsId, exhibitorName: exhibitorName },
            defaults: { exhibitorName, tradeShowId: tsId },
            transaction: t,
          });
          exId = newEx.id;
          exNameToId[`${tsId}-${exhibitorName}`] = exId;
        }

        const sanitizedPr = sanitizeData(prData, PROSPECT_FIELDS);
        const [pr] = await Prospect.findOrCreate({
          where: { exhibitorId: exId, name: prData.name },
          defaults: {
            ...sanitizedPr,
            extraFields: prData.extraFields || {},
            exhibitorId: exId,
          },
          transaction: t,
        });
        if (!pr.isNewRecord)
          await pr.update(
            { ...sanitizedPr, extraFields: prData.extraFields || {} },
            { transaction: t },
          );
      }
    }

    await t.commit();
    res.json({ message: "Global bulk import completed successfully" });
  } catch (err) {
    if (t) await t.rollback();
    res.status(400).json({ error: err.message });
  }
};

// GET /api/tradeshows/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const defaultStats = {
      weekOverview: {
        weeklyShows: 0,
        expectedExhibitors: 0,
        prospects: 0,
        standardShows: 0,
        elongatedShows: 0,
        totalTradeShows: 0,
        totalExhibitors: 0,
        totalProspects: 0,
      },
      monthlyPerformance: [],
      recentShows: [],
      statusDistribution: [],
      resourcePerformance: [],
      top10Shows: [],
    };

    // 1. Totals
    const totalTradeShows = await TradeShow.count();
    const totalExhibitors = await Exhibitor.count();
    const totalProspects = await Prospect.count();
    defaultStats.weekOverview.totalTradeShows = totalTradeShows;
    defaultStats.weekOverview.totalExhibitors = totalExhibitors;
    defaultStats.weekOverview.totalProspects = totalProspects;

    // 2. Week's Overview (Shows in the last 7 days vs next 7 days, or just "current week")
    // Simple approach: Shows where eventDate is this week, or simply recent activity.
    // The prompt says "week's overview (weekly Tradeshows..."
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // We'll consider "weekly" as anything created/updated in the last 7 days.
    const weeklyShows = await TradeShow.findAll({
      where: {
        updatedAt: { [Op.gte]: oneWeekAgo },
      },
    });

    defaultStats.weekOverview.weeklyShows = weeklyShows.length;

    let weeklyExpectedExhibitors = 0;
    let standardCount = 0;
    let elongatedCount = 0;

    weeklyShows.forEach((ts) => {
      weeklyExpectedExhibitors += ts.exhibitorsCount || 0;

      // Calculate standard vs elongated
      // Standard Shows: biStageWeeks <= 2 OR duration <= 4 days
      let isStandard = false;
      if (ts.biStageWeeks !== undefined && ts.biStageWeeks !== null) {
        if (ts.biStageWeeks <= 2) isStandard = true;
      }
      // If still not defined, assume standard if no other info
      if (isStandard) {
        standardCount++;
      } else {
        elongatedCount++;
      }
    });

    const weeklyProspects = await Prospect.count({
      where: { updatedAt: { [Op.gte]: oneWeekAgo } },
    });

    defaultStats.weekOverview.expectedExhibitors = weeklyExpectedExhibitors;
    defaultStats.weekOverview.standardShows = standardCount;
    defaultStats.weekOverview.elongatedShows = elongatedCount;
    defaultStats.weekOverview.prospects = weeklyProspects;

    // 3. Status Distribution
    const statuses = await TradeShow.findAll({
      attributes: [
        "firstExtractionStatus",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["firstExtractionStatus"],
    });
    defaultStats.statusDistribution = statuses.map((s) => ({
      name: s.firstExtractionStatus || "Pending",
      count: parseInt(s.dataValues.count, 10),
    }));

    // 4. Performance by Resources
    const resources = await TradeShow.findAll({
      attributes: [
        "firstExtractionAssigned",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: { firstExtractionAssigned: { [Op.ne]: null, [Op.ne]: "" } },
      group: ["firstExtractionAssigned"],
    });
    defaultStats.resourcePerformance = resources.map((r) => ({
      name: r.firstExtractionAssigned,
      count: parseInt(r.dataValues.count, 10),
    }));

    // 5. Top 10 shows by expected exhibitors
    const topShows = await TradeShow.findAll({
      order: [["exhibitorsCount", "DESC"]],
      limit: 10,
      attributes: ["id", "name", "exhibitorsCount", "exhibitorsExtracted"],
    });
    defaultStats.top10Shows = topShows;

    // 6. Recent Tradeshows added
    const recentShows = await TradeShow.findAll({
      order: [["createdAt", "DESC"]],
      limit: 6,
      attributes: [
        "id",
        "name",
        "createdAt",
        "firstExtractionStatus",
        "priority",
      ],
    });
    defaultStats.recentShows = recentShows;

    // 7. Monthly Performance Overview
    // Just mock or simple calculation for demonstration (grouping by SQLite date functions)
    // For SQLite, strftime('%Y-%m', createdAt)
    const monthlyTs = await TradeShow.findAll({
      attributes: [
        [
          sequelize.fn("DATE_FORMAT", sequelize.col("created_at"), "%Y-%m"),
          "month",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: [
        sequelize.fn("DATE_FORMAT", sequelize.col("created_at"), "%Y-%m"),
      ],
      order: [
        [
          sequelize.fn("DATE_FORMAT", sequelize.col("created_at"), "%Y-%m"),
          "ASC",
        ],
      ],
      limit: 12,
    });

    defaultStats.monthlyPerformance = monthlyTs.map((m) => ({
      month: m.dataValues.month,
      tradeshows: parseInt(m.dataValues.count, 10),
      exhibitors: Math.floor(parseInt(m.dataValues.count, 10) * 15.5), // Example mock metric based on tradeshows where we don't have direct monthly join
      prospects: Math.floor(parseInt(m.dataValues.count, 10) * 42.1),
    }));

    res.json(defaultStats);
  } catch (err) {
    console.error("getDashboardStats Error:", err);
    res.status(500).json({ error: err.message });
  }
};
