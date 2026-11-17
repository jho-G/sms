import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { SubjectAssignment, Subject, ClassSection, TeacherProfile, AcademicYear } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Briefcase, Trash2 } from "lucide-react";

export function AssignmentsView() {
  const { success, error } = useToast();
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog
  const [isOpen, setIsOpen] = useState(false);
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [yearId, setYearId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assignRes, teachRes, subjRes, secRes, yrRes] = await Promise.all([
        api.getSubjectAssignments(),
        api.getTeachers(),
        api.getSubjects(),
        api.getSections(),
        api.getAcademicYears(),
      ]);

      if (assignRes.success) setAssignments(extractList(assignRes));
      if (teachRes.success) setTeachers(extractList(teachRes));
      if (subjRes.success) setSubjects(extractList(subjRes));
      if (secRes.success) setSections(extractList(secRes));
      if (yrRes.success) {
        const yList = extractList(yrRes);
        setYears(yList);
        const active = yList.find((y) => y.is_active) || yList[0];
        if (active) setYearId(active.id);
      }
    } catch {
      error("Failed to load assignments");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    if (teachers.length > 0 && !teacherId) setTeacherId(typeof teachers[0].user === "string" ? teachers[0].user : teachers[0].user.id);
    if (subjects.length > 0 && !subjectId) setSubjectId(subjects[0].id);
    if (sections.length > 0 && !sectionId) setSectionId(sections[0].id);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !subjectId || !sectionId) {
      error("Please fill all required assignment fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createSubjectAssignment({
        teacher: teacherId,
        subject: subjectId,
        section: sectionId,
        academic_year: yearId || undefined,
      });

      if (res.success) {
        success("Teacher assigned to subject and section successfully.");
        setIsOpen(false);
        loadData();
      } else {
        error(res.error?.message || "Assignment conflict or failure.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deactivate this subject assignment?")) return;
    const res = await api.deleteSubjectAssignment(id);
    if (res.success) {
      success("Subject assignment deactivated.");
      loadData();
    } else {
      error(res.error?.message || "Failed to remove assignment.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Teaching Assignments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Link instructional faculty to curriculum courses and section cohorts
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Assign Teacher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-indigo-600" />
            Active Assignments Matrix
          </CardTitle>
          <CardDescription>
            Defines which teacher enters grades and marks attendance for each section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Loading assignments...
                  </TableCell>
                </TableRow>
              ) : assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No teacher assignments found.
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((asg) => (
                  <TableRow key={asg.id}>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      {asg.teacher_name || asg.teacher_email || "Teacher"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{asg.subject_name}</span>
                        {asg.subject_code && (
                          <Badge variant="purple" className="text-[10px]">
                            {asg.subject_code}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        Section {asg.section_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {asg.academic_year_name || "Active Year"}
                    </TableCell>
                    <TableCell>
                      {asg.is_active ? (
                        <Badge variant="success" dot>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="iconSm"
                        className="text-rose-600 hover:text-rose-700"
                        onClick={() => handleDelete(asg.id)}
                        title="Deactivate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Teacher to Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label required>Teacher Faculty</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => {
                    const uId = typeof t.user === "string" ? t.user : t.user.id;
                    const name = t.user_details
                      ? `${t.user_details.first_name} ${t.user_details.last_name}`
                      : `Teacher (${t.employee_id})`;
                    return (
                      <SelectItem key={t.id} value={uId}>
                        {name} - {t.department}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Subject</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label required>Class Section</Label>
                <Select value={sectionId} onValueChange={setSectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.id}>
                        {sec.grade_level_name} - Section {sec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Academic Year (optional)</Label>
              <Select value={yearId} onValueChange={setYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Active year (default)" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name} {y.is_active && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save Assignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
