import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { StudentGuardian, StudentProfile } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, Clock, Award, ChevronRight, User } from "lucide-react";

interface ChildrenViewProps {
  onSelectChild: (
    studentId: string,
    studentName: string,
    destination: "attendance" | "grades"
  ) => void;
}

export function ChildrenView({ onSelectChild }: ChildrenViewProps) {
  const { profileId } = useAuth();
  const { error } = useToast();
  const [guardians, setGuardians] = useState<StudentGuardian[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadChildren = useCallback(async () => {
    if (!profileId) return;
    setIsLoading(true);
    try {
      const res = await api.getParentChildren(profileId);
      if (res.success && res.data) {
        setGuardians(res.data);
      }
    } catch {
      error("Failed to load linked children");
    } finally {
      setIsLoading(false);
    }
  }, [profileId, error]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          My Children
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select a child to monitor class attendance rates and review semester report
          cards
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="h-32 flex items-center justify-center text-muted-foreground">
            Loading child records...
          </CardContent>
        </Card>
      ) : guardians.length === 0 ? (
        <Card>
          <CardContent className="h-40 flex flex-col items-center justify-center text-muted-foreground text-center">
            <Users className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-semibold">No children profiles linked yet.</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Please contact the school director or administrative office to connect your
              parent account with your student's institutional record.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guardians.map((g) => {
            const studentId = typeof g.student === "string" ? g.student : g.student.id;
            const studentName = g.student_name || "Child";
            return (
              <Card
                key={g.id}
                className="hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{studentName}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {g.student_id_number && (
                            <Badge variant="purple" className="font-mono text-[10px]">
                              {g.student_id_number}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">
                            {g.relationship}
                          </Badge>
                          {g.is_primary && (
                            <Badge variant="info" className="text-[10px]">
                              Primary Contact
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectChild(studentId, studentName, "attendance")}
                      className="flex-1 gap-1.5 text-xs"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      View Attendance
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onSelectChild(studentId, studentName, "grades")}
                      className="flex-1 gap-1.5 text-xs"
                    >
                      <Award className="h-3.5 w-3.5" />
                      View Report Card
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
