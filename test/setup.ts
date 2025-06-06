import { execSync } from "child_process";
import "reflect-metadata";
import prisma from "../src/prisma";

if (process.env.TEST_TYPE === "integration") {
  beforeAll(() => {
    execSync("npx prisma db push");
  });

  beforeEach(async () => {
    await prisma.$executeRaw`
      DO $$ 
      DECLARE
          r RECORD;
      BEGIN
          -- Loop over all tables in the public schema and truncate them
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'TRUNCATE TABLE public.' || r.tablename || ' CASCADE';
          END LOOP;
      END $$;
    `;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
}
