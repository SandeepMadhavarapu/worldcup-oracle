import { Card, Section, Shell, Skeleton } from "@/components/ui";

export default function DataCenterLoading() {
  return (
    <Shell>
      <span className="sr-only" role="status">
        Loading data center…
      </span>

      <Section className="bg-[#0b1712]">
        <Skeleton className="h-6 w-48" rounded="rounded-full" />
        <Skeleton className="mt-5 h-12 w-96" />
      </Section>

      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-4 h-32 w-full" rounded="rounded-lg" />
            </Card>
          ))}
        </div>
      </Section>
    </Shell>
  );
}
