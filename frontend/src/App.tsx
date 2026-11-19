import React, { useState } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { LoginView } from "@/views/auth/LoginView";
import { RegisterView } from "@/views/auth/RegisterView";
import { DemoAccountsCard } from "@/views/auth/DemoAccountsCard";
import { HomeOverview } from "@/views/dashboard/HomeOverview";
import { AcademicYearsView } from "@/views/academics/AcademicYearsView";
import { GradeLevelsView } from "@/views/academics/GradeLevelsView";
import { SectionsView } from "@/views/academics/SectionsView";
import { SubjectsView } from "@/views/academics/SubjectsView";
import { AssignmentsView } from "@/views/academics/AssignmentsView";
import { StudentsView } from "@/views/enrollment/StudentsView";
import { CreateStudentModal } from "@/views/enrollment/CreateStudentModal";
import { StudentDetailModal } from "@/views/enrollment/StudentDetailModal";
import { TeachersView } from "@/views/enrollment/TeachersView";
import { ParentsView } from "@/views/enrollment/ParentsView";
import { GuardiansView } from "@/views/enrollment/GuardiansView";
import { AssessmentCategoriesView } from "@/views/grading/AssessmentCategoriesView";
import { EnterGradesView } from "@/views/grading/EnterGradesView";
import { ReportCardView } from "@/views/grading/ReportCardView";
import { TakeAttendanceView } from "@/views/attendance/TakeAttendanceView";
import { MyAttendanceView } from "@/views/attendance/MyAttendanceView";
import { ChildrenView } from "@/views/parent/ChildrenView";
import { MyAssignmentsView } from "@/views/teacher/MyAssignmentsView";
import { PageTransition } from "@/components/ui/motion";
import type { StudentProfile } from "@/types";
import { GraduationCap } from "lucide-react";
import { AnimatePresence } from "framer-motion";

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Sub-view selected student for parent or director inspection
  const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);

  // Selected child for parent view
  const [parentTargetChild, setParentTargetChild] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white animate-pulse">
            <GraduationCap className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Loading Student Management System...
          </p>
        </div>
      </div>
    );
  }

  // Auth Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/70 dark:bg-slate-950">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <GraduationCap className="w-9 h-9" />
            </div>
          </div>
          <h2 className="mt-5 text-center text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Student Management System
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Modular Monolith Academic Platform
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md space-y-4">
          <div className="rounded-3xl border border-gray-200/80 bg-white/90 p-6 sm:p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900/90 backdrop-blur-xl">
            <AnimatePresence mode="wait">
              {authMode === "login" ? (
                <LoginView
                  key="login"
                  onSwitchToRegister={() => setAuthMode("register")}
                  onFillDemo={() => {}}
                />
              ) : (
                <RegisterView
                  key="register"
                  onSwitchToLogin={() => setAuthMode("login")}
                />
              )}
            </AnimatePresence>
          </div>

          <DemoAccountsCard />
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <HomeOverview onNavigate={setActiveTab} />;

      // Academics
      case "academic-years":
        return <AcademicYearsView />;
      case "grade-levels":
        return <GradeLevelsView />;
      case "sections":
        return <SectionsView />;
      case "subjects":
        return <SubjectsView />;
      case "assignments":
        return <AssignmentsView />;

      // Enrollment
      case "students":
        return (
          <StudentsView
            onSelectStudent={(student) => {
              setViewingStudent(student);
              setIsDetailOpen(true);
            }}
            onOpenCreate={() => setIsCreateStudentOpen(true)}
          />
        );
      case "teachers":
        return <TeachersView />;
      case "parents":
        return <ParentsView />;
      case "guardians":
        return <GuardiansView />;

      // Attendance
      case "take-attendance":
        return <TakeAttendanceView />;
      case "my-attendance":
        return <MyAttendanceView />;
      case "child-attendance":
        return (
          <MyAttendanceView
            customStudentId={parentTargetChild?.id}
            studentName={parentTargetChild?.name}
          />
        );

      // Grading
      case "categories":
        return <AssessmentCategoriesView />;
      case "enter-grades":
        return <EnterGradesView />;
      case "report-cards":
      case "my-report-card":
        return <ReportCardView />;
      case "my-grades":
        return <ReportCardView />;
      case "child-grades":
        return <ReportCardView customStudentId={parentTargetChild?.id} />;

      // Teacher
      case "my-assignments":
        return <MyAssignmentsView onNavigate={setActiveTab} />;

      // Parent
      case "children":
        return (
          <ChildrenView
            onSelectChild={(id, name, dest) => {
              setParentTargetChild({ id, name });
              setActiveTab(dest === "attendance" ? "child-attendance" : "child-grades");
            }}
          />
        );

      default:
        return <HomeOverview onNavigate={setActiveTab} />;
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      sidebarContent={<SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    >
      <PageTransition key={activeTab}>{renderActiveView()}</PageTransition>

      <StudentDetailModal
        student={viewingStudent}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      <CreateStudentModal
        isOpen={isCreateStudentOpen}
        onClose={() => setIsCreateStudentOpen(false)}
        onSuccess={() => {
          // Re-render students
          setActiveTab("dashboard");
          setTimeout(() => setActiveTab("students"), 50);
        }}
      />
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
