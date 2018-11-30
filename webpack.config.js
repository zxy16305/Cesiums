var path = require('path');
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
var os = require('os');
const HappyPack = require('happypack');


var config = {
    defaultPath: '/dist',
    path: {
        src: '/src',
        dist: '/dist'
    }
};

module.exports = {
    optimization:{
        minimizer: [
            new UglifyJsPlugin({
                cache: true,
                parallel: true,
                // sourceMap: true ,// set to true if you want JS source maps
                uglifyOptions:{
                    keep_fnames: true
                }
            }),
            new OptimizeCSSAssetsPlugin({})
        ]
    },
    entry: {
        Cesiums: [__dirname + config.path.src]
    },
    externals: {
        Cesium: 'Cesium'
    },
    output: {
        publicPath: config.defaultPath,
        path: path.join(__dirname, config.path.dist),
        filename: '[name].min.js',
        libraryTarget: 'umd',
        // `library` 声明全局变量
        library: '[name]'
    },
    // devtool: 'source-map',//生产环境源码分离
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                // use: {
                //     loader: 'babel-loader',
                //     options: {
                //         presets: ['es2015']
                //     }
                // }
                use: 'happypack/loader?id=js-happy'
            },{
                test: /\.css$/,
                exclude: /(node_modules|bower_components)/,
                use:[{
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
            filename: "[name].min.css",
            chunkFilename: "[id].min.css"
        }),
        new HappyPack({
            id: "js-happy",
            threads: os.cpus().length,
            loaders: [{
                loader: 'babel-loader',
                options: {
                    presets: ['es2015'],
                    cacheDirectory: true
                }
            }]
        })
    ]
};
