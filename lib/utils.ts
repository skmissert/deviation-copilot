import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function daysBetween(start: string, end: string | null): number {
  if (!end) return Math.floor((Date.now() - new Date(start).getTime()) / 86400000);
  return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function isOverdue(dueDateStr: string, status: string): boolean {
  if (status === "Completed") return false;
  return new Date(dueDateStr) < new Date();
}
