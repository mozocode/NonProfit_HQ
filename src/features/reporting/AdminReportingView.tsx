"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { defaultReportingDateRange, useAdminReporting, useReportingFilterOptions } from "@/hooks/useAdminReporting";
import { generateReportingNarrative, buildReportingExportCards } from "@/lib/reportingNarrative";
import { ROUTES } from "@/constants";
import type { ReportingSegmentFilters } from "@/types/reporting";
import { ReportingExportCards } from "@/features/reporting/ReportingExportCards";
import { SimpleBarChart } from "@/features/reporting/SimpleBarChart";

function toSegment(
  schoolId: string,
  partnerOrgId: string,
  programId: string,
  staffUid: string,
): ReportingSegmentFilters {
  return {
    schoolId: schoolId || null,
    partnerOrgId: partnerOrgId || null,
    programId: programId || null,
    staffUid: staffUid || null,
  };
}

export function AdminReportingView() {
  const { orgId } = useAuth();
  const [range, setRange] = useState(() => defaultReportingDateRange(90));
  const [schoolId, setSchoolId] = useState("");
  const [partnerOrgId, setPartnerOrgId] = useState("");
  const [programId, setProgramId] = useState("");
  const [staffUid, setStaffUid] = useState("");

  const segments = useMemo(
    () => toSegment(schoolId, partnerOrgId, programId, staffUid),
    [schoolId, partnerOrgId, programId, staffUid],
  );

  const { schools, partners, programs, staff, isLoading: optionsLoading } = useReportingFilterOptions();
  const { snapshot, isLoading, error, refetch } = useAdminReporting(range, segments);

  const narrative = snapshot ? generateReportingNarrative(snapshot) : null;
  const exportCards = snapshot ? buildReportingExportCards(snapshot) : [];

  const schoolOptions = useMemo(
    () => [{ value: "", label: "All schools" }, ...schools.map((s) => ({ value: s.id, label: s.label }))],
    [schools],
  );
  const partnerOptions = useMemo(
    () => [{ value: "", label: "All partners" }, ...partners.map((p) => ({ value: p.id, label: p.label }))],
    [partners],
  );
  const programOptions = useMemo(
    () => [{ value: "", label: "All programs" }, ...programs.map((p) => ({ value: p.id, label: p.label }))],
    [programs],
  );
  const staffOptions = useMemo(
    () => [{ value: "", label: "All staff" }, ...staff.map((s) => ({ value: s.id, label: s.label }))],
    [staff],
  );

  const sortedSchools = useMemo(() => {
    if (!snapshot) return [];
    return [...snapshot.familiesBySchool].sort((a, b) => b.familiesCount - a.familiesCount);
  }, [snapshot]);

  const sortedPartners = useMemo(() => {
    if (!snapshot) return [];
    return [...snapshot.participantsByPartner].sort((a, b) => b.participantsCount - a.participantsCount);
  }, [snapshot]);

  if (!orgId) {
    return <EmptyState title="No organization" description="Sign in with an admin account tied to an organization." />;
  }

  if (isLoading && !snapshot) {
    return <LoadingState message="Loading analytics…" />;
  }

  if (error && !snapshot) {
    return (
      <EmptyState
        title="Could not load reporting"
        description={error.message}
        action={
          <Button type="button" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!snapshot) {
    return <EmptyState title="No data" description="Try adjusting filters or date range." />;
  }

  const referralStatusRows = snapshot.referralsByStatus
    .filter((r) => r.count > 0)
    .map((r) => ({ label: r.status, value: r.count }));

  const assignmentStatusRows = snapshot.assignmentReferralsByStatus
    .filter((r) => r.count > 0)
    .map((r) => ({ label: r.status, value: r.count }));

  const referralTrendRows = snapshot.referralTrend.map((t) => ({
    label: t.period,
    value: t.made,
    sublabel: `${t.completed} completed`,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.ADMIN}>
          Command center
        </Link>
        <Button type="button" variant="outline" size="sm" disabled={isLoading} onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Date range and segments apply to all metrics below.
            {optionsLoading ? " Loading filter options…" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="rep-start">Start date</Label>
            <input
              id="rep-start"
              type="date"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={range.start}
              onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rep-end">End date</Label>
            <input
              id="rep-end"
              type="date"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={range.end}
              onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rep-school">School</Label>
            <Select
              id="rep-school"
              options={schoolOptions}
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rep-partner">Partner organization</Label>
            <Select
              id="rep-partner"
              options={partnerOptions}
              value={partnerOrgId}
              onChange={(e) => setPartnerOrgId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rep-program">Program</Label>
            <Select
              id="rep-program"
              options={programOptions}
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rep-staff">Staff member (caseload)</Label>
            <Select
              id="rep-staff"
              options={staffOptions}
              value={staffUid}
              onChange={(e) => setStaffUid(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setRange(defaultReportingDateRange(90));
                setSchoolId("");
                setPartnerOrgId("");
                setProgramId("");
                setStaffUid("");
              }}
            >
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Section title="Organization summary" description="Headline metrics for the selected period and filters.">
        <div className="mb-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-medium text-foreground">Organization</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{orgId}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Families served", value: snapshot.totalFamiliesServed },
            { label: "Participants served", value: snapshot.totalParticipantsServed },
            { label: "Active cases", value: snapshot.activeCases },
            { label: "Overdue follow-ups", value: snapshot.overdueFollowUps },
            { label: "Missing documents", value: snapshot.missingDocumentsCount },
            { label: "Staff (active)", value: snapshot.staffCount },
            { label: "Weekly report compliance (approx.)", value: `${snapshot.staffReportComplianceRate}%` },
            { label: "Survey responses (period)", value: snapshot.surveyResponsesInPeriod },
          ].map((m) => (
            <Card key={m.label}>
              <CardHeader className="pb-2">
                <CardDescription>{m.label}</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{m.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Survey completion</CardTitle>
              <CardDescription>{snapshot.surveyCompletionRateLabel}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Staff reports</CardTitle>
              <CardDescription>{snapshot.staffReportComplianceDetail}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Section>

      {narrative ? (
        <Section title="Impact in plain language" description="Short narrative you can reuse in emails or board packets.">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{narrative.headline}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              {narrative.paragraphs.map((p, i) => (
                <p key={`narrative-p-${i}`}>{p}</p>
              ))}
              {narrative.bullets.length > 0 ? (
                <ul className="list-inside list-disc space-y-1">
                  {narrative.bullets.map((b, i) => (
                    <li key={`narrative-b-${i}`}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        </Section>
      ) : null}

      <Section title="Referrals" description="Status counts are limited to referrals made in the selected date range.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Referrals by status</CardTitle>
            </CardHeader>
            <CardContent>
              {referralStatusRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No referrals in this period.</p>
              ) : (
                <SimpleBarChart rows={referralStatusRows} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resource assignments by status</CardTitle>
              <CardDescription>Assignments with an assigned date in range.</CardDescription>
            </CardHeader>
            <CardContent>
              {assignmentStatusRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assignments in this period.</p>
              ) : (
                <SimpleBarChart rows={assignmentStatusRows} barClassName="bg-secondary" />
              )}
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Families & participants by school" description="Families served in the period with an active school link overlapping the range.">
        <Card>
          <CardContent className="pt-6">
            {sortedSchools.length === 0 ? (
              <p className="text-sm text-muted-foreground">No school-linked families in this view.</p>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <SimpleBarChart
                  rows={sortedSchools.map((s) => ({ label: s.schoolName, value: s.familiesCount }))}
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead className="text-right">Families</TableHead>
                      <TableHead className="text-right">Participants</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSchools.map((s) => (
                      <TableRow key={s.schoolId}>
                        <TableCell>{s.schoolName}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.familiesCount}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.participantsCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Section>

      <Section title="Participants by partner organization" description="Participant counts for families served in range with an active partner link.">
        <Card>
          <CardContent className="space-y-4 pt-6">
            {sortedPartners.length === 0 ? (
              <p className="text-sm text-muted-foreground">No partner-linked participants in this view.</p>
            ) : (
              <>
                <SimpleBarChart
                  rows={sortedPartners.map((p) => ({ label: p.partnerName, value: p.participantsCount }))}
                  barClassName="bg-accent"
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead className="text-right">Participants</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPartners.map((p) => (
                      <TableRow key={p.partnerOrgId}>
                        <TableCell>{p.partnerName}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.participantsCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </Section>

      <Section title="Referrals by month" description="Referrals made in range; bar height is total made, subtitle is completed.">
        <Card>
          <CardContent className="pt-6">
            {referralTrendRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No monthly referral activity in this period.</p>
            ) : (
              <SimpleBarChart rows={referralTrendRows} />
            )}
          </CardContent>
        </Card>
      </Section>

      <Section title="Outcomes by period" description="Outcome snapshots that overlap the selected range.">
        <Card>
          <CardContent className="pt-6">
            {snapshot.outcomesByPeriod.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outcome snapshots for this window.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.outcomesByPeriod.map((row, i) => (
                    <TableRow key={`${row.period}-${row.metricName}-${i}`}>
                      <TableCell className="tabular-nums">{row.period}</TableCell>
                      <TableCell>{row.metricName}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Section>

      <Section title="Staff weekly report compliance" description="Approximate submissions per staff member vs weeks in range.">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                  <TableHead className="text-right">Expected (weeks)</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.staffCompliance.map((row) => (
                  <TableRow key={row.staffUid}>
                    <TableCell className="font-mono text-xs">{row.displayName}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.reportsSubmitted}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.reportsExpected}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.complianceRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Section>

      <Section
        title="Export-ready summaries"
        description="Copy into grant narratives, newsletters, or board decks."
      >
        <ReportingExportCards cards={exportCards} />
      </Section>
    </div>
  );
}
