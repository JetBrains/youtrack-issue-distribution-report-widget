const {join, resolve} = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ringUiWebpackConfig = require('@jetbrains/ring-ui/webpack.config');

const pkgConfig = require('./package.json').config;

const componentsPath = join(__dirname, pkgConfig.components);

// Patch @jetbrains/ring-ui svg-sprite-loader config
ringUiWebpackConfig.loaders.svgInlineLoader.include.push(
  require('@jetbrains/logos'),
  require('@jetbrains/icons')
);

const webpackConfig = () => ({
  entry: `${componentsPath}/app/app.js`,
  resolve: {
    mainFields: ['module', 'browser', 'main'],
    alias: {
      react: resolve('./node_modules/react'),
      fecha: resolve('../../components/node_modules/fecha'),
      'react-dom': resolve('./node_modules/react-dom'),
      '@jetbrains/ring-ui': resolve('./node_modules/@jetbrains/ring-ui'),
      'hub-dashboard-addons/dist/localization': resolve('./node_modules/hub-dashboard-addons/components/localization/src/localization.js')
    }
  },
  output: {
    path: resolve(__dirname, pkgConfig.dist),
    filename: '[name].js',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]'
  },
  module: {
    rules: [
      ...ringUiWebpackConfig.config.module.rules,
      {
        test: /\.scss$/,
        include: [
          componentsPath,
          join(__dirname, '../../components')
        ],
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.css$/,
        exclude: [componentsPath, ringUiWebpackConfig.componentsPath],
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.js$/,
        include: [
          join(__dirname, 'node_modules/chai-as-promised'),
          join(__dirname, 'node_modules/hub-dashboard-addons'),
          join(__dirname, '../../components'),
          componentsPath
        ],
        loader: 'babel-loader?cacheDirectory'
      },
      {
        test: /\.po$/,
        include: componentsPath,
        use: [
          'json-loader',
          {
            loader: 'angular-gettext-loader',
            options: {format: 'json'}
          }
        ]
      }
    ]
  },
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    stats: {
      assets: false,
      children: false,
      chunks: false,
      hash: false,
      version: false
    },
    disableHostCheck: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'html-loader?interpolate!src/index.html'
    }),
    new CopyWebpackPlugin([
      'manifest.json'
    ], {})
  ]
});

module.exports = webpackConfig;
