import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { StudentGuardian, StudentProfile, ParentProfile } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
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
import { Plus, ShieldCheck, Trash2, Link } from "lucide-react";

export function GuardiansView() {
  const { success, error } = useToast();
  const [links, setLinks] = useState<StudentGuardian[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [parents, setParents] = useState<ParentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog
  const [isOpen, setIsOpen] = useState(false);
  const [parentId, setParentId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [relationship, setRelationship] = useState("FATHER");
  const [isPrimary, setIsPrimary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [gRes, sRes, pRes] = await Promise.all([
        api.getGuardians(),
        api.getStudents(),
        api.getParents(),
      ]);

      if (gRes.success) setLinks(extractList(gRes));
      if (sRes.success) setStudents(extractList(sRes));
      if (pRes.success) setParents(extractList(pRes));
    } catch {
      error("Failed to load guardian links");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    if (parents.length > 0 && !parentId) setParentId(parents[0].id);
    if (students.length > 0 && !studentId) setStudentId(students[0].id);
    setIsPrimary(true);
    setRelationship("MOTHER");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentId || !studentId) {
      error("Please choose both a parent and a student");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.linkParentStudent({
        parent_id: parentId,
        student_id: studentId,
        relationship,
        is_primary: isPrimary,
      });

      if (res.success) {
        success("Guardian relationship established.");
        setIsOpen(false);
        loadData();
      } else {
        error(res.error?.message || "Failed to link guardian");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async (id: string) => {
    if (!window.confirm("Unlink this guardian from student?")) return;
    const res = await api.unlinkGuardian(id);
    if (res.success) {
      success("Guardian link removed.");
      loadData();
    } else {
      error(res.error?.message || "Failed to remove link");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Family & Guardian Links
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Designate primary emergency contacts, parental rights, and family links
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Link Guardian to Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            Active Guardian Relationships
          </CardTitle>
          <CardDescription>
            Enables parent accounts to access their child's grade reports and attendance
            logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Parent / Guardian</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Primary Contact</TableHead>
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
                    Loading guardian links...
                  </TableCell>
                </TableRow>
              ) : links.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No guardian connections created yet. Click "Link Guardian to Student".
                  </TableCell>
                </TableRow>
              ) : (
                links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      <div>
                        {link.student_name || "Student"}
                        {link.student_id_number && (
                          <Badge variant="purple" className="ml-2 text-[10px] font-mono">
                            {link.student_id_number}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">
                          {link.parent_name || "Parent"}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {link.parent_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{link.relationship}</Badge>
                    </TableCell>
                    <TableCell>
                      {link.is_primary ? (
                        <Badge variant="success" dot>
                          Primary Guardian
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Secondary</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="iconSm"
                        className="text-rose-600 hover:text-rose-700"
                        onClick={() => handleUnlink(link.id)}
                        title="Unlink"
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
            <DialogTitle>Link Guardian to Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label required>Select Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => {
                    const name = s.user_details
                      ? `${s.user_details.first_name} ${s.user_details.last_name}`
                      : `Student (${s.student_id})`;
                    return (
                      <SelectItem key={s.id} value={s.id}>
                        {name} - {s.student_id} ({s.section_name || "Unassigned"})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label required>Select Parent Account</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose parent" />
                </SelectTrigger>
                <SelectContent>
                  {parents.map((p) => {
                    const name = p.user_details
                      ? `${p.user_details.first_name} ${p.user_details.last_name}`
                      : "Parent";
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {name} ({p.user_details?.email})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label required>Relationship Type</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FATHER">Father</SelectItem>
                  <SelectItem value="MOTHER">Mother</SelectItem>
                  <SelectItem value="GUARDIAN">Legal Guardian</SelectItem>
                  <SelectItem value="SIBLING">Sibling</SelectItem>
                  <SelectItem value="OTHER">Other Relative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="is-primary-checkbox"
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label
                htmlFor="is-primary-checkbox"
                className="cursor-pointer text-sm font-normal"
              >
                Set as Primary Guardian (receives primary emergency notices)
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Establish Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
