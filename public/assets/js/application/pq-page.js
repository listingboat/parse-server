function PQPageModule(){
    var thisInstance = this;
    thisInstance.constants = {
        selectors: {
            identifyScoreSection: "#IdentifyScore",
            understandScoreSection: "#UnderstandScore",
            connectScoreSection: "#ConnectScore",
            totalScoreSection: "#PQScore",
            smallBadge: ".js-small-badge",
            largeBadge: ".js-large-badge",
            halfPageLoader: ".js_half_page_loader",
            circleSection: ".js_circle_section"
        }
    };
    thisInstance.init = function(data){
            if(!data.renderScoreSection){
                (new RecalculateScoreModule()).init({
                    batchCount: data.batchCount,
                    hashTimeStamp: data.hashTimeStamp,
                    batchCountHash: data.batchCountHash,
                    userId: data.userId,
                    getUserResponsesUrl: data.getUserResponsesUrl,
                    recalculateCacheTableUrl: data.recalculateCacheTableUrl,
                    successCallback: renderScoreSection
                });
            }
            else {
                renderScoreSection(data);
            }
        };
    function renderScoreSection(scoreData){
        var selector = thisInstance.constants.selectors;
        (new SkillGraphModule()).init(scoreData.skillGraphData);
        if(scoreData.partial){
            $(selector.circleSection).html(scoreData.partial);
        }
        var imageSrcPostfix = new Date().getTime();
        $(selector.identifyScoreSection).text(scoreData.skillGraphData.identify.score);
        $(selector.understandScoreSection).text(scoreData.skillGraphData.understand.score);
        $(selector.connectScoreSection).text(scoreData.skillGraphData.connect.score);
        $(selector.totalScoreSection).text(scoreData.skillGraphData.connect.score + scoreData.skillGraphData.understand.score + scoreData.skillGraphData.identify.score);
        $(selector.halfPageLoader).addClass('hide');
        if (!thisInstance.userId) {
            $(selector.smallBadge).attr('src', $(selector.smallBadge).attr('src') + '?_=' + imageSrcPostfix);
            $(selector.largeBadge).attr('src', $(selector.largeBadge).attr('src') + '?_=' + imageSrcPostfix);
            (new ZeroClipBoardModule()).init();
        }
    }
};
