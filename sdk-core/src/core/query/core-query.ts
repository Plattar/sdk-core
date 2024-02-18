import { CoreObject, CoreObjectAttributes } from '../core-object';
import { GlobalObjectPool } from '../global-object-pool';
import { Service } from '../service';
import { DNS } from '../util/dns';
import { Util } from '../util/util';
import { CoreError } from './errors/core-error';
import { ContainsQuery } from './queries/contains-query';
import { DeletedQuery } from './queries/deleted-query';
import { FieldsQuery } from './queries/fields-query';
import { FilterQuery, FilterQueryOperator } from './queries/filter-query';
import { IncludeQuery } from './queries/include-query';
import { JoinQuery } from './queries/join-query';
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
    private readonly _abort: AbortController;

    public constructor(instance: T, service?: Service) {
        this._instance = instance;
        this._service = service ? service : Service.default;
        this._queries = new Array<Query>();
        this._abort = new AbortController();
    }

    public get instance(): T {
        return this._instance;
    }

    public get service(): Service {
        return this._service;
    }

    /**
     * Call this to abort/terminate incomplete query requests
     */
    public abort(reason?: string): void {
        this._abort.abort(reason);
    }

    /**
     * Allows multiple queries to be joined together
     */
    public join(...queries: Array<CoreQuery<CoreObject<CoreObjectAttributes>, CoreObjectAttributes>>): this {
        queries.forEach((query: CoreQuery<CoreObject<CoreObjectAttributes>, CoreObjectAttributes>) => {
            const queryString: string = query.toString();

            if (queryString !== '') {
                this._queries.push(new JoinQuery(queryString));
            }
        });

        return this;
    }

    public where(variable: keyof U, operation: FilterQueryOperator | SearchQueryOperator, value: string | number | boolean | Date): this {
        switch (operation) {
            case 'like':
            case '~=':
                this._queries.push(new SearchQuery(this.instance.type, <string>variable, (value instanceof Date ? value.toISOString() : value)));
                break;
            default:
                this._queries.push(new FilterQuery(this.instance.type, <string>variable, operation, (value instanceof Date ? value.toISOString() : value)));
                break;
        }

        return this;
    }

    public fields(...fields: Array<keyof U>): this {
        const data: Array<string> = fields.map<string>((object: keyof U) => <string>object);
        this._queries.push(new FieldsQuery(this.instance.type, data));

        return this;
    }

    public include(...objects: Array<(typeof CoreObject<CoreObjectAttributes>) | (typeof CoreQuery<CoreObject<CoreObjectAttributes>, CoreObjectAttributes>) | Array<string>>): this {
        const data: Array<string | Array<string>> = objects.map<string | Array<string>>((object: typeof CoreObject<CoreObjectAttributes> | typeof CoreQuery<CoreObject<CoreObjectAttributes>, CoreObjectAttributes> | Array<string>) => {
            if (Array.isArray(object)) {
                return object.map<string>((object: string) => {
                    return `${this.instance.type}.${object}`;
                });
            }

            if (object instanceof CoreQuery) {
                this.join(object);

                return `${this.instance.type}.${object.instance.type}`;
            }

            return `${this.instance.type}.${(<any>object).type}`;
        });

        this._queries.push(new IncludeQuery(data.flat()));

        return this;
    }

    public contains(...objects: Array<typeof CoreObject<CoreObjectAttributes>>): this {
        const data: Array<string> = objects.map<string>((object: typeof CoreObject<CoreObjectAttributes>) => object.type);
        this._queries.push(new ContainsQuery("==", data));

        return this;
    }

    public notContains(...objects: Array<typeof CoreObject<CoreObjectAttributes>>): this {
        const data: Array<string> = objects.map<string>((object: typeof CoreObject<CoreObjectAttributes>) => object.type);
        this._queries.push(new ContainsQuery("!=", data));

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

    /**
     * Performs the primary request and returns the responses as an array
     */
    protected async _Fetch<Output extends CoreObject<U>, U extends CoreObjectAttributes>(output: Output, url: string, type: QueryFetchType): Promise<Array<Output>> {
        return CoreQuery.fetch<T, Output>(this.service, this.instance, output, encodeURI(`${url}${this._queries.length > 0 ? `?${this.toString()}` : ''}`), type, this._abort.signal);
    }

    /**
     * Generates the url sequence of all queries and returns
     */
    public toString(): string {
        const queries: Array<Query> = this._queries;

        if (queries.length <= 0) {
            return '';
        }

        let url: string = '';

        queries.forEach((query: Query) => {
            const queryString: string = query.toString();

            if (queryString !== '') {
                url += `${queryString}&`;
            }
        });

        // remove the last & keyword
        return url.slice(0, -1);
    }

    public static async fetch<Input extends CoreObject<CoreObjectAttributes>, Output extends CoreObject<CoreObjectAttributes>>(service: Service, input: Input, output: Output, encodedURL: string, type: QueryFetchType, abort?: AbortSignal): Promise<Array<Output>> {
        const results: Array<Output> = new Array<Output>();

        // this resolves instantly if the url is not a localhost
        const baseUrl: string = await DNS.resolveLocalhost(service.config.url);
        const url: string = `${baseUrl}${encodedURL}`;

        if (!fetch) {
            CoreError.init(url, {
                error: {
                    title: 'Runtime Error',
                    text: `native fetch api not available, uprade your ${Util.isNode() ? 'NodeJS' : 'Browser'} environment`
                }
            }).handle(service);

            return results;
        }

        // this resolves instantly if not running NodeJS or if health checking is disabled (by default)
        const serviceHealth: boolean = await service.checkHealth();

        if (!serviceHealth) {
            CoreError.init(url, {
                error: {
                    title: 'Network Error',
                    text: `configured service.url is not healthy and cannot be reached, check host status`
                }
            }).handle(service);

            return results;
        }

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // init our request type
        const request: RequestInit = {
            method: type,
            mode: 'cors',
            cache: 'no-cache',
            redirect: 'follow',
            referrerPolicy: 'origin'
        };

        if (Util.isNode()) {
            switch (service.config.auth.type) {
                // for NodeJS we need to set the cookie header directly so we'll use the
                // token as the actual cookies to send over to the server
                case 'cookie':
                    if (service.config.auth.token) {
                        headers['cookie'] = service.config.auth.token;
                    }
                    break;
                case 'token':
                    if (service.config.auth.token) {
                        headers['Authorization'] = `Bearer ${service.config.auth.token}`;
                    }
                    break;
            }
        }
        else {
            switch (service.config.auth.type) {
                // in brwoser mode (non NodeJS) we send all cookies via `include` credentials
                // which will instruct browser to send all current cookies to the server
                case 'cookie':
                    request.credentials = 'include';
                    break;
                case 'token':
                    if (service.config.auth.token) {
                        headers['Authorization'] = `Bearer ${service.config.auth.token}`;
                    }
                    break;
            }
        }

        request.headers = headers;

        // send the payload if performing POST/PUT/PATCH requests
        switch (type) {
            case 'POST':
            case 'PUT':
            case 'PATCH':
                request.body = JSON.stringify(input.payload);
                break;
        }

        // set the abort signal to terminate the query if needed
        if (abort) {
            request.signal = abort;
        }

        let response: Response | null = null;

        // proceed with generating the request - for anything other than GET we need to generate a payload
        // this payload is generated from non-null values of the object attributes
        try {
            response = await this._ExpFetch(service, url, request, 0, abort);
        }
        catch (err: any) {
            err.handle(service);

            return results;
        }

        // catch backend timeout errors for long-running requests
        if (response.status === 408) {
            CoreError.init(url, {
                error: {
                    status: 408,
                    title: 'Request Timeout',
                    text: `request timed out`
                }
            }).handle(service);

            return results;
        }

        let json: any = null;

        try {
            json = await response.json();
        }
        catch (err: any) {
            CoreError.init(url, {
                error: {
                    title: 'Runtime Error',
                    text: `something unexpected occured during results parsing, details - ${err.message}`
                }
            }).handle(service);

            return results;
        }

        // ensure there is a json object that was parsed properly
        if (!json) {
            CoreError.init(url, {
                error: {
                    title: 'Runtime Error',
                    text: 'runtime expected json results from fetch to be non-null'
                }
            }).handle(service);

            return results;
        }

        // check if the returned data is json error object
        if (json.error) {
            CoreError.init(url, json).handle(service);

            return results;
        }

        // ensure json has the critical data section in-tact
        if (!json.data) {
            CoreError.init(url, {
                error: {
                    title: 'Runtime Error',
                    text: 'runtime tried to parse malformed json data'
                }
            }).handle(service);

            return results;
        }

        // map includes query into a map structure
        const includes: Array<any> = json.included || new Array<any>();
        const includesMap: Map<string, any> = new Map<string, any>();

        // fill in the includes map for faster Lookup when creating object hierarchies
        includes.forEach((includesRecord: any) => {
            if (includesRecord.id) {
                includesMap.set(includesRecord.id, includesRecord);
            }
        });

        // begin parsing the json, which should be the details of the current
        // object type - this could also be an array so we'll need extra object instances
        // if Array - we are dealing with multiple records, otherwise its a single record
        if (Array.isArray(json.data)) {
            const listRecords: Array<any> = json.data;

            // we don't have ANY results, return an empty array
            if (listRecords.length <= 0) {
                return results;
            }

            // otherwise, the first result will be our current instance and any
            // consecutive results will be created dynamically
            // we create a global LUT cache to keep track of recursions
            const cache: Map<string, CoreObject<CoreObjectAttributes>> = new Map<string, CoreObject<CoreObjectAttributes>>();
            const object: any = listRecords[0];

            // add the first object to the instance
            cache.set(object.id, output);

            // construct the first object
            output.setFromAPI({
                object: object,
                includes: includesMap,
                cache: cache
            });

            results.push(output);

            // begin construction of every other instance
            for (let i = 1; i < listRecords.length; i++) {
                const record = listRecords[i];
                const objectInstance: CoreObject<CoreObjectAttributes> | null = cache.get(object.id) || GlobalObjectPool.newInstance(record.type);

                if (!objectInstance) {
                    CoreError.init(url, {
                        error: {
                            title: 'Runtime Error',
                            text: `runtime could not create a new instance of object type ${record.type} at index ${i}`
                        }
                    }).handle(service);

                    continue;
                }

                // add the first object to the instance
                cache.set(record.id, objectInstance);

                objectInstance.setFromAPI({
                    object: listRecords[i],
                    includes: includesMap,
                    cache: cache
                });

                results.push(<Output>objectInstance);
            }
        }
        else {
            // handle single record types
            const record: any = json.data;

            // we don't have ANY results, return an empty array
            if (!record.type || !record.id) {
                return results;
            }

            // otherwise, the first result will be our current instance and any
            // consecutive results will be created dynamically
            // we create a global LUT cache to keep track of recursions
            const cache: Map<string, CoreObject<CoreObjectAttributes>> = new Map<string, CoreObject<CoreObjectAttributes>>();

            // add the first object to the instance
            cache.set(record.id, output);

            // construct the first object
            output.setFromAPI({
                object: record,
                includes: includesMap,
                cache: cache
            });

            results.push(output);
        }

        // return the final results which might contain 0 or more objects (depending on the request)
        return results;
    }

    /**
     * Performs an exponential backoff fetch() request
     */
    private static async _ExpFetch(service: Service, url: string, request: RequestInit, attempt: number, abort?: AbortSignal): Promise<Response> {
        let response: Response | null = null;

        try {
            response = await fetch(url, request);
        }
        catch (err: any) {
            // check if abort was fired
            if (abort && abort.aborted) {
                throw CoreError.init(url, {
                    error: {
                        title: 'Aborted',
                        text: 'request was manually aborted'
                    }
                });
            }

            // check if fetch() returned an internal error
            throw CoreError.init(url, {
                error: {
                    title: 'Runtime Error',
                    text: `something unexpected occured during runtime, details - ${err.message}`
                }
            });
        }

        // this should not happen, but here as a check regardless
        if (!response) {
            throw CoreError.init(url, {
                error: {
                    title: 'Runtime Error',
                    text: `something unexpected occured during runtime, request instance was null`
                }
            });
        }

        // if the response was not ok, we try again using exponential backoff
        if (!response.ok) {
            const newAttempt: number = attempt + 1;

            if (service.config.options.retry.tries >= newAttempt) {
                await Util.sleep(Util.expoBackoffTime(newAttempt));

                return this._ExpFetch(service, url, request, newAttempt, abort);
            }
        }

        // otherwise return the response as-is
        return response;
    }
}