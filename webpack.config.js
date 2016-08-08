
var webpack = require('webpack'),
    path = require('path');

module.exports = {
    // https://webpack.github.io/docs/build-performance.html#sourcemaps
    devtool: 'eval-source-map', // when build production app, set 'source-map'.

    devServer: {
        contentBase: './app',
        colors: true,
        noInfo: true, //  --no-info option
        // host: '',
        port: 9001,
        hot: true,
        inline: true
    },

	context: __dirname,

    entry: {
    	main: ['webpack/hot/dev-server'/*, 'babel-polyfill'*/, './app/src/main.js'],
      tab: ['webpack/hot/dev-server'/*, 'babel-polyfill'*/, './app/src/tab.js'],
      custom: ['webpack/hot/dev-server'/*, 'babel-polyfill'*/, './app/src/custom.js']
    },

    output: {
        path: __dirname +'/app/build',
        filename: "[name].js"
    },

    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" },
            { test: /\.jsx?$/, loaders: ['react-hot', 'babel'], exclude: /(node_modules|bower_components)/ }
        ]
    },

    plugins: [
		new webpack.HotModuleReplacementPlugin(),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
                drop_console: true,
				warnings: false
			},
			sourceMap: false,
			mangle: true
		})
	],

    resolve: {
    	// you can now require('file') instead of require('file.coffee')
		extension: ['', '.js', '.json', '.coffee']
    },
};