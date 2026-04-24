"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { trackUsageMetric } from "@/services/functions/nonprofitOsService";
import { createInquiry, listInquiries, updateInquiryStatus } from "@/services/firestore/tenantAdminService";
import type { InquiryView } from "@/types/tenantAdmin";

export function TenantInquiriesView() {
  const { orgId, user } = useAuth();
  const [inquiries, setInquiries] = useState<InquiryView[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState<InquiryView["source"]>("web_form");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      setInquiries(await listInquiries(orgId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inquiries.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inquiries</CardTitle>
        <CardDescription>Capture and triage service inquiries before formal enrollment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="inq-name">Full name</Label>
            <Input id="inq-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inq-source">Source</Label>
            <Select
              id="inq-source"
              value={source}
              onChange={(e) => setSource(e.target.value as InquiryView["source"])}
              options={[
                { value: "web_form", label: "Web form" },
                { value: "phone", label: "Phone" },
                { value: "partner", label: "Partner referral" },
                { value: "walk_in", label: "Walk in" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inq-email">Email</Label>
            <Input id="inq-email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inq-phone">Phone</Label>
            <Input id="inq-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="inq-notes">Notes</Label>
            <Textarea id="inq-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button
              type="button"
              disabled={isSaving || !fullName.trim() || !orgId || !user}
              onClick={() => {
                if (!orgId || !user || !fullName.trim()) return;
                setIsSaving(true);
                setError(null);
                void createInquiry(orgId, {
                  fullName,
                  email,
                  phone,
                  notes,
                  source,
                  createdByUid: user.uid,
                })
                  .then(async (inquiryId) => {
                    await trackUsageMetric("inquiry_created", 1, { inquiryId });
                    setFullName("");
                    setEmail("");
                    setPhone("");
                    setNotes("");
                    await load();
                  })
                  .catch((e) => setError(e instanceof Error ? e.message : "Failed to create inquiry."))
                  .finally(() => setIsSaving(false));
              }}
            >
              {isSaving ? "Saving..." : "Add inquiry"}
            </Button>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.map((inquiry) => (
              <TableRow key={inquiry.inquiryId}>
                <TableCell>{inquiry.fullName}</TableCell>
                <TableCell className="text-xs text-slate-600">{inquiry.email ?? inquiry.phone ?? "—"}</TableCell>
                <TableCell>{inquiry.source}</TableCell>
                <TableCell>{inquiry.status}</TableCell>
                <TableCell>
                  <Select
                    value={inquiry.status}
                    onChange={(e) => {
                      if (!orgId) return;
                      const nextStatus = e.target.value as InquiryView["status"];
                      void updateInquiryStatus(orgId, inquiry.inquiryId, nextStatus)
                        .then(async () => {
                          if (nextStatus === "converted") {
                            await trackUsageMetric("inquiry_converted", 1, { inquiryId: inquiry.inquiryId });
                          }
                          await load();
                        });
                    }}
                    options={[
                      { value: "new", label: "new" },
                      { value: "triaged", label: "triaged" },
                      { value: "qualified", label: "qualified" },
                      { value: "converted", label: "converted" },
                      { value: "archived", label: "archived" },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-slate-500">
                  No inquiries yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
