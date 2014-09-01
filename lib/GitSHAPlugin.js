var async = require('async'),
    gitsha = require('git-bundle-sha'),

    CHUNKGITSHA_REGEXP = /\[chunkgitsha\]/gi;

function GitSHAPlugin(options) {
  options = options || {};
  this.shaLength = options.shaLength || 7;
}
module.exports = GitSHAPlugin;

GitSHAPlugin.prototype.constructor = GitSHAPlugin;
GitSHAPlugin.prototype.apply = function(compiler) {
  var replaceSha = this.replaceSha.bind(this);
  compiler.plugin("compilation", function(compilation) {
    // we need an async hook because we are calling out to asynchronous
    // processes to get the git SHA of the chunks. optimize-tree runs before
    // final hashes and asset paths are computed, so it's most appropriate.
    compilation.plugin("optimize-tree", function(chunks, modules, done) {
      var tasks = chunks.map(function (chunk) {
        return gitsha.bind(null, chunk.modules.map(function (m) {
          return m.resource;
        }).filter(Boolean));
      });

      async.parallel(tasks, function(err, res) {
        if (err) return done(err);

        res.forEach(function (chunkSha, i) {
          chunks[i].gitsha = chunkSha;
        });
        done();
      });
    });

    compilation.mainTemplate.plugin("asset-path", replaceSha);
  });
};

GitSHAPlugin.prototype.replaceSha = function(path, data) {
  var sha = data.chunk && data.chunk.gitsha;
  return path.replace(CHUNKGITSHA_REGEXP, (sha || "").slice(0, this.shaLength));
};
