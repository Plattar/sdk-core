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
    // (optional) the authentication to use for backend, this
    // will default to 'cookie' based auth if not supplied
    readonly auth?: ServiceAuth | null;
}

export class Service {
    private static _defaultService: Service | null = null;

    private readonly _config: ServiceConfig;

    public constructor(config: ServiceConfig) {
        // makes a deep copy of the provided config so references do not get mixed up
        // plus creates proper defaults
        this._config = {
            url: config.url,
            auth: {
                type: (config.auth && config.auth.type) ? config.auth.type : 'cookie',
                token: config.auth ? config.auth.token : null,
                tls: config.auth ? config.auth.tls : false
            }
        }
    }

    public static config(config: ServiceConfig): Service {
        this._defaultService = new Service(config);

        return this._defaultService;
    }

    public static get default(): Service {
        if (!this._defaultService) {
            throw new Error('ERROR: Service.default is not configured, use Service.config() to set a new default');
        }

        return this._defaultService;
    }

    public get config(): ServiceConfig {
        return this._config;
    }
}