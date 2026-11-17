import React, { useEffect, useState, useCallback, useMemo } from "react";
import { api, extractList } from "@/services/api";
import type { StudentProfile, ClassSection } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Plus, Users, Search, Download, Trash2, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StudentsViewProps {
  onSelectStudent?: (student: StudentProfile) => void;
  onOpenCreate?: () => void;
}

export function StudentsView({ onSelectStudent, onOpenCreate }: StudentsViewProps) {
  const { success, error } = useToast();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stuRes, secRes] = await Promise.all([
        api.getStudents(selectedSectionId === "ALL" ? undefined : selectedSectionId),
        api.getSections(),
      ]);

      if (stuRes.success) setStudents(extractList(stuRes));
      if (secRes.success) setSections(extractList(secRes));
    } catch {
      error("Failed to load students roster");
    } finally {
      setIsLoading(false);
    }
  }, [selectedSectionId, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const term = searchTerm.toLowerCase();
      const studentId = s.student_id?.toLowerCase() || "";
      const name = s.user_details
        ? `${s.user_details.first_name} ${s.user_details.last_name}`.toLowerCase()
        : "";
      const email = s.user_details?.email.toLowerCase() || "";
      return studentId.includes(term) || name.includes(term) || email.includes(term);
    });
  }, [students, searchTerm]);

  const exportCSV = () => {
    if (filteredStudents.length === 0) {
      error("No student records to export.");
      return;
    }

    const headers = ["Student ID", "First Name", "Last Name", "Email", "Section", "DOB", "Enrollment Date"];
    const rows = filteredStudents.map((s) => [
      `"${s.student_id}"`,
      `"${s.user_details?.first_name || ""}"`,
      `"${s.user_details?.last_name || ""}"`,
      `"${s.user_details?.email || ""}"`,
      `"${s.section_name || ""}"`,
      `"${s.date_of_birth || ""}"`,
      `"${s.enrollment_date || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `students_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Roster exported to CSV.");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this student profile?")) return;
    const res = await api.deleteStudentProfile(id);
    if (res.success) {
      success("Student profile removed.");
      loadData();
    } else {
      error(res.error?.message || "Failed to remove student.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Student Roster
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage institutional enrollments, class section cohorts, and student details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          {onOpenCreate && (
            <Button onClick={onOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Enroll Student
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Enrolled Students Directory
              </CardTitle>
              <CardDescription>
                Showing {filteredStudents.length} of {students.length} students
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sections</SelectItem>
                  {sections.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id}>
                      {sec.grade_level_name} - {sec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Loading student roster...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No students matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Badge variant="purple" className="font-mono text-[11px]">
                        {s.student_id}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      {s.user_details
                        ? `${s.user_details.first_name} ${s.user_details.last_name}`
                        : "Student"}
                    </TableCell>
                    <TableCell>
                      {s.section_name ? (
                        <Badge variant="secondary">Section {s.section_name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(s.date_of_birth)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(s.enrollment_date)}
                    </TableCell>
                    <TableCell>
                      {s.is_active ? (
                        <Badge variant="success" dot>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onSelectStudent && (
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => onSelectStudent(s)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="iconSm"
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(s.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
