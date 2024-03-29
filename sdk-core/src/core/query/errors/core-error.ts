import { Service } from "../../service";

export interface JsonError {
    readonly error: {
        readonly status?: number;
        readonly title: string;
        readonly text: string;
    }
}

export class CoreError extends Error {
    private readonly _json: JsonError;
    private readonly _source: string;

    public constructor(source: string, json: JsonError) {
        super(`Error - (${json.error.title})${json.error.status && json.error.status > 0 ? ` Status - (${json.error.status})` : ''} Source - (${source}) Message - (${json.error.text})`);

        this._json = json;
        this._source = source;
    }

    public static init(source: string, json: JsonError): CoreError {
        return new CoreError(source, json);
    }

    public get status(): number {
        return this._json.error.status ? this._json.error.status : 0;
    }

    public get title(): string {
        return this._json.error.title;
    }

    public get text(): string {
        return this._json.error.text;
    }

    public get source(): string {
        return this._source;
    }

    /**
     * Handles this error according to the configuration set in the service
     */
    public handle(service: Service): void {
        try {
            service.config.options.errorListener(this);
        }
        catch (_: any) { /*silent exit*/ }

        switch (service.config.options.errorHandler) {
            case 'console.error':
                console.error(this.message);
                break;
            case 'console.warn':
                console.warn(this.message);
                break;
            case 'throw':
                throw this;
        }
    }
}