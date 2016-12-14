/* eslint-env node */

module.exports = {
  entry: './src/SpeechRecognition.js',
  devtool: 'source-map',
  output: {
    path: __dirname + '/dist',
    filename: 'SpeechRecognition.js',
    library: 'SpeechRecognition',
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
