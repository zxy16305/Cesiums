var path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin')
var JsDocPlugin = require('jsdoc-webpack-plugin-v2');

var config = {
    defaultPath: '/dist',
    path: {
        src: '/src',
        dist: '/dist'
    }
};

module.exports = {
    entry: {
        Cesiums: [__dirname + config.path.src]
    },
    externals: {
        Cesium: 'Cesium'
    },
    output: {
        publicPath: config.defaultPath,
        path: path.join(__dirname, config.path.dist),
        filename: '[name].js',
        libraryTarget: 'umd',
        // `library` 声明全局变量
        library: '[name]'
    },
    devtool: 'eval-source-map',//可以保证调试行对应
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['es2015']
                    }
                }
            }, {
                test: /\.css$/,
                exclude: /(node_modules|bower_components)/,
                use: [{
                    loader: MiniCssExtractPlugin.loader,
                    options: {
                        // you can specify a publicPath here
                        // by default it use publicPath in webpackOptions.output
                        publicPath: '../'
                    }
                },
                    "css-loader"]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        }),
        // new CopyWebpackPlugin([{
        //     from: "./resources/**",
        //     to: "./"
        // }])
    ]
};