"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useCallback } from "react";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { useFamilyWorkflow } from "@/hooks/useFamilyWorkflow";
import { useFamilyNotes } from "@/hooks/useFamilyNotes";
import { useFamilyInteractions } from "@/hooks/useFamilyInteractions";
import { useFamilyTimeline } from "@/hooks/useFamilyTimeline";
import { useFamilyResources } from "@/hooks/useFamilyResources";
import { useResources } from "@/hooks/useResources";
import {
  useFamilyDocuments,
  useDocumentUpload,
  useRequiredTemplates,
  useDocumentDownloadUrl,
} from "@/hooks/useFamilyDocuments";
import { createNote, createInteraction } from "@/services/firestore/notesInteractionsService";
import { assignResourceToFamily, updateAssignmentStatus } from "@/services/firestore/resourcesService";
import { updateDocumentStatus } from "@/services/firestore/documentsService";
import type { CreateNoteInput, CreateInteractionInput } from "@/types/notesInteractions";
import type { ReferralStatus } from "@/types/domain";
import { DocumentsTab } from "@/features/family-profile/DocumentsTab";
import { WorkflowTab } from "@/features/workflow/WorkflowTab";
import { GoalsTab } from "@/features/family-profile/GoalsTab";
import { InteractionsTab } from "@/features/family-profile/InteractionsTab";
import { NextRequiredActionBanner } from "@/features/family-profile/NextRequiredActionBanner";
import { NotesTab } from "@/features/family-profile/NotesTab";
import { OverviewTab } from "@/features/family-profile/OverviewTab";
import { ResourcesTab } from "@/features/family-profile/ResourcesTab";
import { TasksTab } from "@/features/family-profile/TasksTab";
import { TimelineTab } from "@/features/family-profile/TimelineTab";

const TAB_OVERVIEW = "overview";
const TAB_WORKFLOW = "workflow";
const TAB_GOALS = "goals";
const TAB_TASKS = "tasks";
const TAB_NOTES = "notes";
const TAB_INTERACTIONS = "interactions";
const TAB_DOCUMENTS = "documents";
const TAB_RESOURCES = "resources";
const TAB_TIMELINE = "timeline";

export function FamilyProfileView() {
  const params = useParams();
  const familyId = params?.familyId as string | null;
  const { orgId, user } = useAuth();
  const { data, isLoading, error, refetch } = useFamilyProfile(familyId);
  const { state: workflowState, isLoading: workflowLoading, updateStage, isUpdating } = useFamilyWorkflow(familyId);
  const { notes: notesFromHook, isLoading: isLoadingNotes, refetch: refetchNotes } = useFamilyNotes(familyId);
  const { interactions, isLoading: isLoadingInteractions, refetch: refetchInteractions } = useFamilyInteractions(familyId);
  const { entries: timelineEntries, isLoading: isLoadingTimeline, refetch: refetchTimeline } = useFamilyTimeline(familyId);
  const { assignments: resourceAssignments, isLoading: isLoadingResourceAssignments, refetch: refetchFamilyResources } = useFamilyResources(familyId);
  const { resources: resourcesForAssign, isLoading: isLoadingResourcesForAssign } = useResources({});
  const { requirements: docRequirements, documents: docDocuments, isLoading: isLoadingDocuments, refetch: refetchDocuments } = useFamilyDocuments({
    organizationId: orgId ?? null,
    familyId,
    enabled: !!familyId,
  });
  const { templates: docTemplates } = useRequiredTemplates(orgId ?? null);
  const { upload: uploadDocument, isUploading: isUploadingDocument } = useDocumentUpload({
    organizationId: orgId ?? null,
    familyId,
    uploadedBy: user?.uid ?? "",
    onSuccess: refetchDocuments,
  });
  const { getUrl: getDocumentDownloadUrl } = useDocumentDownloadUrl();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isLoggingInteraction, setIsLoggingInteraction] = useState(false);
  const [isAssigningResource, setIsAssigningResource] = useState(false);
  const [tab, setTab] = useState(TAB_OVERVIEW);

  const handleAddNote = useCallback(
    async (input: CreateNoteInput) => {
      if (!orgId || !user?.uid) return;
      setIsAddingNote(true);
      try {
        await createNote(orgId, user.uid, input);
        await refetchNotes();
        await refetchTimeline();
      } finally {
        setIsAddingNote(false);
      }
    },
    [orgId, user?.uid, refetchNotes, refetchTimeline],
  );

  const handleLogInteraction = useCallback(
    async (input: CreateInteractionInput) => {
      if (!orgId || !user?.uid || !familyId) return;
      setIsLoggingInteraction(true);
      try {
        await createInteraction(orgId, familyId, user.uid, input);
        await refetchInteractions();
        await refetchTimeline();
      } finally {
        setIsLoggingInteraction(false);
      }
    },
    [orgId, user?.uid, familyId, refetchInteractions, refetchTimeline],
  );

  const handleAssignResource = useCallback(
    async (resourceId: string) => {
      if (!orgId || !user?.uid || !familyId) return;
      setIsAssigningResource(true);
      try {
        await assignResourceToFamily(orgId, familyId, resourceId, user.uid, { initialStatus: "suggested" });
        await refetchFamilyResources();
      } finally {
        setIsAssigningResource(false);
      }
    },
    [orgId, user?.uid, familyId, refetchFamilyResources],
  );

  const handleResourceStatusChange = useCallback(
    async (assignmentId: string, referralStatus: ReferralStatus) => {
      if (!orgId) return;
      try {
        await updateAssignmentStatus(orgId, assignmentId, referralStatus);
        await refetchFamilyResources();
      } catch {
        // ignore
      }
    },
    [orgId, refetchFamilyResources],
  );

  const handleDocumentUpload = useCallback(
    async (templateId: string, file: File, memberId?: string | null) => {
      if (!uploadDocument) return false;
      const id = await uploadDocument({ templateId, file, memberId });
      return id != null;
    },
    [uploadDocument],
  );

  const handleDocumentDownload = useCallback(
    (storagePath: string) => {
      getDocumentDownloadUrl(storagePath).then((url) => {
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      });
    },
    [getDocumentDownloadUrl],
  );

  const handleDocumentStatusChange = useCallback(
    async (documentId: string, status: "pending" | "approved" | "rejected") => {
      if (!orgId) return;
      try {
        await updateDocumentStatus(orgId, documentId, status);
        await refetchDocuments();
      } catch {
        // ignore
      }
    },
    [orgId, refetchDocuments],
  );

  if (!familyId) {
    return (
      <EmptyState
        title="No family selected"
        description="Select a family from the dashboard."
        action={
          <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF}>
            Back to dashboard
          </Link>
        }
      />
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading family profile…" />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={refetch}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Family not found"
        description="This family may have been removed or you don’t have access."
        action={
          <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF}>
            Back to dashboard
          </Link>
        }
      />
    );
  }

  const { summary, nextRequiredAction } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={summary.primaryContactName}
        description={`Family · ${summary.workflowStage} · ${summary.memberCount} member${summary.memberCount !== 1 ? "s" : ""}`}
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF}>
            Back to dashboard
          </Link>
        }
      />

      {nextRequiredAction ? (
        <NextRequiredActionBanner action={nextRequiredAction} />
      ) : null}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex w-full flex-wrap gap-1 sm:flex-nowrap">
          <TabsTrigger value={TAB_OVERVIEW}>Overview</TabsTrigger>
          <TabsTrigger value={TAB_WORKFLOW}>Workflow</TabsTrigger>
          <TabsTrigger value={TAB_GOALS}>Goals</TabsTrigger>
          <TabsTrigger value={TAB_TASKS}>Tasks</TabsTrigger>
          <TabsTrigger value={TAB_NOTES}>Notes</TabsTrigger>
          <TabsTrigger value={TAB_INTERACTIONS}>Interactions</TabsTrigger>
          <TabsTrigger value={TAB_DOCUMENTS}>Documents</TabsTrigger>
          <TabsTrigger value={TAB_RESOURCES}>Resources</TabsTrigger>
          <TabsTrigger value={TAB_TIMELINE}>Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value={TAB_OVERVIEW} className="mt-4">
          <OverviewTab data={data} onMemberAdded={refetch} />
        </TabsContent>
        <TabsContent value={TAB_WORKFLOW} className="mt-4">
          <WorkflowTab
            familyId={familyId}
            state={workflowState}
            isLoading={workflowLoading}
            onStageChange={updateStage}
            isUpdating={isUpdating}
          />
        </TabsContent>
        <TabsContent value={TAB_GOALS} className="mt-4">
          <GoalsTab data={data} />
        </TabsContent>
        <TabsContent value={TAB_TASKS} className="mt-4">
          <TasksTab data={data} />
        </TabsContent>
        <TabsContent value={TAB_NOTES} className="mt-4">
          <NotesTab
            data={data}
            notesFromHook={notesFromHook}
            isLoadingNotes={isLoadingNotes}
            onAddNote={handleAddNote}
            isAddingNote={isAddingNote}
          />
        </TabsContent>
        <TabsContent value={TAB_INTERACTIONS} className="mt-4">
          <InteractionsTab
            familyId={familyId}
            interactions={interactions}
            isLoading={isLoadingInteractions}
            onLogInteraction={handleLogInteraction}
            isSubmitting={isLoggingInteraction}
          />
        </TabsContent>
        <TabsContent value={TAB_DOCUMENTS} className="mt-4">
          <DocumentsTab
            data={data}
            requirementsFromHook={docRequirements}
            documentsFromHook={docDocuments}
            isLoadingDocuments={isLoadingDocuments}
            templates={docTemplates}
            members={data.members.map((m) => ({ memberId: m.memberId, name: [m.firstName, m.lastName].filter(Boolean).join(" ").trim() || m.memberId }))}
            onUpload={handleDocumentUpload}
            isUploading={isUploadingDocument}
            onDownload={handleDocumentDownload}
            onStatusChange={handleDocumentStatusChange}
          />
        </TabsContent>
        <TabsContent value={TAB_RESOURCES} className="mt-4">
          <ResourcesTab
            data={data}
            assignmentsFromHook={resourceAssignments}
            isLoadingAssignments={isLoadingResourceAssignments}
            resourcesForAssign={resourcesForAssign}
            isLoadingResources={isLoadingResourcesForAssign}
            onAssignResource={handleAssignResource}
            isAssigning={isAssigningResource}
            onStatusChange={handleResourceStatusChange}
          />
        </TabsContent>
        <TabsContent value={TAB_TIMELINE} className="mt-4">
          <TimelineTab
            data={data}
            entriesFromHook={timelineEntries}
            isLoading={isLoadingTimeline}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
