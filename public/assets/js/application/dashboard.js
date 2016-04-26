function DashboardModule(){
    this.init = function () {
        (new UTILS.User()).getAssessments(function (assessments) {
            var inProgress = false;
            for (var assessmentIndex = 0; assessmentIndex < assessments.length; assessmentIndex++) {
                $('.js-no-assessment').hide();
                var assessment = assessments[assessmentIndex];
                var assessmentData = $('<tr></tr>').
                    append('<td>' + (assessment.get("completed") ? assessment.id : '<a href="/quiz/assessment?id=' + assessment.id + '">' + assessment.id + '</a>') + '</td>').
                    append('<td>' + assessment.createdAt + '</td>').
                    append('<td><img src="' + (assessment.get("completed") ? '/assets/images/tick.png' : '/assets/images/cross.png') + '"/></td>').
                    append('<td>' + (assessment.get("completedAt") == "undefined" || assessment.get("completedAt") == null ? '-' : assessment.get("completedAt")) + '</td>');
                assessmentData.data('obj', assessment);
                $('.js-assessment-table').append(assessmentData);
                if (!inProgress && !assessment.get("completed")) {
                    inProgress = true;
                }
            }
            $('.js-loader').hide();
            if (!inProgress) {
                $('.js-start-assessment').show();
            }
        }, function () {
            alert("Could not fetch assessments. Please try again later.");
        });
    };
}
