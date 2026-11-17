import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { StudentProfile, StudentGuardian } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Shield, Calendar, Phone, Activity, GraduationCap } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StudentDetailModalProps {
  student: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentDetailModal({
  student,
  isOpen,
  onClose,
}: StudentDetailModalProps) {
  const [guardians, setGuardians] = useState<StudentGuardian[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (student && isOpen) {
      setIsLoading(true);
      api
        .getStudentGuardians(student.id)
        .then((res) => {
          if (res.success && res.data) {
            setGuardians(res.data);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [student, isOpen]);

  if (!student) return null;

  const fullName = student.user_details
    ? `${student.user_details.first_name} ${student.user_details.last_name}`
    : "Student Profile";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              <User className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl">{fullName}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="purple" className="font-mono text-xs">
                  {student.student_id}
                </Badge>
                {student.section_name && (
                  <Badge variant="secondary">
                    Section {student.section_name}
                  </Badge>
                )}
                {student.is_active ? (
                  <Badge variant="success" dot>Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Date of Birth
              </span>
              <p className="font-medium mt-1">{formatDate(student.date_of_birth)}</p>
            </div>

            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" /> Enrollment Date
              </span>
              <p className="font-medium mt-1">{formatDate(student.enrollment_date)}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 text-sm">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Primary Guardian Contact Phone
            </span>
            <p className="font-medium mt-1">{student.guardian_contact || "No emergency phone registered"}</p>
          </div>

          {student.medical_notes && (
            <div className="p-3 rounded-xl border border-rose-100 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/30 text-sm">
              <span className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-semibold">
                <Activity className="h-3.5 w-3.5" /> Medical Notes / Allergies
              </span>
              <p className="mt-1 text-rose-900 dark:text-rose-200">{student.medical_notes}</p>
            </div>
          )}

          {/* Linked Guardians */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Linked Parents / Guardians
            </h4>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Loading guardians...</p>
            ) : guardians.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No parent account linked yet.</p>
            ) : (
              <div className="space-y-2">
                {guardians.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {g.parent_name || "Parent"}
                      </p>
                      <p className="text-xs text-muted-foreground">{g.parent_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{g.relationship}</Badge>
                      {g.is_primary && (
                        <Badge variant="info">Primary</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
