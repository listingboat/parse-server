function RecalculateScoreModule(){
    var thisInstance = this;
    thisInstance.constants = {
        smallBatchCount: 10
    };

    this.init = function(options){
        $.extend(this, options);
        recalculateUserCache(); 
    };

    function recalculateUserCache(){
        function getUserResponseBatch(currentPageCount, createdAfter){
            var finalIndex = ((currentPageCount + 1) * thisInstance.constants.smallBatchCount > thisInstance.batchCount) ? thisInstance.batchCount : (currentPageCount + 1) * thisInstance.constants.smallBatchCount;
            for(var currentBatch = currentPageCount * thisInstance.constants.smallBatchCount; currentBatch < finalIndex; currentBatch++){
                $.ajax({
                    type: "post",
                    url: thisInstance.getUserResponsesUrl,
                    data: {
                        batchNumber : currentBatch,
                        batchCount: thisInstance.batchCount,
                        hashTimeStamp: thisInstance.hashTimeStamp,
                        batchCountHash: thisInstance.batchCountHash,
                        userId: thisInstance.userId,
                        createdAfter : createdAfter,
                        smallBatchCount: thisInstance.constants.smallBatchCount
                    },
                    success: function(data){
                        if(data.responseData.batchNumber == finalIndex -1 && data.lastResponseCreatedAt){
                            getUserResponseBatch(currentPageCount + 1, data.lastResponseCreatedAt);
                        }
                        getResponseSuccessCallback(data);
                    }
                });
            }
        }

        thisInstance.responseCount = 0;
        thisInstance.allReceivedResponse = [];
        getUserResponseBatch(0);

    }

    function getResponseSuccessCallback(data){
        thisInstance.responseCount++;
        thisInstance.allReceivedResponse.push(data);
        if(thisInstance.responseCount >= thisInstance.batchCount){
            thisInstance.allReceivedResponse =  JSON.stringify(thisInstance.allReceivedResponse);
            $.ajax({
                type: "post",
                url: thisInstance.recalculateCacheTableUrl,
                data: {
                    batchCountHash: thisInstance.batchCountHash,
                    hashTimeStamp: thisInstance.hashTimeStamp,
                    userId: thisInstance.userId,
                    responseBatches: thisInstance.allReceivedResponse
                },
                success: thisInstance.successCallback,
                error: thisInstance.errorCallback
            });
        }
    }

}
