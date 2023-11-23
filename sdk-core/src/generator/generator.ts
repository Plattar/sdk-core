import { CoreController } from "@plattar/api-core";
import { GeneratedProject, PackageJsonVars, Project } from "./generators/project";
import { GeneratedSchema, Schema } from "./generators/schema";
import fs from "fs";

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

        await Promise.all(allSchemas);

        // write the index.ts file
        await fs.promises.writeFile(`${outputDir}/src/index.ts`, this.generateIndexFile(schemas));
    }

    private static generateIndexFile(schemas: Array<GeneratedSchema>): string {
        let output: string = '/*\n * Warning: Do Not Edit - Auto Generated via @plattar/sdk-core\n */\n\n';

        output += 'export { Service, ServiceConfig, ServiceAuth } from "@plattar/sdk-core";\n';

        schemas.forEach((schema) => {
            output += `export * from "./schemas/${schema.name}";\n`;
        });

        return output;
    }
}