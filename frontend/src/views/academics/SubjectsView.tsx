import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { Subject, GradeLevel } from "@/types";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, BookOpen, Trash2, Edit2 } from "lucide-react";

export function SubjectsView() {
  const { success, error } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog
  const [isOpen, setIsOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subjRes, gradeRes] = await Promise.all([
        api.getSubjects(),
        api.getGradeLevels(),
      ]);

      if (subjRes.success) setSubjects(extractList(subjRes));
      if (gradeRes.success) setGradeLevels(extractList(gradeRes));
    } catch {
      error("Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setName("");
    setCode("");
    setDescription("");
    setSelectedGrades([]);
    setIsOpen(true);
  };

  const handleOpenEdit = (subj: Subject) => {
    setEditingSubject(subj);
    setName(subj.name);
    setCode(subj.code);
    setDescription(subj.description || "");
    setSelectedGrades(subj.grade_levels || []);
    setIsOpen(true);
  };

  const toggleGradeSelection = (id: string) => {
    setSelectedGrades((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingSubject) {
        const res = await api.updateSubject(editingSubject.id, {
          name,
          code,
          description,
          grade_levels: selectedGrades,
        });
        if (res.success) {
          success("Subject updated successfully.");
          setIsOpen(false);
          loadData();
        } else {
          error(res.error?.message || "Failed to update subject");
        }
      } else {
        const res = await api.createSubject({
          name,
          code,
          description,
          grade_levels: selectedGrades,
        });
        if (res.success) {
          success("Subject created successfully.");
          setIsOpen(false);
          loadData();
        } else {
          error(res.error?.message || "Failed to create subject");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    const res = await api.deleteSubject(id);
    if (res.success) {
      success("Subject deleted.");
      loadData();
    } else {
      error(res.error?.message || "Failed to delete subject");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Course Subjects
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Curriculum subjects, official course codes, and associated grade levels
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Subject
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            Curriculum Catalog
          </CardTitle>
          <CardDescription>
            Subjects are assigned to teachers across class sections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Code</TableHead>
                <TableHead>Subject Name</TableHead>
                <TableHead>Grade Levels</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading curriculum subjects...
                  </TableCell>
                </TableRow>
              ) : subjects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No subjects found.
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((subj) => (
                  <TableRow key={subj.id}>
                    <TableCell>
                      <Badge variant="purple" className="font-mono">
                        {subj.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      {subj.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {subj.grade_level_names && subj.grade_level_names.length > 0 ? (
                          subj.grade_level_names.map((gn, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {gn}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            All grades
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                      {subj.description || "—"}
                    </TableCell>
                    <TableCell>
                      {subj.is_active ? (
                        <Badge variant="success" dot>
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => handleOpenEdit(subj)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(subj.id)}
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

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "Edit Subject" : "Create Subject"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Subject Name</Label>
                <Input
                  required
                  placeholder="e.g. Physics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label required>Course Code</Label>
                <Input
                  required
                  placeholder="e.g. PHYS201"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                placeholder="Course outline or description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Applicable Grade Levels</Label>
              <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 max-h-32 overflow-y-auto">
                {gradeLevels.map((gl) => {
                  const isChecked = selectedGrades.includes(gl.id);
                  return (
                    <button
                      type="button"
                      key={gl.id}
                      onClick={() => toggleGradeSelection(gl.id)}
                      className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                        isChecked
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {gl.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editingSubject ? "Save Changes" : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
