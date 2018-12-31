const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const middleware = require('webpack-dev-middleware');
const compiler = webpack({
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ],
  resolve: {
    modules: ['node_modules', path.resolve(`node_modules/altspace/node_modules`)],
    alias: {
      //firebase: path.resolve(`node_modules/altspace/lib/firebase.min`),
      //urllib: path.resolve(`node_modules/altspace/lib/url.min`),
      //please: path.resolve(`node_modules/altspace/lib/Please.min`),
    },
  },
  devServer: {
    contentBase: './',
    hot: true
  },
});
const express = require('express');
const app = express();

app.use(middleware(compiler, {
  // webpack-dev-middleware options
}));
/*
app.get('/skullart.stl', (req, res) => {
    res.render('skullart.stl');
});
*/
app.use(express.static('public'))
/*
app.get('/', (req, res) => {


  if(/AltspaceVR\-App/.test(req.headers['user-agent'])) {
    console.log('In VR!');
    res.render('index.html');
  } else {
    res.send(
`<!DOCTYPE><html><head><title>Spee.ch VR</title></head><body>Error: Must be ran in AltspaceVR</body></html>`
    );
  }
});
*/

app.listen(8000, () => {
  console.log('Example app listening on port 8000!')
});
