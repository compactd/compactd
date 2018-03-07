import { mainStory } from "storyboard";

/**
 * Removes redundant text from a string
 * Useful for converting '<artist> - <album>' format.
 * Also removes capped text between parenthesis or brackets such as [HQ] or (OFFICIAL VIDEO)
 * @param textToTransform the text to remove the queries from
 * @param queries string to remove from the textToTransform
 */
export function removeRedundantText (textToTransform: string, ...queries: string[]) {
  const query = queries
    .map((str) => str.replace(/-/g, ' '))
    // Escape strings
    .map(escapeRegExp)
    // We want to ignore accents
    .map((str) => str.replace(/e/gi, '[eéèê]').replace(/a/gi, '[aáàâ]'))
    .join('|');

  const pattern = `^(\\s*((${query})(\\s*(-|;|:)\\s+))?)*`;

  mainStory.debug('utils', `Remove redundant text from '${textToTransform}' using /${pattern}/`);

  const regex = new RegExp(pattern, 'i');
  
  return textToTransform.replace(regex, '')
    // Remove capped text inside parenthesis at the end of the name
    // Such as [OFFICIAL CLIP] or (HQ)
    .replace(/(\s*\[([A-Z\u00C0-\u00DC]\s?)+\])|(\s*\(([A-Z\u00C0-\u00DC]\s?)+\))\s*$/i, '');
}

export function escapeRegExp(str: string) {
  return str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
}