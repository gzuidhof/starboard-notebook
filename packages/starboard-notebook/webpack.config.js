const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { ESBuildMinifyPlugin } = require('esbuild-loader')

const webpack = require('webpack')
  
const pkg = require("././package.json");

const baseConfig = {
    entry: ['./src/publicPath.ts', './src/main.ts'],
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: "starboard-notebook.js",
        chunkFilename: '[name].chunk.js',
        crossOriginLoading: 'anonymous',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.d.ts'],
        alias: {
            "react": path.resolve("./node_modules/preact/compat"),
            "react-dom": path.resolve("./node_modules/preact/compat"),
            "markdown-it" : path.resolve(path.join(__dirname, 'node_modules/markdown-it')),
            "prosemirror-view" : path.resolve(path.join(__dirname, 'node_modules/starboard-rich-editor/node_modules/rich-markdown-editor/node_modules/prosemirror-view')),
        },
        fallback: { "assert": require.resolve("assert/") }
    },
    cache: {
        type: "filesystem",
        buildDependencies: {
            config: [__filename],
        },
    },
    optimization: {
        moduleIds: "named",
        chunkIds: "named",
        usedExports: true,
        splitChunks: false,
        
        minimizer: [
            new ESBuildMinifyPlugin({
                target: "es2018",
                css: true
            })
        ]
    },
    stats: "minimal",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "esbuild-loader",
                        options: {
                            loader: "ts",
                            target: "es2018",
                        },
                    }
                ],
                exclude: [/node_modules/, /initServiceWorker\.ts$/],
            },
            { // The ESBuild plugin is problematic for the service worker, so we use ts-loader for that..
                test: /initServiceWorker\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ],
                exclude: [/node_modules/],
            },
            {
                test: /\.(s?css|sass)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {}
                    },
                    'sass-loader'
                ]
            },
            {
                test: /\.ico$|\.ttf$|\.woff2$/,
                use: ['file-loader?name=[name].[hash].[ext]'],
                exclude: [/.*KaTeX.*.ttf/],
            },
            { // KaTeX ttf fonts are not emitted. Starboard only supports browsers that understand woff2 anyway.
                test: /(KaTeX).*\.ttf$/,
                use: ['file-loader?emitFile=false'],
            },
            {
                test: /\.svg$|\.eot|\.woff$/,
                use: ['file-loader?emitFile=false'],

            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Starboard Notebook',
            favicon: 'static/favicon.ico',
        }),
        new MiniCssExtractPlugin({
            filename: "starboard-notebook.css"
        }),
        new webpack.DefinePlugin({
            STARBOARD_NOTEBOOK_VERSION: JSON.stringify(pkg.version)
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser.js',
        }),
        new MonacoWebpackPlugin({
            languages: [
                "markdown", "html", "css", "javascript", "typescript", "python",
            ],
            features: [
                "!toggleHighContrast", "!gotoSymbol"
            ]
        }),
    ],
    devServer: {
        // contentBase: path.join(__dirname, './dist/'),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        compress: true,
        port: 9001,
        hot: true,
        historyApiFallback: false,
        headers: {
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Access-Control-Allow-Origin": "*",
        }
    },
}

module.exports = (env, argv) => {
    const config = baseConfig;

    if (argv.mode === "development") {
        config.devtool = 'inline-source-map'
        config.output.publicPath = "/"

        // We add it here so that in a production build it fails to import notebooks
        config.module.rules.push({
            test: /\.(nb|sbnb)$/,
            use: 'raw-loader',
        })
    }

    if (argv.stats) {
        config.plugins.push(new BundleAnalyzerPlugin({
            analyzerMode: "static"
        }))
    }

    if (env.minify === "disabled") {
        console.log("Building without minimization");
        config.optimization.minimizer = [];
    }

    return config;
};