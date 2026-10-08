import React from "react";
import CategorySkeleton from "@/components/common/CategorySkeleton";

export default function Loading() {
  return (
    <CategorySkeleton
      cardAspect="portrait"
      accentColorClass="border-cyber-orange/40 hover:border-cyber-orange"
      titlePlaceholder="LOADING MANGA LOGS..."
    />
  );
}
