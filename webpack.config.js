const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const webpack = require('webpack')

const pkg = require("./package.json");

const baseConfig = {
    entry: ['./src/publicPath.ts', './src/main.ts'],
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: "starboard-notebook.js",
        chunkFilename: '[name].chunk.js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.d.ts'],
        alias: {
            "react": path.resolve("./node_modules/preact/compat"),
            "react-dom": path.resolve("./node_modules/preact/compat")
        }
    },
    optimization: {
        usedExports: true,
        minimizer: [
            new CssMinimizerPlugin(),
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    compress: {
                        passes: 3,
                    },
                    ecma: 2018,
                  // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
                }
            }),
        ]
    },
    node: false,
    externals: { // These are only relevant polyfills for Node - save ~50KB by removing them.
        "node-libs-browser": "0",

        // These are the deps of node-libs-browser
        "assert": "0",
        "browserify-zlib": "0",
        "buffer": "0",
        "console-browserify": "0",
        "constants-browserify": "0",
        "crypto-browserify": "0",
        "domain-browser": "0",
        "events": "0",
        "https-browserify": "0",
        "os-browserify": "0",
        "path-browserify": "1",
        "process": "0",
        "punycode": "0",
        "querystring-es3": "0",
        "readable-stream": "^0",
        "stream-browserify": "0",
        "stream-http": "0",
        "string_decoder": "0",
        "timers-browserify": "0",
        "tty-browserify": "0",
        "url": "0",
        "util": "0",
        "vm-browserify": "0"
    },
    // stats: "minimal",
    module: {
        rules: [
        {
            test: /\.tsx?$/,
            use: [
                {
                    loader: 'minify-lit-html-loader',
                    options: {
                      htmlMinifier: {
                        ignoreCustomFragments: [
                          /<\s/,
                          /<=/,
                        ]
                      },
                    }
                  },
                'ts-loader'
            ],
            exclude: [/node_modules/, /textEditor\.ts$/, /esm\.ts$/, /precompile(Module)?\.ts$/, /consoleOutput(Module)?\.ts$/, /katex(Module)?\.ts$/],
        },
        {
            test: /(textEditor)|(esm)|(precompile(Module)?)|(consoleOutput(Module)?)|(katex(Module)?)\.ts$/, // Dynamic imports break when using minify-lit-html-loader for some mysterious reason.. a workaround
            use: [
                'ts-loader'
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
            test: /\.ttf$|\.woff2$/,
            use: ['file-loader?name=[name].[ext]'],
            exclude: [/.*KaTeX.*.ttf/],
        },
        {   // KaTeX ttf fonts are not omitted. Starboard only supports browsers that understand woff2 anyway.
            test: /(KaTeX).*\.ttf$/,
            use: ['file-loader?emitFile=false'],
        },
        {
            test: /\.ico$|\.svg$|\.eot|\.woff$/,
            use: ['file-loader?emitFile=false'],
            
        },
        {
            test: /\.(nb|sbnb)$/,
            use: 'raw-loader',
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
            STARBOARD_NOTEBOOK_VERSION: JSON.stringify(pkg.version),
        }),
        new MonacoWebpackPlugin({
            languages: [
                "markdown", "html", "css", "javascript", "typescript", "python", "coffee",
            ],
            features: [
                "!toggleHighContrast", "!gotoSymbol"
            ]
        }),
    ],
    devServer: {
        contentBase: path.join(__dirname, './dist/'),
        compress: true,
        port: 9001,
        hot: true,
        historyApiFallback: false
    },
}

module.exports = (env, argv) => {
    const config = baseConfig;

    if (argv.mode === "development") {
        config.devtool = 'inline-source-map'
        config.output.publicPath = "/"

        // We need these packages for livereload to work, so we can't exclude them in the dev build
        delete config.externals["url"];
        delete config.externals["punycode"];
        delete config.externals["events"];
    }
    


    return config;
};


