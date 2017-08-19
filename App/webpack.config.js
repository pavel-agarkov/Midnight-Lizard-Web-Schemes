const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const AotPlugin = require('@ngtools/webpack').AotPlugin;
const CheckerPlugin = require('awesome-typescript-loader').CheckerPlugin;

module.exports = (env) =>
{
    // Configuration in common to both client-side and server-side bundles
    const isDevBuild = !(env && env.prod); process.env.r
    const clientBundleOutputDir = './wwwroot/dist';
    const sharedConfig = {
        stats: { modules: false },
        context: __dirname,
        resolve: { extensions: ['.js', '.ts'] },
        output: {
            filename: '[name].js',
            publicPath: '/dist/' // Webpack dev middleware, if enabled, handles requests for this URL prefix
        },
        module: {
            rules: [
                { test: /\.ts$/, include: /ClientApp/, use: ['awesome-typescript-loader?silent=true', 'angular2-template-loader'] },
                { test: /\.html$/, use: 'html-loader?minimize=false' },
                { test: /\.css$/, use: ['to-string-loader', isDevBuild ? 'css-loader' : 'css-loader?minimize'] },
                { test: /\.(png|jpg|jpeg|gif|svg)$/, use: 'url-loader?limit=25000' },
                {
                    test: /\.scss$/,
                    exclude: /node_modules/,
                    loaders: ['raw-loader', isDevBuild ? 'sass-loader' : 'sass-loader?minimize'] // sass-loader
                }
            ]
        },
        plugins:
        [
            new CheckerPlugin()
        ].concat(isDevBuild
            ? // Plugins that apply in development builds only
            [
                new webpack.SourceMapDevToolPlugin({
                    filename: '[file].map', // Remove this line if you prefer inline source maps
                    moduleFilenameTemplate: path.relative(clientBundleOutputDir, '[resourcePath]') // Point sourcemap entries to the original file locations on disk
                })
            ]
            : // Plugins that apply in production builds only
            [
                new webpack.optimize.UglifyJsPlugin({ comments: false, output: { comments: false } })
            ])
    };

    // Configuration for client-side bundle suitable for running in browsers
    const clientBundleConfig = merge(sharedConfig, {
        entry: {
            'main-client': './ClientApp/boot-client.ts'
        },
        output: {
            path: path.join(__dirname, clientBundleOutputDir),
            libraryTarget: 'var'
        },
        plugins: [
            new webpack.DllReferencePlugin({
                context: __dirname,
                manifest: require('./wwwroot/dist/vendor-manifest.json')
            })
        ].concat(isDevBuild ? [] : [
            new AotPlugin({
                tsConfigPath: './tsconfig.json',
                entryModule: path.join(__dirname, 'ClientApp/app/app.module.client#AppModule'),
                exclude: ['./**/*.server.ts']
            })])
    });

    const schemesBundleConfig = merge(sharedConfig, {
        entry: {
            'schemes-module': './ClientApp/app/modules/schemes.module.ts'
        },
        output: {
            path: path.join(__dirname, clientBundleOutputDir),
            libraryTarget: 'commonjs'
        },
        plugins: [
            new webpack.DllReferencePlugin({
                context: __dirname,
                manifest: require('./wwwroot/dist/vendor-manifest.json')
            })
        ].concat(isDevBuild ? [] : [
            new AotPlugin({
                tsConfigPath: './tsconfig.json',
                entryModule: path.join(__dirname, 'ClientApp/app/modules/schemes.module#SchemesModule'),
                exclude: ['./**/*.server.ts']
            })])
    });

    return [clientBundleConfig, schemesBundleConfig];
};
