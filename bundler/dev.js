// development config
const { resolve } = require('path');
const { merge } = require('webpack-merge');
const commonConfig = require('./common');
const webpack = require('webpack');

module.exports = merge(commonConfig, {
    mode: 'development',
    entry: [
        'webpack-dev-server/client?http://localhost:8080', // bundle the client for webpack-dev-server and connect to the provided endpoint
        './index.tsx', // the entry point of our app
    ],
    output: {
        path: resolve(__dirname, '../../dist'),
        filename: 'main.js',
        publicPath: '/',
    },
    devServer: {
        historyApiFallback: true, // fixes error 404-ish errors when using react router :see this SO question: https://stackoverflow.com/questions/43209666/react-router-v4-cannot-get-url
        open: true,
    },
    devtool: 'cheap-module-source-map',
    plugins: [
    ],
});
