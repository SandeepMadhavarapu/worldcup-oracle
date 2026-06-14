import type { ReactNode } from "react";
import { AlertCircle, Database } from "lucide-react";
import { clsx } from "clsx";

import { Card } from "@/components/ui";
import type { SourceKind } from "@/lib/data-center/summary";

const sourceTone: Record<SourceKind, string> = {
  live: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  sample: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
  offline: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  demo: "border-violet-300/25 bg-violet-300/10 text-violet-200",
  placeholder: "border-zinc-300/20 bg-zinc-300/10 text-zinc-200",
  illustrative: "border-amber-300/25 bg-amber-300/10 text-amber-200",
};

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function SourceBadge({
  kind,
  children,
}: {
  kind: SourceKind;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded border px-2 py-1 text-xs font-semibold",
        sourceTone[kind],
      )}
    >
      {children}
    </span>
  );
}

export function DatasetModeBadge({
  mode,
  kind,
}: {
  mode: string;
  kind: SourceKind;
}) {
  return <SourceBadge kind={kind}>{mode}</SourceBadge>;
}

export function EmptyDataState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-6 text-center">
      <div className="max-w-md">
        <AlertCircle className="mx-auto size-8 text-amber-200" aria-hidden="true" />
        <p className="mt-3 text-base font-semibold text-white">{title}</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{detail}</p>
      </div>
    </div>
  );
}

export function DataStatusCard({
  label,
  value,
  detail,
  kind,
}: {
  label: string;
  value: string;
  detail: string;
  kind: SourceKind;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
        </div>
        <span
          className={clsx(
            "grid size-9 shrink-0 place-items-center rounded-md border",
            sourceTone[kind],
          )}
        >
          <Database className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{detail}</p>
    </Card>
  );
}

export function DataTable<T>({
  title,
  description,
  columns,
  rows,
  getRowKey,
  emptyState,
  minWidth = "760px",
}: {
  title: string;
  description?: string;
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  emptyState?: ReactNode;
  minWidth?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-white/10 p-5">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <div className="p-5">{emptyState}</div>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-sm"
            style={{ minWidth }}
          >
            <thead className="bg-white/[0.025] text-xs uppercase tracking-[0.12em] text-zinc-400">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={clsx("px-5 py-3 font-semibold", column.className)}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className="border-t border-white/5 text-zinc-300"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={clsx("px-5 py-4 align-top", column.className)}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
