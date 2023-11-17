export type ServiceAuthType = 'cookie' | 'token';

export interface ServiceAuth {
    // the authentication type to use for backend
    readonly type: ServiceAuthType;

    // (optional) the authentication token to use, this will be ignored if
    // authentication type is 'cookie'
    readonly token?: string | null;

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
 * Locked down, immutable version of ServiceConfig with defaults already set
 */
export interface LockedServiceConfig {
    readonly url: string;
    readonly version: string;
    readonly auth: {
        readonly type: ServiceAuthType;
        readonly token: string | null;
        readonly tls: boolean;
    }
}

export class Service {
    private static _defaultService: Service | null = null;

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
                tls: (config.auth && config.auth.tls) ? true : false
            }
        }
    }

    public static config(config: ServiceConfig): Service {
        this._defaultService = new Service(config);

        return this._defaultService;
    }

    public static get default(): Service {
        if (!this._defaultService) {
            throw new Error('Service.default is not configured, use Service.config() to set a new default');
        }

        return this._defaultService;
    }

    public get config(): LockedServiceConfig {
        return this._config;
    }

    /**
     * This returns the base url and versioning combined
     */
    public get url(): string {
        return `${this.config.url}/${this.config.version}`
    }
}