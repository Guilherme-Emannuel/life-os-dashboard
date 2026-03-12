const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "prisma", "dev.db");
const backupsDir = path.join(__dirname, "..", "backups");

if (!fs.existsSync(dbPath)) {
  console.error("Banco de dados não encontrado em", dbPath);
  process.exit(1);
}

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

const now = new Date();
const stamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
  "_",
  String(now.getHours()).padStart(2, "0"),
  String(now.getMinutes()).padStart(2, "0"),
  String(now.getSeconds()).padStart(2, "0"),
].join("");

const target = path.join(backupsDir, `dev-${stamp}.db`);

fs.copyFileSync(dbPath, target);

console.log("Backup criado em", target);

