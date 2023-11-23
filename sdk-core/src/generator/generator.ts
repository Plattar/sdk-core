import { CoreController } from "@plattar/api-core";
import { GeneratedProject, PackageJsonVars, Project } from "./generators/project";
import { GeneratedSchema, Schema } from "./generators/schema";
import fs from "fs";
import { Util } from "./generators/util";

export interface GeneratorData {
    readonly controllers: Array<typeof CoreController>;
    readonly output: string;
    readonly package: PackageJsonVars;
}

export class Generator {
    public static async generate(data: GeneratorData): Promise<void> {
        // generate the project files
        const project: GeneratedProject = Project.generate(data.package);
        const schemas: Array<GeneratedSchema> = new Array<GeneratedSchema>();

        // generate the schema source files
        data.controllers.forEach((controller: typeof CoreController) => {
            schemas.push(Schema.generate(<CoreController>(new (<any>controller)())));
        });

        const outputDir: string = `./${data.output}/${data.package.name}`;

        // ensure project folder exists
        fs.mkdirSync(`${outputDir}/src/schemas`, { recursive: true });
        fs.mkdirSync(`${outputDir}/src/core`, { recursive: true });

        // write the .npmignore file
        await fs.promises.writeFile(`${outputDir}/${project.npmIgnore.fname}`, project.npmIgnore.data);
        // write the .npmrc file
        await fs.promises.writeFile(`${outputDir}/${project.npmRc.fname}`, project.npmRc.data);
        // write the package.json file
        await fs.promises.writeFile(`${outputDir}/${project.packageJson.fname}`, project.packageJson.data);
        // write the .tsconfig file
        await fs.promises.writeFile(`${outputDir}/${project.tsConfig.fname}`, project.tsConfig.data);
        // write the README.md file
        await fs.promises.writeFile(`${outputDir}/${project.readme.fname}`, project.readme.data);

        // begin writing all source files
        const allSchemas: Array<Promise<void>> = new Array<Promise<void>>();

        schemas.forEach((schema) => {
            allSchemas.push(fs.promises.writeFile(`${outputDir}/src/schemas/${schema.fname}`, schema.data));
        });

        const serviceSchema = this.generateServiceFile(data);

        // write the service file
        allSchemas.push(fs.promises.writeFile(`${outputDir}/src/core/${serviceSchema.fname}`, serviceSchema.data));

        await Promise.all(allSchemas);

        // write the index.ts file
        await fs.promises.writeFile(`${outputDir}/src/index.ts`, this.generateIndexFile([
            {
                dir: 'schemas',
                schemas: schemas
            },
            {
                dir: 'core',
                schemas: [serviceSchema]
            }
        ]));
    }

    private static generateIndexFile(files: Array<{ dir: string, schemas: Array<GeneratedSchema> }>): string {
        let output: string = '/*\n * Warning: Do Not Edit - Auto Generated via @plattar/sdk-core\n */\n\n';

        output += `export { Service, ServiceConfig, ServiceAuth } from '@plattar/sdk-core';\n`;

        files.forEach((schemas) => {
            schemas.schemas.forEach((schema) => {
                output += `export * from "./${schemas.dir}/${schema.name}";\n`;
            });
        });

        return output;
    }

    public static generateServiceFile(data: GeneratorData): GeneratedSchema {
        const className: string = `${Util.capitaliseClassName(data.package.name)}Service`;

        let output: string = `import { Service, ServiceConfig, ServiceStaticContainer } from '@plattar/sdk-core';\n\n`;

        output += `export class ${className} extends Service {\n`;
        output += `\tprivate static readonly serviceContainer: ServiceStaticContainer = {service:null}\n`;
        output += `\tpublic static override get container(): ServiceStaticContainer {\n`;
        output += `\t\treturn this.serviceContainer;\n`;
        output += `\t}\n`;
        output += `\tpublic static override config(config: ServiceConfig): ${className} {\n`;
        output += `\t\tthis.container.service = new ${className}(config);\n`;
        output += `\t\treturn <${className}>this.container.service;\n`;
        output += `\t}\n`;
        output += '}\n';

        return {
            name: `${data.package.name}-service`,
            fname: `${data.package.name}-service.ts`,
            data: output
        }
    }
}