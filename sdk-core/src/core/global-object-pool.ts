import { CoreObjectAttributes, type CoreObject } from './core-object';

/**
 * This object provides runtime functionality to access object types for construction
 * from the API
 */
export class GlobalObjectPool {
    private static readonly _globalMap: Map<string, typeof CoreObject> = new Map<string, typeof CoreObject>();

    /**
     * Used by the Generator for adding an object instance with a unique API key into the Registrar
     */
    public static register(objectInstance: typeof CoreObject): GlobalObjectPool {
        this._globalMap.set(objectInstance.type, objectInstance);

        return this;
    }

    /**
     * Used by Reflective Constructors to re-generate objects from the API at runtime
     */
    public static get(key: string): (typeof CoreObject) | null {
        const obj: typeof CoreObject | undefined = this._globalMap.get(key);

        return obj ? obj : null;
    }

    /**
     * Generates a new instance of the object provided a key, otherwise returns null
     */
    public static newInstance<T extends CoreObject<CoreObjectAttributes>>(key: string): T | null {
        const obj: typeof CoreObject | null = this.get(key);

        return obj ? obj.newInstance<T>() : null;
    }
}