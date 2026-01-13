interface AdminFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  children?: React.ReactNode;
}

export function AdminFormField({ label, hint, children, className = "", ...props }: AdminFormFieldProps) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-700">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      {children ?? (
        <input
          className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${className}`}
          {...props}
        />
      )}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export default AdminFormField;
