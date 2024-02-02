import { Util as CoreUtil, EndpointMetaData, ObjectSchema, FileSchema } from "@plattar/api-core";
import { Util } from "../util";
import { EndpointMapping } from "../schema-collection";

export class StaticQueryGenerator {
    public static generate(schema: typeof ObjectSchema, mappings: Array<EndpointMapping>): string {
        const schemaInstance: ObjectSchema = new (<any>schema);
        const apiType: string = schema.apiType;
        const className = Util.capitaliseClassName(schemaInstance.type);
        const interfaceName = Util.getClassAttributesName(schemaInstance.type);
        const queryName = className + 'Query';
        const fileInterfaceName = className + 'FileAttributes';
        const isFile: boolean = (schemaInstance instanceof FileSchema) ? true : false;

        let output = `export class ${queryName}Static extends ${(isFile ? 'CoreFileQuery' : 'CoreQuery')}<${className},${interfaceName}${(isFile ? `,${fileInterfaceName}` : '')}> {\n`;

        // iterate over all mappings
        mappings.forEach((map: EndpointMapping) => {
            const suffix: string = map.controller.suffix;
            let endpoint: string = "";

            if (suffix !== "") {
                endpoint = endpoint + "/" + suffix;
            }

            if (apiType !== CoreUtil.DEFAULT_OBJECT_TYPE) {
                endpoint = endpoint + "/" + apiType;
            }

            const meta: EndpointMetaData | undefined = map.mount.meta;

            if (meta) {
                // generate the function
                const data: Array<string> = Util.getParams(map.mount.endpoint);
                let dataType: string | null = null;
                let isSet: boolean = false;
                let additionalQuery: string = '';

                if (data.length > 0) {
                    dataType = '{';

                    data.forEach((attr: string) => {
                        if (attr !== 'id') {
                            dataType += `${attr}:string,`;

                            isSet = true;

                            additionalQuery += `.replace(':${attr}', params.${attr})`;
                        }
                    });

                    dataType = (dataType.slice(0, -1) + '}');
                }

                const mountEndpoint: string = map.mount.endpoint.replace(":id", "${this.instance.id}");

                // output class name culd be different depending on the endpoint mapping
                const outputClassName: string = map.mount.meta.output ? Util.capitaliseClassName(map.mount.meta.output.type) : className;
                const outputAttributesName: string = map.mount.meta.output ? Util.getClassAttributesName(map.mount.meta.output.type) : (isFile ? fileInterfaceName : interfaceName);

                if (meta.outputType === 'single') {
                    output += `\tpublic async ${meta.identifier}(${(isSet ? `params:${dataType}` : '')}): Promise<${outputClassName} | null> {\n`;
                    output += `\t\tconst url:string = \`${endpoint}${mountEndpoint}\`${isSet ? additionalQuery : ''};\n`;
                    output += `\t\tconst result:Array<${outputClassName}> = await this._Fetch<${outputClassName},${outputAttributesName}>(new ${outputClassName}(), url, '${map.mount.type}');\n`;
                    output += `\t\treturn result.length > 0 ? result[0] : null;\n`;
                    output += '\t}\n';
                }
                else if (meta.outputType === 'array') {
                    output += `\tpublic async ${meta.identifier}(${(isSet ? `params:${dataType}` : '')}): Promise<Array<${outputClassName}>> {\n`;
                    output += `\t\tconst url:string = \`${endpoint}${mountEndpoint}\`${isSet ? additionalQuery : ''};\n`;
                    output += `\t\treturn await this._Fetch<${outputClassName},${outputAttributesName}>(new ${outputClassName}(), url, '${map.mount.type}');\n`;
                    output += '\t}\n';
                }
                else if (meta.outputType === 'void') {
                    output += `\tpublic async ${meta.identifier}(${(isSet ? `params:${dataType}` : '')}): Promise<void> {\n`;
                    output += `\t\tconst url:string = \`${endpoint}${mountEndpoint}\`${isSet ? additionalQuery : ''};\n`;
                    output += `\t\tawait this._Fetch<${outputClassName},${outputAttributesName}>(new ${outputClassName}(), url, '${map.mount.type}');\n`;
                    output += `\t\treturn;\n`;
                    output += '\t}\n';
                }
            }
        });

        output += '}\n';

        return output;
    }
}