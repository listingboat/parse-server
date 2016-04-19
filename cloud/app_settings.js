exports.PRODUCTION =  false;
exports.CONTACT_US_EMAIL =  "admin@work.style";
exports.PROTOCOL = "https://";
exports.DOMAIN = "my.work.style";    // domain for url which generates large badge
exports.DOMAIL_FOR_LARGE_BADGE = "node-workstyle.rhcloud.com";    // domain for url which access large badge
exports.PARDOT_BATCH_SIZE = 50;
exports.MAX_INVITES_ALLOWED = 5;

// Dictionary mapping pardots APIs to their URLs.
exports.PARDOTS_URLS = {
    'LOGIN': 'https://pi.pardot.com/api/login/version/3',
    'CREATE_UPDATE_PROSPECT': 'https://pi.pardot.com/api/prospect/version/3/do/upsert',
    'CREATE_UPDATE_PROSPECT_BATCH': 'https://pi.pardot.com/api/prospect/version/3/do/batchUpsert',
    'SEND_MAIL_TO_PROSPECT': 'https://pi.pardot.com/api/email/version/3/do/send/prospect_email/',
    'SEND_MAIL_TO_LIST': 'https://pi.pardot.com/api/email/version/3/do/send',
    'READ_CAMPAIGN': 'https://pi.pardot.com/api/campaign/version/3/do/read/id',
    'UPDATE_CAMPAIGN': 'https://pi.pardot.com/api/campaign/version/3/do/update/id/',
    'CREATE_LIST': 'https://pi.pardot.com/api/list/version/3/do/create',
    'READ_TEMPLATE': 'https://pi.pardot.com/api/emailTemplate/version/3/do/read/id/'
};

exports.PARDOTS_LIST_NAMES = {
    'ASSESSMENT_COMPLETE': 'assessment_complete_list_id',
    'WAIT_LIST_JOIN': 'wait_list_join_list_id',
    'INVITE_LIST': 'invite_list_id',
    'REGISTER_LIST': 'register_list_id',
    'MIGRATED_ASSESSMENT_COMPLETE': 'migrated_assessment_complete_list_id',
    'FRIEND_INVITE_LIST': "invite_friend_list_id",
    'ACCOUNT_TERMS_ACCEPTED_EMAIL_LIST': "account_terms_accepted_mail_list"
};

exports.CAMPAIGN = "workstyle_campaign_id";
exports.PARDOT_EMAIL_TEMPLATE_NAME = {
    PASSWORD_CHANGED: "password_reset_email_template_id",
    EMAIL_LAYOUT: "email_layout_id",
    TOP_PQ_SCORE: "top_pq_score_email_template_id",
    TOP_WEEKLY_GAIN: "top_weekly_pq_gain_email_template_id",
    CUSTOM_CONTEST: "custom_contest_email_template_id",
    PDF_REPORT: "pdf_report_email_template_id",
    INVITE_USER: "invite_user_email_template_id"
};

exports.DOMAIN = "my.work.style";    // domain for url which access small badge
exports.DOMAIN_FOR_LARGE_BADGE = "node-workstyle.rhcloud.com";    // domain for url which access large badge
exports.DOMAIN_FOR_WORK_STYLE = "work.style";
exports.PROTOCOL_FOR_WORK_STYLE = "http://";

// override app settings with custom environment
var _ = require('underscore');
try {
    var setupEnvironment = require('./cloud/setup_environment.js');
}catch(error){
    setupEnvironment = {environment: 'development'}
}
var environment = require('./cloud/environment/' + setupEnvironment.environment + '.js');

exports = _.extend(exports, environment);

try{
    // local overrides
    localEnvironment = require('./cloud/environment/local.js');
    exports = _.extend(exports, localEnvironment);
}catch(error){} // ignores if local.js does not exists
