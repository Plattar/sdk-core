export class Util {
    public static expoBackoffTime(attempt: number): number {
        return Util.getRandomBetween(0, Math.min(500, 15 * (2 << (attempt - 1))));
    }

    public static getRandomBetween(min: number, max: number): number {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
    }

    public static clamp(val: number, min: number, max: number): number {
        if (!val) {
            return min;
        }

        return Math.min(Math.max(val, min), max)
    }

    /**
     * Checks if running inside NodeJS
     */
    public static isNode(): boolean {
        return (typeof process !== 'undefined') && (process.release.name === 'node');
    }

    public static parseBool(value: any): boolean {
        if (!value) {
            return false;
        }

        if ((typeof value === 'string') || (value instanceof String)) {
            return value.toLowerCase() === 'true' ? true : false;
        }

        return value === true ? true : false;
    }

    /**
     * Checks if the provided object is a function
     */
    public static isFunction(obj: any): boolean {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    }
}