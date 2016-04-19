(function(exports) {
    exports.asset_helper = function(assetHashes) {
        assetHashes = assetHashes || (require('./cloud/asset_hash.js')).assetHashes;
        exports.registerAssetHelper = function (app, env) {
            var assetHelper = (env === 'production') ? exports.asset : function (path, throwError) {
                return exports.asset(path, ((typeof throwError === "undefined") ? true : throwError));
            };
            if (app.helpers) {
                var helpers = {};
                helpers.asset = assetHelper;
                app.helpers(helpers);
            }
            app.locals = app.locals || {};
            app.locals.asset = assetHelper;
        };

        exports.asset = function (path, throwError) {
            if (typeof path == "string" && path.trim() !== '') {
                path = path.trim();
                path = (path[0] === '/' ? path.slice(1) : path);
                var paramExistIndex = path.indexOf('?'),
                    pathKey = (paramExistIndex !== -1) ? path.slice(0, paramExistIndex) : path;
                var hsIndexingIndex = pathKey.indexOf('#');
                pathKey = (hsIndexingIndex !== -1) ? pathKey.slice(0, hsIndexingIndex) : pathKey;
                var assetHash = assetHashes[pathKey];
                if (assetHash) {
                    return ('/' + path + ((paramExistIndex === -1) ? "?hash=" : "&hash=") + assetHash);
                }
                else if (!throwError) {
                    return ('/' + path);
                }
                else throw("Asset with path " + path + " does not exists");
            }
            else throw('Invalid path');
        };
        return exports;
    }
})(exports);
