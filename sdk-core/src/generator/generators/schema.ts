import { ObjectSchema } from '@plattar/api-core';
import { Util } from './util';
import { EndpointMapping } from './schema-collection';
import { AttributeGenerator } from './schemas/attribute-generator';
import { StaticQueryGenerator } from './schemas/static-query-generator';
import { DynamicQueryGenerator } from './schemas/dynamic-query-generator';

/**
 * Contains helpful functions to generate Classes from a CoreController schema definition from the core-api
 */
export class Schema {

    private _name: string | null;
    private _fname: string | null;
    private _data: string | null;
    private _key: string | null;

    public constructor() {
        this._name = null;
        this._fname = null;
        this._data = null;
        this._key = null;
    }

    public get key(): string {
        if (!this._key) {
            throw new Error("Schema.key is not defined - use .generate() function");
        }

        return this._key;
    }

    public get name(): string {
        if (!this._name) {
            throw new Error("Schema.name is not defined - use .generate() function");
        }

        return this._name;
    }

    public get fname(): string {
        if (!this._fname) {
            throw new Error("Schema.fname is not defined - use .generate() function");
        }

        return this._fname;
    }

    public get data(): string {
        if (!this._data) {
            throw new Error("Schema.data is not defined - use .generate() function");
        }

        return this._data;
    }

    /**
     * Generates a class using the provided controller
     */
    public generate(schema: typeof ObjectSchema, endpoints: Array<EndpointMapping>): Schema {
        // create a list of all imports
        const imports: Set<string> = new Set<string>();

        endpoints.forEach((value: EndpointMapping) => {
            if (value.mount.meta.input && value.mount.meta.input !== schema) {
                imports.add(`import {${Util.capitaliseClassName(value.mount.meta.input.type)},${Util.getClassAttributesName(value.mount.meta.input.type)}} from './${Util.getNameFromApiType(value.mount.meta.input.type)}';`);
            }

            if (value.mount.meta.output && value.mount.meta.output !== schema) {
                imports.add(`import {${Util.capitaliseClassName(value.mount.meta.output.type)},${Util.getClassAttributesName(value.mount.meta.output.type)}} from './${Util.getNameFromApiType(value.mount.meta.output.type)}';`);
            }
        });

        let output: string = '';

        imports.forEach((value: string) => {
            output += `${value}\n`;
        });

        const schemaInstance: ObjectSchema = new (<any>schema);
        const className = Util.capitaliseClassName(schemaInstance.type);
        const interfaceName = Util.getClassAttributesName(schemaInstance.type);
        const queryName = className + 'Query';

        // generate attributes
        output += AttributeGenerator.generate(schema);

        // generate static query interfaces
        output += StaticQueryGenerator.generate(schema, endpoints);

        // generate dynamic query interfaces
        output += DynamicQueryGenerator.generate(schema, endpoints);

        // GENERATE: the main class
        output += `export class ${className} extends CoreObject<${interfaceName}> {\n`;
        output += '\tpublic static override get type():string {\n';
        output += `\t\treturn '${schemaInstance.apiType}';\n`;
        output += '\t}\n';
        output += `\tpublic static query(service?:Service): ${queryName}Static {\n`;
        output += `\t\treturn new ${queryName}Static(new ${className}(), service);\n`;
        output += '\t}\n';
        output += `\tpublic query(service?:Service): ${queryName}Dynamic {\n`;
        output += `\t\treturn new ${queryName}Dynamic(this, service);\n`;
        output += '\t}\n';

        output += `}\nGlobalObjectPool.register(${className});\n`;

        this._key = schemaInstance.type;
        this._name = schemaInstance.type.replaceAll('_', '-');
        this._fname = schemaInstance.type.replaceAll('_', '-') + '.ts';
        this._data = output;

        return this;
    }
}