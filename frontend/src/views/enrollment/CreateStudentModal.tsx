import React, { useState, useEffect } from "react";
import { api, extractList } from "@/services/api";
import type { ClassSection } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateStudentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateStudentModalProps) {
  const { success, error } = useToast();
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "student123password",
    student_id: "",
    section_id: "",
    date_of_birth: "2008-01-15",
    guardian_contact: "",
    medical_notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      api.getSections().then((res) => {
        if (res.success) setSections(extractList(res));
      });
      // Generate a suggested student ID
      const randomId = "STU-" + Math.floor(1000 + Math.random() * 9000);
      setFormData((prev) => ({ ...prev, student_id: randomId }));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Create student user account
      const regRes = await api.register({
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        password_confirm: formData.password,
        role: "STUDENT",
      });

      if (!regRes.success || !regRes.data?.user) {
        error(regRes.error?.message || "Failed to create student user");
        return;
      }

      // 2. Create StudentProfile
      const profRes = await api.createStudentProfile({
        user: regRes.data.user.id,
        student_id: formData.student_id,
        section: formData.section_id || null,
        date_of_birth: formData.date_of_birth,
        guardian_contact: formData.guardian_contact,
        medical_notes: formData.medical_notes,
      });

      if (profRes.success) {
        success("Student enrolled successfully.");
        onClose();
        onSuccess();
      } else {
        error(profRes.error?.message || "User created but profile registration failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Enroll New Student</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required>First Name</Label>
              <Input
                required
                placeholder="Sarah"
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
                placeholder="Connor"
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
                placeholder="sconnor"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label required>Email Address</Label>
              <Input
                type="email"
                required
                placeholder="sconnor@school.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required>Institutional Student ID</Label>
              <Input
                required
                placeholder="e.g. STU-1001"
                value={formData.student_id}
                onChange={(e) =>
                  setFormData({ ...formData, student_id: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label required>Class Section</Label>
              <Select
                value={formData.section_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, section_id: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign section" />
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required>Date of Birth</Label>
              <Input
                type="date"
                required
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Guardian Contact Phone</Label>
              <Input
                placeholder="+1 (555) 000-0000"
                value={formData.guardian_contact}
                onChange={(e) =>
                  setFormData({ ...formData, guardian_contact: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Medical Notes / Conditions</Label>
            <Input
              placeholder="e.g. Peanut allergy, Asthma inhaler"
              value={formData.medical_notes}
              onChange={(e) =>
                setFormData({ ...formData, medical_notes: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Enroll Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
