interface AdminCardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: string;
}

export function AdminCard({ title, action, children, className = "", description }: AdminCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-lg shadow-slate-200/60 backdrop-blur ${className}`}>
      {(title || action || description) && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className="space-y-3 text-slate-800">{children}</div>
    </div>
  );
}

export default AdminCard;
