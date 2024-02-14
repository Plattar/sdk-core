import { Util } from "./util/util";

export type ServiceAuthType = 'cookie' | 'token' | 'none';
export type ServiceErrorHandler = 'silent' | 'console.error' | 'console.warn' | 'throw';
export type ServiceErrorListener = (err: Error) => void;

export interface ServiceAuth {
    // the authentication type to use for backend
    readonly type: ServiceAuthType;

    // (optional) the authentication token to use
    // if type == 'cookie' this will be used as a Cookie if set
    // if type == 'token' this will be used as an Auth token if set
    readonly token?: string | null;
}

export interface ServiceOptions {
    // (optional) ask server to return gzipped content, this will reduce
    // download time for requests and might speed things up at expense of
    // additional processing on the client-side
    // NOTE: When SDK is used in browser, gzip is automatically enabled
    readonly gzip?: boolean | null;

    // (optional) for non-secure NodeJS environments to enable/disable tls
    // this defaults to 'true'
    readonly tls?: boolean | null;

    // (optional) exponential backoff mechanism, retry requests for a number of times
    // before failure to alleviate network hiccups or issues. This is defaulted to 3 times
    readonly retry?: {
        readonly tries: number;
    }

    // (optional) for error handling when api throws errors like 404, 401 etc
    // defaults to `console.error` which will print the error via console.error()
    readonly errorHandler?: ServiceErrorHandler | null;

    // (optional) catch-all error listener for any errors that occur in the api
    // this is useful for global reporting or analytics reporting etc..
    // this will be called first before errors are thrown to higher code
    readonly errorListener?: ServiceErrorListener | null;

    // (optional) provide an API version to use, this defaults to '3'
    readonly version?: number | null;
}

export interface ServiceConfig {
    // the full backend url
    readonly url: string;

    // (optional) additional configuration options for the backend
    readonly options?: ServiceOptions | null;

    // (optional) the authentication to use for backend, this
    // will default to 'cookie' based auth if not supplied
    readonly auth?: ServiceAuth | null;
}

/**
 * Locked down, immutable version of ServiceConfig with defaults already set
 */
export interface LockedServiceConfig {
    readonly url: string;
    readonly options: {
        readonly version: string;
        readonly tls: boolean;
        readonly gzip: boolean;
        readonly errorHandler: ServiceErrorHandler;
        readonly errorListener: ServiceErrorListener;
        readonly retry: {
            readonly tries: number;
        }
    };
    readonly auth: {
        readonly type: ServiceAuthType;
        readonly token: string | null;
    };
}

/**
 * Allows configuration of a connection service to an api-core based backend service
 */
export class Service {
    private static _defaultServiceInstance: Service | null;

    private readonly _config: LockedServiceConfig;

    public constructor(config: ServiceConfig) {
        // makes a deep copy of the provided config so references do not get mixed up
        // plus creates proper defaults
        this._config = Object.freeze({
            url: config.url,
            options: {
                version: (config.options && config.options.version) ? `v${config.options.version}` : 'v3',
                tls: (config.options && config.options.tls) ? Util.parseBool(config.options.tls) : false,
                gzip: (config.options && config.options.gzip) ? Util.parseBool(config.options.gzip) : false,
                errorHandler: (config.options && config.options.errorHandler) ? config.options.errorHandler : 'console.error',
                errorListener: (config.options && config.options.errorListener && Util.isFunction(config.options.errorListener)) ? config.options.errorListener : (_: Error) => { /* silent handler */ },
                retry: (config.options && config.options.retry ? { tries: Util.clamp(config.options.retry.tries, 0, 10) } : { tries: 3 })
            },
            auth: {
                type: (config.auth && config.auth.type) ? config.auth.type : 'none',
                token: (config.auth && config.auth.token) ? config.auth.token : null
            }
        });

        // set TLS options for NodeJS
        if (Util.isNode()) {
            if (this._config.options.tls) {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
            }
            else {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            }
        }
    }

    /**
     * Configure a new default service
     */
    public static config(config: ServiceConfig): Service {
        Service._defaultServiceInstance = new Service(config);

        return Service._defaultServiceInstance;
    }

    /**
     * Returns the default service object
     */
    public static get default(): Service {
        if (!Service._defaultServiceInstance) {
            throw new Error('Service.default is not configured, use Service.config() to set a new default');
        }

        return Service._defaultServiceInstance;
    }

    /**
     * Returns the currently locked, read-only Service Configuration
     */
    public get config(): LockedServiceConfig {
        return this._config;
    }

    /**
     * This returns the base url and versioning combined
     */
    public get url(): string {
        return `${this.config.url}/${this.config.options.version}`;
    }
}