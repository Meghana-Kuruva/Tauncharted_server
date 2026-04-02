const { sequelize, User } = require("./models");

const users = [
  {
    name: "Asif",
    email: "asif@tauncharted.com",
    password: "password123",
    role: "admin",
  },
  {
    name: "Hammad",
    email: "hammad@tauncharted.com",
    password: "password123",
    role: "admin",
  },
  {
    name: "Jyoti",
    email: "jyoti@tauncharted.com",
    password: "password123",
    role: "intern",
  },
  {
    name: "Mahi",
    email: "mahi@tauncharted.com",
    password: "password123",
    role: "intern",
  },
  {
    name: "Meghana",
    email: "meghana@tauncharted.com",
    password: "password123",
    role: "admin",
  },
  {
    name: "Mukul",
    email: "mukul@tauncharted.com",
    password: "password123",
    role: "intern",
  },
  {
    name: "Riya",
    email: "riya@tauncharted.com",
    password: "password123",
    role: "intern",
  },
  {
    name: "Soumya",
    email: "soumya@tauncharted.com",
    password: "password123",
    role: "intern",
  },
  {
    name: "Skumar",
    email: "skumar@tauncharted.com",
    password: "password123",
    role: "associate",
  },
  {
    name: "Systems",
    email: "systems@tauncharted.com",
    password: "password123",
    role: "admin",
  },
  {
    name: "Tammy",
    email: "tammy@tauncharted.com",
    password: "password123",
    role: "associate",
  },
  {
    name: "Tahmed",
    email: "tahmed@tauncharted.com",
    password: "password123",
    role: "admin",
  },
];

const seedUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync({ alter: true });
    console.log("✅ Tables synced");

    for (const userData of users) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData,
      });

      if (created) {
        console.log(`✅ Created ${user.role}: ${user.email}`);
      } else {
        console.log(`⏭️  Already exists: ${user.email}`);
      }
    }

    console.log("\n🎉 User seeding complete!");
    console.log("\nDefault password for all users: password123");
    console.log("Admins: hammad, meghana, tahmed, systems");
    console.log("Associates: skumar, tammy");
    console.log("Interns: asif, jyoti, mahi, mukul, riya, soumya");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

seedUsers();
