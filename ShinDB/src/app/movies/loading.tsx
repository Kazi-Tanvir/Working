import CategorySkeleton from "@/components/common/CategorySkeleton";

export default function MoviesLoading() {
  return (
    <CategorySkeleton
      cardAspect="portrait"
      accentColorClass="border-cyber-yellow"
      titlePlaceholder="LOADING MOVIES DATABASE..."
    />
  );
}
