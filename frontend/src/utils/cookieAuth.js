/**
 * cookieAuth.js
 * Handles persistent barcode cookie for "Remember Me" login flow.
 * Cookie is stored for COOKIE_DAYS days and cleared on logout.
 */

const COOKIE_NAME = 'portal_saved_barcode';
const COOKIE_DAYS = 30;

/**
 * Save the barcode in a persistent cookie.
 * @param {string} barcode
 */
export function saveBarcodeToookie(barcode) {
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_DAYS);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(barcode)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Read the saved barcode from the cookie.
 * @returns {string|null}
 */
export function getSavedBarcode() {
  const prefix = `${COOKIE_NAME}=`;
  const cookies = document.cookie.split(';');
  for (let c of cookies) {
    const trimmed = c.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

/**
 * Clear the saved barcode cookie (on logout).
 */
export function clearSavedBarcode() {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}
