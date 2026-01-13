interface AdminPageTitleProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminPageTitle({ title, description, action }: AdminPageTitleProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-blue-500">Admin</p>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export default AdminPageTitle;
