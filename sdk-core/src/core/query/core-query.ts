import { CoreObject, CoreObjectAttributes } from '../core-object';
import { Service } from '../service';
import { QueryContainsOperator, ContainsQuery } from './queries/contains-query';
import { DeletedQuery } from './queries/deleted-query';
import { FieldsQuery } from './queries/fields-query';
import { FilterQuery, FilterQueryOperator } from './queries/filter-query';
import { IncludeQuery } from './queries/include-query';
import { PaginationQuery } from './queries/pagination-query';
import { Query } from './queries/query';
import { SearchQuery, SearchQueryOperator } from './queries/search-query';
import { QuerySortOperator, SortQuery } from './queries/sort-query';

/**
 * The currently possible request types that can be made as part of a query
 */
export type QueryFetchType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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

    public where(variable: keyof U, operation: FilterQueryOperator | SearchQueryOperator, value: string | number | boolean): this {
        switch (operation) {
            case 'like':
            case '~=':
                this._queries.push(new SearchQuery(this.instance.type, <string>variable, value));
                break;
            default:
                this._queries.push(new FilterQuery(this.instance.type, <string>variable, operation, value));
                break;
        }

        return this;
    }

    public fields(...fields: Array<keyof U>): this {
        const data: Array<string> = fields.map<string>((object: keyof U) => <string>object);
        this._queries.push(new FieldsQuery(this.instance.type, data));

        return this;
    }

    public include(...objects: Array<(typeof CoreObject<CoreObjectAttributes>) | Array<string>>): this {
        const data: Array<string | Array<string>> = objects.map<string | Array<string>>((object: typeof CoreObject<CoreObjectAttributes> | Array<string>) => {
            if (Array.isArray(object)) {
                return object.map<string>((object: string) => {
                    return `${this.instance.type}.${object}`;
                });
            }

            return `${this.instance.type}.${object.type}`;
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

        this._queries.push(new IncludeQuery(consolidatedData));

        return this;
    }

    public contains(operation: QueryContainsOperator = '==', ...objects: Array<typeof CoreObject<CoreObjectAttributes>>): this {
        const data: Array<string> = objects.map<string>((object: typeof CoreObject<CoreObjectAttributes>) => object.type);
        this._queries.push(new ContainsQuery(operation, data));

        return this;
    }

    public deleted(...objects: Array<typeof CoreObject<CoreObjectAttributes>>): this {
        const data: Array<string> = objects.map<string>((object: typeof CoreObject<CoreObjectAttributes>) => object.type);
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

        // encode the full url to safely escape all characters (like whitespaces)
        const encodedURL: string = encodeURI(url + this.toString());

        // proceed with generating the request - for anything other than GET we need to generate a payload
        // this payload is generated from non-null values of the object attributes
        // TO-DO

        // return the final results which might contain 0 or more objects (depending on the request)
        return results;
    }

    /**
     * Generates the url sequence of all queries and returns
     */
    public toString(): string {
        const queries: Array<Query> = this._queries;

        if (queries.length <= 0) {
            return '';
        }

        let url: string = '?';

        queries.forEach((query: Query) => {
            url += `${query.toString()}&`;
        });

        // remove the last & keyword
        return url.slice(0, -1);
    }
}