export type ServiceAuthType = 'cookie' | 'token';

export interface ServiceAuth {
    // the authentication type to use for backend
    readonly type: ServiceAuthType;

    // (optional) the authentication token to use, this will be ignored if
    // authentication type is 'cookie'
    readonly token?: string | null;

    // (optional) ask server to return gzipped content, this will reduce
    // download time for requests and might speed things up at expense of
    // additional processing on the client-side
    // NOTE: When SDK is used in browser, gzip is automatically enabled
    readonly gzip?: boolean | null;

    // (optuonal) for non-secure NodeJS environments to enable/disable tls
    // this defaults to 'false'
    readonly tls?: boolean | null;
}

export interface ServiceConfig {
    // the full backend url
    readonly url: string;

    // (optional) provide an API version to use, this defaults to 'v3'
    readonly version?: string;

    // (optional) the authentication to use for backend, this
    // will default to 'cookie' based auth if not supplied
    readonly auth?: ServiceAuth | null;
}

/**
 * Static container used for holding the default service, since sdk-core is used
 * in multiple projects, using an anti-pattern can become troublesome for state
 * storage
 */
export interface ServiceStaticContainer {
    service: Service | null;
}

/**
 * Locked down, immutable version of ServiceConfig with defaults already set
 */
export interface LockedServiceConfig {
    readonly url: string;
    readonly version: string;
    readonly auth: {
        readonly type: ServiceAuthType;
        readonly token: string | null;
        readonly tls: boolean;
        readonly gzip: boolean;
    }
}

export abstract class Service {
    private readonly _config: LockedServiceConfig;

    public constructor(config: ServiceConfig) {
        // makes a deep copy of the provided config so references do not get mixed up
        // plus creates proper defaults
        this._config = {
            url: config.url,
            version: config.version ? config.version : 'v3',
            auth: {
                type: (config.auth && config.auth.type) ? config.auth.type : 'cookie',
                token: (config.auth && config.auth.token) ? config.auth.token : null,
                tls: (config.auth && config.auth.tls) ? true : false,
                gzip: (config.auth && config.auth.gzip) ? true : false
            }
        }
    }

    /**
     * Configure a new default service
     */
    public static config(config: ServiceConfig): Service {
        throw new Error('Service.config is not implemented correctly, contact admin');
    }

    public static get default(): Service {
        if (!this.container.service) {
            throw new Error('Service.default is not configured, use Service.config() to set a new default');
        }

        return this.container.service;
    }

    public static get container(): ServiceStaticContainer {
        throw new Error('Service.container is not implemented correctly, contact admin');
    }

    public get config(): LockedServiceConfig {
        return this._config;
    }

    /**
     * This returns the base url and versioning combined
     */
    public get url(): string {
        return `${this.config.url}/${this.config.version}`;
    }
}