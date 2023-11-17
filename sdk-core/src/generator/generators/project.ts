export interface PackageJsonVars {
    readonly name: string;
    readonly version: string;
    readonly dependencies: {
        readonly '@plattar/sdk-core': string;
    };
}

export interface GeneratedProject {
    readonly packageJson: {
        readonly fname: string;
        readonly data: string;
    };
    readonly tsConfig: {
        readonly fname: string;
        readonly data: string;
    };
    readonly npmIgnore: {
        readonly fname: string;
        readonly data: string;
    };
}

/**
 * Contains helpful functions to generate the data for a TypeScript based project
 */
export class Project {

    public static generate(vars: PackageJsonVars): GeneratedProject {
        return {
            packageJson: {
                fname: 'package.json',
                data: JSON.stringify(Project.generatePackageJson(vars))
            },
            tsConfig: {
                fname: 'tsconfig.json',
                data: JSON.stringify(Project.generateTsConfig())
            },
            npmIgnore: {
                fname: '.npmignore',
                data: Project.generateNpmIgnore()
            }
        }
    }

    /**
     * Generates the package.json file for the new project
     */
    public static generatePackageJson(vars: PackageJsonVars): any {
        return {
            name: '@plattar/' + vars.name,
            version: vars.version,
            description: 'Generated using @plattar/sdk-core and used for interfacing with ' + vars.name + ' backend service',
            main: 'dist/index.js',
            module: 'dist/index.js',
            types: 'dist/index.d.ts',
            scripts: {
                clean: 'rm -rf dist node_modules package-lock.json && npm cache clean --force',
                build: 'npm install && npm run build-ts',
                'build-ts': 'tsc --noEmitOnError',
                'clean:build': 'npm run clean && npm run build',
            },
            repository: {
                type: 'git',
                url: 'git+https://github.com/Plattar/sdk-core.git',
            },
            engines: {
                node: '>=18.0',
            },
            author: 'plattar',
            license: 'Apache-2.0',
            bugs: {
                url: 'https://github.com/Plattar/sdk-core/issues',
            },
            homepage: 'https://www.plattar.com',
            dependencies: {
                '@plattar/sdk-core': vars.dependencies['@plattar/sdk-core'],
            },
            devDependencies: {
                typescript: '^5.2.2'
            },
            publishConfig: {
                access: 'public',
            }
        }
    }

    public static generateTsConfig(): any {
        return {
            compilerOptions: {
                target: 'ES2022',
                module: 'CommonJS',
                declaration: true,
                moduleResolution: 'node',
                outDir: './dist',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                noImplicitOverride: true
            },
            include: [
                'src/**/*'
            ],
            exclude: [
                'node_modules',
                'dist'
            ]
        }
    }

    public static generateNpmIgnore(): string {
        return ['src/',
            'node_modules/',
            'tsconfig.json',
            'package-lock.json',
            '.npmrc'].join('\r\n');
    }
}