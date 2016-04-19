var commonUtils = require('./cloud/apps/common/utils.js'),
    appSettings = require('./cloud/app_settings.js'),
    secret = require('./cloud/secret.js');

exports.report155Controller = function(req, res){

    function errorCallback(error){
        res.send({success: false});
    }

    var hashReceived = req.body.hash,
        timeStamp = req.body.timeStamp;
    if(commonUtils.validateReportErrorData(hashReceived, timeStamp)){
        commonUtils.report155ToAdminList(
            appSettings.REPORT_ERROR_MAIL_DATA.CAMPAIGN_ID,
            appSettings.REPORT_ERROR_MAIL_DATA.EMAIL_TEMPLATE_ID,
            appSettings.REPORT_ERROR_MAIL_DATA.ADMIN_LIST_ID,
            function(){
                res.send({success: false});
            }, errorCallback
        );
    }
    else{
        errorCallback();
    }
};


exports.getVideoThumbnail = function(req, res) {
    var videoHash = req.params.video_hash;
    var videoUrl = 'https://api.wistia.com/v1/medias/'+videoHash+'.json?api_password='+secret.WistisAPIPassword;
    var thumbnailPath;

    Parse.Cloud.httpRequest({
        url: videoUrl,
        success: function(httpResponse) {
            var videoJson = JSON.parse(httpResponse.text);
            thumbnailPath = videoJson.thumbnail.url;
            thumbnailPath = thumbnailPath.replace(/(\?.*)$/i, '');
            Parse.Cloud.httpRequest({
                url: thumbnailPath,
                success: function(response) {
                    res.writeHead(200, {    // set the head of the response
                        'Content-type': 'image/jpg',    // content type of the response
                        'Content-Length': response.buffer.length,
                        'Request-Url': req.url
                    });
                    res.end(response.buffer);    // sends the image
                },
                error: function(response) {
                    res.status(500).end();
                }
            });
        },
        error: function(httpResponse) {
            res.status(500).end();
        }
    });
};
