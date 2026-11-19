import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { SubjectAssignment, StudentProfile, AttendanceStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardCheck,
  Check,
  Clock,
  AlertCircle,
  Save,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceEntry {
  student_id: string;
  student_name: string;
  student_id_number: string;
  status: AttendanceStatus;
  remarks: string;
}

export function TakeAttendanceView() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load teacher's subject assignments
  useEffect(() => {
    async function loadAssignments() {
      const res = await api.getSubjectAssignments({ teacher: user?.id });
      if (res.success) {
        const list = extractList(res);
        setAssignments(list);
        if (list.length > 0 && !selectedAssignmentId) {
          setSelectedAssignmentId(list[0].id);
        }
      }
    }
    loadAssignments();
  }, [user?.id]);

  // Load students for chosen assignment's section
  const loadRoster = useCallback(async () => {
    if (!selectedAssignmentId) return;
    setIsLoading(true);

    try {
      const currentAsg = assignments.find((a) => a.id === selectedAssignmentId);
      if (!currentAsg) return;

      // 1. Get section students
      const stuRes = await api.getStudents(currentAsg.section);
      const studentList: StudentProfile[] = extractList(stuRes);

      // 2. Check if attendance already recorded for this date
      const attRes = await api.getAttendanceRecords({
        assignment: selectedAssignmentId,
        date: date,
      });
      const existingRecords = extractList(attRes);
      const existingMap = new Map(existingRecords.map((r) => [r.student, r]));

      const initialEntries: AttendanceEntry[] = studentList.map((s) => {
        const existing = existingMap.get(s.id);
        const name = s.user_details
          ? `${s.user_details.first_name} ${s.user_details.last_name}`
          : s.student_id;
        return {
          student_id: s.id,
          student_name: name,
          student_id_number: s.student_id,
          status: existing ? existing.status : "PRESENT",
          remarks: existing?.remarks || "",
        };
      });

      setEntries(initialEntries);
    } catch {
      error("Failed to load section attendance roster");
    } finally {
      setIsLoading(false);
    }
  }, [selectedAssignmentId, date, assignments, error]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setEntries((prev) =>
      prev.map((e) => (e.student_id === studentId ? { ...e, status } : e))
    );
  };

  const handleRemarkChange = (studentId: string, remarks: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.student_id === studentId ? { ...e, remarks } : e))
    );
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setEntries((prev) => prev.map((e) => ({ ...e, status })));
  };

  const handleSubmit = async () => {
    if (!selectedAssignmentId) return;
    setIsSubmitting(true);

    try {
      const payload = {
        subject_assignment_id: selectedAssignmentId,
        date,
        records: entries.map((e) => ({
          student_id: e.student_id,
          status: e.status,
          remarks: e.remarks || undefined,
        })),
      };

      const res = await api.bulkSubmitAttendance(payload);
      if (res.success) {
        success(`Saved attendance for ${entries.length} students.`);
      } else {
        error(res.error?.message || "Failed to submit attendance log.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  const statusCounts = entries.reduce(
    (acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Take Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Log presence, tardiness, and absences with atomic batch submission
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={entries.length === 0 || isLoading}
          isLoading={isSubmitting}
          className="gap-2 shadow-sm"
        >
          <Save className="h-4 w-4" />
          Save Attendance Log
        </Button>
      </div>

      {/* Selectors Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Class Section & Course</Label>
              <Select
                value={selectedAssignmentId}
                onValueChange={setSelectedAssignmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose course" />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.subject_name} - Section {a.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Attendance Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll("PRESENT")}
                  className="text-xs flex-1"
                >
                  All Present
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll("ABSENT")}
                  className="text-xs flex-1 text-rose-600 dark:text-rose-400"
                >
                  All Absent
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Pills */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>Present: {statusCounts["PRESENT"] || 0}</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-500" />
          <span>Absent: {statusCounts["ABSENT"] || 0}</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <span>Late: {statusCounts["LATE"] || 0}</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:border-sky-800 dark:text-sky-300 text-xs font-semibold flex items-center gap-2">
          <span>Excused: {statusCounts["EXCUSED"] || 0}</span>
        </div>
      </div>

      {/* Attendance Roster Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-indigo-600" />
            Class Roster -{" "}
            {currentAssignment
              ? `${currentAssignment.subject_name} (Section ${currentAssignment.section_name})`
              : "Select a Course"}
          </CardTitle>
          <CardDescription>
            Click a status button for each student or enter remarks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead className="min-w-[260px]">Attendance Status</TableHead>
                <TableHead>Remarks / Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading section roster...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No students found in this assigned class section.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.student_id}>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      {entry.student_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="purple" className="font-mono text-xs">
                        {entry.student_id_number}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {(
                          ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]
                        ).map((st) => {
                          const isSelected = entry.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(entry.student_id, st)}
                              className={cn(
                                "text-xs px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer",
                                isSelected &&
                                  st === "PRESENT" &&
                                  "bg-emerald-600 text-white border-emerald-600 shadow-xs",
                                isSelected &&
                                  st === "ABSENT" &&
                                  "bg-rose-600 text-white border-rose-600 shadow-xs",
                                isSelected &&
                                  st === "LATE" &&
                                  "bg-amber-500 text-white border-amber-500 shadow-xs",
                                isSelected &&
                                  st === "EXCUSED" &&
                                  "bg-sky-600 text-white border-sky-600 shadow-xs",
                                !isSelected &&
                                  "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                              )}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Optional remarks..."
                        value={entry.remarks}
                        onChange={(e) =>
                          handleRemarkChange(entry.student_id, e.target.value)
                        }
                        className="h-8 text-xs max-w-xs"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
