const { sequelize, TradeShow, Exhibitor } = require("./models");

// TSV-like source rows from your data block (header row must match and is skipped)
const rawRows = `
tradeshow	Exhibitor Name	Booth Number	Booth Size	Company URL
Consumer Electronics Show - CES	(Rokid)Hangzhou Lingban Technology Co., Ltd.	17214	50X50	global.rokid.com
Surf Expo	(Sleepal)HongKong XSmart Century Technology Ltd.	9171	20X20	sleepal.ai
AIMExpo - American International Motocycle Expo	.lumen	50768	50X30	www.dotlumen.com/
Consumer Electronics Show - CES	0x Limited	63200	50X40	www.0xmd.com
Surf Expo	10minds Co., Ltd.	54139	20X40	motionpillow.com/en/home.do
AIMExpo - American International Motocycle Expo	1NCE	10171	50X20	1nce.com/en-us/
Consumer Electronics Show - CES	276 HOLDINGS Inc.	62501	50X50	www.276holdings.com/
Surf Expo	3C Ventures, LLC	55030	NA	3cventures.com/
AIMExpo - American International Motocycle Expo	3D Technology 'UTU'	50352	60X20	utu.com.ua/en
Consumer Electronics Show - CES	3H CO., LTD.	50816	40X30	www.3hk.co.kr/
Surf Expo	3M	8505	70X40	www.mmm.com
AIMExpo - American International Motocycle Expo	4INLAB Inc.	63416	80X30	4inlab.ai
Consumer Electronics Show - CES	6P Color, Inc.	N238	40X30	6pcolor.com/
Surf Expo	8K Association Inc.	2976	NA	8kassociation.com/
AIMExpo - American International Motocycle Expo	A-ZoneTech Co,. Ltd	50816	40X30	a-zonetech.co.kr/
WORLD OF CONCRETE - WOC	10 10 Hats	S13335	5*10	https://1010hats.com/
WORLD OF CONCRETE - WOC	20% Water Savings	N149	10*10	https://cmpwater.com/
WORLD OF CONCRETE - WOC	3B Scientific	C6390	10*10	NA
WORLD OF CONCRETE - WOC	3D Printing Live RIC Robotics	BL201	10*20	https://ricrobotics.com/
WORLD OF CONCRETE - WOC	3GEN Masonry Products, Inc.	S10748	10*20	https://3genmp.com/
WORLD OF CONCRETE - WOC	3M	C5140	20*30	http://www.3m.com/ppe
`;

function parseRow(line) {
  const parts = line.split("\t").map((v) => v.trim());
  if (parts.length < 5) return null;
  const [tradeshow, exhibitorName, boothNumber, boothSize, companyUrl] = parts;

  return {
    tradeshow,
    exhibitorName,
    boothNumber: boothNumber || null,
    boothSize: boothSize || null,
    companyUrl: companyUrl && companyUrl !== "NA" ? companyUrl : null,
  };
}

const rows = rawRows
  .split(/\r?\n/)
  .map((r) => r.trim())
  .filter((r) => r && !r.startsWith("tradeshow"))
  .map(parseRow)
  .filter(Boolean);

async function seedExhibitors() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync({ alter: true });
    console.log("✅ Tables synced");

    for (const row of rows) {
      const tradeShow = await TradeShow.findOne({
        where: { name: row.tradeshow },
      });

      if (!tradeShow) {
        console.warn(
          `⚠️ TradeShow not found for row: ${row.tradeshow} (skipping)`,
        );
        continue;
      }

      const [exhibitor, created] = await Exhibitor.findOrCreate({
        where: {
          tradeShowId: tradeShow.id,
          exhibitorName: row.exhibitorName,
        },
        defaults: {
          tradeShowId: tradeShow.id,
          exhibitorName: row.exhibitorName,
          boothNumber: row.boothNumber,
          boothSize: row.boothSize,
          companyUrl: row.companyUrl,
        },
      });

      if (!created) {
        await exhibitor.update({
          boothNumber: row.boothNumber,
          boothSize: row.boothSize,
          companyUrl: row.companyUrl,
        });
        console.log(
          `✏️ Updated exhibitor ${row.exhibitorName} (TradeShow: ${row.tradeshow})`,
        );
      } else {
        console.log(
          `✅ Inserted exhibitor ${row.exhibitorName} (TradeShow: ${row.tradeshow})`,
        );
      }
    }

    console.log("\n🎉 Exhibitor seeding complete!");
    return true;
  } catch (err) {
    console.error("❌ Exhibitor seeding failed:", err);
    throw err;
  }
}

module.exports = { seedExhibitors };

if (require.main === module) {
  seedExhibitors()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
