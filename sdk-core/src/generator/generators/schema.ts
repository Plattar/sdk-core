import { CoreController, FileSchema, FileUpload, ObjectSchema } from '@plattar/api-core';
import { Util } from './util';

export interface GeneratedSchema {
    readonly name: string;
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
        const fileInterfaceName = className + 'FileAttributes';
        const isFile: boolean = (schemaInstance instanceof FileSchema) ? true : false;

        // GENERATE: import statement
        let output = `import { CoreObject, CoreObjectAttributes, GlobalObjectPool, Service, ${(isFile ? 'CoreFileQuery, CoreFileAttributes' : 'CoreQuery')} } from '@plattar/sdk-core';\n`;

        // GENERATE: file-attributes (if any)
        if (isFile) {
            const fileSchema: FileSchema = <FileSchema>schemaInstance;

            output += `export enum ${fileInterfaceName} extends CoreFileAttributes {`

            fileSchema.getFileUploads().forEach((value: FileUpload) => {
                output += `\t${value.key}\n`;
            });

            output += '}\n';
        }

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
        output += `export class ${queryName} extends ${(isFile ? 'CoreFileQuery' : 'CoreQuery')}<${className},${interfaceName}${(isFile ? `,${fileInterfaceName}` : '')}> {`;

        output += '}\n';

        // GENERATE: the main class
        output += `export class ${className} extends CoreObject<${interfaceName}> {\n`;
        output += `\tpublic static query(service?:Service): ${queryName} {`;
        output += `\t\treturn new ${queryName}(new ${className}(), service);`;
        output += '\t}\n';
        output += `\tpublic query(service?:Service): ${queryName} {`;
        output += `\t\treturn new ${queryName}(this, service);`;
        output += '\t}\n';

        output += `}\nGlobalObjectPool.register(${className});`;

        return {
            name: schemaInstance.type.replaceAll('_', '-'),
            fname: schemaInstance.type.replaceAll('_', '-') + '.ts',
            data: output
        };
    }
}