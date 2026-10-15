import React from "react";
import { getMediaByType } from "@/lib/media";
import { getSessionUser } from "@/lib/auth";
import MediaCollectionView from "@/components/common/MediaCollectionView";

export const dynamic = "force-dynamic";

export default async function AnimePage() {
  const sessionUser = await getSessionUser();
  const initialItems = await getMediaByType("anime", sessionUser?.id);

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <MediaCollectionView type="anime" initialItems={initialItems} />
    </div>
  );
}
