import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/badge";
import { Shield, BookOpen, GraduationCap, HeartHandshake, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function DemoAccountsCard() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const [loadingRole, setLoadingRole] = React.useState<string | null>(null);

  const demoAccounts = [
    {
      role: "DIRECTOR",
      title: "School Director",
      description: "Full administrative access",
      email: "director@sms.com",
      password: "director123",
      icon: Shield,
      badge: "purple",
    },
    {
      role: "TEACHER",
      title: "Teacher",
      description: "Attendance & grades entry",
      email: "teacher@sms.com",
      password: "teacher123",
      icon: BookOpen,
      badge: "info",
    },
    {
      role: "STUDENT",
      title: "Student",
      description: "Report card & attendance",
      email: "student@sms.com",
      password: "student123",
      icon: GraduationCap,
      badge: "success",
    },
    {
      role: "PARENT",
      title: "Parent / Guardian",
      description: "Child's academic records",
      email: "parent@sms.com",
      password: "parent123",
      icon: HeartHandshake,
      badge: "warning",
    },
  ];

  const handleQuickLogin = async (acc: typeof demoAccounts[0]) => {
    setLoadingRole(acc.role);
    const res = await login({ email: acc.email, password: acc.password });
    setLoadingRole(null);

    if (res.success) {
      success(`Signed in as ${acc.title}`);
    } else {
      error(res.message || `Failed to sign in as ${acc.title}`);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            One-Click Demo Accounts
          </h3>
          <p className="text-xs text-muted-foreground">
            Instantly experience any role without typing passwords
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {demoAccounts.map((acc) => {
          const Icon = acc.icon;
          const isLoading = loadingRole === acc.role;

          return (
            <motion.button
              key={acc.role}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickLogin(acc)}
              disabled={!!loadingRole}
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-200/70 bg-white hover:border-indigo-300 hover:shadow-md transition-all text-left dark:border-gray-800 dark:bg-gray-800/60 dark:hover:border-indigo-500/50 cursor-pointer disabled:opacity-50"
            >
              <div className="p-2 rounded-lg bg-gray-50 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300 shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold truncate text-gray-900 dark:text-gray-100">
                    {acc.title}
                  </span>
                  <Badge variant={acc.badge as any} className="text-[10px] px-1.5 py-0">
                    {acc.role}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {acc.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
