export const DEFAULT_COVER_IMAGES: Record<string, string> = {
  anime: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
  manga: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
  game: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
  movie: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
  series: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
};

export function getCoverImage(coverImage?: string | null, type: string = "anime"): string {
  if (coverImage && typeof coverImage === "string" && coverImage.trim() !== "") {
    return coverImage.trim();
  }
  return DEFAULT_COVER_IMAGES[type] || DEFAULT_COVER_IMAGES.anime;
}
