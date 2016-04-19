exports.SCORE_SECTION = 'Condominium';

exports.USER_SESSION_DEFAULT_PERIOD = 3600000 * 24;
exports.USER_SESSION_STAY_SIGNED_IN_PERIOD = 3600000 * 24 * 30;
exports.USER_RESPONSE_QUERY_BATCH_SIZE = 1000;

exports.TOTAL_SKILL_COUNT = 3;
exports.TOTAL_PERSONLITY_COUNT = 6;
exports.MINIMUM_PPI_SCORE = 40;
exports.CALL_COUNT_THRESHOLD = 5;


exports.PERSONALITY_CLASS_MAP = {
            'doer': 'doer-wrap',
            'original': 'original-wrap',
            'dreamer': 'dreamer-wrap',
            'advisor': 'advisor-wrap',
            'organizer': 'organizer-wrap',
            'connector': 'connector-wrap'
        };
exports.PERSONALITY_ICON_CLASS_MAP = {    // class maps for icons
            'doer': 'doer-pq-wrap',
            'original': 'original-pq-wrap',
            'dreamer': 'dreamer-pq-wrap',
            'advisor': 'advisor-pq-wrap',
            'organizer': 'organizer-pq-wrap',
            'connector': 'connector-pq-wrap'
        };
exports.PERSONALITY_BADGE_CLASS_MAP = {    // calss maps for badges
            'doer': 'ws-icon-doer-badge',
            'original': 'ws-icon-original-badge',
            'dreamer': 'ws-icon-dreamer-badge',
            'advisor': 'ws-icon-advisor-badge',
            'organizer': 'ws-icon-organizer-badge',
            'connector': 'ws-icon-connector-badge'
        };
exports.LEARN_MORE_PERSONALITY_URL_NAME_MAP = {    // class maps for badges
            'doer': 'explore.doer',
            'original': 'explore.original',
            'dreamer': 'explore.dreamer',
            'advisor': 'explore.advisor',
            'organizer': 'explore.organizer',
            'connector': 'explore.connector'
        };
exports.SUPERPOWER_TAGLINE_MAP = {    // class maps for superpower tagline image
            'doer': '/assets/images/doer_superpower.png',
            'original': '/assets/images/original_superpower.png',
            'dreamer': '/assets/images/dreamer_superpower.png',
            'advisor': '/assets/images/advisor_superpower.png',
            'organizer': '/assets/images/organizer_superpower.png',
            'connector': '/assets/images/connector_superpower.png'
        };
exports.SMALL_SIGNATURE_IMAGE_MAP = {    // image maps for badge
    'doer': 'doer_small_badge.png',
    'original': 'original_small_badge.png',
    'dreamer': 'dreamer_small_badge.png',
    'advisor': 'advisor_small_badge.png',
    'organizer': 'organizer_small_badge.png',
    'connector': 'connector_small_badge.png'
};

exports.BADGE_WITHOUT_PQ_MAP = {    // image maps for badges without pq
    'doer': 'ws-doer-without-pq-badge-lg.png',
    'original': 'ws-original-without-pq-badge-lg.png',
    'dreamer': 'ws-dreamer-without-pq-badge-lg.png',
    'advisor': 'ws-advisor-without-pq-badge-lg.png',
    'organizer': 'ws-organizer-without-pq-badge-lg.png',
    'connector': 'ws-connector-without-pq-badge-lg.png'
};

exports.BADGE_GIF_MAP = {    // image maps for badges gif
    'doer': 'ws_badge_doer.gif',
    'original': 'ws_badge_original.gif',
    'dreamer': 'ws_badge_dreamer.gif',
    'advisor': 'ws_badge_advisor.gif',
    'organizer': 'ws_badge_organizer.gif',
    'connector': 'ws_badge_connector.gif'
};

exports.MIGRATED_USER_RESULT_LIMIT = 6;

exports.MIGRATED_SCORE_NAME_ACTIONS = 'actions';
exports.MIGRATED_SCORE_NAME_REFLECTIONS = 'reflections';
exports.MIGRATED_SCORE_NAME_REACTIONS = 'reactions';
exports.MIGRATED_SCORE_NAME_EMOTIONS = 'emotions';
exports.MIGRATED_SCORE_NAME_THOUGHTS = 'thoughts';
exports.MIGRATED_SCORE_NAME_OPINIONS = 'opinions';

exports.USER_SCORE_NAME_MAP = {};
exports.USER_SCORE_NAME_MAP[exports.MIGRATED_SCORE_NAME_ACTIONS] = 'Doer';
exports.USER_SCORE_NAME_MAP[exports.MIGRATED_SCORE_NAME_REFLECTIONS] = 'Dreamer';
exports.USER_SCORE_NAME_MAP[exports.MIGRATED_SCORE_NAME_REACTIONS] = 'Original';
exports.USER_SCORE_NAME_MAP[exports.MIGRATED_SCORE_NAME_EMOTIONS] = 'Connector';
exports.USER_SCORE_NAME_MAP[exports.MIGRATED_SCORE_NAME_THOUGHTS] = 'Organizer';
exports.USER_SCORE_NAME_MAP[exports.MIGRATED_SCORE_NAME_OPINIONS] = 'Advisor';

exports.USER_SCORE_SECTION_MAP = {
    'Strength' : 'Strength',
    'Psychological Need' : 'PsychologicalNeed',
    'Connection Preference' : 'ConnectionPreference',
    'Condominium' : 'Condominium'
};

exports.MIGRATED_USER_RESULT_SCORE_SECTION = 'Condominium';

exports.GENERATE_LARGE_BADGE_PATH = '/badge?';    // rout to generate large badge
exports.GENERATE_BADGE_with_PQ_PATH = '/badge2?';    // rout to generate large badge
exports.ACCESS_LARGE_BADGE_PATH = '/userBadges/user';    // rout to access generated large badge

exports.ABOUT_ME_VIDEO_URL = {
    'organizer': '//fast.wistia.net/embed/iframe/itk126iwcy?autoPlay=true',
    'connector': '//fast.wistia.net/embed/iframe/ffcd89v0ll?autoPlay=true',
    'original': '//fast.wistia.net/embed/iframe/py8oz4ivfw?autoPlay=true',
    'advisor': '//fast.wistia.net/embed/iframe/wtw1hxv7y1?autoPlay=true',
    'doer': '//fast.wistia.net/embed/iframe/g76dv75b9j?autoPlay=true',
    'dreamer': '//fast.wistia.net/embed/iframe/ltl4xsh7l2?autoPlay=true'
};

exports.PERSONALITY_DESCRIPTION_MAP = {
    'Organizer': {
        'description': 'The Organizer personality is one of six Workstyle personality types. Organizers are typically logical, responsible, and organized. When communicating and emailing with an Organizer workstyle, outline goals and present information in a logical, orderly fashion. Use data to prove a point.',
        'follow-up': 'an Organizer'
    },
    'Connector': {
        'description': 'The Connector personality is one of six Workstyle personality types. Connectors are compassionate, sensitive, and warm. When communicating and emailing with a Connector workstyle, start with a quick personal check-in, focus on a project’s impact on people to show your emotional intelligence, and include personal stories to convey points and messages.',
        'follow-up': 'a Connector'
    },
    'Original': {
        'description': 'The Original personality is one of six Workstyle personality types. Originals are spontaneous, creative, and playful. When communicating and emailing with an Original workstyle, point out what’s different or unique and show that you understand that you don’t have to be serious to be successful. Present information with creativity and an interactive exchange that will keep an original engaged.',
        'follow-up': 'an Original'
    },
    'Advisor': {
        'description': 'The Advisor personality is one of six Workstyle personality types. Advisors are dedicated, observant, and conscientious. When communicating and emailing with an Advisor workstyle, start by stating why your proposal is important, leverage well-known sources to build credibility, and show outward signs of respect to the Advisor and their opinions.',
        'follow-up': 'an Advisor'
    },
    'Doer': {
        'description': 'The Doer personality is one of six Workstyle personality types. Doers are adaptable, persuasive, and charming. When communicating and emailing with a Doer workstyle, start with the bottom line, keep points short, focus on the actionable, and give things an edge to keep the conversation interesting.',
        'follow-up': 'a Doer'
    },
    'Dreamer': {
        'description': 'The Dreamer personality is one of six Workstyle personality types. Dreamers are calm, imaginative, and reflective. When communicating and emailing with a Dreamer workstyle, be calm, give clear direction, and steer clear of “touchy feely” approaches. Present direct, simple, and unadorned bullet points.',
        'follow-up': 'a Dreamer'
    }
};

exports.DEPARTMENT_MAP = {
    consultingClientServices: "Consulting/Client Services",
    customerService: "Customer Service",
    hr: "HR",
    it: "IT",
    legal: "Legal",
    management: "Management",
    marketing: "Marketing",
    operations: "Operations",
    product: "Product",
    researchAndDevelopment: "Research & Development",
    salesBusinessDevelopment: "Sales/Business Development",
    other: "Other"
};

exports.PUBLIC_PROFILE_PARTIALS_MAP = {
    'original' : '_original_public_profile',
    'organizer' : '_organizer_public_profile',
    'connector' : '_connector_public_profile',
    'advisor' : '_advisor_public_profile',
    'doer' : '_doer_public_profile',
    'dreamer' : '_dreamer_public_profile'
};

exports.FIRST_NAME_MAX_LENGTH = 30;
exports.LAST_NAME_MAX_LENGTH = 30;
exports.EMAIL_MAX_LENGTH = 100;
exports.POSITION_TITLE_MAX_LENGTH = 100;
exports.PHONE_ID_MAX_LENGTH = 50;
exports.IDENTIFIER_SOURCE_MAX_LENGTH = 50;

exports.PERSONALITY_LIST = [
    "Advisor",
    "Connector",
    "Doer",
    "Dreamer",
    "Organizer",
    "Original"
];

exports.USER_PERMISSION_TYPE = {
    ACCOUNT_OWNER: "account_owner",
    SUPER_ADMIN: "super_admin",
    SUPERVISOR: "supervisor",
    MEMBER: "regular_user"
};

exports.PARDOT_DATA_VALIDITY = 5 * 60 * 1000;

exports.REPORT_CLASS_MAP = {
    'doer': 'doer-details-report',
    'original': 'original-details-report',
    'dreamer': 'dreamer-details-report',
    'advisor': 'advisor-details-report',
    'organizer': 'organizer-details-report',
    'connector': 'connector-details-report'
};

exports.PERSONALITY_COMMUNICATION_MAP = {
    'doer': "When communicating and emailing with an doer workstyle, start with the bottom line, keep points short, focus on the actionable, and give things an edge to keep the conversation interesting.",
    'organizer': 'When communicating and emailing with an organizer workstyle, start by outlining clear objectives. keep communications succinct and in specific order (eg. chronological, categorical, milestones). Organizers are structured, process driven, and need their time respected.',
    'dreamer': 'When communicating and emailing with a dreamer workstyle, be calm, give clear direction, and steer clearof "touch feely" approaches. Present direct, simple, unadorned bullet points.',
    'advisor': 'When communicating and emailing with an advisor workstyle, start by stating why your proposal is important, leverage well-known sources to build credibility, and show outward signs of respect to the advisor and their opinions.',
    'original': "When communicating and emailing with an original workstyle, point out what's different or unique and show that understand that you don't have to be serious to be successful. present information with creativity and interactive exchange that will keep an original engaged.",
    'connector': "When communicating and emailing with an connector workstyle, start with a quick personal check-in, focus on a project's impact on people to show your emotional intelligence, and include personal stories to convey points and messages."
};

exports.REPORT_PERSONALITY_DESCRIPTION_VIEW_MAP = {
    'doer': 'pdf_report/_doer_personality_description',
    'original': 'pdf_report/_original_personality_description',
    'dreamer': 'pdf_report/_dreamer_personality_description',
    'advisor': 'pdf_report/_advisor_personality_description',
    'organizer': 'pdf_report/_organizer_personality_description',
    'connector': 'pdf_report/_connector_personality_description'
};

exports.DARK_SUPERPOWER_TAGLINE_MAP = {    // class maps for superpower tagline image
    'doer': '/assets/images/doer_superpower_dark.png',
    'original': '/assets/images/original_superpower_dark.png',
    'dreamer': '/assets/images/dreamer_superpower_dark.png',
    'advisor': '/assets/images/advisor_superpower_dark.png',
    'organizer': '/assets/images/organizer_superpower_dark.png',
    'connector': '/assets/images/connector_superpower_dark.png'
};

exports.PERSONALITY_PQ_ICONS_MAP = {
    'doer': '/assets/images/pdf-report-images/doer-icon.svg',
    'original': '/assets/images/pdf-report-images/original-icon.svg',
    'dreamer': '/assets/images/pdf-report-images/dreamer-icon.svg',
    'advisor': '/assets/images/pdf-report-images/advisor-icon.svg',
    'organizer': '/assets/images/pdf-report-images/organizer-icon.svg',
    'connector': '/assets/images/pdf-report-images/connector-icon.svg'
};

exports.PERSONALITY_PQ_TEXT_MAP = {
    'doer': '/assets/images/pdf-report-images/doer-text.svg',
    'original': '/assets/images/pdf-report-images/original-text.svg',
    'dreamer': '/assets/images/pdf-report-images/dreamer-text.svg',
    'advisor': '/assets/images/pdf-report-images/advisor-text.svg',
    'organizer': '/assets/images/pdf-report-images/organizer-text.svg',
    'connector': '/assets/images/pdf-report-images/connector-text.svg'
};

exports.PERSONALITY_DESCRIPTION_BODY_MAP = {
    'doer': '/assets/images/pdf-report-images/doer-pq-details-page.svg',
    'original': '/assets/images/pdf-report-images/original-pq-details-page.svg',
    'dreamer': '/assets/images/pdf-report-images/dreamer-pq-details-page.svg',
    'advisor': '/assets/images/pdf-report-images/advisor-pq-details-page.svg',
    'organizer': '/assets/images/pdf-report-images/organizer-pq-details-page.svg',
    'connector': '/assets/images/pdf-report-images/connector-pq-details-page.svg'
};

exports.PERSONALITY_COLOR_MAP = {
    'doer': '217,65,84',
    'original': '237,169,0',
    'dreamer': '24,140,137',
    'advisor': '119,67,149',
    'organizer': '80,145,221',
    'connector': '255,107,53'
};
