var userConstants = require('cloud/apps/user/constants.js'),
    commonConstants = require('cloud/apps/common/constants.js'),
    _ = require('underscore');
exports.loginRequired = function (req, res, next) {
    var currentUser = Parse.User.current();
    var expiryTimeMilliSeconds = req.cookies.rememberme;
    if (expiryTimeMilliSeconds && expiryTimeMilliSeconds > 0) {
        res.cookie('rememberme', expiryTimeMilliSeconds, {maxAge: expiryTimeMilliSeconds, httpOnly: true});
        if (currentUser && !currentUser.get("is_deleted")) {
            var lastActivity = currentUser.get('last_activity');
            if(lastActivity){
                lastActivity = lastActivity.getTime();
            }
            else{
                lastActivity = 1;
            }
            req.currentUser = currentUser;
            res.locals = _.extend(res.locals || {}, {
                isAccountOwner: (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type')),
                isSuperAdmin: (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')),
                isSupervisor: (userConstants.USER_PERMISSION_TYPE.SUPERVISOR === currentUser.get('permission_type')),
                permissionType: currentUser.get('permission_type'),
                userLastActivityTime: lastActivity,
                lastActivityUpdateInterval: commonConstants.LAST_ACTIVITY_UPDATE_INTERVAL,
                currentTime: new Date().getTime(),
                companyExists: currentUser.get('company') ? true: false
            });
            next();
        } else {
            Parse.User.logOut();
            if(!req.xhr) {
                req.session.redirectURL = req.url;
                res.redirect(req.app.namedRoutes.build('user.auth'));
            }
            else{
                res.status(401).end();
            }
        }
    } else {
        Parse.User.logOut();
        req.session = {};
        if (!req.xhr) {
            req.session.redirectURL = req.url;
            res.redirect(req.app.namedRoutes.build('user.auth'));
        }
        else {
            res.status(401).end();
        }
    }
};

exports.ajaxRequired = function (req, res, next) {
    if (req.xhr) {
        next();
    }
    else {
        res.render('common/404');
    }
};

exports.assessmentComplete = function (req, res, next) {
    if (req.currentUser.get('primary_personality')){
        next();
    }
    else {
        if (req.xhr) {
            res.status(404).end();
        }
        else {
            res.redirect(req.app.namedRoutes.build('assessment.question'));
        }
    }
};

exports.assessmentInComplete = function (req, res, next) {
    if (req.currentUser.get('primary_personality')) {
        if (req.xhr) {
            res.status(404).end();
        }
        else {
            res.redirect(req.app.namedRoutes.build('user.myPQ'));
        }
    }
    else {
        next();
    }
};

exports.adminRequired = function (req, res, next) {
    if (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === req.currentUser.get('permission_type') || (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === req.currentUser.get('permission_type'))) {
        next();
    }
    else {
        if (req.xhr) {
            res.status(404).end();
        }
        else {
            res.render('common/404');
        }
    }
};

// only allows super admins to pass , renders 404 otherwise
exports.superAdminRequired = function (req, res, next) {
    if (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === req.currentUser.get('permission_type')) {
        next();
    }
    else {
        if (req.xhr) {
            res.status(404).end();
        }
        else {
            res.render('common/404');
        }
    }
};

exports.companyExists = function (req, res, next) {
   if (req.currentUser.get('company')) {
        next();
    }
    else {
        if (req.xhr) {
            res.status(404).end();
        }
        else {
            res.render('common/404');
        }
    }
};
