import { CoreController, EndpointMount, ObjectSchema } from "@plattar/api-core";

export interface EndpointMapping {
    readonly controller: CoreController;
    readonly mount: EndpointMount;
}

/**
 * Contains a collection of Schema to Endpoint lists used for generating query functions
 */
export class SchemaCollection {
    private readonly _map: Map<typeof ObjectSchema, Array<EndpointMapping>>;

    public constructor() {
        this._map = new Map<typeof ObjectSchema, Array<EndpointMapping>>();
    }

    public push(controller: CoreController): SchemaCollection {
        const mounts: Array<EndpointMount> = controller.mount();
        const schema: typeof ObjectSchema = controller.getSchema();

        // we insert as part of the input, if the input is undefined we use the
        // original schema
        mounts.forEach((mount: EndpointMount) => {
            this._insert(controller, mount.meta.input || schema, mount);

            if (mount.meta.output) {
                this._insert(controller, mount.meta.output, null);
            }
        });

        return this;
    }

    private _insert(controller: CoreController, schema: typeof ObjectSchema, mount: EndpointMount | null): SchemaCollection {
        const data: Array<EndpointMapping> | undefined = this._map.get(schema);

        if (data) {
            if (mount) {
                data.push({
                    controller: controller,
                    mount: mount
                });
            }

            return this;
        }

        const newData: Array<EndpointMapping> = new Array<EndpointMapping>();

        if (mount) {
            newData.push({
                controller: controller,
                mount: mount
            });
        }

        this._map.set(schema, newData);

        return this;
    }

    public get(key: typeof ObjectSchema): Array<EndpointMapping> | null {
        const data = this._map.get(key);

        return data ? data : null;
    }

    public forEach(fn: (schema: typeof ObjectSchema, endpoints: Array<EndpointMapping>) => void) {
        this._map.forEach((value: Array<EndpointMapping>, key: typeof ObjectSchema) => {
            fn(key, value);
        });
    }
}