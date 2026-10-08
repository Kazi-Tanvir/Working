import React from "react";
import CategorySkeleton from "@/components/common/CategorySkeleton";

export default function Loading() {
  return (
    <CategorySkeleton
      cardAspect="portrait"
      accentColorClass="border-cyber-purple/40 hover:border-cyber-purple"
      titlePlaceholder="LOADING ANIME LOGS..."
    />
  );
}
