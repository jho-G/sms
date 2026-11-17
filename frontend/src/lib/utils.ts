import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely with clsx and twMerge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date string to localized readable format
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Format score to 2 decimal places or integer if whole
 */
export function formatScore(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return "—";
  const parsed = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(parsed)) return "—";
  return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(1);
}

/**
 * Get color styling for Attendance Status
 */
export function getAttendanceStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case "PRESENT":
      return {
        label: "Present",
        bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        dot: "bg-emerald-500",
      };
    case "ABSENT":
      return {
        label: "Absent",
        bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800",
        dot: "bg-rose-500",
      };
    case "LATE":
      return {
        label: "Late",
        bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        dot: "bg-amber-500",
      };
    case "EXCUSED":
      return {
        label: "Excused",
        bg: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200 dark:border-sky-800",
        dot: "bg-sky-500",
      };
    default:
      return {
        label: status,
        bg: "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
        dot: "bg-gray-400",
      };
  }
}
