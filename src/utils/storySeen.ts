// Utility for marking stories as seen and checking seen status using localStorage
export function markStoryAsSeen(storyId: string) {
  const seen = JSON.parse(localStorage.getItem("seenStories") || "[]");
  if (!seen.includes(storyId)) {
    seen.push(storyId);
    localStorage.setItem("seenStories", JSON.stringify(seen));
  }
}

export function isStorySeen(storyId: string): boolean {
  const seen = JSON.parse(localStorage.getItem("seenStories") || "[]");
  return seen.includes(storyId);
}
