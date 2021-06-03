const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

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
    stats: "minimal",
    module: {
        rules: [{
            test: /\.tsx?$/,
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
        { // KaTeX ttf fonts are not omitted. Starboard only supports browsers that understand woff2 anyway.
            test: /(KaTeX).*\.ttf$/,
            use: ['file-loader?emitFile=false'],
        },
        {
            test: /\.ico$|\.svg$|\.eot|\.woff$/,
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

    return config;
};