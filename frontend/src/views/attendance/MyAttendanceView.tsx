import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { AttendanceRecord, AbsenceSummary } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
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
import { Clock, CheckCircle2, AlertCircle, AlertTriangle, Calendar } from "lucide-react";
import { formatDate, getAttendanceStatusBadge } from "@/lib/utils";

interface MyAttendanceViewProps {
  customStudentId?: string;
  studentName?: string;
}

export function MyAttendanceView({
  customStudentId,
  studentName,
}: MyAttendanceViewProps) {
  const { profileId } = useAuth();
  const { error } = useToast();

  const targetStudentId = customStudentId || profileId;

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [absenceSummary, setAbsenceSummary] = useState<AbsenceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAttendance = useCallback(async () => {
    if (!targetStudentId) return;
    setIsLoading(true);

    try {
      const [recRes, absRes] = await Promise.all([
        api.getAttendanceRecords({ student: targetStudentId }),
        api.getStudentAbsences(targetStudentId),
      ]);

      if (recRes.success) setRecords(extractList(recRes));
      if (absRes.success) setAbsenceSummary(absRes.data);
    } catch {
      error("Failed to load attendance records");
    } finally {
      setIsLoading(false);
    }
  }, [targetStudentId, error]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Statistics
  const totalLogs = records.length;
  const presentLogs = records.filter((r) => r.status === "PRESENT").length;
  const lateLogs = records.filter((r) => r.status === "LATE").length;
  const absentLogs = records.filter((r) => r.status === "ABSENT").length;
  const excusedLogs = records.filter((r) => r.status === "EXCUSED").length;

  const attendanceRate =
    totalLogs > 0 ? Math.round(((presentLogs + lateLogs) / totalLogs) * 100) : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Attendance Record {studentName && `— ${studentName}`}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Comprehensive daily log of class attendance, excused status, and absence
          breakdown
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Attendance Rate
            </CardTitle>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
              {attendanceRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {totalLogs} logged class sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Present Days
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {presentLogs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              On-time classroom attendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tardy / Late
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {lateLogs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Recorded with arrival delay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unexcused Absences
            </CardTitle>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {absenceSummary?.total_absences ?? absentLogs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {excusedLogs} excused absences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Class Session History
          </CardTitle>
          <CardDescription>
            Chronological records marked by teaching faculty.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Subject Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Teacher Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading attendance history...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No attendance records logged yet for this academic period.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => {
                  const badgeInfo = getAttendanceStatusBadge(r.status);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatDate(r.date)}
                      </TableCell>
                      <TableCell>{r.subject_name || "Course Subject"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeInfo.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badgeInfo.dot}`} />
                          {badgeInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.remarks || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
