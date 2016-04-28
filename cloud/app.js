var express = require('express'), // integrate express framework
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    cookieSession = require('cookie-session'),
    expressLayouts = require('./packages/express-layout'), // express layout plugin to manage templates layout
    parseExpressHttpsRedirect = require('parse-express-https-redirect'),
    parseExpressCookieSession = require('parse-express-cookie-session'), // express session cookie plugin
    secret = require('./secret'), // contains secret key
    Router = require('./packages/router'), // plugin to override express routes. It supports reversing of url
    app_settings = require('./app_settings.js'),
    asset_helper = (require('./asset_helper.js')).asset_helper(),
    env = app_settings.PRODUCTION? 'production': 'development',
    router = new Router(),
    app = express(),
    cookieOptions = {maxAge: 60 * 24 * 60 * 60 * 1000};
;

// Configure the app
router.extendExpress(app); // overriding app routes
router.registerAppHelpers(app); // adding helper for app
asset_helper.registerAssetHelper(app, env); // adding helper for app
app.set('views', 'cloud/views'); // set path for ejs templates
app.set('view engine', 'ejs'); // integrate ejs with app
app.use(parseExpressHttpsRedirect());  // Require user to be on HTTPS.
app.use(expressLayouts); // integrate express layout with app
app.use(bodyParser());
app.use(methodOverride());
app.use(cookieParser(secret.cookie_key)); // telling express to use secret key for cookie
app.use(cookieSession({keys:[secret.cookie_key]})); // telling express to use secret key for cookie
app.use(parseExpressCookieSession({ // cookie configuration
    cookie: {
        maxAge: cookieOptions.maxAge
    },
    fetchUser: true
}));

// Serve static assets from the /public/assets folder
var path = require('path');
app.use(express.static(path.join(__dirname , '../public')));


// Define all the endpoints
var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

Parse.User.enableUnsafeCurrentUser();

if (!databaseUri) {
    console.log('DATABASE_URI not specified, falling back to localhost.');
}

// Add Google Analytics, HotJar, SumoMe tracking id in template context
app.use(function(req, res, next){
    res.locals = res.locals || {};
    res.locals.GOOGLE_ANALYTICS_TRACKING_ID = app_settings.GOOGLE_ANALYTICS_TRACKING_ID;
    res.locals.HOT_JAR_TRACKING_ID = app_settings.HOT_JAR_TRACKING_ID;
    res.locals.SUMO_ME_TRACKING_ID = app_settings.SUMO_ME_TRACKING_ID;
    next();
});

// Middleware to add error callback in req object
app.use(function(req, res, next){

    function createHashForReport() {
        var securityKey1 = secret.securityKey1,
            securityKey2 = secret.securityKey2,
            reportTimeStamp = new Date().getTime(),
            hash = require('cloud/packages/md5.js').hex_md5(securityKey1 + reportTimeStamp + securityKey2);
        return {hash: hash, timeStamp: reportTimeStamp};
    }

    req.errorCallback = function(error) {
        console.error("URL: " + req.originalUrl);
        console.error(error);
        console.error(JSON.stringify(error));
        if (req.currentUser && req.currentUser.id) {
            console.error("User ID : " + req.currentUser.id);
            console.error((new Error()).stack);
        }
        if (error && error.code && error.code == 155) {
            var hashData = createHashForReport(),
                context = {
                    reportUrl: req.app.namedRoutes.build('assessment.report155'),
                    reportHash: hashData.hash,
                    reportTimeStamp: hashData.timeStamp
                };
            if (req.xhr) {
                context['errorCode'] = 155;
                res.status(500).send(context);
            }
            else {
                res.render('common/500', context);
            }
        }
        else if (error && error.code && error.code == 206) { // handle user session error 206
            req.session = {};
            Parse.User.logOut();
            if (req.xhr) {
                res.status(404).end();
            }
            else{
                res.redirect(req.app.namedRoutes.build('user.auth'));
            }
        }
        else {
            if (req.xhr) {
                res.status(500).send();
            }
            else {
                res.render('common/500');
            }
        }
    };
    next();
});

// Middleware to handle 500 error on rendering template
app.use(function(req, res, next) {
    var _render = res.render;

    res.render = function(view, options, fn) {
        var options = options || {};
        // support callback function as second arg
        if ('function' == typeof options) {
            fn = options, options = {};
        }

        _render.call(res, view, options, function(error, html) {
            if(error) {
                console.error("URL: " + req.originalUrl);
                console.error(error);
                console.error(JSON.stringify(error));
                console.error((new Error()).stack);
                if(req.currentUser && req.currentUser.id){
                    console.error("User ID : "+ req.currentUser.id);
                }
                res.status(500);
                _render.call(res, 'common/500');
            }
            else if (fn){
                fn(error, html);
            }
            else{
                res.send(html);
            }
        });
    };
    next();
});

// Assessment controllers
(require('./apps/assessment/routes')).controllers(app);

// Common controllers
(require('./apps/common/routes')).controllers(app);

// Explore controllers
(require('./apps/explore/routes')).controllers(app);

// Quiz controllers
(require('./apps/quiz/routes')).controllers(app);

// User controllers
(require('./apps/user/routes')).controllers(app);

// Settings controllers
(require('./apps/settings/routes')).controllers(app);

// Company controllers
(require('./apps/company/routes')).controllers(app);

// Leader Board controllers
(require('./apps/leader_board/routes')).controllers(app);

// User Settings controllers
(require('./apps/user_settings/routes')).controllers(app);

// Analytics controllers
(require('./apps/analytics/routes')).controllers(app);

// contest controllers
(require('./apps/contest/routes')).controllers(app);

// UI Statics endpoints
app.use('/ui-statics', require('./apps/ui-statics/routes'));

// robots.txt for web crawlers
app.use('/robots.txt', function(req, res){
    res.render('common/robots', {layout: 'layout_partial.ejs'}, function (err, robotsContent) {
        res.writeHead(200, {    // set the head of the response
            'Content-type': 'text/plain',    // content type of the response
            'Content-Length': robotsContent.length
        });
        res.end(robotsContent); // write robots Content to response
    });
});

// shows 404 error in case someone tries to access url which do not exist on this app
app.use(function(req, res) {
    var staticURLRegex = /^(\/(assets|static))+/i;
    if (req.xhr) {
        res.status(404).end();
    }
    else {
        if(staticURLRegex.test(req.url)) {
            next();
        }
        else {
            res.render('common/404');
        }
    }
});

// shows 500 error.
app.use(function(err, req, res, next) {
    var staticURLRegex = /^(\/(assets|static))+/i;
    if(staticURLRegex.test(req.url)) {
        next();
    }
    else {
        console.error("URL: " + req.originalUrl);
        console.error(JSON.stringify(err));
        if (req.currentUser && req.currentUser.id) {
            console.error("User ID : " + req.currentUser.id);
            console.error((new Error()).stack);
        }
        if (req.xhr) {
            res.status(500).end();
        }
        else {
            res.status(500).render('common/500');
        }
    }
});

app.listen(3000, function () {
    console.log ("Express listening on 3000");
});
