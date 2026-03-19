# Phase 9: Goals and tasks

## Overview

Goals (long-term and short-term) and tasks are supported with assignee types (staff, parent, child/family member), due dates, status, and task history. Next action is surfaced on the family profile and staff dashboard.

## Data model

- **Goal** (subcollection `families/{familyId}/goals/{goalId}`): `goalType` ("long_term" | "short_term"), title, description, status (active | completed | cancelled), targetDate, createdBy, createdAt, updatedAt.
- **GoalTask** (subcollection `families/{familyId}/goals/{goalId}/goalTasks/{taskId}`): familyId, goalId, taskId (stored in doc for collection-group lookup), title, description, status (todo | in_progress | done | blocked), assigneeType (staff | parent | child), assigneeId, assignedToUid (for staff), dueDate, completedAt, taskHistory (array of { at, by, action, note? }), createdBy, createdAt, updatedAt.

## Service (`src/services/firestore/goalsTasksService.ts`)

- **Goals:** getGoalsByFamily, getGoal, createGoal, updateGoal.
- **Tasks:** getTasksByGoal, getTasksByFamily, getTask, getTaskByTaskId (collection group by taskId), createTask, updateTask, addTaskProgressNote.
- **Next action:** getNextActionForFamily returns the earliest due task that is todo or in_progress.

## Hooks

- **useFamilyGoals(familyId)** – list goals with task counts.
- **useGoal(familyId, goalId)** – single goal and its tasks.
- **useFamilyTasks(familyId)** – all tasks for the family.
- **useTask(taskId)** – single task and goal (resolved via getTaskByTaskId).
- **useTaskUpdate(familyId, goalId, taskId, onSuccess)** – update status, addTaskProgressNote.
- **useNextAction(familyId)** – next action for the family.

## Routes

| Path | Purpose |
|------|---------|
| `/staff/family/[familyId]` | Family profile (Goals tab, Tasks tab) |
| `/staff/family/[familyId]/goals/new` | Add goal form |
| `/staff/family/[familyId]/goals/[goalId]` | Goal detail: goal info + tasks list, link to add task |
| `/staff/family/[familyId]/goals/[goalId]/task/new` | Add task form |
| `/staff/task/[taskId]` | Task detail: status, assignee, update progress, add note, task history |

## UI

- **Goals tab (family profile):** Goal type badge, status, target date, task count; link to goal detail; "Add goal" button.
- **Tasks tab (family profile):** TaskCard with assignee name, due date, status; link to task detail.
- **Goal detail page:** Goal type, status, target date; list of tasks with TaskCard; "Add task" link.
- **Task detail page:** Title, description, status, due date, assignee type; link to goal and family; status dropdown; "Add note" textarea + Add button; task history timeline.
- **Staff dashboard:** "Next required action" card at top (first item from action list: overdue, then tasks/documents/reminders); links to task or family.

## Status and update flows

- Staff can change task status (todo, in_progress, done, blocked) on the task detail page.
- Staff can add progress notes; they are appended to taskHistory with action "note" or "status_change".
- Completing a task (status done) sets completedAt in the service.

## Task history / timeline

- Each task has a `taskHistory` array. addTaskProgressNote appends { at (ISO), by (uid), action, note }.
- Task detail page shows task history in reverse order (newest first) using TimelineItem.

## Assignee types

- **staff:** assigneeId = staff uid; assignedToUid also set for queries.
- **parent / child:** assigneeId = family member id or label; assigneeName can be resolved from family members in the UI (e.g. in family profile context).

## Files created

- `src/types/goalsTasks.ts` – GoalView, TaskView, NextActionView, CreateGoalInput, UpdateGoalInput, CreateTaskInput, UpdateTaskInput, AddTaskNoteInput, TaskHistoryEntryView.
- `src/services/firestore/goalsTasksService.ts` – goals and tasks CRUD, addTaskProgressNote, getNextActionForFamily, getTaskByTaskId.
- `src/hooks/useFamilyGoals.ts`, `useGoal.ts`, `useFamilyTasks.ts`, `useTask.ts`, `useTaskUpdate.ts`, `useNextAction.ts`.
- `src/features/goals/CreateGoalForm.tsx`.
- `src/features/tasks/CreateTaskForm.tsx`.
- `src/app/(dashboard)/staff/family/[familyId]/goals/new/page.tsx`.
- `src/app/(dashboard)/staff/family/[familyId]/goals/[goalId]/page.tsx`.
- `src/app/(dashboard)/staff/family/[familyId]/goals/[goalId]/task/new/page.tsx`.
- `src/app/(dashboard)/staff/task/[taskId]/page.tsx` (replaced placeholder with full implementation).
- `docs/PHASE9-GOALS-TASKS.md`.

## Files changed

- `src/types/domain.ts` – Goal: added goalType; GoalTask: added familyId, description, assigneeType, assigneeId, taskHistory; TaskAssigneeType, TaskHistoryEntry.
- `src/types/familyProfile.ts` – FamilyGoalView: goalType, tasksCount; FamilyTaskView: goalTitle, assigneeType, assigneeName, isNextAction.
- `src/services/family/mockFamilyProfile.ts` – goals/tasks mock data updated with new fields.
- `src/constants/index.ts` – STAFF_FAMILY_GOAL, STAFF_FAMILY_GOAL_NEW.
- `src/features/family-profile/GoalsTab.tsx` – goalType badge, link to goal detail, "Add goal" button.
- `src/features/family-profile/TasksTab.tsx` – assignee on TaskCard.
- `src/features/dashboard/StaffDashboardView.tsx` – "Next required action" card at top.
- `firestore.indexes.json` – collection group index for goalTasks (organizationId, taskId).

## Firestore index

- **goalTasks** (collection group): organizationId ASC, taskId ASC – for getTaskByTaskId.
