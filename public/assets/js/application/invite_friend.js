function InviteFriendModule(){
    var thisInstance = this;
    thisInstance.constants = {  // constants
        selector: {
            inviteFriend: '.js_invite_friend',
            friendEmailField: '.js_friend_email',
            inviteForm: '#invite-friend-form',
            errorModal: '#id-upload-csv-error',
            successModal: '#id-upload-csv-success',
            allInvitesUsedModal: "#id-all-invites-used",
            message: '.js_message',
            loader: ".js-full-page-loader"
        }
    };
    this.init = function(){
        inviteFormBinding();
    };

    function inviteFormBinding(){
        var selector = thisInstance.constants.selector;
        $(selector.inviteForm).submit(function(event){
            event.preventDefault();
            if(validateEmail()){
                $(selector.loader).addClass('hide');
                sendInvite();
            }
            else{
                showErrorModal("Invalid Email Format");
            }
        });

        function validateEmail() {
            var emailValidator = /\S+@\S+\.\S+/i,
                selector = thisInstance.constants.selector,
                friendEmail = $(selector.friendEmailField);
            friendEmail.val(friendEmail.val().trim());
            return (friendEmail.val().match(emailValidator));
        }

        function sendInvite(){
            var selector = thisInstance.constants.selector,
                friendEmail = $.trim($(selector.friendEmailField).val()),
                url = $(selector.inviteFriend).data("invite_friend_url");
            $(selector.loader).removeClass('hide');
            $.ajax({
                type: "post",
                url: url,
                data: {
                    email: friendEmail
                },
                success: function(result){
                    if(result){
                        if(result.success){
                            $(selector.friendEmailField).val("");
                            $(selector.successModal).modal('show');
                            addFriendInPardot(result.pardotCallData);
                        }
                        else if(result.invalidEmail){
                            showErrorModal("Invalid Email Format");
                        }
                        else if(result.alreadyRegistered){
                            showErrorModal("User Already Exist");
                        }
                        else if(result.maxInvitesReached){
                            $(selector.friendEmailField).val("");
                            $(selector.allInvitesUsedModal).modal('show');
                        }
                        else if(result.alreadyInvited){
                            showErrorModal("User Already Invited");
                        }
                    }
                },
                error: function(){
                    showErrorModal("Something Went Wrong")
                }
            }).always(function(){
                $(selector.loader).addClass('hide');
            });
        }

        function showErrorModal(errorMessage) {
            var $errorModal = $(selector.errorModal);
            $errorModal.find(selector.message).text(errorMessage);
            $errorModal.modal('show');
        }

        function addFriendInPardot(data){
            var selector = thisInstance.constants.selector;
            $.ajax({
                type: "post",
                url: $(selector.inviteFriend).data("add_friend_in_pardot_url"),
                data: data
            });
        }
    }
}
