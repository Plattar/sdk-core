import version from '../../version';

export interface PackageJsonVars {
    readonly name: string;
    readonly version: string;
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
    readonly webpack: {
        readonly fname: string;
        readonly data: string;
    };
    readonly npmRc: {
        readonly fname: string;
        readonly data: string;
    };
    readonly readme: {
        readonly fname: string;
        readonly data: string;
    }
}

/**
 * Contains helpful functions to generate the data for a TypeScript based project
 */
export class Project {

    public static generate(vars: PackageJsonVars): GeneratedProject {
        return {
            packageJson: {
                fname: 'package.json',
                data: JSON.stringify(Project.generatePackageJson(vars), null, 2)
            },
            tsConfig: {
                fname: 'tsconfig.json',
                data: JSON.stringify(Project.generateTsConfig(), null, 2)
            },
            webpack: {
                fname: 'webpack.config.js',
                data: Project.generateWebpackConfig(vars)
            },
            npmIgnore: {
                fname: '.npmignore',
                data: Project.generateNpmIgnore()
            },
            npmRc: {
                fname: '.npmrc',
                data: '//registry.npmjs.org/:_authToken=${NPM_TOKEN}'
            },
            readme: {
                fname: 'README.md',
                data: Project.generateReadme(vars)
            }
        }
    }

    /**
     * Generates the package.json file for the new project
     */
    public static generateWebpackConfig(vars: PackageJsonVars): any {
        const webpack = `{
            name: '${vars.name}',
            mode: 'production',
            devtool: 'source-map',
            entry: {
                main: ['./dist/index.js']
            },
            output: {
                path: path.resolve(__dirname, './build'),
                filename: "bundle.min.js"
            },
            module: {},
            plugins: [
                new CleanWebpackPlugin()
            ],
            optimization: {
                minimize: true,
                minimizer: [
                    new TerserPlugin({
                        terserOptions: {
                            format: {
                                comments: false,
                            },
                            keep_classnames: true,
                            keep_fnames: false,
                            sourceMap: true
                        },
                        extractComments: false
                    }),
                ],
            }
        }`;

        let output = `const { CleanWebpackPlugin } = require('clean-webpack-plugin');\n`;
        output += `const TerserPlugin = require("terser-webpack-plugin");\n`;
        output += `const path = require("path");\n\n`;

        return `${output}\nmodule.exports=${webpack}\n`;
    }

    /**
     * Generates the package.json file for the new project
     */
    public static generatePackageJson(vars: PackageJsonVars): any {
        return {
            name: `@plattar/${vars.name}`,
            version: vars.version,
            description: `Generated using @plattar/sdk-core and used for interfacing with ${vars.name} backend service`,
            main: 'dist/index.js',
            module: 'dist/index.js',
            types: 'dist/index.d.ts',
            sideEffects: false,
            scripts: {
                'webpack:build': 'webpack',
                clean: 'rm -rf dist build node_modules package-lock.json && npm cache clean --force',
                build: 'npm install && npm run build-ts && npm run webpack:build',
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
                '@plattar/sdk-core': `^${version}`,
            },
            devDependencies: {
                typescript: '^5.3.2',
                webpack: '^5.89.0',
                'webpack-cli': '^5.1.4',
                'clean-webpack-plugin': '^4.0.0',
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

    public static generateReadme(vars: PackageJsonVars): string {
        let output = `[![NPM](https://img.shields.io/npm/v/@plattar/${vars.name})](https://www.npmjs.com/package/@plattar/${vars.name})\n\n`;
        output += `### About\n\n`;
        output += `_${vars.name}_ v${vars.version} is automatically generated using [sdk-core](https://www.npmjs.com/package/@plattar/sdk-core) module\n\n`;
        output += `### Installation\n\n`;
        output += `-   Install using [npm](https://www.npmjs.com/package/@plattar/${vars.name})\n\n`;
        output += `\`\`\`console\nnpm install @plattar/${vars.name}\n\`\`\`\n`;

        return output;
    }
}