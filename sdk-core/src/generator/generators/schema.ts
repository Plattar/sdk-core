import { CoreController, FileSchema, ObjectSchema } from "@plattar/api-core";
import { Util } from "../util";

export interface GeneratedSchema {
    readonly fname: string;
    readonly data: string;
}

/**
 * Contains helpful functions to generate Classes from a CoreController schema definition from the core-api
 */
export class Schema {

    /**
     * Generates a class using the provided controller
     */
    public static generate(controller: CoreController): GeneratedSchema {
        const schemaInstance: ObjectSchema = new (<any>controller.getSchema());
        const className = Util.capitaliseClassName(schemaInstance.type);
        const interfaceName = className + 'Attributes';
        const queryName = className + 'Query';
        const isFile: boolean = (schemaInstance instanceof FileSchema) ? true : false;

        // GENERATE: import statement
        let output = `import { CoreObject, CoreObjectAttributes, GlobalObjectPool, Service, ${(isFile ? "CoreFileQuery" : "CoreQuery")} } from "@plattar/sdk-core";\n`;

        // GENERATE: attributes interface, public is mutable and protected is immutable
        output += `export interface ${interfaceName} extends CoreObjectAttributes {\n`;

        schemaInstance.attributes.publicList.forEach((attribute: string) => {
            output += `\t${attribute}:any;\n`;
        });

        schemaInstance.attributes.protectedList.forEach((attribute: string) => {
            output += `\treadonly ${attribute}:any;\n`;
        });

        output += '}\n';

        // GENERATE: the main Query object + all functions (functions to-do)
        output += `export class ${queryName} extends ${(isFile ? "CoreFileQuery" : "CoreQuery")}<${className}, ${interfaceName}> {`;

        output += '}\n';

        // GENERATE: the main class
        output += `export class ${className} extends CoreObject<${interfaceName}> {\n`;
        output += `\tpublic static query(service?:Service): ${queryName} {`;
        output += `\t\treturn new ${queryName}(service, new this());`;
        output += '\t}\n';
        output += `\tpublic query(service?:Service): ${queryName} {`;
        output += `\t\treturn new ${queryName}(service, this);`;
        output += '\t}\n';

        output += `}\nGlobalObjectPool.register(${className});`;

        return {
            fname: schemaInstance.type.replaceAll('_', '-') + ".ts",
            data: output
        };
    }
}