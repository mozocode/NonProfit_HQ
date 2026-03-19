"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select } from "@/components/ui/select";
import { useCreateSurvey } from "@/hooks/useSurveys";
import type { SurveyAudience } from "@/types/surveys";
import { Loader2, Plus, Trash2 } from "lucide-react";

const AUDIENCE_OPTIONS = [
  { value: "parent", label: "Parent / caregiver" },
  { value: "child", label: "Child / youth" },
  { value: "staff", label: "Staff" },
];

const TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "choice", label: "Multiple choice" },
  { value: "scale", label: "Scale (1–5)" },
];

interface DraftQuestion {
  type: "text" | "choice" | "scale";
  questionText: string;
  optionsRaw: string;
}

export function CreateSurveySheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<SurveyAudience>("parent");
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    { type: "scale", questionText: "", optionsRaw: "" },
  ]);
  const { create, isCreating } = useCreateSurvey();

  const addQuestion = () => {
    setQuestions((q) => [...q, { type: "text", questionText: "", optionsRaw: "" }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((q) => q.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, patch: Partial<DraftQuestion>) => {
    setQuestions((q) => q.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const rows = questions.filter((q) => q.questionText.trim());
    if (rows.length === 0) return;

    await create({
      name: name.trim(),
      description: description.trim() || null,
      audience,
      status: "active",
      questions: rows.map((q, i) => ({
        order: i,
        type: q.type,
        questionText: q.questionText.trim(),
        options:
          q.type === "choice"
            ? q.optionsRaw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
      })),
    });
    setOpen(false);
    setName("");
    setDescription("");
    setQuestions([{ type: "scale", questionText: "", optionsRaw: "" }]);
    onCreated();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Create survey</Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create survey</SheetTitle>
          <SheetDescription>
            Audience selects who should take the survey. For multiple choice, list options separated by commas.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex flex-1 flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="sv-name">Name</Label>
            <Input id="sv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Satisfaction survey" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sv-desc">Description</Label>
            <Textarea id="sv-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sv-audience">Audience</Label>
            <Select
              id="sv-audience"
              options={AUDIENCE_OPTIONS}
              value={audience}
              onChange={(e) => setAudience(e.target.value as SurveyAudience)}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Questions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="mr-1 size-4" />
                Add
              </Button>
            </div>
            {questions.map((q, index) => (
              <div key={index} className="space-y-2 rounded-lg border p-3">
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Question {index + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(index)} aria-label="Remove">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Select
                  options={TYPE_OPTIONS}
                  value={q.type}
                  onChange={(e) => updateQuestion(index, { type: e.target.value as DraftQuestion["type"] })}
                />
                <Input
                  placeholder="Question text"
                  value={q.questionText}
                  onChange={(e) => updateQuestion(index, { questionText: e.target.value })}
                />
                {q.type === "choice" && (
                  <Input
                    placeholder="Options, comma-separated"
                    value={q.optionsRaw}
                    onChange={(e) => updateQuestion(index, { optionsRaw: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleSubmit} disabled={isCreating || !name.trim()}>
            {isCreating ? <Loader2 className="size-4 animate-spin" /> : "Save & activate"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
