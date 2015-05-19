# git-sha-webpack-plugin

Allows tagging a webpack bundle or chunk with the Git SHA of the latest commit affecting that bundle. Useful for when you want to use long-term caching of your bundles, but want to tie the hash to something real and traceable.

## Usage

Install via npm:

```shell
npm install git-sha-webpack-plugin
```

And then require for use in webpack:

```javascript
// in webpack.config.js (or similar)
var GitSHAPlugin = require('git-sha-webpack-plugin');

module.exports = {
  
  // your config values here

  output: {
    filename: '[chunkgitsha].js'
  },
  plugins: [
    new GitSHAPlugin({shaLength: 7})
  ]
}
```

### Options

#### `shaLength`

Allows truncating the SHA to a specific character length. 7 by default.
