const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

module.exports = (env, argv) => [
  // 1. UI — builds first, inlines JS into ui.html
  {
    name: 'ui',
    entry: './src/ui/index.tsx',
    output: {
      filename: 'ui.js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [
        { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
        { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      ],
    },
    resolve: { extensions: ['.tsx', '.ts', '.js'] },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/ui/index.html',
        filename: 'ui.html',
        inject: 'body',
      }),
      new HtmlInlineScriptPlugin(), // inlines ui.js into ui.html
    ],
  },
  // 2. Plugin sandbox — builds after UI, reads ui.html to define __html__
  {
    name: 'plugin',
    dependencies: ['ui'], // ensures UI builds first
    entry: './src/plugin/main.ts',
    output: {
      filename: 'code.js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [{ test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ }],
    },
    resolve: { extensions: ['.ts', '.js'] },
    target: 'node',
    plugins: [
      new webpack.DefinePlugin({
        __html__: webpack.DefinePlugin.runtimeValue(
          () => {
            const htmlPath = path.resolve(__dirname, 'dist', 'ui.html');
            return JSON.stringify(fs.readFileSync(htmlPath, 'utf8'));
          },
          { fileDependencies: [path.resolve(__dirname, 'dist', 'ui.html')] }
        ),
      }),
    ],
  },
];
