/**
 * Format a price with two decimal places and comma separators.
 * 
 * @param price — the number to format
 * @returns formatted string, e.g. "10,000,000.00"
 */
export function formatPrice(price?: number | null): string {
    if (price == null || isNaN(price)) {
        return '0.00';
    }
    // Force two decimals
    const fixed = price.toFixed(2);
    // Insert commas every three digits to the left of the decimal
    return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}
export function formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}