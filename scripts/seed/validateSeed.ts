import fs from "node:fs";
import path from "node:path";

import {
  caseSchema,
  familySchema,
  organizationSchema,
  orgUserSchema,
  taskSchema,
} from "../../src/types/firestore.ts";

type SeedPayload = {
  organizations: Array<Record<string, unknown>>;
  orgUsers: Array<Record<string, unknown>>;
  families: Array<Record<string, unknown>>;
  cases: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
};

const seedPath = path.resolve(process.cwd(), "scripts/seed/devSeed.json");
const raw = fs.readFileSync(seedPath, "utf-8");
const parsed = JSON.parse(raw) as SeedPayload;

const checks = [
  ["organizations", parsed.organizations, organizationSchema],
  ["orgUsers", parsed.orgUsers, orgUserSchema],
  ["families", parsed.families, familySchema],
  ["cases", parsed.cases, caseSchema],
  ["tasks", parsed.tasks, taskSchema],
] as const;

for (const [collectionName, items, schema] of checks) {
  for (const item of items) {
    schema.parse(item);
  }
  console.log(`Validated ${items.length} ${collectionName} records`);
}

console.log("Seed fixture validation completed.");
