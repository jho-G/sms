import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { GradeLevel, AcademicYear } from "@/types";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Layers, Trash2, Edit2 } from "lucide-react";

export function GradeLevelsView() {
  const { success, error } = useToast();
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeLevel | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<number>(9);
  const [academicYearId, setAcademicYearId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [gradesRes, yearsRes] = await Promise.all([
        api.getGradeLevels(selectedYearId === "ALL" ? undefined : selectedYearId),
        api.getAcademicYears(),
      ]);

      if (gradesRes.success) setGrades(extractList(gradesRes));
      if (yearsRes.success) {
        const yrList = extractList(yearsRes);
        setYears(yrList);
        if (!academicYearId && yrList.length > 0) {
          const active = yrList.find((y) => y.is_active) || yrList[0];
          setAcademicYearId(active.id);
        }
      }
    } catch {
      error("Failed to load grade levels");
    } finally {
      setIsLoading(false);
    }
  }, [selectedYearId, academicYearId, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingGrade(null);
    setName("");
    setLevel(9);
    setDescription("");
    setIsOpen(true);
  };

  const handleOpenEdit = (gr: GradeLevel) => {
    setEditingGrade(gr);
    setName(gr.name);
    setLevel(gr.level);
    setAcademicYearId(gr.academic_year);
    setDescription(gr.description || "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academicYearId) {
      error("Please choose an academic year");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGrade) {
        const res = await api.updateGradeLevel(editingGrade.id, {
          name,
          level: Number(level),
          academic_year: academicYearId,
          description,
        });
        if (res.success) {
          success("Grade level updated.");
          setIsOpen(false);
          loadData();
        } else {
          error(res.error?.message || "Failed to update grade level");
        }
      } else {
        const res = await api.createGradeLevel({
          name,
          level: Number(level),
          academic_year: academicYearId,
          description,
        });
        if (res.success) {
          success("Grade level created.");
          setIsOpen(false);
          loadData();
        } else {
          error(res.error?.message || "Failed to create grade level");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this grade level?")) return;
    const res = await api.deleteGradeLevel(id);
    if (res.success) {
      success("Grade level deleted.");
      loadData();
    } else {
      error(res.error?.message || "Failed to delete grade level");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Grade Levels
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure educational grade standards (Grades 9-12) per academic calendar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Academic Years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name} {y.is_active && "(Active)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Grade Level
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            Active Grade Levels
          </CardTitle>
          <CardDescription>
            Grades organize class sections and curriculum cohorts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grade Name</TableHead>
                <TableHead>Numeric Level</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading grade levels...
                  </TableCell>
                </TableRow>
              ) : grades.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No grade levels found.
                  </TableCell>
                </TableRow>
              ) : (
                grades.map((gr) => (
                  <TableRow key={gr.id}>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      {gr.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Level {gr.level}</Badge>
                    </TableCell>
                    <TableCell>{gr.academic_year_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {gr.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => handleOpenEdit(gr)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(gr.id)}
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
              {editingGrade ? "Edit Grade Level" : "Create Grade Level"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label required>Grade Name</Label>
              <Input
                required
                placeholder="e.g. Grade 11"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Numeric Level (9-12)</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value) || 9)}
                />
              </div>
              <div className="space-y-1.5">
                <Label required>Academic Year</Label>
                <Select value={academicYearId} onValueChange={setAcademicYearId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Junior High Year"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editingGrade ? "Save Changes" : "Create Grade"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
