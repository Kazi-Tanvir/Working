import React from "react";
import { getMediaByType } from "@/lib/media";
import MediaCollectionView from "@/components/common/MediaCollectionView";

export const dynamic = "force-dynamic";

export default async function MoviesPage() {
  const initialItems = await getMediaByType("movie");

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <MediaCollectionView type="movie" initialItems={initialItems} />
    </div>
  );
}
