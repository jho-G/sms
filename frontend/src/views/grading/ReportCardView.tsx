import React, { useEffect, useState, useCallback } from "react";
import { api, extractList } from "@/services/api";
import type { ReportCard, StudentProfile, AcademicYear } from "@/types";
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
import { GraduationCap, Printer, Award, BookOpen, Star } from "lucide-react";
import confetti from "canvas-confetti";

interface ReportCardViewProps {
  customStudentId?: string;
}

export function ReportCardView({ customStudentId }: ReportCardViewProps) {
  const { profileId, isStudent, isDirector } = useAuth();
  const { error } = useToast();

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    customStudentId || profileId || ""
  );

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");

  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load Years and Students (if director/teacher)
  useEffect(() => {
    async function init() {
      try {
        const [yrRes, stuRes] = await Promise.all([
          api.getAcademicYears(),
          isDirector ? api.getStudents() : Promise.resolve({ success: false, data: [] }),
        ]);

        if (yrRes.success) {
          const yrList = extractList(yrRes);
          setYears(yrList);
          const active = yrList.find((y) => y.is_active) || yrList[0];
          if (active) setSelectedYearId(active.id);
        }

        if (stuRes.success) {
          const sList = extractList(stuRes);
          setStudents(sList);
          if (!selectedStudentId && sList.length > 0) {
            setSelectedStudentId(sList[0].id);
          }
        }
      } catch {
        error("Failed to load school academic years");
      }
    }
    init();
  }, [isDirector, selectedStudentId, error]);

  const loadReportCard = useCallback(async () => {
    if (!selectedYearId) return;
    setIsLoading(true);

    try {
      let res;
      if (isStudent && !customStudentId) {
        res = await api.getMyReportCard(selectedYearId);
      } else if (selectedStudentId) {
        res = await api.getReportCard(selectedStudentId, selectedYearId);
      }

      if (res && res.success && res.data) {
        setReportCard(res.data);
        if (res.data.gpa >= 3.5) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        }
      } else {
        setReportCard(null);
      }
    } catch {
      setReportCard(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYearId, selectedStudentId, isStudent, customStudentId]);

  useEffect(() => {
    loadReportCard();
  }, [loadReportCard]);

  const getGpaColor = (gpa: number) => {
    if (gpa >= 3.5) return "text-emerald-600 dark:text-emerald-400";
    if (gpa >= 3.0) return "text-indigo-600 dark:text-indigo-400";
    if (gpa >= 2.0) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Academic Report Card
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cumulative GPA transcript, subject mastery breakdowns, and letter grades
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isDirector && (
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.user_details
                      ? `${s.user_details.first_name} ${s.user_details.last_name}`
                      : s.student_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name} {y.is_active && "(Active)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
            Calculating student transcript and GPA...
          </CardContent>
        </Card>
      ) : !reportCard ? (
        <Card>
          <CardContent className="h-48 flex flex-col items-center justify-center text-muted-foreground">
            <Award className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-2" />
            <p className="text-sm font-medium">
              No report card data found for this period.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ensure marks are entered and category weights total up properly.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Official Banner / KPI */}
          <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                    {reportCard.student_name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="purple" className="font-mono text-xs">
                      {reportCard.student_id_number}
                    </Badge>
                    <Badge variant="secondary">Section {reportCard.section_name}</Badge>
                    <Badge variant="outline">{reportCard.academic_year_name}</Badge>
                  </div>
                </div>
              </div>

              {/* GPA Display Box */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Cumulative GPA
                  </span>
                  <div
                    className={`text-4xl font-extrabold tracking-tight ${getGpaColor(reportCard.gpa)}`}
                  >
                    {reportCard.gpa.toFixed(2)}
                  </div>
                  <span className="text-xs text-muted-foreground">4.0 Scale</span>
                </div>

                <div className="text-right pl-6 border-l border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Grade & Average
                  </span>
                  <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                    {reportCard.letter_grade}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {reportCard.overall_percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Subject Breakdown Table */}
            <div className="pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Subject Performance Breakdown
              </h3>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Assessment Breakdown</TableHead>
                    <TableHead>Weighted Score</TableHead>
                    <TableHead>Letter Grade</TableHead>
                    <TableHead className="text-right">Grade Point</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportCard.subjects.map((subj) => (
                    <TableRow key={subj.subject_id}>
                      <TableCell>
                        <Badge variant="purple" className="font-mono text-xs">
                          {subj.subject_code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                        {subj.subject_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {subj.categories?.map((cat, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                            >
                              {cat.name} ({cat.weight}%): {cat.percentage.toFixed(0)}%
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-gray-900 dark:text-gray-100">
                        {subj.score.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            subj.letter_grade === "A"
                              ? "success"
                              : subj.letter_grade === "B"
                                ? "purple"
                                : subj.letter_grade === "C"
                                  ? "warning"
                                  : "destructive"
                          }
                          className="font-bold"
                        >
                          {subj.letter_grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                        {subj.grade_point.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
