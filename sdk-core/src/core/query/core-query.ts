import { CoreObject, CoreObjectAttributes } from '../core-object';
import { Service } from '../service';
import { Query } from './queries/query';

/**
 * The currently possible request types that can be made as part of a query
 */
export type QueryFetchType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * The operation types that can be used for comparison operations
 * 
 * operator == or = is 'equals'
 * operator != is 'not equals'
 * operator > is 'greater than'
 * operator < is 'less than'
 * operator >= is 'greater than or equals to'
 * operator <= is 'less than or equals to'
 * operator ~= is 'roughly equals' or 'fuzzy search'
 */
export type QueryOperator = '==' | '=' | '!=' | '>' | '<' | '>=' | '<=' | '~=';
export type ContainsOperator = '==' | '=' | '!=';

/**
 * The operation types that can be used for sorting operations
 * 
 * operator ascending or asc is 'sort by ascending order'
 * operator descending or desc is 'sort by descending order'
 */
export type QuerySortOperator = 'ascending' | 'descending' | 'asc' | 'desc';

/**
 * Base Query Object that allows building a query against the primary API 
 */
export abstract class CoreQuery<T extends CoreObject<U>, U extends CoreObjectAttributes> {
    private readonly _instance: T;
    private readonly _service: Service;
    private readonly _queries: Array<Query>;

    public constructor(instance: T, service?: Service) {
        this._instance = instance;
        this._service = service ? service : Service.default;
        this._queries = new Array<Query>();
    }

    public get instance(): T {
        return this._instance;
    }

    public get service(): Service {
        return this._service;
    }

    public where(variable: keyof U, operation: QueryOperator, value: string | number | boolean): this {
        return this;
    }

    public fields(...fields: Array<keyof U>): this {
        return this;
    }

    public include(...objects: Array<typeof CoreObject>): this {
        return this;
    }

    public contains(operation: ContainsOperator, ...objects: Array<typeof CoreObject>): this {
        return this;
    }

    public deleted(...objects: Array<typeof CoreObject>): this {
        return this;
    }

    public sort(variable: keyof U, operation: QuerySortOperator): this {
        return this;
    }

    protected async _Fetch(url: string, type: QueryFetchType): Promise<Array<T>> {
        const results: Array<T> = new Array<T>();
        // generate all the query parameters to the final URL
        const queries: Array<Query> = this._queries;

        if (queries.length > 0) {
            url += '?';

            queries.forEach((query: Query) => {
                url += `${query.toString()}&`;
            });

            // remove the last & keyword
            url = url.slice(0, -1);
        }

        // proceed with generating the request - for anything other than GET we need to generate a payload
        // this payload is generated from non-null values of the object attributes
        // TO-DO

        // return the final results which might contain 0 or more objects (depending on the request)
        return results;
    }
}