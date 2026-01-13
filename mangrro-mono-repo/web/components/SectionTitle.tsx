import { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}

export default function SectionTitle({ eyebrow, title, action }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div>
        {eyebrow && <p className="text-sm uppercase tracking-[0.2em] text-purple-500 font-semibold">{eyebrow}</p>}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
