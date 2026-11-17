import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { SubjectAssignment, AssessmentCategory, StudentProfile, Grade } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Award, Save, CheckCircle2 } from "lucide-react";

interface GradeEntryRow {
  student_id: string;
  student_name: string;
  student_id_number: string;
  score: number;
  max_score: number;
  remarks: string;
}

export function EnterGradesView() {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");

  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [rows, setRows] = useState<GradeEntryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load teacher assignments
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

  // Load categories for selected assignment
  useEffect(() => {
    if (!selectedAssignmentId) return;

    async function loadCategories() {
      const res = await api.getAssessmentCategories(selectedAssignmentId);
      if (res.success) {
        const catList = extractList(res);
        setCategories(catList);
        if (catList.length > 0) {
          setSelectedCategoryId(catList[0].id);
        } else {
          setSelectedCategoryId("");
        }
      }
    }
    loadCategories();
  }, [selectedAssignmentId]);

  // Load student roster & any existing marks for this category
  const loadRosterAndMarks = useCallback(async () => {
    if (!selectedAssignmentId || !selectedCategoryId) {
      setRows([]);
      return;
    }
    setIsLoading(true);

    try {
      const currentAsg = assignments.find((a) => a.id === selectedAssignmentId);
      if (!currentAsg) return;

      const [stuRes, gradeRes] = await Promise.all([
        api.getStudents(currentAsg.section),
        api.getGrades({ category: selectedCategoryId }),
      ]);

      const students: StudentProfile[] = extractList(stuRes);
      const existingGrades: Grade[] = extractList(gradeRes);
      const gradesMap = new Map(existingGrades.map((g) => [g.student, g]));

      const initialRows: GradeEntryRow[] = students.map((s) => {
        const ex = gradesMap.get(s.id);
        const name = s.user_details
          ? `${s.user_details.first_name} ${s.user_details.last_name}`
          : s.student_id;
        return {
          student_id: s.id,
          student_name: name,
          student_id_number: s.student_id,
          score: ex ? Number(ex.score) : 85,
          max_score: ex ? Number(ex.max_score) : 100,
          remarks: ex?.remarks || "",
        };
      });

      setRows(initialRows);
    } catch {
      error("Failed to load grade roster");
    } finally {
      setIsLoading(false);
    }
  }, [selectedAssignmentId, selectedCategoryId, assignments, error]);

  useEffect(() => {
    loadRosterAndMarks();
  }, [loadRosterAndMarks]);

  const handleScoreChange = (studentId: string, score: number) => {
    setRows((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, score } : r))
    );
  };

  const handleMaxScoreChange = (studentId: string, max_score: number) => {
    setRows((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, max_score } : r))
    );
  };

  const handleRemarkChange = (studentId: string, remarks: string) => {
    setRows((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, remarks } : r))
    );
  };

  const handleSubmit = async () => {
    if (!selectedCategoryId) {
      error("Please select an assessment category");
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = {
        assessment_category_id: selectedCategoryId,
        grades: rows.map((r) => ({
          student_id: r.student_id,
          score: r.score,
          max_score: r.max_score,
          remarks: r.remarks || undefined,
        })),
      };

      const res = await api.bulkSubmitGrades(payload);
      if (res.success) {
        success(`Grades recorded successfully for ${rows.length} students.`);
      } else {
        error(res.error?.message || "Failed to record student grades.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Enter Assessment Grades
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submit marks and remarks per assessment category with automatic percentage weighting
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={rows.length === 0 || isLoading}
          isLoading={isSubmitting}
          className="gap-2 shadow-sm"
        >
          <Save className="h-4 w-4" />
          Save Student Grades
        </Button>
      </div>

      {/* Selector Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Select Assigned Course & Section</Label>
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
                      {a.subject_name} (Section {a.section_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Assessment Category</Label>
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.weight}% weight)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Entry Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-600" />
                Mark Sheet — {activeCategory ? `${activeCategory.name} (${activeCategory.weight}% Weight)` : "Select Category"}
              </CardTitle>
              <CardDescription>
                Raw scores are automatically computed into percentage and weighted points.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead className="w-32">Raw Score</TableHead>
                <TableHead className="w-32">Max Score</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Teacher Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Loading student marks...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No assessment categories configured for this subject assignment yet.
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No students in this class section.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const pct = row.max_score > 0 ? Math.round((row.score / row.max_score) * 100) : 0;
                  return (
                    <TableRow key={row.student_id}>
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                        {row.student_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="purple" className="font-mono text-xs">
                          {row.student_id_number}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={row.max_score}
                          value={row.score}
                          onChange={(e) => handleScoreChange(row.student_id, parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={row.max_score}
                          onChange={(e) => handleMaxScoreChange(row.student_id, parseFloat(e.target.value) || 100)}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                          pct >= 90
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : pct >= 75
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                            : pct >= 60
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}>
                          {pct}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Optional feedback..."
                          value={row.remarks}
                          onChange={(e) => handleRemarkChange(row.student_id, e.target.value)}
                          className="h-8 text-xs max-w-xs"
                        />
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
