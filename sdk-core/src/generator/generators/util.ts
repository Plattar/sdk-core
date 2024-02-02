export class Util {

    /**
     * This will capitalise the following
     * my_named_class = MyNamedClass
     */
    public static capitaliseClassName(name: string): string {
        const capName: string = name.split('_').map((word: string) => {
            return word[0].toUpperCase() + word.substring(1);
        }).join('');

        return capName.split('-').map((word: string) => {
            return word[0].toUpperCase() + word.substring(1);
        }).join('');
    }

    public static getClassAttributesName(name: string): string {
        return `${Util.capitaliseClassName(name)}Attributes`;
    }

    public static getNameFromApiType(type: string): string {
        return type.replaceAll('_', '-');
    }

    public static getFileNameFromApiType(type: string): string {
        return `${Util.getNameFromApiType(type)}.ts`;
    }

    /**
     * Returns the extracted ID's from a URL schema, for example
     * value of '/my/endpoint/:myid/something/:myother/final' will return string[] = ["myid", "myother"]
     */
    public static getParams(value: string): Array<string> {
        const key: string = '/:';
        const results = [];

        while (value.length) {
            const index: number = value.indexOf(key);

            if (index === -1) {
                break
            }

            const start: number = index + key.length;
            let end: number = value.indexOf('/', start);

            if (end === -1) {
                end = value.length;
            }

            results.push(value.substring(start, end));
            value = value.substring(end);
        }

        return results;
    }

    /**
     * Checks if the provided object is a function
     */
    public static isFunction(obj: any): boolean {
        return !!(obj && obj.constructor && obj.call && obj.apply);
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
}