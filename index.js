// Example express application adding the parse-server module to expose Parse
// compatible API routes.
require('app-module-path').addPath(__dirname);
var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

process.env.DATABASE_URI = 'mongodb://mattersight:Abc123@ds011261.mlab.com:11261/heroku_tn8vd0q9';
process.env.PARSEDEV_APP_PATH = './cloud';
var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}


var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://mattersight:Abc123@ds011261.mlab.com:11261/heroku_tn8vd0q9',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'emnNcRVhoszLtAzLWWOdcW7O9TjL4KnN7QH7cDQC',
  masterKey: process.env.MASTER_KEY || 'ELl0QP5W8yL30HmnIECAjSXEmwEL3OoZUt7qVIY4', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:3001/parse',  // Don't forget to change to https if needed
  verbose: true,
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();


// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

var port = process.env.PORT || 3001;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
  console.log('parse-server running on port ' + port + '.');
});


//require('./cloud/main.js');