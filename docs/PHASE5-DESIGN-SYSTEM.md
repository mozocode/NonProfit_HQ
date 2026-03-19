# Phase 5: Design system and reusable components

## Style tokens and conventions

### CSS variables (globals.css)

- **Theme:** `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`.
- **Status (chips/badges):**
  - Success: `--status-success`, `--status-success-muted`
  - Warning: `--status-warning`, `--status-warning-muted`
  - Error: `--status-error`, `--status-error-muted`
  - Info: `--status-info`, `--status-info-muted`
  - Neutral: `--status-neutral`, `--status-neutral-muted`
- **Spacing:** `--page-padding-x`, `--section-gap`, `--card-padding` (for reference; layout uses Tailwind spacing).

### Tailwind

- Status colors: `bg-status-success`, `text-status-warning`, `bg-status-error-muted`, etc.
- Radius: `rounded-lg` (default), `rounded-md`, `rounded-xl` for cards.
- Dense but readable: `text-sm` for body, `text-xs` for meta/chips; consistent `gap-2` / `gap-4` in bars and cards.

### Conventions

- **Page structure:** One `PageHeader` at top; content in `Section` components with optional title/action.
- **Data density:** Use tables for tabular data; cards for entity summaries; chips for status/dates.
- **Accessibility:** Use semantic HTML, `aria-label` on icon-only controls, `role="status"` on chips, focus visible rings.
- **Responsive:** Stack (flex-col) on small screens; use `sm:flex-row` and `sm:items-center` where appropriate.

---

## Component index

| Component | Path | Purpose |
|-----------|------|---------|
| PageHeader | `ui/page-header` | Page title, description, actions |
| Section | `ui/section` | Section wrapper with optional title/action |
| Card | `ui/card` | Card, CardHeader, CardTitle, CardDescription, CardContent |
| StatCard | `ui/stat-card` | Metric card with title, value, trend, icon |
| DataTable | `ui/data-table` | Table with columns, data, empty/loading |
| SearchBar | `ui/search-bar` | Search input with optional debounced onSearch |
| FilterBar | `ui/filter-bar` | Wrapper for filter controls + clear |
| Tabs | `ui/tabs` | Tabs, TabsList, TabsTrigger, TabsContent |
| Badge | `ui/badge` | Badge with default/secondary/outline/status variants |
| StatusChip | `ui/status-chip` | Status pill (active, pending, completed, etc.) |
| DueDateChip | `ui/due-date-chip` | Due date with soon/overdue styling |
| DocumentStatusChip | `ui/document-status-chip` | Document status (missing, uploaded, approved, rejected) |
| Button | `ui/button` | Button + buttonVariants (default, ghost, link, destructive) |
| Dialog | `ui/dialog` | Modal dialog with trigger, content, header, footer |
| Sheet | `ui/sheet` | Drawer (left/right/top/bottom) |
| Form, FormField | `ui/form` | Form layout with spacing |
| Label | `ui/label` | Form label |
| Input | `ui/input` | Text input |
| Textarea | `ui/textarea` | Multi-line text |
| Select | `ui/select` | Native select with options array |
| DatePicker | `ui/date-picker` | Native date input styled |
| EmptyState | `ui/empty-state` | Empty state with icon, title, description, action |
| ErrorState | `ui/error-state` | Error message + optional retry |
| LoadingState | `ui/loading-state` | Spinner + optional message |
| PageSpinner | `ui/page-spinner` | Full-area spinner |
| TimelineItem | `ui/timeline-item` | Timeline entry (title, description, timestamp) |
| NoteCard | `ui/note-card` | Note with author, timestamp, visibility |
| TaskCard | `ui/task-card` | Task with status, due date, assignee |
| ResourceCard | `ui/resource-card` | Resource name, description, category, link |
| Table | `ui/table` | Table, TableHeader, TableBody, TableRow, TableHead, TableCell |

---

## Usage examples

### Page layout

```tsx
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

<PageHeader
  title="Families"
  description="Manage family profiles and cases."
  actions={<Button>Add family</Button>}
/>
<Section title="Recent" action={<Button variant="outline">View all</Button>}>
  {/* content */}
</Section>
```

### Stat cards

```tsx
import { StatCard } from "@/components/ui/stat-card";
import { Users } from "lucide-react";

<StatCard
  title="Families served"
  value={42}
  description="This month"
  trend={{ value: "+12%", positive: true }}
  icon={<Users />}
/>
```

### Data table

```tsx
import { DataTable } from "@/components/ui/data-table";

type Row = { id: string; name: string; status: string };
const columns: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", accessorKey: "name" },
  { id: "status", header: "Status", cell: (row) => <StatusChip status="active">{row.status}</StatusChip> },
];
<DataTable
  columns={columns}
  data={rows}
  keyExtractor={(r) => r.id}
  emptyMessage="No families yet"
  isLoading={isLoading}
/>
```

### Search and filters

```tsx
import { SearchBar } from "@/components/ui/search-bar";
import { FilterBar } from "@/components/ui/filter-bar";
import { Select } from "@/components/ui/select";

<SearchBar placeholder="Search families…" onSearch={setQuery} />
<FilterBar onClear={() => { setStatus(undefined); setProgram(undefined); }}>
  <Select options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
  <Select options={programOptions} value={program} onChange={(e) => setProgram(e.target.value)} />
</FilterBar>
```

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const [tab, setTab] = useState("overview");
<Tabs value={tab} onValueChange={setTab}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="details">...</TabsContent>
</Tabs>
```

### Chips

```tsx
import { StatusChip } from "@/components/ui/status-chip";
import { DueDateChip } from "@/components/ui/due-date-chip";
import { DocumentStatusChip } from "@/components/ui/document-status-chip";

<StatusChip status="completed" />
<DueDateChip dueDate="2025-04-01" />
<DocumentStatusChip status="approved" label="Approved" />
```

### Dialog and sheet

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm</DialogTitle>
    </DialogHeader>
    <p>Are you sure?</p>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form

```tsx
import { Form, FormField } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

<Form onSubmit={handleSubmit}>
  <FormField>
    <Label htmlFor="name">Name</Label>
    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
  </FormField>
  <FormField>
    <Label htmlFor="notes">Notes</Label>
    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
  </FormField>
  <FormField>
    <Label>Status</Label>
    <Select options={[{ value: "active", label: "Active" }]} value={status} onChange={...} />
  </FormField>
  <FormField>
    <Label>Due date</Label>
    <DatePicker value={dueDate} onChange={...} />
  </FormField>
  <Button type="submit">Save</Button>
</Form>
```

### Empty, error, loading

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Inbox } from "lucide-react";

{!data.length && <EmptyState icon={<Inbox />} title="No items" description="Get started by adding one." action={<Button>Add</Button>} />}
{error && <ErrorState message={error.message} onRetry={refetch} />}
{isLoading && <LoadingState message="Loading…" />}
```

### Domain cards

```tsx
import { TimelineItem } from "@/components/ui/timeline-item";
import { NoteCard } from "@/components/ui/note-card";
import { TaskCard } from "@/components/ui/task-card";
import { ResourceCard } from "@/components/ui/resource-card";

<TimelineItem title="Intake completed" timestamp="Mar 1, 2025" description="..." />
<NoteCard content="..." author="Jane" timestamp="Mar 1" visibility="internal" />
<TaskCard title="Follow up" status="in_progress" dueDate="2025-03-15" onClick={() => {}} />
<ResourceCard name="Food bank" description="..." category="Basic needs" link="https://..." />
```

---

## Files created or updated

### New components

- `src/components/ui/page-header.tsx`
- `src/components/ui/section.tsx`
- `src/components/ui/stat-card.tsx`
- `src/components/ui/search-bar.tsx`
- `src/components/ui/filter-bar.tsx`
- `src/components/ui/data-table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/status-chip.tsx`
- `src/components/ui/due-date-chip.tsx`
- `src/components/ui/document-status-chip.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/date-picker.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/empty-state.tsx`
- `src/components/ui/error-state.tsx`
- `src/components/ui/loading-state.tsx`
- `src/components/ui/timeline-item.tsx`
- `src/components/ui/note-card.tsx`
- `src/components/ui/task-card.tsx`
- `src/components/ui/resource-card.tsx`

### Updated

- `src/app/globals.css` — status CSS variables
- `tailwind.config.ts` — status colors
- `src/components/ui/button.tsx` — ghost, link, destructive variants
- `src/components/ui/badge.tsx` — success, warning, destructive, muted variants

### Existing (unchanged)

- `src/components/ui/card.tsx`, `input.tsx`, `table.tsx`, `badge.tsx`, `page-spinner.tsx`
