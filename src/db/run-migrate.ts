import { migrate_db } from "../db/migrate";

migrate_db()
  .then(() => {
    console.log("✅ Migration done");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
