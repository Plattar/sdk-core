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
}