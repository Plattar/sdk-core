import { Schema } from "./schema";

/**
 * Keeps track of all generated Schema objects ready to be written out into files
 */
export class SchemaList {
    private readonly _map: Map<string, Schema>;

    public constructor() {
        this._map = new Map<string, Schema>();
    }

    public push(schema: Schema): SchemaList {
        this._map.set(schema.key, schema);

        return this;
    }

    public get(key: string): Schema | null {
        const data = this._map.get(key);

        return data ? data : null;
    }

    public forEach(fn: (schema: Schema) => void) {
        this._map.forEach((value: Schema, key: string) => {
            fn(value);
        });
    }
}