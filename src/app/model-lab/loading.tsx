import { Card, Section, Shell, Skeleton } from "@/components/ui";

export default function ModelLabLoading() {
  return (
    <Shell>
      <span className="sr-only" role="status">
        Loading model lab…
      </span>

      <Section className="bg-[#0b1712]">
        <Skeleton className="h-6 w-44" rounded="rounded-full" />
        <Skeleton className="mt-5 h-12 w-72" />
        <Skeleton className="mt-4 h-16 w-full max-w-2xl" />
      </Section>

      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-6 w-6" rounded="rounded-md" />
              <Skeleton className="mt-4 h-5 w-40" />
              <Skeleton className="mt-3 h-16 w-full" />
            </Card>
          ))}
        </div>
      </Section>
    </Shell>
  );
}
