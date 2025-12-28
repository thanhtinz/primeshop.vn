import { Skeleton } from "./skeleton";

// Product Card Skeleton
export const ProductCardSkeleton = () => (
  <div className="rounded-xl border bg-card overflow-hidden">
    <Skeleton className="aspect-square w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  </div>
);

// Product Grid Skeleton
export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => (
  <tr className="border-b">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-4">
        <Skeleton className="h-5 w-full" />
      </td>
    ))}
  </tr>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) => (
  <div className="rounded-lg border overflow-hidden">
    <div className="bg-muted/50 p-4 border-b">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
    </div>
    <table className="w-full">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

// Hero Banner Skeleton
export const HeroBannerSkeleton = () => (
  <div className="relative rounded-2xl overflow-hidden">
    <Skeleton className="aspect-[21/9] w-full" />
    <div className="absolute bottom-8 left-8 space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  </div>
);

// Category Card Skeleton
export const CategoryCardSkeleton = () => (
  <div className="rounded-xl border bg-card overflow-hidden">
    <Skeleton className="aspect-video w-full" />
    <div className="p-4 space-y-2">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
    </div>
  </div>
);

// Profile Header Skeleton
export const ProfileHeaderSkeleton = () => (
  <div className="rounded-xl border bg-card overflow-hidden">
    <Skeleton className="h-32 w-full" />
    <div className="p-6 -mt-12 flex items-end gap-4">
      <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
      <div className="space-y-2 pb-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
    </div>
  </div>
);

// News Card Skeleton
export const NewsCardSkeleton = () => (
  <div className="rounded-xl border bg-card overflow-hidden">
    <Skeleton className="aspect-video w-full" />
    <div className="p-4 space-y-2">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);

// Stats Card Skeleton
export const StatsCardSkeleton = () => (
  <div className="rounded-xl border bg-card p-6 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded" />
    </div>
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-3 w-20" />
  </div>
);

// Page Content Skeleton
export const PageContentSkeleton = () => (
  <div className="space-y-6 p-4 sm:p-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
    <div className="flex gap-4">
      <Skeleton className="h-10 w-64 rounded-lg" />
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
    <TableSkeleton rows={8} columns={6} />
  </div>
);
