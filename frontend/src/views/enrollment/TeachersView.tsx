import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { TeacherProfile } from "@/types";
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
import { Plus, UserCheck, Search, Award, Briefcase } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function TeachersView() {
  const { success, error } = useToast();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Dialog
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "teacher123password",
    employee_id: "",
    department: "Science",
    specialization: "Physics",
    qualification: "M.Sc. Education",
    hire_date: "2024-08-01",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getTeachers();
      if (res.success) setTeachers(extractList(res));
    } catch {
      error("Failed to load teachers directory");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const handleOpenCreate = () => {
    const randomId = "EMP-" + Math.floor(100 + Math.random() * 900);
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "teacher123password",
      employee_id: randomId,
      department: "Mathematics",
      specialization: "Calculus",
      qualification: "B.Ed, M.Sc.",
      hire_date: new Date().toISOString().slice(0, 10),
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Register teacher user (Director only)
      const regRes = await api.register({
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        password_confirm: formData.password,
        role: "TEACHER",
      });

      if (!regRes.success || !regRes.data?.user) {
        error(regRes.error?.message || "Failed to create teacher user");
        return;
      }

      // 2. Create profile
      const profRes = await api.createTeacherProfile({
        user: regRes.data.user.id,
        employee_id: formData.employee_id,
        department: formData.department,
        specialization: formData.specialization,
        qualification: formData.qualification,
        hire_date: formData.hire_date,
      });

      if (profRes.success) {
        success("Teacher faculty member added successfully.");
        setIsOpen(false);
        loadTeachers();
      } else {
        error(profRes.error?.message || "Profile creation failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const term = searchTerm.toLowerCase();
    const name = t.user_details
      ? `${t.user_details.first_name} ${t.user_details.last_name}`.toLowerCase()
      : "";
    const email = t.user_details?.email.toLowerCase() || "";
    const dept = t.department?.toLowerCase() || "";
    return name.includes(term) || email.includes(term) || dept.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Teaching Faculty
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Faculty directory, employee identifiers, academic departments, and
            qualifications
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Faculty Member
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-indigo-600" />
                Faculty Members
              </CardTitle>
              <CardDescription>
                Faculty members assigned to teach sections and submit grades.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading faculty members...
                  </TableCell>
                </TableRow>
              ) : filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No faculty records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Badge variant="purple" className="font-mono text-xs">
                        {t.employee_id}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      <div>
                        {t.user_details
                          ? `${t.user_details.first_name} ${t.user_details.last_name}`
                          : "Teacher"}
                        <p className="text-xs text-muted-foreground font-normal">
                          {t.user_details?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.department}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{t.specialization || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t.qualification || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(t.hire_date)}
                    </TableCell>
                    <TableCell>
                      {t.is_active ? (
                        <Badge variant="success" dot>
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Faculty Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>First Name</Label>
                <Input
                  required
                  placeholder="Albert"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label required>Last Name</Label>
                <Input
                  required
                  placeholder="Einstein"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Username</Label>
                <Input
                  required
                  placeholder="aeinstein"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label required>Email Address</Label>
                <Input
                  type="email"
                  required
                  placeholder="albert@school.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Employee ID</Label>
                <Input
                  required
                  placeholder="EMP-101"
                  value={formData.employee_id}
                  onChange={(e) =>
                    setFormData({ ...formData, employee_id: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label required>Department</Label>
                <Input
                  required
                  placeholder="e.g. Science"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Specialization</Label>
                <Input
                  placeholder="e.g. Theoretical Physics"
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Highest Qualification</Label>
                <Input
                  placeholder="e.g. Ph.D. Physics"
                  value={formData.qualification}
                  onChange={(e) =>
                    setFormData({ ...formData, qualification: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save Faculty
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
