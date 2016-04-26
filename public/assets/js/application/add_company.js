function AddCompanyModule() {// module to handle adding new company
    var thisInstance = this;

    thisInstance.constants = {  // constants
        selector: {
            companySelect: "#company-select",
            companySelectOption: ".js_company_select option",
            addCompany: ".js_add_company",
            companyNameInput: ".js_new_company_name",
            addCompanyModal: '#id-add-company-modal',
            successModal: "#id-company-added-success-modal",
            lastDomainDiv: ".js_active",
            newDomainField: ".js_new_domain_field",
            newDomainDiv: '.js_new_domain_div',
            removeDomainAnchor: '.js_remove_domain_anchor'
        },
        class: {
            lastDomainActiveClass: "active",    // class to hide 'X' button from text box
            lastDomainBeActiveClass: "js_active"  // class to add on last domain box
        }
    };

    thisInstance.init = function (options) {
        addCompanyBinding(); // add new company from user invite page.
        bindAddParentDomainBoxBinding(); // Adding company domain bindings
    };

    function addCompanyBinding() {
        var selector = thisInstance.constants.selector,
            $companyNameInput = $(selector.companyNameInput);

        var errorCallback = function($input, errorMessage) {
            $input.parent().find('.error-text-wrap').text(errorMessage);
            $input.parent().addClass('error-wrap');
        };

        var successCallback = function(company) {
            var $companySelect = $(selector.companySelect);
            // Add new company to the dropdown
            $companySelect.append($('<option>', {
                value: company.objectId,
                text: company.name
            }));
            $companySelect.selectpicker('refresh');
            // Clear the add company form fields
            $companyNameInput.val('');
            $(selector.newDomainDiv + ':not(' + selector.lastDomainDiv + ')').remove();

            $(selector.addCompanyModal).modal('hide');
            $(selector.successModal).modal('show');

            // add pardot list for company and update list id to company object
            addPardotListForCompany(company.objectId);
        };
        $(selector.addCompany).on('click', function() {
            var $this = $(this);
            var url = $this.data('add_company_url');
            addNewCompany(url, successCallback, errorCallback);
        });

        $(selector.companyNameInput).on('input', function() {
            $(this).parent().removeClass('error-wrap');
        });
    }

    function validateNewCompanyForm(errorCallback) {
        var selector = thisInstance.constants.selector,
            returnValue = true,
            $companyNameInput = $(selector.companyNameInput);

        var newCompanyName = $.trim($companyNameInput.val());

        // validate company name
        if (newCompanyName == '') {
            errorCallback($companyNameInput, '*Required');
            returnValue = false;
        } else {
            var validated = true;
            $(selector.companySelectOption).each(function () {
                var $currentOption = $(this);
                if ($currentOption.text().toLowerCase() === newCompanyName.toLowerCase()) {
                    errorCallback($companyNameInput, 'Company with this name already exists!');
                    returnValue = false;
                    return false;
                }
            });
        }

        // validate company domains
        if ($(selector.newDomainDiv + ':not(' + selector.lastDomainDiv + ')').length== 0) {
            errorCallback($(selector.newDomainField), '*Required');
            returnValue = false;
        } else {
            $(selector.newDomainField).each(function() {
                var $this = $(this);
                var domainName = $.trim($this.val());
                var domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/;
                if(!$this.parent().hasClass('js_active') && !domainRegex.test(domainName)) {
                    errorCallback($this, 'Invalid company domain!');
                    returnValue = false;
                }
            });
        }
        return returnValue;
    }

    // Function validates the new company name and make backend call.
    function addNewCompany(url, successCallback, errorCallback) {
        var selector = thisInstance.constants.selector,
            $loader = $('.js-full-page-loader'),
            $companyNameInput = $(selector.companyNameInput);

        var formValid = validateNewCompanyForm(errorCallback);
        if (formValid) {
            var newCompanyName = $.trim($companyNameInput.val());
            var data = {companyName: newCompanyName, companyDomains: []};
             $(selector.newDomainField).each(function() {
                var $this = $(this);
                if(!$this.parent().hasClass('js_active')) {
                    data.companyDomains.push($.trim($this.val()));
                }
            });
            $loader.removeClass('hide');
            $.ajax({
                type: 'POST',
                url: url,
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: function (data) {
                    if (data.success) {
                        var company = data.company;
                        successCallback(company);
                    } else {
                        var errors = data.errors;
                        if(errors['companyName'] !== undefined)
                            errorCallback($companyNameInput, errors['companyName']);
                        if(errors['companyDomainName'] !== undefined)
                            errorCallback($(selector.lastDomainDiv).find(selector.newDomainField), errors['companyDomainName']);
                        else {
                            $(selector.newDomainField).each(function() {
                                var $this = $(this);
                                if(!$this.parent().hasClass('js_active') && errors[$.trim($this.val())] !== undefined) {
                                    errorCallback($this, errors[$.trim($this.val())]);
                                }
                            });
                        }
                    }
                },
                error: function(error){
                    if(error && error.status === 401){
                        location.reload();
                    }
                },
                complete: function () {
                    $loader.addClass('hide');
                }
            });
        }
    }

    function addPardotListForCompany(companyId){
        var selector = thisInstance.constants.selector,
            url = $(selector.addCompany).data('add_pardot_list_url');
        $.ajax({
            url: url,
            data: {company_id: companyId}
        });
    }

    // binds remove link and remove error wrap on input of newly added domain
    function newParentDomainFieldBindings($this){
        var selector = thisInstance.constants.selector;
        $this.find(selector.removeDomainAnchor).on("click", function(event){
            $(this).closest(selector.newDomainDiv).remove();
        });

        $this.find(selector.newDomainField).on("input", function(){
            $(this).closest(selector.newDomainDiv).removeClass("error-wrap");
        });
    }

    function bindAddParentDomainBoxBinding(){
        var selector = thisInstance.constants.selector;
        $(selector.lastDomainDiv).find(selector.newDomainField).one("input", function(event){
            var $currentInputDiv = $(this).closest(selector.lastDomainDiv).removeClass('error-wrap');

            // insert the new text box and reset it's value
            var $newTextBox = $currentInputDiv.clone().insertAfter($currentInputDiv).find(selector.newDomainField).val("");

            $currentInputDiv.removeClass(thisInstance.constants.class.lastDomainActiveClass);  // removes the style class from current input's parent div
            $currentInputDiv.removeClass(thisInstance.constants.class.lastDomainBeActiveClass);  // removes the event binding class from current input's parent div
            bindAddParentDomainBoxBinding();
            newParentDomainFieldBindings($currentInputDiv);
        });
    }
}
