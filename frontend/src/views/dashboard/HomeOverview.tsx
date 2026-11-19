import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, extractList } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

interface HomeOverviewProps {
  onNavigate: (tab: string) => void;
}

export function HomeOverview({ onNavigate }: HomeOverviewProps) {
  const { user, isDirector, isTeacher, isStudent, isParent } = useAuth();

  const [stats, setStats] = useState<{
    studentsCount?: number;
    teachersCount?: number;
    subjectsCount?: number;
    activeYear?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        if (isDirector) {
          const [studentsRes, teachersRes, subjectsRes, yearRes] = await Promise.all([
            api.getStudents(),
            api.getTeachers(),
            api.getSubjects(),
            api.getActiveAcademicYear(),
          ]);

          if (mounted) {
            setStats({
              studentsCount: extractList(studentsRes).length,
              teachersCount: extractList(teachersRes).length,
              subjectsCount: extractList(subjectsRes).length,
              activeYear: yearRes.success ? yearRes.data.name : "None active",
            });
          }
        }
      } catch {
        // fallback
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadStats();
    return () => {
      mounted = false;
    };
  }, [isDirector]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/20"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-3">
            <Calendar className="h-3.5 w-3.5" />
            <span>{today}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.first_name || "Scholar"}!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-indigo-100 max-w-xl">
            {isDirector &&
              "Here is your school overview and active administration control center."}
            {isTeacher &&
              "Ready to record attendance or submit category marks for your classes."}
            {isStudent &&
              "Check your latest subject attendance rates and report card progress."}
            {isParent &&
              "Track your children's class attendance, assignments, and academic reports."}
          </p>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </motion.div>

      {/* Director Quick Stats */}
      {isDirector && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Enrolled Students
              </CardTitle>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats.studentsCount ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                Active institutional roster
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faculty & Teachers
              </CardTitle>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <GraduationCap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats.teachersCount ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Teaching staff members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Curriculum Subjects
              </CardTitle>
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                <BookOpen className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats.subjectsCount ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Active courses offered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Academic Year
              </CardTitle>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Calendar className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="text-xl font-bold truncate">
                  {stats.activeYear || "2024-2025"}
                </div>
              )}
              <Badge variant="success" className="mt-1">
                Current Term
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role Action Shortcuts */}
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
          Quick Access
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isDirector && (
            <>
              <motion.div whileHover={{ y: -3 }}>
                <Card
                  className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  onClick={() => onNavigate("students")}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        <Users className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base mt-2">Student Directory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Enroll new students, assign class sections, and manage guardian
                      links.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -3 }}>
                <Card
                  className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  onClick={() => onNavigate("academic-years")}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base mt-2">Academic Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Manage academic years, grade levels, sections, and teacher
                      assignments.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -3 }}>
                <Card
                  className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  onClick={() => onNavigate("report-cards")}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        <Award className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base mt-2">School Report Cards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Calculate term GPA and view official school report cards per
                      student.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {isTeacher && (
            <>
              <motion.div whileHover={{ y: -3 }}>
                <Card
                  className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  onClick={() => onNavigate("take-attendance")}
                >
                  <CardHeader>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 w-fit">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base mt-2">
                      Take Daily Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Mark present, absent, late, or excused students with 1-click bulk
                      save.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -3 }}>
                <Card
                  className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  onClick={() => onNavigate("enter-grades")}
                >
                  <CardHeader>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 w-fit">
                      <Award className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base mt-2">
                      Submit Assessment Grades
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Enter exam, midterm, and quiz scores for your assigned subjects.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -3 }}>
                <Card
                  className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  onClick={() => onNavigate("my-assignments")}
                >
                  <CardHeader>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 w-fit">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base mt-2">
                      Assigned Class Sections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Review active schedules, subjects, and student rosters.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {isStudent && (
            <>
              <motion.div whileHover={{ y: -3 }}>
                <Card
                  className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  onClick={() => onNavigate("my-report-card")}
                >
                  <CardHeader>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 w-fit">
                      <Award className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base mt-2">
                      My Academic Report Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      View your term GPA, subject grades, and letter grade performance.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -3 }}>
                <Card
                  className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  onClick={() => onNavigate("my-attendance")}
                >
                  <CardHeader>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 w-fit">
                      <Clock className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base mt-2">Attendance Record</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Check your presence percentage and log of excused/absent dates.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -3 }}>
                <Card
                  className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  onClick={() => onNavigate("my-grades")}
                >
                  <CardHeader>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 w-fit">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base mt-2">
                      Recent Assessment Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Review individual test scores, weights, and teacher remarks.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {isParent && (
            <>
              <motion.div whileHover={{ y: -3 }}>
                <Card
                  className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  onClick={() => onNavigate("children")}
                >
                  <CardHeader>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 w-fit">
                      <Users className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base mt-2">Children Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      View linked student profiles and classroom assignments.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -3 }}>
                <Card
                  className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  onClick={() => onNavigate("child-attendance")}
                >
                  <CardHeader>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 w-fit">
                      <Clock className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base mt-2">Attendance Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Stay updated on daily attendance records and absence counts.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -3 }}>
                <Card
                  className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                  onClick={() => onNavigate("child-grades")}
                >
                  <CardHeader>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 w-fit">
                      <Award className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base mt-2">
                      Academic Report Cards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      View cumulative GPA and term subject assessments for your children.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
