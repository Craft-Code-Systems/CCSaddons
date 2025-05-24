/**
 * Returns the current date and time as a string in the format DD-MM-YYYY HH:MM:SS.
 * If the function fails to get the current date and time, it returns null.
 * @returns {string | null} The current date and time.
 */
export function getDateAndTime() {
    const date = new Date();
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    try {
        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    }
    catch {
        return null;
    }
}
