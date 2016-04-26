function InvitePageModule(){
    var thisInstance = this;

    thisInstance.selector = {
        departmentSetupStartButton: ".js_start_department_setup",   // button on setting page with GET STARTED on it
        inviteDiv: "#invite_div",    // actual invite page div
        questionTypeDiv: "#select-question-type-div",  // select question type main div
        departmentSetupDiv: "#department_setup_div",    // div with text box where we add departments
        toInvitePage: "#to-invite-page",    // back button on add department page
        departmentSetupGetStarted: '#start-department-settings-section',
        bulkInviteDiv: '#invite-employees-section'
    };

    thisInstance.init = function(options){
        var selector = thisInstance.selector;
        (new InviteFriendModule()).init();
        if((options.isAccountOwner && !options.isDepartmentSetupRequired)  || options.isSuperAdmin) {
            (new UserInviteModule()).init({isSuperAdmin:((typeof options.isSuperAdmin === 'undefined')? false: options.isSuperAdmin)});
            (new AddCompanyModule()).init();
        }
        else if(options.isAccountOwner){
            $(selector.departmentSetupDiv).addClass("hide");
            // binds button to go on invite page
            $(selector.toInvitePage).click(function () {
                $(selector.departmentSetupDiv).addClass("hide");
                $(selector.inviteDiv).removeClass("hide");
            });
            (new InitialDepartmentSetupModule()).init({setupCompleteCallback: function(){
                $(selector.departmentSetupDiv).addClass("hide");
                $(selector.inviteDiv).removeClass("hide");
                $(selector.departmentSetupGetStarted).addClass('hide');
                $(selector.bulkInviteDiv).removeClass('hide');
                (new UserInviteModule()).init({isSuperAdmin:((typeof options.isSuperAdmin === 'undefined')? false: options.isSuperAdmin)});
            }});
        }
    }

}