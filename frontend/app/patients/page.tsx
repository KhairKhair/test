"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar/navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

// Zod schemas
const patientSummarySchema = z.object({
  name: z.string().min(1),
  date_of_birth: z.string().min(1),
  gender: z.string().min(1),
  last_visit: z.string().min(1),
});
const patientDetailSchema = patientSummarySchema.extend({
  contact: z.object({ phone: z.string().min(1), email: z.string().email() }),
  emergency_contact: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
  }),
  insurance: z.string().min(1),
  medical_history: z.string().optional(),
  notes: z.string().optional(),
});

type PatientSummaryInput = z.infer<typeof patientSummarySchema>;
interface PatientSummary extends PatientSummaryInput {
  id: number;
}

type PatientDetailInput = z.infer<typeof patientDetailSchema>;
interface PatientDetail extends PatientDetailInput, PatientSummary {}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientSummary[] | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mode, setMode] = useState<"view" | "add" | "edit">("view");
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<PatientDetailInput>({
    resolver: zodResolver(patientDetailSchema),
    defaultValues: {
      name: "",
      date_of_birth: "",
      gender: "",
      last_visit: "",
      contact: { phone: "", email: "" },
      emergency_contact: { name: "", phone: "" },
      insurance: "",
      medical_history: "",
      notes: "",
    },
  });

  // Fetch summary list
  useEffect(() => {
    fetch("http://localhost:8000/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) router.replace("/login");
      })
      .then(() =>
        fetch("http://localhost:8000/patients", { credentials: "include" })
      )
      .then((res) => res.json())
      .then((data) => setPatients(data.patients))
      .catch(() => setPatients([]))
      .finally(() => setLoadingSummary(false));
  }, [router]);

  // Load detail when opening view or edit
  useEffect(() => {
    if ((mode === "view" || mode === "edit") && selectedId !== null) {
      setLoadingDetail(true);
      fetch(`http://localhost:8000/patients/${selectedId}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data: PatientDetail) => {
          setDetail(data);
          if (mode === "edit") {
            form.reset({
              ...data,
              medical_history: data.medical_history || "",
            });
          }
        })
        .catch(() => setDetail(null))
        .finally(() => setLoadingDetail(false));
    }
    if (mode === "add" && dialogOpen) {
      form.reset();
      setDetail(null);
    }
  }, [mode, selectedId, dialogOpen, form]);

  // Submit handler for add/edit
  const handleSubmit = async (values: PatientDetailInput) => {
    try {
      if (mode === "add") {
        const resp = await fetch("http://localhost:8000/patients/new", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const created: PatientDetail = await resp.json();
        setPatients((prev) => (prev ? [created, ...prev] : [created]));
        toast.success("Patient added successfully");
      } else if (mode === "edit" && detail) {
        const resp = await fetch(
          `http://localhost:8000/patients/${detail.id}`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          }
        );
        const updated: PatientDetail = await resp.json();
        setPatients((prev) =>
          prev ? prev.map((p) => (p.id === updated.id ? updated : p)) : prev
        );
        toast.success("Patient updated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save patient record");
    } finally {
      setDialogOpen(false);
      setMode("view");
      setSelectedId(null);
      form.reset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar pageTitle="Patient Records" />
      <main className="p-6">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Patient Records</CardTitle>
            <Button
              onClick={() => {
                setMode("add");
                setDialogOpen(true);
              }}
            >
              Add Patient
            </Button>
          </CardHeader>
          <CardContent>
            <PatientTable
              patients={patients}
              loading={loadingSummary}
              onRowClick={(id) => {
                setMode("view");
                setSelectedId(id);
                setDialogOpen(true);
              }}
            />
            <PatientDialog
              open={dialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setDialogOpen(false);
                  setMode("view");
                  setSelectedId(null);
                  form.reset();
                }
              }}
              mode={mode}
              detail={detail}
              loading={loadingDetail}
              form={form}
              onSubmit={handleSubmit}
              onModeChange={setMode}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function PatientTable({
  patients,
  loading,
  onRowClick,
}: {
  patients: PatientSummary[] | null;
  loading: boolean;
  onRowClick: (id: number) => void;
}) {
  if (loading) return <Skeleton className="h-8 w-full" />;
  return (
    <Table>
      <TableHeader className="bg-sky-100">
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>DOB</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Last Visit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients?.map((p, index) => (
          <TableRow
            key={p.id}
            className={`cursor-pointer hover:bg-gray-100 ${
              index % 2 === 0 ? "bg-white" : "bg-gray-50"
            }`}
            onClick={() => onRowClick(p.id)}
          >
            <TableCell>{p.id}</TableCell>
            <TableCell>{p.name}</TableCell>
            <TableCell>{p.date_of_birth}</TableCell>
            <TableCell>{p.gender}</TableCell>
            <TableCell>{p.last_visit}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "view" | "add" | "edit";
  detail: PatientDetail | null;
  loading: boolean;
  form: ReturnType<typeof useForm<PatientDetailInput>>;
  onSubmit: (values: PatientDetailInput) => void;
  onModeChange: (mode: "view" | "add" | "edit") => void;
}
function PatientDialog({
  open,
  onOpenChange,
  mode,
  detail,
  loading,
  form,
  onSubmit,
  onModeChange,
}: PatientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:min-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "view"
              ? "Patient Details"
              : mode === "add"
              ? "Add Patient"
              : "Edit Patient"}
          </DialogTitle>
          <DialogDescription>
            {mode === "view"
              ? detail?.name
              : mode === "add"
              ? "Enter patient details."
              : "Modify patient information."}
          </DialogDescription>
        </DialogHeader>

        {/* View Mode */}
        {mode === "view" ? (
          loading || !detail ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-2">
              <p>
                <strong>ID:</strong> {detail.id}
              </p>
              <p>
                <strong>Name:</strong> {detail.name}
              </p>
              <p>
                <strong>DOB:</strong> {detail.date_of_birth}
              </p>
              <p>
                <strong>Gender:</strong> {detail.gender}
              </p>
              <p>
                <strong>Last Visit:</strong> {detail.last_visit}
              </p>
              <p>
                <strong>Contact:</strong> {detail.contact.phone},{" "}
                {detail.contact.email}
              </p>
              <p>
                <strong>Emergency:</strong> {detail.emergency_contact.name} (
                {detail.emergency_contact.phone})
              </p>
              <p>
                <strong>Insurance:</strong> {detail.insurance}
              </p>
              <p>
                <strong>History:</strong> {detail.medical_history || "None"}
              </p>
              <p>
                <strong>Notes:</strong> {detail.notes || "None"}
              </p>
            </div>
          )
        ) : (
          /* Add/Edit Mode */
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="date_of_birth"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DOB</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="gender"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="last_visit"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Visit</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="contact.phone"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="contact.email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="emergency_contact.name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="emergency_contact.phone"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="insurance"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="medical_history"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical History</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Comma-separated list" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="col-span-full flex justify-end space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">{mode === "add" ? "Add" : "Save"}</Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* Edit Button in View Mode */}
        {mode === "view" && detail && (
          <DialogFooter>
            <Button onClick={() => onModeChange("edit")}>Edit</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
