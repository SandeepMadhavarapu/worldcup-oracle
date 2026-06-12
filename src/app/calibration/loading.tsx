import { Card, Section, Shell, Skeleton } from "@/components/ui";

// Server-render fallback while the calibration page resolves real results from
// the live feed (cold cache can wait on the provider). Mirrors the real layout
// so there is no shift when content arrives.
export default function CalibrationLoading() {
  return (
    <Shell>
      <span className="sr-only" role="status">
        Loading calibration report…
      </span>

      <Section className="bg-[#0b1712]">
        <div className="max-w-3xl">
          <Skeleton className="h-6 w-56" rounded="rounded-full" />
          <Skeleton className="mt-5 h-12 w-72" />
          <Skeleton className="mt-4 h-20 w-full max-w-2xl" />
        </div>
      </Section>

      <Section className="pb-0">
        <Skeleton className="h-24 w-full" rounded="rounded-xl" />
      </Section>

      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-4 h-9 w-20" />
              <Skeleton className="mt-3 h-10 w-full" />
            </Card>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-5 h-[420px] w-full" rounded="rounded-lg" />
          </Card>
          <Card className="p-5">
            <Skeleton className="h-5 w-40" />
            <div className="mt-5 space-y-3">
              {[0, 1, 2, 3, 4].map((index) => (
                <Skeleton key={index} className="h-9 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </Section>
    </Shell>
  );
}
