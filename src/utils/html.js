/**
 * Helpers for reading the server-rendered HTML that Demo Web Shop returns.
 *
 * The site is nopCommerce 2.x: there is no JSON REST API for pages like the cart, addresses or
 * orders, so the API clients read the facts they need straight from the HTML response.
 * Every helper returns null / [] when the value is missing instead of throwing; the caller decides.
 */

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

export function decodeEntities(text) {
  return text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity]);
}

/** Strip tags and collapse whitespace: '<span> 10.00 </span>' -> '10.00'. */
export function cleanText(html) {
  if (html === null || html === undefined) {
    return null;
  }
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** First capture group of `pattern` in `html`, cleaned. */
export function matchFirst(html, pattern) {
  const match = html.match(pattern);
  if (!match) {
    return null;
  }
  return cleanText(match[1]);
}

/** Every first-capture-group match of a global `pattern`, raw (not cleaned). */
export function matchAll(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

/** The hidden anti-forgery token rendered into a form (only /register uses one). */
export function extractAntiForgeryToken(html) {
  return matchFirst(html, /name="__RequestVerificationToken" type="hidden" value="([^"]+)"/);
}

/** Validation messages: summary list items plus per-field errors. */
export function extractValidationErrors(html) {
  const summary = matchAll(html, /<div class="validation-summary-errors">([\s\S]*?)<\/div>/g);
  const summaryItems = summary.flatMap((block) => matchAll(block, /<(?:li|span)>([^<]+)<\/(?:li|span)>/g));
  const fieldErrors = matchAll(html, /<span class="field-validation-error"[^>]*>(?:<span[^>]*>)?([^<]+)</g);
  return [...summaryItems, ...fieldErrors].map(cleanText).filter(Boolean);
}

export function toNumber(text) {
  if (text === null || text === undefined) {
    return null;
  }
  return Number(String(text).replace(/[^0-9.-]/g, ''));
}
