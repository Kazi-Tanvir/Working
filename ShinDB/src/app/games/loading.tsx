import CategorySkeleton from "@/components/common/CategorySkeleton";

export default function GamesLoading() {
  return (
    <CategorySkeleton
      cardAspect="landscape"
      accentColorClass="border-cyber-cyan"
      titlePlaceholder="LOADING GAMES DATABASE..."
    />
  );
}
