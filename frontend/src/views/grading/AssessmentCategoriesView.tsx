import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { AssessmentCategory, SubjectAssignment } from "@/types";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Tags, Scale } from "lucide-react";

export function AssessmentCategoriesView() {
  const { success, error } = useToast();
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Dialog
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [weight, setWeight] = useState<number>(30);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catRes, asgRes] = await Promise.all([
        api.getAssessmentCategories(selectedAssignmentId === "ALL" ? undefined : selectedAssignmentId),
        api.getSubjectAssignments(),
      ]);

      if (catRes.success) setCategories(extractList(catRes));
      if (asgRes.success) {
        const asgList = extractList(asgRes);
        setAssignments(asgList);
        if (!assignmentId && asgList.length > 0) {
          setAssignmentId(asgList[0].id);
        }
      }
    } catch {
      error("Failed to load assessment categories");
    } finally {
      setIsLoading(false);
    }
  }, [selectedAssignmentId, assignmentId, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setName("");
    setWeight(30);
    setDescription("");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId) {
      error("Please choose a subject assignment");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createAssessmentCategory({
        name,
        subject_assignment: assignmentId,
        weight: Number(weight),
        description,
      });

      if (res.success) {
        success("Assessment category created.");
        setIsOpen(false);
        loadData();
      } else {
        error(res.error?.message || "Failed to create category (Weight limit may be exceeded).");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total weight for current filter
  const totalWeight = categories.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Assessment Categories
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure weighted grading formulas (Midterm, Final, Homework, Quizzes) up to 100%
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Course Assignments</SelectItem>
              {assignments.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.subject_name} ({a.section_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        </div>
      </div>

      {selectedAssignmentId !== "ALL" && (
        <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Total Allocated Weight:
                </span>
              </div>
              <Badge variant={totalWeight === 100 ? "success" : totalWeight > 100 ? "destructive" : "warning"}>
                {totalWeight}% / 100%
              </Badge>
            </div>
            {/* Visual Bar */}
            <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  totalWeight === 100
                    ? "bg-emerald-500"
                    : totalWeight > 100
                    ? "bg-rose-500"
                    : "bg-indigo-600"
                }`}
                style={{ width: `${Math.min(totalWeight, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tags className="h-4 w-4 text-indigo-600" />
            Configured Assessment Categories
          </CardTitle>
          <CardDescription>
            Weights determine GPA and subject cumulative report card calculations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Course Assignment</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Loading assessment categories...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No categories configured for this subject assignment.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      {cat.name}
                    </TableCell>
                    <TableCell>{cat.subject_name || "Assigned Course"}</TableCell>
                    <TableCell>
                      <Badge variant="purple" className="font-semibold">
                        {cat.weight}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cat.description || "—"}
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
            <DialogTitle>Create Assessment Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label required>Course Subject Assignment</Label>
              <Select value={assignmentId} onValueChange={setAssignmentId}>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Category Name</Label>
                <Input
                  required
                  placeholder="e.g. Midterm Exam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label required>Weight Percentage (%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                placeholder="e.g. First semester written test"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
