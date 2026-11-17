import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { AcademicYear } from "@/types";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Calendar, Trash2, Edit2, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function AcademicYearsView() {
  const { success, error } = useToast();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadYears = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAcademicYears();
      if (res.success) {
        setYears(extractList(res));
      }
    } catch {
      error("Failed to load academic years");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  const handleOpenCreate = () => {
    setEditingYear(null);
    setName("");
    setStartDate("");
    setEndDate("");
    setIsActive(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (yr: AcademicYear) => {
    setEditingYear(yr);
    setName(yr.name);
    setStartDate(yr.start_date);
    setEndDate(yr.end_date);
    setIsActive(yr.is_active);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingYear) {
        const res = await api.updateAcademicYear(editingYear.id, {
          name,
          start_date: startDate,
          end_date: endDate,
          is_active: isActive,
        });
        if (res.success) {
          success("Academic year updated successfully.");
          setIsOpen(false);
          loadYears();
        } else {
          error(res.error?.message || "Failed to update academic year");
        }
      } else {
        const res = await api.createAcademicYear({
          name,
          start_date: startDate,
          end_date: endDate,
          is_active: isActive,
        });
        if (res.success) {
          success("Academic year created successfully.");
          setIsOpen(false);
          loadYears();
        } else {
          error(res.error?.message || "Failed to create academic year");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this academic year?")) return;
    const res = await api.deleteAcademicYear(id);
    if (res.success) {
      success("Academic year deleted.");
      loadYears();
    } else {
      error(res.error?.message || "Failed to delete academic year");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Academic Years
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure school years and designate the active school calendar
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Academic Year
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Calendar Periods
          </CardTitle>
          <CardDescription>
            Only one academic year can be active at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Loading academic years...
                  </TableCell>
                </TableRow>
              ) : years.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No academic years found. Click "New Academic Year" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                years.map((yr) => (
                  <TableRow key={yr.id}>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      {yr.name}
                    </TableCell>
                    <TableCell>{formatDate(yr.start_date)}</TableCell>
                    <TableCell>{formatDate(yr.end_date)}</TableCell>
                    <TableCell>
                      {yr.is_active ? (
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
                          onClick={() => handleOpenEdit(yr)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(yr.id)}
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

      {/* Create / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingYear ? "Edit Academic Year" : "Create Academic Year"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label required>Year Name</Label>
              <Input
                required
                placeholder="e.g. 2026-2027"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Start Date</Label>
                <Input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label required>End Date</Label>
                <Input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="is-active-checkbox"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label htmlFor="is-active-checkbox" className="cursor-pointer text-sm font-normal">
                Set as active academic year
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editingYear ? "Save Changes" : "Create Year"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
