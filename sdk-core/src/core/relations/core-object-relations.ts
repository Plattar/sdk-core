import { CoreObject, CoreObjectAttributes } from "../core-object";
import { CoreQuery } from "../query/core-query";
import { Service } from "../service";

export type QuerySearch<T extends CoreObject<CoreObjectAttributes>> = (object: T) => boolean;

export class RelationCache {
    private readonly _cache: Map<string, Array<CoreObject<CoreObjectAttributes>>> = new Map<string, Array<CoreObject<CoreObjectAttributes>>>();

    /**
     * Checks the current status of the provided object type's cache
     */
    public checkStatus(objectType: typeof CoreObject): boolean {
        return this._cache.has(objectType.type);
    }

    /**
     * Clears the cache of the provided objects. If nothing is provided cache
     * will be cleared for all objects (hard-reset)
     */
    public clear(...objectType: Array<typeof CoreObject>): void {
        // if nothing is passed, clear the map
        if (objectType.length <= 0) {
            this._cache.clear();
            return;
        }

        // otherwise we only clear the objects that are passed
        objectType.forEach((object: typeof CoreObject) => {
            this._cache.delete(object.type);
        });
    }

    /**
     * Adds a new object of type as a relation into the cache
     */
    public put(objectType: string, objects: Array<CoreObject<CoreObjectAttributes>>): void {
        this._cache.set(objectType, objects);
    }

    /**
     * Appends a new record into an existing relationship list
     */
    public append(object: CoreObject<CoreObjectAttributes>): void {
        const previousRecords: Array<CoreObject<CoreObjectAttributes>> | undefined = this._cache.get(object.type);

        if (previousRecords) {
            previousRecords.push(object);
            return;
        }

        // otherwise create a new record
        this.put(object.type, [object]);
    }

    /**
     * Returns all objects related to this instance that matches the provided query
     */
    public get<T extends CoreObject<CoreObjectAttributes>>(objectType: typeof CoreObject, search?: QuerySearch<T> | null, optArr?: Array<T> | null): Array<T> {
        const results: Array<T> = optArr || new Array<T>();
        const state: Array<CoreObject<CoreObjectAttributes>> | undefined = this._cache.get(objectType.type);

        if (!state || state.length <= 0) {
            return results;
        }

        if (search) {
            state.forEach((object) => {
                try {
                    if (search(<T>object)) {
                        results.push(<T>object);
                    }
                }
                catch (_: any) { /* silent exit */ }
            });
        }
        else {
            results.push(...<Array<T>>state);
        }

        return results;
    }

    /**
     * Returns the first object related to this instance that matches the provided query
     */
    public first<T extends CoreObject<CoreObjectAttributes>>(objectType: typeof CoreObject, search?: QuerySearch<T> | null): T | null {
        const results: Array<T> = this.get(objectType, search);
        return results.length > 0 ? results[0] : null;
    }
}

export class CoreObjectRelations {
    private readonly _instance: CoreObject<CoreObjectAttributes>;
    private readonly _cache: RelationCache;

    public constructor(instance: CoreObject<CoreObjectAttributes>) {
        this._instance = instance;
        this._cache = new RelationCache();
    }

    /**
     * Returns the cache instance
     */
    public get cache(): RelationCache {
        return this._cache;
    }

    /**
     * Returns all objects related to this instance that matches the provided query
     */
    public async get<T extends CoreObject<CoreObjectAttributes>>(objectType: typeof CoreObject, search?: QuerySearch<T> | null, service?: Service | null): Promise<Array<T>> {
        // if cache is available, quickly return
        if (this.cache.checkStatus(objectType)) {
            return this.cache.get(objectType, search);
        }

        const connection: Service = service || Service.default;
        const newObjectInstance = objectType.newInstance();

        // otherwise we need to fetch and cache the relations directly
        const results: Array<T> = await CoreQuery.fetch<T, T>(connection, <T>newObjectInstance, <T>newObjectInstance, `${connection.url}/${this._instance.type}/${this._instance.id}/${objectType.type}`, 'GET');

        // add the results into the cache
        this.cache.put(objectType.type, results);

        // return the final results from the cache
        return this.cache.get(objectType, search);
    }

    /**
     * Returns the first object related to this instance that matches the provided query
     */
    public async first<T extends CoreObject<CoreObjectAttributes>>(objectType: typeof CoreObject, search?: QuerySearch<T> | null): Promise<T | null> {
        const results: Array<T> = await this.get(objectType, search);
        return results.length > 0 ? results[0] : null;
    }
}