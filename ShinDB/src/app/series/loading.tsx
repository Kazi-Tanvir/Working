import CategorySkeleton from "@/components/common/CategorySkeleton";

export default function SeriesLoading() {
  return (
    <CategorySkeleton
      cardAspect="portrait"
      accentColorClass="border-cyber-orange"
      titlePlaceholder="LOADING SERIES DATABASE..."
    />
  );
}
