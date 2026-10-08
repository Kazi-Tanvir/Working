import React from "react";
import CategorySkeleton from "@/components/common/CategorySkeleton";

export default function Loading() {
  return (
    <CategorySkeleton
      cardAspect="landscape"
      accentColorClass="border-cyber-green/40 hover:border-cyber-green"
      titlePlaceholder="LOADING GAMES LOGS..."
    />
  );
}
