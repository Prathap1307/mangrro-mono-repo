interface AdminBadgeProps {
  label: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

const toneStyles: Record<Required<AdminBadgeProps>["tone"], string> = {
  success: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  warning: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  danger: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  info: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

export function AdminBadge({ label, tone = "neutral", className = "" }: AdminBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${toneStyles[tone]} ${className}`}
    >
      {label}
    </span>
  );
}

export default AdminBadge;
