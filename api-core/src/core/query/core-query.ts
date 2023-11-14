import { CoreObject, CoreObjectAttributes } from "../core-object";

/**
 * The currently possible request types that can be made as part of a query
 */
export type QueryFetchType = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * The operation types that can be used for comparison operations
 * 
 * operator == is 'equals'
 * operator != is 'not equals'
 * operator > is 'greater than'
 * operator < is 'less than'
 * operator >= is 'greater than or equals to'
 * operator <= is 'less than or equals to'
 * operator ~= is 'roughly equals'
 */
export type QueryOperator = "==" | "!=" | ">" | "<" | ">=" | "<=" | "~=";

/**
 * The operation types that can be used for sorting operations
 * 
 * operator ascending or asc is 'sort by ascending order'
 * operator descending or desc is 'sort by descending order'
 */
export type QuerySortOperator = "ascending" | "descending" | "asc" | "desc";

/**
 * Base Query Object that allows building a query against the primary API 
 */
export abstract class CoreQuery<T extends CoreObject<U>, U extends CoreObjectAttributes> {
    private readonly _instance: T;

    public constructor(instance: T) {
        this._instance = instance;
    }

    public where(variable: string, operation: QueryOperator, value: string | number | boolean): this {
        return this;
    }

    public fields(...fields: Array<string>): this {
        return this;
    }

    public include(...objects: Array<typeof CoreObject>): this {
        return this;
    }

    public deleted(...objects: Array<typeof CoreObject>): this {
        return this;
    }

    public sort(variable: string, operation: QuerySortOperator): this {
        return this;
    }

    protected async _Fetch(url: string, type: QueryFetchType, payload: any): Promise<T> {
        return this._instance;
    }
}