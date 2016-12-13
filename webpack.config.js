/* eslint-env node */

module.exports = {
  entry: './src/Dictation.js',
  devtool: 'source-map',
  output: {
    path: __dirname + '/dist',
    filename: 'Dictation.js',
    library: 'Dictation',
    libraryTarget: 'umd'
  },
  externals: {
    'react': {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react'
    }
  },
  module: {
    loaders: [
      { test: /\.js$/, loaders: ['babel-loader'], exclude: /node_modules/ }
    ]
  }
}
