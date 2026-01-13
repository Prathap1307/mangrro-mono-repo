interface AdminTableProps<T extends object> {
  columns: { key: keyof T | string; label: string; className?: string }[];
  data: T[];
  renderCell?: (item: T, key: string) => React.ReactNode;
}

export function AdminTable<T extends object>({ columns, data, renderCell }: AdminTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
      <div className="w-full overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 ${col.className ?? ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70">
                {columns.map((col) => {
                  const fallbackValue = item[col.key as keyof T];
                  return (
                    <td key={String(col.key)} className={`px-4 py-3 text-slate-800 ${col.className ?? ""}`}>
                      {renderCell ? renderCell(item, String(col.key)) : (fallbackValue as React.ReactNode)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminTable;
