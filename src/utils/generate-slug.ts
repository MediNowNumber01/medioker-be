import slugify from "slugify";

/**
 * Generates a URL-friendly slug from a given string.
 * @param text The input string to be slugified.
 * @returns The generated slug.
 */
export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}
