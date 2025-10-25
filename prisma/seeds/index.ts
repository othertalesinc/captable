import { db } from "@/server/db";
import colors from "colors";
import inquirer from "inquirer";
colors.enable();

import type { QuestionCollection } from "inquirer";
import seedCompanies from "./companies";
import seedTeam from "./team";

if (process.env.NODE_ENV === "production") {
  console.log("❌ You cannot run this command on production".red);
  process.exit(0);
}

const parseBooleanEnv = (value?: string | null, defaultValue = false) =>
  value === undefined
    ? defaultValue
    : ["1", "true", "yes"].includes(value.toLowerCase());

const shouldAutoConfirm =
  parseBooleanEnv(process.env.SEED_SKIP_CONFIRM, true) ||
  parseBooleanEnv(process.env.SEED_FORCE) ||
  parseBooleanEnv(process.env.CI);

const confirmSeeding = async () => {
  if (shouldAutoConfirm) {
    console.log(
      "⚠️  Auto-confirm enabled via environment variable, skipping prompt."
        .yellow,
    );
    return true;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      "Interactive confirmation is required. Re-run with SEED_SKIP_CONFIRM=true (default) to proceed without prompts.",
    );
  }

  const inquiry = await inquirer.prompt({
    type: "confirm",
    name: "answer",
    message: "Are you sure you want to NUKE 🚀 and re-seed the database?",
  } as QuestionCollection);

  return inquiry.answer as boolean;
};

const seed = async () => {
  const answer = await confirmSeeding();

  if (!answer) {
    throw new Error("Seeding aborted");
  }

  await nuke();

  console.log("Seeding database".underline.cyan);
  return db.$transaction(async () => {
    await seedCompanies();
    await seedTeam();
  });
};

const nuke = () => {
  console.log("🚀 Nuking database records".yellow);
  return db.$transaction(async (db) => {
    await db.user.deleteMany();
    await db.member.deleteMany();
    await db.company.deleteMany();
    await db.shareClass.deleteMany();
    await db.equityPlan.deleteMany();
    await db.document.deleteMany();
    await db.bucket.deleteMany();
    await db.audit.deleteMany();
    await db.session.deleteMany();
  });
};

await seed()
  .then(async () => {
    console.log("✅ Database seeding completed".green);
    console.log(
      "💌 We have created four admin accounts for you. Please login with one of these emails:\n"
        .cyan,
      "ceo@example.com\n".underline.yellow,
      "cto@example.com\n".underline.yellow,
      "cfo@example.com\n".underline.yellow,
      "lawyer@example.com\n".underline.yellow,
    );
    await db.$disconnect();
  })
  .catch(async (error: Error) => {
    console.log(`❌ ${error.message}`.red);
    await db.$disconnect();
  });
