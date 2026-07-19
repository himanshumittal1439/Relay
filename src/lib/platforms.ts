export const PLATFORM_OPTIONS = [
  { value: "x", label: "X (Twitter)", maxLength: 280 },
  { value: "threads", label: "Threads", maxLength: 500 },
  { value: "bluesky", label: "Bluesky", maxLength: 300 },
  { value: "linkedin", label: "LinkedIn", maxLength: 3000 },
  { value: "facebook", label: "Facebook", maxLength: 63206 },
  { value: "instagram", label: "Instagram", maxLength: 2200 },
  { value: "reddit", label: "Reddit", maxLength: 40000 },
] as const;

export type PlatformValue = (typeof PLATFORM_OPTIONS)[number]["value"];

export const PLATFORM_MAP = Object.fromEntries(
  PLATFORM_OPTIONS.map((p) => [p.value, p])
) as Record<PlatformValue, (typeof PLATFORM_OPTIONS)[number]>;

export function validatePostForPlatforms(
  content: string,
  platforms: PlatformValue[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!content.trim()) {
    errors.push("Post content is required.");
  }
  if (platforms.length === 0) {
    errors.push("Select at least one platform.");
  }
  for (const platform of platforms) {
    const limit = PLATFORM_MAP[platform]?.maxLength;
    if (limit && content.length > limit) {
      errors.push(
        `${PLATFORM_MAP[platform].label} allows a maximum of ${limit} characters (current: ${content.length}).`
      );
    }
  }
  return { valid: errors.length === 0, errors };
}
