/**
 * This interface will need to be implemented by the SDK generator
 */
export interface CoreObjectAttributes { }

/**
 * CoreObject is the base object that all Objects in the API derive base functionality from
 */
export abstract class CoreObject<Attributes extends CoreObjectAttributes> {

    // these attributes are filled from the remote API when a query is made
    private readonly _attributes: Attributes;

    // every object has a unique ID assigned, this is filled by the remote API
    private _id: string | null;

    public constructor(id?: string | null) {
        this._id = id ? id : null;
        this._attributes = <Attributes>{}
    }

    public get attributes(): Attributes {
        return this._attributes;
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

    public get type(): string {
        return (<any>this.constructor).type;
    }

    /**
     * Re-fills tis object instance with data from the api
     */
    public setFromAPI(data: any) {
        // error out if we try to write the data from the api into the wrong type
        if (this.type !== data.type) {
            throw new Error(`CoreObject.setFromAPI() - type mismatch, cannot set ${this.type} from data type ${data.type}`);
        }

        // assign the ID
        this._id = data.id;

        // delete all previous keys from our object instance
        Object.keys(this._attributes).forEach(key => delete (<any>(this._attributes))[key]);

        // assign new keys to our attributes
        for (const [key, value] of Object.entries(data.attributes)) {
            (<any>(this._attributes))[key] = value;
        }
    }
}