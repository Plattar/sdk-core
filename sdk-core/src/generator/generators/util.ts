export class Util {

    /**
     * This will capitalise the following
     * my_named_class = MyNamedClass
     */
    public static capitaliseClassName(name: string): string {
        return name.split('_').map((word: string) => {
            return word[0].toUpperCase() + word.substring(1);
        }).join('');
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
}