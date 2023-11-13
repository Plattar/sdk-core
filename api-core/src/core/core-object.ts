/**
 * This interface will need to be implemented by the SDK generator
 */
export interface CoreObjectAttributes { }

/**
 * CoreObject is the base object that all Objects in the API derive base functionality from
 */
export abstract class CoreObject<Attributes extends CoreObjectAttributes> {

    // these attributes are filled from the remote API when a query is made
    private _attributes: Attributes;

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
            throw new Error('Error: CoreObject.id is not configured, use constructor with a non-null id');
        }

        return this._id;
    }

    public static get type(): string {
        throw new Error('Error: CoreObject.type is not implemented, contact admin');
    }

    public get type(): string {
        return (<any>this.constructor).type;
    }
}