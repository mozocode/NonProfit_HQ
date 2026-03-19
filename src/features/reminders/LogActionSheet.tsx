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
} from "@/components/ui/sheet";
import type { LogActionInput } from "@/types/notifications";
import { Loader2 } from "lucide-react";

export interface LogActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptTitle: string;
  onLog: (input: LogActionInput) => Promise<void>;
  isLogging: boolean;
}

export function LogActionSheet({
  open,
  onOpenChange,
  promptTitle,
  onLog,
  isLogging,
}: LogActionSheetProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("");
  const [outcome, setOutcome] = useState("");

  const reset = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setMethod("");
    setOutcome("");
  };

  const handleSubmit = async () => {
    if (!method.trim() || !outcome.trim()) return;
    await onLog({ date, method: method.trim(), outcome: outcome.trim() });
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Log action taken</SheetTitle>
          <SheetDescription>
            Record what you did for: {promptTitle}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-1 flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="log-date">Date</Label>
            <Input
              id="log-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="log-method">Method</Label>
            <Input
              id="log-method"
              placeholder="e.g. Phone call, Email, In-person visit"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="log-outcome">Outcome</Label>
            <Textarea
              id="log-outcome"
              placeholder="What was the result?"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              rows={3}
            />
          </div>
          <div className="mt-auto flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLogging}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!method.trim() || !outcome.trim() || isLogging}>
              {isLogging ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Log action"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
