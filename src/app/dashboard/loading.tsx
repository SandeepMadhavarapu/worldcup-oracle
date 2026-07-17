import { Card, Section, Shell, Skeleton } from "@/components/ui";

// Server-render fallback while the dashboard's initial baseline simulation and
// leaderboard resolve. Mirrors the tab layout to avoid shift.
export default function DashboardLoading() {
  return (
    <Shell>
      <span className="sr-only" role="status">
        Loading dashboard…
      </span>

      <Section className="bg-[#0b1712]">
        <Skeleton className="h-6 w-44" rounded="rounded-full" />
        <Skeleton className="mt-5 h-12 w-80" />
        <div className="mt-6 flex gap-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-9 w-28" rounded="rounded-md" />
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-5 lg:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-5 h-48 w-full" rounded="rounded-lg" />
            </Card>
          ))}
        </div>
      </Section>
    </Shell>
  );
}
