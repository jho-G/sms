import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { ParentProfile } from "@/types";
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
import { Plus, HeartHandshake, Search } from "lucide-react";

export function ParentsView() {
  const { success, error } = useToast();
  const [parents, setParents] = useState<ParentProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Dialog
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "parent123password",
    occupation: "Software Engineer",
    address: "123 Maple Street",
    secondary_phone: "+1 555-0199",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadParents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getParents();
      if (res.success) setParents(extractList(res));
    } catch {
      error("Failed to load parents directory");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadParents();
  }, [loadParents]);

  const handleOpenCreate = () => {
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "parent123password",
      occupation: "",
      address: "",
      secondary_phone: "",
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Register parent user account
      const regRes = await api.register({
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        password_confirm: formData.password,
        role: "PARENT",
      });

      if (!regRes.success || !regRes.data?.user) {
        error(regRes.error?.message || "Failed to create parent user");
        return;
      }

      // 2. Create ParentProfile
      const profRes = await api.createParentProfile({
        user: regRes.data.user.id,
        occupation: formData.occupation,
        address: formData.address,
        secondary_phone: formData.secondary_phone,
      });

      if (profRes.success) {
        success("Parent registered successfully.");
        setIsOpen(false);
        loadParents();
      } else {
        error(profRes.error?.message || "Profile creation failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredParents = parents.filter((p) => {
    const term = searchTerm.toLowerCase();
    const name = p.user_details
      ? `${p.user_details.first_name} ${p.user_details.last_name}`.toLowerCase()
      : "";
    const email = p.user_details?.email.toLowerCase() || "";
    const occ = p.occupation?.toLowerCase() || "";
    return name.includes(term) || email.includes(term) || occ.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Parents & Legal Guardians
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registered family contacts, residential addresses, and emergency phone
            channels
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Register Parent
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-indigo-600" />
                Parents Directory
              </CardTitle>
              <CardDescription>
                Family accounts can be linked to students in the Guardians view.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parents..."
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
                <TableHead>Parent Name</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Occupation</TableHead>
                <TableHead>Contact Address</TableHead>
                <TableHead>Secondary Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading parents...
                  </TableCell>
                </TableRow>
              ) : filteredParents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No parent records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredParents.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      {p.user_details
                        ? `${p.user_details.first_name} ${p.user_details.last_name}`
                        : "Parent"}
                    </TableCell>
                    <TableCell className="text-sm">{p.user_details?.email}</TableCell>
                    <TableCell className="text-sm">{p.occupation || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {p.address || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {p.secondary_phone || "—"}
                    </TableCell>
                    <TableCell>
                      {p.is_active ? (
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
            <DialogTitle>Register Parent Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>First Name</Label>
                <Input
                  required
                  placeholder="Robert"
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
                  placeholder="Taylor"
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
                  placeholder="rtaylor"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label required>Email Address</Label>
                <Input
                  type="email"
                  required
                  placeholder="robert.taylor@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Occupation</Label>
                <Input
                  placeholder="e.g. Architect"
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData({ ...formData, occupation: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Secondary Phone</Label>
                <Input
                  placeholder="+1 (555) 234-5678"
                  value={formData.secondary_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, secondary_phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Residential Address</Label>
              <Input
                placeholder="Street address, City, State"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Register Parent
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
