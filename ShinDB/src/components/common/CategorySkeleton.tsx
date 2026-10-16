import React from "react";

interface CategorySkeletonProps {
  cardAspect?: "portrait" | "landscape";
  accentColorClass?: string;
  titlePlaceholder?: string;
}

export default function CategorySkeleton({
  cardAspect = "portrait",
  accentColorClass = "border-gray-700",
  titlePlaceholder = "LOADING SYSTEM LOGS..."
}: CategorySkeletonProps) {
  // Skeletons count
  const skeletonCount = 12;
  const aspectClass = cardAspect === "landscape" ? "aspect-video md:aspect-[16/10]" : "aspect-[2/3]";

  return (
    <div className="w-full flex flex-col gap-6 font-mono select-none animate-pulse">
      
      {/* Sleek Obsidian Control Ribbon Skeleton */}
      <section className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-white/10 text-xs text-gray-500">
        
        {/* Left Side: Mock Title */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-800" />
          <div className="h-4 w-32 bg-gray-800 border border-gray-700" />
          <div className="h-3 w-16 bg-gray-900 border border-gray-800 ml-2" />
        </div>

        {/* Right Side: Mock Command Buttons */}
        <div className="flex items-center gap-3.5">
          <div className="h-3 w-10 bg-gray-800" />
          <div className="h-3 w-12 bg-gray-800" />
          <div className="h-3 w-16 bg-gray-800 hidden md:block" />
          <div className="h-3 w-12 bg-gray-800" />
          <div className="h-3 w-8 bg-gray-800" />
        </div>

      </section>

      {/* Mock Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-dashed border-white/10 pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-7 w-16 bg-gray-900 border border-gray-800"
          />
        ))}
      </div>

      {/* Grid Layout matching normal categories */}
      <div className={`grid ${cardAspect === "landscape" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"} gap-x-4 gap-y-6`}>
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <div
            key={idx}
            className={`w-full flex flex-col bg-[#09090b] border-2 ${accentColorClass} shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] p-2 gap-2`}
          >
            {/* Aspect image placeholder */}
            <div className={`w-full ${aspectClass} bg-gray-900 border border-gray-800`} />
            
            {/* Texts placeholder */}
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="h-3.5 w-3/4 bg-gray-800 border border-gray-700" />
              <div className="h-2.5 w-1/2 bg-gray-900 border border-gray-850" />
            </div>

            {/* Bottom button controls placeholder */}
            <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
              <div className="h-5 w-12 bg-gray-900 border border-gray-800" />
              <div className="flex gap-1">
                <div className="h-5 w-5 bg-gray-900 border border-gray-800" />
                <div className="h-5 w-5 bg-gray-900 border border-gray-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
