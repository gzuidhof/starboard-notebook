const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const webpack = require('webpack')

const pkg = require("./package.json");

const baseConfig = {
    entry: {
        starboardNotebook: './src/main.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: "starboard-notebook.js",
        publicPath: "./",
        chunkFilename: '[name].bundle.js',
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
    },
    stats: "minimal",
    module: {
        rules: [{
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
            exclude: /node_modules/,
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
        },
        {
            test: /.ico$|.svg$|.eot|woff$/,
            use: ['file-loader?emitFile=false'],
            
        },
        {
            test: /\.nb$/,
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
                "markdown", "html", "css", "javascript", "typescript", "python",
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
    }
    return config;
};


