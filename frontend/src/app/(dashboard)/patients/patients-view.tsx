"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PatientFormDialog } from "@/components/patients/patient-form-dialog";
import { PatientsPanel } from "@/components/patients/patients-panel";
import { Button } from "@/components/ui/button";

export function PatientsView() {
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Search, filter, and manage every patient record."
        actions={
          <Button size="lg" className="h-10 px-4" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden /> Add patient
          </Button>
        }
      />
      <PatientsPanel />
      <PatientFormDialog open={createOpen} onOpenChange={setCreateOpen} mode={{ kind: "create" }} />
    </div>
  );
}
