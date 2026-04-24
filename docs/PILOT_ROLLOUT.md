# Pilot Rollout Runbook

This runbook operationalizes the partner-pilot rollout for the Nonprofit OS capabilities.

## Pilot Cohort

- Partner 1: case management agency with therapy + intake workflows.
- Partner 2: referral/career support agency receiving warm handoffs.
- Optional Partner 3: nonprofit serving as observer sandbox.

## Pre-Launch Checklist

1. Enable feature flags for pilot users:
   - `NEXT_PUBLIC_FF_TENANT_ADMIN_WORKSPACE=true`
   - `NEXT_PUBLIC_FF_INQUIRY_PIPELINE=true`
   - `NEXT_PUBLIC_FF_HANDOFF_COLLABORATION=true`
   - `NEXT_PUBLIC_FF_DOCUMENTATION_PACKS=true`
   - `NEXT_PUBLIC_FF_AUDITABLE_EXPORTS=true`
   - `NEXT_PUBLIC_FF_MONETIZATION_ENTITLEMENTS=true`
2. Run entitlement bootstrap:
   - `npm --prefix functions run pilot:entitlements -- --orgs=orgA,orgB --plan=professional`
3. Backfill audit metadata for historical docs:
   - `npm --prefix functions run pilot:backfill-audit`

## Weekly Pilot Cadence

- Week 1: Inquiry capture + intake completion time.
- Week 2: Documentation pack adoption + signature completion rates.
- Week 3: Cross-org handoff acceptance latency and status outcomes.
- Week 4: Export/audit review with org admins.

## Success Metrics

- Inquiry-to-conversion percentage.
- Handoff acceptance within 72 hours.
- Average time from intake start to case-ready documentation bundle.
- Weekly audit export completion without permission errors.

## Rollback Plan

- Disable public feature flags.
- Keep read access to pilot records; block new writes via callables.
- Notify pilot organizations and export data snapshots for continuity.
