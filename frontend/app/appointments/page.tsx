"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar/navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

interface Appointment {
  id: number;
  patient_name: string;
  date: string;
  time: string;
  reason: string;
  status: "Scheduled" | "Missed" | "Canceled" | "Completed";
}

const appointmentSchema = z.object({
  date: z.string(),
  time: z.string(),
  reason: z.string(),
  status: z.enum(["Scheduled", "Missed", "Canceled", "Completed"]),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const form = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { date: "", time: "", reason: "", status: "Scheduled" },
  });

  useEffect(() => {
    fetch("http://localhost:8000/appointments", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setAppointments(data.appointments))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const fetchDetails = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/appointments/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      setSelected(data.appointment);
      setDetailDialogOpen(true);
    } catch (err: any) {
      toast.error("Failed to fetch appointment", { description: err.message });
    }
  };

  const handleEdit = () => {
    if (selected) {
      form.reset({
        date: selected.date,
        time: selected.time,
        reason: selected.reason,
        status: selected.status,
      });
      setEditDialogOpen(true);
    }
  };

  const handleSave = async (values: AppointmentForm) => {
    if (!selected) return;
    try {
      const res = await fetch(
        `http://localhost:8000/appointments/${selected.id}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      const updated = await res.json();
      setAppointments(
        (prev) => prev?.map((a) => (a.id === updated.id ? updated : a)) ?? []
      );
      toast.success("Appointment updated");
      setEditDialogOpen(false);
      setDetailDialogOpen(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleAdd = async (values: AppointmentForm) => {
    try {
      const res = await fetch("http://localhost:8000/appointments/new", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.statusText}`);
      }

      const data = await res.json();

      if (!data.appointment) {
        throw new Error("Missing 'appointment' in response");
      }

      setAppointments((prev) =>
        prev ? [data.appointment, ...prev] : [data.appointment]
      );
      toast.success("Appointment added");
      setAddDialogOpen(false);
      form.reset({ date: "", time: "", reason: "", status: "Scheduled" });
    } catch (err: any) {
      toast.error("Failed to add appointment", {
        description: err.message || "Unknown error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar pageTitle="Appointments" />
      <main className="p-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Appointments</CardTitle>
            <Button onClick={() => setAddDialogOpen(true)}>
              Add Appointment
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <AppointmentTable
                appointments={appointments}
                onRowClick={fetchDetails}
              />
            )}
          </CardContent>
        </Card>
      </main>

      {/* View Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>{selected?.patient_name}</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-2">
              <p>
                <strong>Date:</strong> {selected.date}
              </p>
              <p>
                <strong>Time:</strong> {selected.time}
              </p>
              <p>
                <strong>Reason:</strong> {selected.reason}
              </p>
              <p>
                <strong>Status:</strong> {selected.status}
              </p>
            </div>
          ) : (
            <Skeleton className="h-24 w-full" />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
            >
              Close
            </Button>
            <Button onClick={handleEdit}>Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSave)}
              className="space-y-4"
            >
              <FormField
                name="date"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="time"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="reason"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="status"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Missed">Missed</SelectItem>
                        <SelectItem value="Canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Appointment</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAdd)} className="space-y-4">
              <FormField
                name="date"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="time"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="reason"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="status"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Missed">Missed</SelectItem>
                        <SelectItem value="Canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "Scheduled":
      return "bg-blue-100 text-blue-700";
    case "Completed":
      return "bg-green-100 text-green-700";
    case "Missed":
      return "bg-yellow-100 text-yellow-700";
    case "Canceled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function AppointmentTable({
  appointments,
  onRowClick,
}: {
  appointments: Appointment[] | null;
  onRowClick: (id: number) => void;
}) {
  return (
    <Table>
      <TableHeader className="bg-sky-100">
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments?.map((appt, index) => (
          <TableRow
            key={appt.id}
            className={`cursor-pointer hover:bg-gray-100 ${
              index % 2 === 0 ? "bg-white" : "bg-slate-50"
            }`}
            onClick={() => onRowClick(appt.id)}
          >
            <TableCell>{appt.id}</TableCell>
            <TableCell>{appt.patient_name}</TableCell>
            <TableCell>{appt.date}</TableCell>
            <TableCell>{appt.time}</TableCell>
            <TableCell>{appt.reason}</TableCell>
            <TableCell>
              <Badge className={getStatusColor(appt.status)}>
                {appt.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
