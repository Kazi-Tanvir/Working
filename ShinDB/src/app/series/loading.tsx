import React from "react";
import CategorySkeleton from "@/components/common/CategorySkeleton";

export default function Loading() {
  return (
    <CategorySkeleton
      cardAspect="portrait"
      accentColorClass="border-cyber-cyan/40 hover:border-cyber-cyan"
      titlePlaceholder="LOADING SERIES LOGS..."
    />
  );
}
