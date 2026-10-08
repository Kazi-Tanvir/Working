import React from "react";
import CategorySkeleton from "@/components/common/CategorySkeleton";

export default function Loading() {
  return (
    <CategorySkeleton
      cardAspect="portrait"
      accentColorClass="border-cyber-yellow/40 hover:border-cyber-yellow"
      titlePlaceholder="LOADING MOVIES LOGS..."
    />
  );
}
