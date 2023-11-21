import { AttributeKT, CoreController, EndpointMetaData, EndpointMount, FileSchema, FileUpload, ObjectSchema } from '@plattar/api-core';
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

            output += `export interface ${fileInterfaceName} extends CoreFileAttributes {\n`

            fileSchema.getFileUploads().forEach((value: FileUpload) => {
                output += `\treadonly ${value.key}:any\n`;
            });

            output += '}\n';
        }

        // GENERATE: attributes interface, public is mutable and protected is immutable
        output += `export interface ${interfaceName} extends CoreObjectAttributes {\n`;

        schemaInstance.attributes.publicListTypes.forEach((attribute: AttributeKT) => {
            output += `\t${attribute.key}${attribute.type !== 'any' ? '?' : ''}:${attribute.type};\n`;
        });

        schemaInstance.attributes.protectedListTypes.forEach((attribute: AttributeKT) => {
            output += `\treadonly ${attribute.key}${attribute.type !== 'any' ? '?' : ''}:${attribute.type};\n`;
        });

        output += '}\n';

        // GENERATE: the main Static Query object + all functions (functions to-do)
        output += `export class ${queryName}Static extends ${(isFile ? 'CoreFileQuery' : 'CoreQuery')}<${className},${interfaceName}${(isFile ? `,${fileInterfaceName}` : '')}> {\n`;
        output += this.generateStaticQueryFunctions(controller, className);

        output += '}\n';

        // GENERATE: the main Dynamic Query object + all functions (functions to-do)
        output += `export class ${queryName}Dynamic extends ${(isFile ? 'CoreFileQuery' : 'CoreQuery')}<${className},${interfaceName}${(isFile ? `,${fileInterfaceName}` : '')}> {\n`;
        output += this.generateDynamicQueryFunctions(controller, className);

        output += '}\n';

        // GENERATE: the main class
        output += `export class ${className} extends CoreObject<${interfaceName}> {\n`;
        output += `\tpublic static query(service?:Service): ${queryName}Static {\n`;
        output += `\t\treturn new ${queryName}Static(new ${className}(), service);\n`;
        output += '\t}\n';
        output += `\tpublic query(service?:Service): ${queryName}Dynamic {\n`;
        output += `\t\treturn new ${queryName}Dynamic(this, service);\n`;
        output += '\t}\n';

        output += `}\nGlobalObjectPool.register(${className});\n`;

        return {
            name: schemaInstance.type.replaceAll('_', '-'),
            fname: schemaInstance.type.replaceAll('_', '-') + '.ts',
            data: output
        };
    }

    private static generateDynamicQueryFunctions(controller: CoreController, className: string): string {
        const mounts: Array<EndpointMount> = controller.mount();

        let output = '';

        mounts.forEach((mount: EndpointMount) => {
            const meta: EndpointMetaData | undefined = mount.meta;

            if (meta && meta.returnType === "single") {
                // generate the function
                const data: Array<string> = Util.getParams(mount.endpoint);
                let dataType: string | null = null;
                let isSet: boolean = false;

                if (data.length > 0) {
                    dataType = '{';

                    data.forEach((attr: string) => {
                        if (attr !== 'id') {
                            dataType += `${attr}:string,`;

                            isSet = true;
                        }
                    });

                    dataType = (dataType.slice(0, -1) + '}');
                }

                output += `\t\tpublic ${meta.name}(${(isSet ? `params:${dataType}` : '')}): ${className} | null {\n`
                // fill in the function
                output += `return null;\n`;
                output += '\t\t}\n';
            }
        });

        return output;
    }

    private static generateStaticQueryFunctions(controller: CoreController, className: string): string {
        const mounts: Array<EndpointMount> = controller.mount();

        let output = '';

        mounts.forEach((mount: EndpointMount) => {
            const meta: EndpointMetaData | undefined = mount.meta;

            if (meta && meta.returnType !== "custom") {
                // generate the function
                const data: Array<string> = Util.getParams(mount.endpoint);
                let dataType: string | null = null;

                if (data.length > 0) {
                    dataType = '{';

                    data.forEach((attr: string) => {
                        dataType += `${attr}:string,`;
                    });

                    dataType = (dataType.slice(0, -1) + '}');
                }

                output += `\t\tpublic ${meta.name}(${(dataType ? `params:${dataType}` : '')}): ${meta.returnType === "array" ? `Array<${className}>` : `${className} | null`} {\n`
                // fill in the function
                output += `return ${meta.returnType === "array" ? '[]' : 'null'};\n`;
                output += '\t\t}\n';
            }
        });

        return output;
    }
}