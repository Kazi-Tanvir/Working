import CategorySkeleton from "@/components/common/CategorySkeleton";

export default function MangaLoading() {
  return (
    <CategorySkeleton
      cardAspect="portrait"
      accentColorClass="border-cyber-green"
      titlePlaceholder="LOADING MANGA DATABASE..."
    />
  );
}
