const { sequelize, TradeShow, Exhibitor, Prospect } = require("./models");

const rawRows = `
First Name	Last Name	Title	Company Name	Email	Corporate Phone	# Employees	Person Linkedin Url	Website	City	State	Country	Event Date	Event Name	Booth Size
Mara	Canfield	Tradeshow & Event Coordinator	Optikos Corp.	maracanfield@optikos.com	+1 617-354-7557	93	http://www.linkedin.com/in/mara-canfield	https://optikos.com	Boston	Massachusetts	United States	Jul 23rd	CES	10X20
John	Smith	Event Manager	Teknova Inc.	john.smith@teknova.com	+1 212-555-7812	150	http://www.linkedin.com/in/john-smith	https://teknova.com	New York	New York	United States	Aug 10th	CES	10X20
Emily	Johnson	Marketing Director	BluePeak Solutions	emily.johnson@bluepeak.com	+1 415-555-6621	80	http://www.linkedin.com/in/emily-johnson	https://bluepeak.com	San Francisco	California	United States	Sep 5th	WOC	20X20
Michael	Brown	Event Coordinator	NextGen Robotics	michael.brown@nextgen.com	+1 312-555-8899	200	http://www.linkedin.com/in/michael-brown	https://nextgen.com	Chicago	Illinois	United States	Oct 12th	WOC	10X30
Sarah	Davis	Operations Manager	Innovatek Corp	sarah.davis@innovatek.com	+1 617-555-2233	120	http://www.linkedin.com/in/sarah-davis	https://innovatek.com	Boston	Massachusetts	United States	Nov 8th	CES	20X20
David	Miller	Trade Show Manager	Alpha Systems	david.miller@alpha.com	+1 206-555-3344	300	http://www.linkedin.com/in/david-miller	https://alpha.com	Seattle	Washington	United States	Jan 15th	WOC	30X30
Laura	Wilson	Event Planner	BrightEdge Tech	laura.wilson@brightedge.com	+1 512-555-9988	60	http://www.linkedin.com/in/laura-wilson	https://brightedge.com	Austin	Texas	United States	Feb 20th	WOC	10X10
James	Moore	Marketing Manager	FusionWorks	james.moore@fusionworks.com	+1 303-555-4455	140	http://www.linkedin.com/in/james-moore	https://fusionworks.com	Denver	Colorado	United States	Mar 18th	Auto Expo	20X30
Olivia	Taylor	Event Specialist	Vertex Labs	olivia.taylor@vertex.com	+1 408-555-1122	95	http://www.linkedin.com/in/olivia-taylor	https://vertex.com	San Jose	California	United States	Apr 9th	TechCrunch Disrupt	10X20
Daniel	Anderson	Project Manager	Quantum Corp	daniel.anderson@quantum.com	+1 646-555-2234	210	http://www.linkedin.com/in/daniel-anderson	https://quantum.com	New York	New York	United States	May 25th	CES	20X20
Sophia	Thomas	Event Director	NovaTech	sophia.thomas@novatech.com	+1 702-555-7788	175	http://www.linkedin.com/in/sophia-thomas	https://novatech.com	Las Vegas	Nevada	United States	Jun 30th	CES	30X30
Matthew	Jackson	Marketing Head	EcoWave	matthew.jackson@ecowave.com	+1 305-555-5566	130	http://www.linkedin.com/in/matthew-jackson	https://ecowave.com	Miami	Florida	United States	Jul 14th	WOC	10X20
Ava	White	Event Manager	Skyline Tech	ava.white@skyline.com	+1 213-555-9911	85	http://www.linkedin.com/in/ava-white	https://skyline.com	Los Angeles	California	United States	Aug 22nd	CES	20X20
Ethan	Harris	Coordinator	Pinnacle Corp	ethan.harris@pinnacle.com	+1 404-555-6677	160	http://www.linkedin.com/in/ethan-harris	https://pinnacle.com	Atlanta	Georgia	United States	Sep 11th	WOC	10X30
Mia	Martin	Event Planner	GlobalSoft	mia.martin@globalsoft.com	+1 617-555-8890	110	http://www.linkedin.com/in/mia-martin	https://globalsoft.com	Boston	Massachusetts	United States	Oct 3rd	CES	20X20
Alexander	Thompson	Trade Show Lead	Apex Innovations	alex.thompson@apex.com	+1 312-555-3322	190	http://www.linkedin.com/in/alex-thompson	https://apex.com	Chicago	Illinois	United States	Nov 19th	Tech Expo	30X30
Isabella	Garcia	Marketing Exec	CoreTech	isabella.garcia@coretech.com	+1 480-555-1010	75	http://www.linkedin.com/in/isabella-garcia	https://coretech.com	Phoenix	Arizona	United States	Dec 7th	CES	10X10
William	Martinez	Event Specialist	SmartEdge	william.martinez@smartedge.com	+1 619-555-2233	140	http://www.linkedin.com/in/william-martinez	https://smartedge.com	San Diego	California	United States	Jan 28th	WOC	20X20
Charlotte	Robinson	Event Manager	Nexon Systems	charlotte.robinson@nexon.com	+1 503-555-8899	105	http://www.linkedin.com/in/charlotte-robinson	https://nexon.com	Portland	Oregon	United States	Feb 14th	WOC	10X20
Benjamin	Clark	Operations Lead	FutureTech	benjamin.clark@futuretech.com	+1 215-555-6677	220	http://www.linkedin.com/in/benjamin-clark	https://futuretech.com	Philadelphia	Pennsylvania	United States	Mar 9th	CES	20X30
Amelia	Rodriguez	Event Coordinator	DigiWave	amelia.rodriguez@digiwave.com	+1 210-555-7788	98	http://www.linkedin.com/in/amelia-rodriguez	https://digiwave.com	San Antonio	Texas	United States	Apr 21st	WOC	10X20
`;

const rows = rawRows
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("First Name"))
  .map((line) => {
    const [
      firstName,
      lastName,
      title,
      companyName,
      email,
      corporatePhone,
      employees,
      linkedinUrl,
      website,
      city,
      state,
      country,
      eventDate,
      eventName,
      boothSize,
    ] = line.split("\t");
    return {
      name: `${firstName || ""} ${lastName || ""}`.trim(),
      title: title || null,
      companyName: companyName || null,
      email: email || null,
      corporatePhone: corporatePhone || null,
      employees: employees ? Number(employees) : null,
      linkedinUrl: linkedinUrl || null,
      website: website || null,
      city: city || null,
      state: state || null,
      country: country || null,
      eventDate: eventDate || null,
      eventName: eventName || null,
      boothSize: boothSize || null,
    };
  });

async function ensureTradeShowUsable(name) {
  let tradeShow = await TradeShow.findOne({ where: { name } });
  if (!tradeShow) {
    tradeShow = await TradeShow.create({
      name,
      dates: name,
      eventDate: null,
      city: null,
      country: null,
      priority: "Medium",
    });
    console.log(`✨ Created placeholder trade show: ${name}`);
  }
  return tradeShow;
}

async function getOrCreateExhibitor(tradeShowId, companyName, boothSize) {
  const [exhibitor] = await Exhibitor.findOrCreate({
    where: {
      tradeShowId,
      exhibitorName: companyName,
    },
    defaults: {
      tradeShowId,
      exhibitorName: companyName,
      boothSize: boothSize || null,
    },
  });
  return exhibitor;
}

async function seedProspects() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync({ alter: true });
    console.log("✅ Tables synced");

    for (const row of rows) {
      if (!row.name || !row.eventName) {
        console.warn("⚠️ Skipping invalid row (missing name/eventName):", row);
        continue;
      }

      const tradeShow = await ensureTradeShowUsable(row.eventName);
      const exhibitor = await getOrCreateExhibitor(
        tradeShow.id,
        row.companyName || "Unknown",
        row.boothSize,
      );

      const [prospect, created] = await Prospect.findOrCreate({
        where: {
          exhibitorId: exhibitor.id,
          name: row.name,
          email: row.email || null,
        },
        defaults: {
          exhibitorId: exhibitor.id,
          name: row.name,
          role: row.title || null,
          companyName: row.companyName || null,
          email: row.email || null,
          phone: row.corporatePhone || null,
          extraFields: {
            employees: row.employees,
            linkedinUrl: row.linkedinUrl,
            website: row.website,
            city: row.city,
            state: row.state,
            country: row.country,
            eventDate: row.eventDate,
            boothSize: row.boothSize,
          },
        },
      });

      if (created) {
        console.log(`✅ Prospect inserted: ${row.name} (${row.eventName})`);
      } else {
        await prospect.update({
          role: row.title || prospect.role,
          email: row.email || prospect.email,
          extraFields: {
            ...prospect.extraFields,
            employees: row.employees,
            linkedinUrl: row.linkedinUrl,
            website: row.website,
            city: row.city,
            state: row.state,
            country: row.country,
            eventDate: row.eventDate,
            boothSize: row.boothSize,
          },
        });
        console.log(`✏️ Prospect updated: ${row.name} (${row.eventName})`);
      }
    }

    console.log("\n🎉 Prospect seeding complete!");
    return true;
  } catch (err) {
    console.error("❌ Prospect seeding failed:", err);
    throw err;
  }
}

module.exports = { seedProspects };

if (require.main === module) {
  seedProspects()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
