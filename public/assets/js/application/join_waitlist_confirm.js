function JoinWaitListSuccessModule() {    // module for success of join wait list form
    this.init = function (pardotDataDict, url) {
        addUserToPardotJoinWaitList(url, pardotDataDict);  // Add user to pardot list
    };

    function addUserToPardotJoinWaitList(url, requestData) {
        $.ajax({
            url: url,
            data: requestData,
            type: "post"
        });
    }
}
