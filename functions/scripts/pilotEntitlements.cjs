/* eslint-disable no-console */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

function parseArg(name, fallback = "") {
  const pref = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(pref));
  return hit ? hit.slice(pref.length) : fallback;
}

async function main() {
  const orgsRaw = parseArg("orgs");
  const plan = parseArg("plan", "professional");
  if (!orgsRaw) {
    throw new Error("Missing --orgs=orgId1,orgId2");
  }
  const orgIds = orgsRaw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (orgIds.length === 0) throw new Error("No organization IDs provided.");

  const featureMap = {
    starter: ["case_timeline", "inquiries", "documentation_packs"],
    growth: ["case_timeline", "inquiries", "documentation_packs", "handoffs"],
    professional: ["case_timeline", "inquiries", "documentation_packs", "handoffs", "auditable_exports"],
    enterprise: ["case_timeline", "inquiries", "documentation_packs", "handoffs", "auditable_exports", "advanced_automation"],
  };

  for (const organizationId of orgIds) {
    await db.collection("entitlements").doc(organizationId).set(
      {
        organizationId,
        plan,
        enabledFeatures: featureMap[plan] ?? featureMap.professional,
        limits: { staffSeats: 25, activeCases: 2500, monthlyHandoffs: 500 },
        billingStatus: "trial",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedByUid: "pilot-script",
      },
      { merge: true },
    );
    console.log(`entitlement seeded for ${organizationId} (${plan})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
