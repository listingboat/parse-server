// Provides endpoints for common app

exports.controllers = function (app) {
    var controller = require('cloud/apps/common/controller.js'), // explore app controller path
        decorators = require('cloud/decorators');

    app.post('/common/report-155', 'assessment.report155', controller.report155Controller); // route to report 155 or 124 error

    app.get('/video-thumbnail/:video_hash', 'video.thumbnail', controller.getVideoThumbnail);
};
