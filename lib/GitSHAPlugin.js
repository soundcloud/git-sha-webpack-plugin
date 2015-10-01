var async = require('async'),
    gitsha = require('git-bundle-sha'),
    path = require('path'),

    CHUNKGITSHA_REGEXP = /\[chunkgitsha\]/gi,
    STRIP_QUERY_REGEXP = /\?.*$/;

function GitSHAPlugin(options) {
  options = options || {};
  this.shaLength = options.shaLength || 7;
}
module.exports = GitSHAPlugin;

GitSHAPlugin.prototype.constructor = GitSHAPlugin;
GitSHAPlugin.prototype.apply = function(compiler) {
  var replaceSha = this.replaceSha.bind(this);
  var projectRoot = path.resolve();
  var cwdToProjectRoot = path.relative(process.cwd(), projectRoot) || '.';
  compiler.plugin("compilation", function(compilation) {
    // we need an async hook because we are calling out to asynchronous
    // processes to get the git SHA of the chunks. optimize-tree runs before
    // final hashes and asset paths are computed, so it's most appropriate.
    compilation.plugin("optimize-tree", function(chunks, modules, done) {
      var tasks = chunks.map(function (chunk) {
        var files = chunk.modules.map(function (m) {
          return m.resource
            && m.resource.indexOf(projectRoot) === 0
            // trim paths a bit - we can give git relative paths, and this
            // helps us avoid argument length limits
            && m.resource
              .replace(projectRoot, cwdToProjectRoot)
              .replace(STRIP_QUERY_REGEXP, '');
        }).filter(Boolean);

        return gitsha.bind(null, files);
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
