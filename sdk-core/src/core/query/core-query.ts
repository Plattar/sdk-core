import { CoreObject, CoreObjectAttributes } from '../core-object';
import { Service } from '../service';
import { QueryContainsOperator, ContainsQuery } from './queries/contains-query';
import { DeletedQuery } from './queries/deleted-query';
import { PaginationQuery } from './queries/pagination-query';
import { Query } from './queries/query';
import { QuerySortOperator, SortQuery } from './queries/sort-query';

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

    public contains(operation: QueryContainsOperator = '==', ...objects: Array<typeof CoreObject>): this {
        const data: Array<string> = objects.map<string>((object: typeof CoreObject) => object.type);
        this._queries.push(new ContainsQuery(operation, data));

        return this;
    }

    public deleted(...objects: Array<typeof CoreObject>): this {
        const data: Array<string> = objects.map<string>((object: typeof CoreObject) => object.type);
        this._queries.push(new DeletedQuery(data));

        return this;
    }

    public sort(operation: QuerySortOperator, variable: keyof U): this {
        this._queries.push(new SortQuery(operation, this.instance.type, <string>variable));

        return this;
    }

    public page(count: number, size: number): this {
        this._queries.push(new PaginationQuery(count, size));

        return this;
    }

    protected async _Fetch(url: string, type: QueryFetchType): Promise<Array<T>> {
        const results: Array<T> = new Array<T>();

        const queries: Array<Query> = this._queries;

        // generate all the query parameters to the final URL (if any)
        // some requests (like POST) will ignore certain queries as they are
        // not processable in the provided context
        if (queries.length > 0) {
            url += '?';

            queries.forEach((query: Query) => {
                url += `${query.toString()}&`;
            });

            // remove the last & keyword
            url = url.slice(0, -1);
        }

        // encode the full url to safely escape all characters (like whitespaces)
        const encodedURL: string = encodeURI(url);

        // proceed with generating the request - for anything other than GET we need to generate a payload
        // this payload is generated from non-null values of the object attributes
        // TO-DO

        // return the final results which might contain 0 or more objects (depending on the request)
        return results;
    }
}