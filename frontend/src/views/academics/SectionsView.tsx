import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { ClassSection, GradeLevel } from "@/types";
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
import { Plus, Building2, Trash2, Edit2 } from "lucide-react";

export function SectionsView() {
  const { success, error } = useToast();
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ClassSection | null>(null);
  const [name, setName] = useState("");
  const [gradeLevelId, setGradeLevelId] = useState("");
  const [capacity, setCapacity] = useState(35);
  const [roomNumber, setRoomNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [secRes, gradeRes] = await Promise.all([
        api.getSections(selectedGradeId === "ALL" ? undefined : selectedGradeId),
        api.getGradeLevels(),
      ]);

      if (secRes.success) setSections(extractList(secRes));
      if (gradeRes.success) {
        const glList = extractList(gradeRes);
        setGradeLevels(glList);
        if (!gradeLevelId && glList.length > 0) {
          setGradeLevelId(glList[0].id);
        }
      }
    } catch {
      error("Failed to load sections");
    } finally {
      setIsLoading(false);
    }
  }, [selectedGradeId, gradeLevelId, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingSection(null);
    setName("");
    setCapacity(35);
    setRoomNumber("");
    setIsOpen(true);
  };

  const handleOpenEdit = (sec: ClassSection) => {
    setEditingSection(sec);
    setName(sec.name);
    setGradeLevelId(sec.grade_level);
    setCapacity(sec.capacity);
    setRoomNumber(sec.room_number || "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeLevelId) {
      error("Please choose a grade level");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSection) {
        const res = await api.updateSection(editingSection.id, {
          name,
          grade_level: gradeLevelId,
          capacity: Number(capacity),
          room_number: roomNumber,
        });
        if (res.success) {
          success("Section updated successfully.");
          setIsOpen(false);
          loadData();
        } else {
          error(res.error?.message || "Failed to update section");
        }
      } else {
        const res = await api.createSection({
          name,
          grade_level: gradeLevelId,
          capacity: Number(capacity),
          room_number: roomNumber,
        });
        if (res.success) {
          success("Section created successfully.");
          setIsOpen(false);
          loadData();
        } else {
          error(res.error?.message || "Failed to create section");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this section?")) return;
    const res = await api.deleteSection(id);
    if (res.success) {
      success("Section deleted.");
      loadData();
    } else {
      error(res.error?.message || "Failed to delete section");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Class Sections
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize student cohorts, classroom capacities, and room assignments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Grade Levels</SelectItem>
              {gradeLevels.map((gl) => (
                <SelectItem key={gl.id} value={gl.id}>
                  {gl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Section
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600" />
            Classroom Sections
          </CardTitle>
          <CardDescription>
            Sections divide grade cohorts into manageable physical classes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section Name</TableHead>
                <TableHead>Grade Level</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Loading class sections...
                  </TableCell>
                </TableRow>
              ) : sections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No sections found.
                  </TableCell>
                </TableRow>
              ) : (
                sections.map((sec) => (
                  <TableRow key={sec.id}>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      Section {sec.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {sec.grade_level_name || "Grade"}
                      </Badge>
                    </TableCell>
                    <TableCell>{sec.room_number || "—"}</TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {sec.capacity} students max
                      </span>
                    </TableCell>
                    <TableCell>
                      {sec.is_active ? (
                        <Badge variant="success" dot>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => handleOpenEdit(sec)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(sec.id)}
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
              {editingSection ? "Edit Section" : "Create Section"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Section Name</Label>
                <Input
                  required
                  placeholder="e.g. A, B, or 10-A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label required>Grade Level</Label>
                <Select value={gradeLevelId} onValueChange={setGradeLevelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((gl) => (
                      <SelectItem key={gl.id} value={gl.id}>
                        {gl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Student Capacity</Label>
                <Input
                  type="number"
                  min="5"
                  max="100"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 35)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Room Number</Label>
                <Input
                  placeholder="e.g. Room 204"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editingSection ? "Save Changes" : "Create Section"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
