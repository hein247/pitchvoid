import { Skeleton } from '@/components/ui/skeleton';

interface GenerationSkeletonProps {
  format: 'one-pager' | 'script';
}

const GenerationSkeleton = ({ format }: GenerationSkeletonProps) => {
  if (format === 'script') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/5 bg-accent/10" />
          <Skeleton className="h-4 w-1/4 bg-accent/10" />
        </div>

        {/* Script sections */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl border border-border/50 bg-card/30 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24 bg-accent/10" />
              <Skeleton className="h-4 w-16 bg-accent/10" />
            </div>
            <Skeleton className="h-4 w-full bg-accent/10" />
            <Skeleton className="h-4 w-4/5 bg-accent/10" />
            <Skeleton className="h-4 w-2/3 bg-accent/10" />
            <div className="pt-2 border-t border-border/30">
              <Skeleton className="h-3 w-3/5 bg-accent/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // One-pager skeleton
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Headline */}
      <div className="text-center space-y-3 py-6">
        <Skeleton className="h-10 w-4/5 mx-auto bg-accent/10" />
        <Skeleton className="h-5 w-3/5 mx-auto bg-accent/10" />
      </div>

      {/* Sections */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-5 rounded-2xl border border-border/50 bg-card/30 space-y-3">
          <Skeleton className="h-6 w-1/3 bg-accent/10" />
          <Skeleton className="h-4 w-full bg-accent/10" />
          <div className="space-y-2 pl-4">
            <Skeleton className="h-3 w-4/5 bg-accent/10" />
            <Skeleton className="h-3 w-3/5 bg-accent/10" />
            <Skeleton className="h-3 w-2/3 bg-accent/10" />
          </div>
        </div>
      ))}

      {/* Contact */}
      <div className="flex justify-center gap-6 pt-4">
        <Skeleton className="h-4 w-32 bg-accent/10" />
        <Skeleton className="h-4 w-28 bg-accent/10" />
      </div>
    </div>
  );
};

export default GenerationSkeleton;
