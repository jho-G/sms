import React from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Building2,
  BookOpen,
  Briefcase,
  Users,
  UserCheck,
  HeartHandshake,
  ShieldCheck,
  Tags,
  FileSpreadsheet,
  ClipboardCheck,
  Award,
  Clock,
  GraduationCap,
} from "lucide-react";

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export function SidebarNav({ activeTab, setActiveTab }: SidebarNavProps) {
  const { isDirector, isTeacher, isStudent, isParent } = useAuth();

  const directorAcademics: NavItem[] = [
    { id: "academic-years", label: "Academic Years", icon: Calendar },
    { id: "grade-levels", label: "Grade Levels", icon: Layers },
    { id: "sections", label: "Sections", icon: Building2 },
    { id: "subjects", label: "Subjects", icon: BookOpen },
    { id: "assignments", label: "Assignments", icon: Briefcase },
  ];

  const directorEnrollment: NavItem[] = [
    { id: "students", label: "Students", icon: Users },
    { id: "teachers", label: "Teachers", icon: UserCheck },
    { id: "parents", label: "Parents", icon: HeartHandshake },
    { id: "guardians", label: "Guardians", icon: ShieldCheck },
  ];

  const directorGrading: NavItem[] = [
    { id: "categories", label: "Categories", icon: Tags },
    { id: "report-cards", label: "Report Cards", icon: FileSpreadsheet },
  ];

  const teacherNav: NavItem[] = [
    { id: "my-assignments", label: "My Assignments", icon: Briefcase },
    { id: "take-attendance", label: "Take Attendance", icon: ClipboardCheck },
    { id: "enter-grades", label: "Enter Grades", icon: Award },
  ];

  const studentNav: NavItem[] = [
    { id: "my-attendance", label: "My Attendance", icon: Clock },
    { id: "my-grades", label: "My Grades", icon: Award },
    { id: "my-report-card", label: "Report Card", icon: GraduationCap },
  ];

  const parentNav: NavItem[] = [
    { id: "children", label: "My Children", icon: Users },
    { id: "child-attendance", label: "Attendance", icon: Clock },
    { id: "child-grades", label: "Grades & Reports", icon: GraduationCap },
  ];

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      <div className="px-3 mb-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
          {title}
        </h4>
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-all duration-150 text-left select-none",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 dark:bg-indigo-600"
                  : "text-muted-foreground hover:bg-gray-100 hover:text-foreground dark:hover:bg-gray-800/60"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-white" : "text-muted-foreground"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="py-2">
      <div className="mb-6 space-y-1">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-150 text-left",
            activeTab === "dashboard"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 dark:bg-indigo-600"
              : "text-muted-foreground hover:bg-gray-100 hover:text-foreground dark:hover:bg-gray-800/60"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </button>
      </div>

      {isDirector && (
        <>
          {renderNavGroup("Academics", directorAcademics)}
          {renderNavGroup("Enrollment", directorEnrollment)}
          {renderNavGroup("Grading & Reports", directorGrading)}
        </>
      )}

      {isTeacher && renderNavGroup("Teaching", teacherNav)}

      {isStudent && renderNavGroup("My Info", studentNav)}

      {isParent && renderNavGroup("Family Portal", parentNav)}
    </div>
  );
}
