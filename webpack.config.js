const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: {
            popup: './popup/popup.js',
            options: './options/options.js',
            background: './background/background.js',
            content: './content-scripts/content.js'
        },

        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: (pathData) => {
                const { chunk } = pathData;
                switch (chunk.name) {
                    case 'popup':
                        return 'popup/popup.js';
                    case 'options':
                        return 'options/options.js';
                    case 'background':
                        return 'background/background.js';
                    case 'content':
                        return 'content-scripts/content.js';
                    default:
                        return '[name].js';
                }
            },
            clean: true
        },

        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader']
                }
            ]
        },

        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    // Copy manifest.json
                    {
                        from: 'manifest.json',
                        to: 'manifest.json'
                    },
                    // Copy HTML files
                    {
                        from: 'popup/popup.html',
                        to: 'popup/popup.html'
                    },
                    {
                        from: 'options/options.html',
                        to: 'options/options.html'
                    },
                    // Copy CSS files
                    {
                        from: 'popup/popup.css',
                        to: 'popup/popup.css'
                    },
                    {
                        from: 'options/options.css',
                        to: 'options/options.css'
                    },
                    // Copy icons (if they exist)
                    {
                        from: 'popup/icons',
                        to: 'popup/icons',
                        noErrorOnMissing: true
                    }
                ]
            })
        ],

        devtool: isProduction ? false : 'source-map',

        mode: isProduction ? 'production' : 'development',

        optimization: {
            minimize: isProduction,
            splitChunks: false // Don't split chunks for browser extensions
        },

        resolve: {
            extensions: ['.js', '.json']
        },

        // Ensure browser APIs are treated as externals (not bundled)
        externals: {
            'webextension-polyfill': 'browser'
        },

        performance: {
            hints: false // Disable performance warnings for browser extensions
        },

        stats: {
            colors: true,
            modules: false,
            children: false,
            chunks: false,
            chunkModules: false
        }
    };
};