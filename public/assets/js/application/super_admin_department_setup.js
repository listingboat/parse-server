function SuperAdminDepartmentSetupModule(){
    var thisInstance = this;
    thisInstance.selectors = {
        companySelect: ".js_company_select",
        departmentSection: ".js_company_department_section"
    };

    thisInstance.init = function(){
        selectCompanyBinding();
    };

    function selectCompanyBinding(){
        var selector = thisInstance.selectors;
        $(selector.companySelect).on("change", function(){
            getCompanyDepartmentSettingPage($.trim($(this).val()));
        });
    }

    function getCompanyDepartmentSettingPage(companyId){
        var selector = thisInstance.selectors;

        $.ajax({
            method: "get",
            url: $(selector.companySelect).data("get_company_department_settings_url"),
            data: {companyId: companyId},
            success: function(data){
                $(selector.departmentSection).html(data.partial);
                if(data.isDepartmentSetupRequired){
                    (new InitialDepartmentSetupModule()).init({
                        companyId: companyId,
                        setupCompleteCallback: function () {
                            getCompanyDepartmentSettingPage(companyId);
                        }
                    });
                }
                else{
                    (new DepartmentSettingsModule()).init({companyId: companyId});
                }
            },
            error: function(error){
            }
        });
    }

}