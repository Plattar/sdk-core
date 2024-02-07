import { ObjectSchema, FileSchema, FileUpload, AttributeKT } from "@plattar/api-core";
import { Util } from "../util";

export class AttributeGenerator {
    public static generate(schema: typeof ObjectSchema): string {
        const schemaInstance: ObjectSchema = new (<any>schema);
        const className = Util.capitaliseClassName(schemaInstance.type);
        const interfaceName = Util.getClassAttributesName(schemaInstance.type);
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

        return output;
    }
}