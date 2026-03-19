"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";

export interface AddFamilyMemberSheetProps {
  familyId: string;
  onAdded?: () => void;
  trigger?: React.ReactNode;
}

const relationshipOptions = [
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

export function AddFamilyMemberSheet({ familyId, onAdded, trigger }: AddFamilyMemberSheetProps) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [relationship, setRelationship] = useState("parent");
  const [isParticipant, setIsParticipant] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // TODO: familyProfileService.addFamilyMember(orgId, familyId, { firstName, lastName, dateOfBirth, relationship, isParticipant })
      await new Promise((r) => setTimeout(r, 400));
      setFirstName("");
      setLastName("");
      setDateOfBirth("");
      setRelationship("parent");
      setIsParticipant(true);
      setOpen(false);
      onAdded?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            Add family member
          </Button>
        </SheetTrigger>
      )}
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Add family member</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of birth</Label>
            <DatePicker
              id="dob"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select
              options={relationshipOptions}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isParticipant"
              checked={isParticipant}
              onChange={(e) => setIsParticipant(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isParticipant" className="font-normal">
              Participant in program
            </Label>
          </div>
          <div className="mt-auto flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding…" : "Add member"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
