import type { ReactNode } from "react";

interface DashboardKpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  footer?: ReactNode;
}

export default function DashboardKpiCard({ label, value, icon, footer }: DashboardKpiCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
        {icon}
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">{value}</h4>
        {footer && <div className="mt-2">{footer}</div>}
      </div>
    </div>
  );
}
