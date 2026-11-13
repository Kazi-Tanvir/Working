import CategorySkeleton from "@/components/common/CategorySkeleton";

export default function AnimeLoading() {
  return (
    <CategorySkeleton
      cardAspect="portrait"
      accentColorClass="border-cyber-purple"
      titlePlaceholder="LOADING ANIME DATABASE..."
    />
  );
}
