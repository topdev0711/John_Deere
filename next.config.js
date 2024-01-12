const withTm = require('next-transpile-modules');
const path = require('path');

module.exports = withTm({
  transpileModules: [
    'csv-parse'
  ],
  reactStrictMode: false,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.node = {
      ...(config.node || {}),
      net: 'empty',
      tls: 'empty',
      dns: 'empty'
    };
    config.resolve.alias['@babel/runtime'] = path.resolve(
      __dirname,
      'node_modules',
      '@babel/runtime'
    );
    config.resolve.alias['component-emitter'] = path.resolve(
      __dirname,
      'node_modules',
      'component-emitter'
    );
    config.resolve.alias['isarray'] = path.resolve(
      __dirname,
      'node_modules',
      'isarray'
    );
    config.resolve.alias['uuid'] = path.resolve(
      __dirname,
      'node_modules',
      'uuid'
    );
    config.resolve.alias['react-is'] = path.resolve(
      __dirname,
      'node_modules',
      'react-is'
    );
    config.resolve.alias['prop-types'] = path.resolve(
      __dirname,
      'node_modules',
      'prop-types'
    );
    config.resolve.alias['inherits'] = path.resolve(
      __dirname,
      'node_modules',
      'inherits'
    );
    config.resolve.alias['uncontrollable'] = path.resolve(
      __dirname,
      'node_modules',
      'uncontrollable'
    );
    config.resolve.alias['@emotion/memoize'] = path.resolve(
      __dirname,
      'node_modules',
      '@emotion/memoize'
    );

    config.module.rules.push({
      test: /@?(react-virtualized-auto-sizer).*.(ts|js)x?$/,
      use: defaultLoaders.babel,
      include: [path.resolve(__dirname, "node_modules")],
    })

    config.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/))
    return config;
  }
})


