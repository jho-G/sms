import React, { useEffect, useState } from "react";
import { api, extractList } from "@/services/api";
import type { SubjectAssignment } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, ClipboardCheck, Award, Users, Calendar } from "lucide-react";

interface MyAssignmentsViewProps {
  onNavigate: (tab: string) => void;
}

export function MyAssignmentsView({ onNavigate }: MyAssignmentsViewProps) {
  const { user } = useAuth();
  const { error } = useToast();
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await api.getSubjectAssignments({ teacher: user?.id });
        if (res.success) setAssignments(extractList(res));
      } catch {
        error("Failed to load your teaching assignments");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user?.id, error]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          My Teaching Assignments
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Active course subjects and class sections under your instruction
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="h-32 flex items-center justify-center text-muted-foreground">
            Loading assigned classes...
          </CardContent>
        </Card>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="h-32 flex flex-col items-center justify-center text-muted-foreground text-center">
            <BookOpen className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm font-semibold">No active teaching assignments found.</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Contact the Director to assign courses to your faculty profile.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((asg) => (
            <Card key={asg.id} className="hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  {asg.subject_code && (
                    <Badge variant="purple" className="font-mono text-xs">
                      {asg.subject_code}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{asg.subject_name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    Section {asg.section_name}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {asg.academic_year_name || "Active Year"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate("take-attendance")}
                    className="flex-1 gap-1 text-xs"
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Attendance
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onNavigate("enter-grades")}
                    className="flex-1 gap-1 text-xs"
                  >
                    <Award className="h-3.5 w-3.5" />
                    Enter Marks
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
