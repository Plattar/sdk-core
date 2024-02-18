import { CoreController, ObjectSchema, Util } from "@plattar/api-core";
import { GeneratedProject, PackageJsonVars, Project } from "./generators/project";
import { Schema } from "./generators/schema";
import fs from "fs";
import { SchemaList } from "./generators/schema-list";
import { EndpointMapping, SchemaCollection } from "./generators/schema-collection";

export interface GeneratorData {
    readonly controllers: Array<typeof CoreController>;
    readonly output: string;
    readonly package: PackageJsonVars;
}

export class Generator {
    public static async generate(data: GeneratorData): Promise<void> {
        // generate the project files
        const project: GeneratedProject = Project.generate(data.package);

        const schemas: SchemaList = new SchemaList();
        const collections: SchemaCollection = new SchemaCollection();

        // add all schemas into the collections pool
        data.controllers.forEach((controller: typeof CoreController) => {
            collections.push(<CoreController>(new (<any>controller)()));
        });

        // generate the schema source files
        // each schema can generate multiple schema files based on endpoints
        collections.forEach((schema: typeof ObjectSchema, endpoints: Array<EndpointMapping>) => {
            if (schema.type !== Util.DEFAULT_OBJECT_TYPE) {
                schemas.push(new Schema().generate(schema, endpoints));
            }
        });

        const outputDir: string = `./${data.output}/${data.package.name}-sdk`;

        // ensure project folder exists
        fs.mkdirSync(`${outputDir}/src/schemas`, { recursive: true });

        // write the .npmignore file
        await fs.promises.writeFile(`${outputDir}/${project.npmIgnore.fname}`, project.npmIgnore.data);
        // write the .npmrc file
        await fs.promises.writeFile(`${outputDir}/${project.npmRc.fname}`, project.npmRc.data);
        // write the package.json file
        await fs.promises.writeFile(`${outputDir}/${project.packageJson.fname}`, project.packageJson.data);
        // write the .tsconfig file
        await fs.promises.writeFile(`${outputDir}/${project.tsConfig.fname}`, project.tsConfig.data);
        // write the .webpack.config.js file
        await fs.promises.writeFile(`${outputDir}/${project.webpack.fname}`, project.webpack.data);
        // write the README.md file
        await fs.promises.writeFile(`${outputDir}/${project.readme.fname}`, project.readme.data);

        // begin writing all source files
        const allSchemas: Array<Promise<void>> = new Array<Promise<void>>();

        schemas.forEach((schema) => {
            allSchemas.push(fs.promises.writeFile(`${outputDir}/src/schemas/${schema.fname}`, schema.data));
        });

        await Promise.all(allSchemas);

        // write the index.ts file
        await fs.promises.writeFile(`${outputDir}/src/index.ts`, this.generateIndexFile([
            {
                dir: 'schemas',
                schemas: schemas
            }
        ]));
    }

    private static generateIndexFile(files: Array<{ dir: string, schemas: SchemaList }>): string {
        let output: string = '/*\n * Warning: Do Not Edit - Auto Generated via @plattar/sdk-core\n */\n\n';

        output += `export { Service, ServiceConfig, ServiceAuth, ServiceOptions, ServiceAuthType, ServiceErrorHandler, ServiceErrorListener, CoreError } from '@plattar/sdk-core';\n`;

        files.forEach((schemas) => {
            schemas.schemas.forEach((schema) => {
                output += `export * from "./${schemas.dir}/${schema.name}";\n`;
            });
        });

        return output;
    }
}