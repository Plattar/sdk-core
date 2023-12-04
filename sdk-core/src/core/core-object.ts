import { CoreObjectRelations } from "./relations/core-object-relations";

/**
 * This interface will need to be implemented by the SDK generator
 */
export interface CoreObjectAttributes { }

export interface CoreObjectPayload {
    readonly data: {
        readonly attributes: CoreObjectAttributes;
    }
}

/**
 * This is input from the fetch operation with the required data to construct this object and all
 * internal hierarcies
 * 
 * data - the primary data that belongs to this object
 * records - a global list of additional records that might belong to this object (will be filtered)
 * cache - a global cache map to break recursion so multiple object of same type are not created
 */
export interface FetchData {
    readonly object: {
        readonly id: string;
        readonly type: string;
        readonly attributes: any;
        readonly relationships: any;
    };
    readonly includes: Array<any>;
    readonly cache: Map<string, CoreObject<CoreObjectAttributes>>;
}

/**
 * CoreObject is the base object that all Objects in the API derive base functionality from
 */
export abstract class CoreObject<Attributes extends CoreObjectAttributes> {

    // these attributes are filled from the remote API when a query is made
    private readonly _attributes: Attributes;

    // these are a list of all objects related to this object
    private readonly _relations: CoreObjectRelations;

    // every object has a unique ID assigned, this is filled by the remote API
    private _id: string | null;

    public constructor(id?: string | null, attributes?: Attributes) {
        this._id = id ? id : null;
        this._attributes = attributes ? attributes : <Attributes>{}
        this._relations = new CoreObjectRelations(this);
    }

    public get attributes(): Attributes {
        return this._attributes;
    }

    public get relationships(): CoreObjectRelations {
        return this._relations;
    }

    /**
     * Generates a JSON Payload that can be sent to a backend server
     */
    public get payload(): CoreObjectPayload {
        return {
            data: {
                attributes: this.attributes
            }
        }
    }

    public get id(): string {
        if (!this._id) {
            throw new Error('CoreObject.id is not configured, use constructor with a non-null id');
        }

        return this._id;
    }

    public hasID(): boolean {
        return this._id ? true : false;
    }

    public static get type(): string {
        throw new Error('CoreObject.type is not implemented, contact admin');
    }

    public static newInstance<T extends CoreObject<CoreObjectAttributes>>(): T {
        return <T>(new (<any>this)());
    }

    public get type(): string {
        return (<any>this.constructor).type;
    }

    /**
     * shortcut for easier chained construction of Include Queries
     */
    public static include(...objects: Array<(typeof CoreObject<CoreObjectAttributes>) | Array<string>>): Array<string> {
        const data: Array<string | Array<string>> = objects.map<string | Array<string>>((object: typeof CoreObject<CoreObjectAttributes> | Array<string>) => {
            if (Array.isArray(object)) {
                return object.map<string>((object: string) => {
                    return `${this.type}.${object}`;
                });
            }

            return `${this.type}.${object.type}`;
        });

        const consolidatedData: Array<string> = new Array<string>();

        data.forEach((object: string | Array<string>) => {
            if (Array.isArray(object)) {
                consolidatedData.push(...object);
            }
            else {
                consolidatedData.push(object);
            }
        });

        return consolidatedData;
    }

    /**
     * Re-fills tis object instance with data from the api
     * 
     * data - the primary data that belongs to this object
     * records - a global list of additional records that might belong to this object (will be filtered)
     * cache - a global cache map to break recursion so multiple object of same type are not created
     */
    public setFromAPI(data: FetchData) {
        // error out if we try to write the data from the api into the wrong type
        if (this.type !== data.object.type) {
            throw new Error(`CoreObject.setFromAPI() - type mismatch, cannot set ${this.type} from data type ${data.object.type}`);
        }

        // assign the ID
        this._id = data.object.id;

        // delete all previous keys from our object instance
        Object.keys(this._attributes).forEach(key => delete (<any>(this._attributes))[key]);

        // assign new keys to our attributes
        for (const [key, value] of Object.entries(data.object.attributes)) {
            (<any>(this._attributes))[key] = value;
        }

        // we need to build the relationships of this object from the records section
        // which includes all the records from any include query
    }
}