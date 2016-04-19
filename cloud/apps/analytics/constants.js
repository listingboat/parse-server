exports.DEFAULT_PQ_GAIN_ARRAY_SIZE = 7;
exports.INITIAL_ANALYTICS_DATE = new Date(2015, 6, 1, 0, 0, 0, 0);
exports.DEFAULT_DEPARTMENT_COUNT = 5;
exports.DEFAULT_DAYS_COUNT = 90;
exports.EMPLOYEE_COUNT_PER_PAGE = 15;

exports.PERSONALITY_CLASS_MAP_FOR_DONUT_GRAPH = {
    advisor: "advisor-pq-progress",
    connector: "connector-pq-progress",
    doer: "doer-pq-progress",
    dreamer: "dreamer-pq-progress",
    organizer: "organizer-pq-progress",
    original: "original-pq-progress"
};

exports.PERSONALITY_CLASS_MAP_FOR_CALL_CENTER_DATA = {
    advisor: "advisor-pq-summary",
    connector: "connector-pq-summary",
    doer: "doer-pq-summary",
    dreamer: "dreamer-pq-summary",
    organizer: "organizer-pq-summary",
    original: "original-pq-summary"
};

exports.PERSONALITY_CLASS_MAP_FOR_WORKSTYLE_METRIC = {
    advisor: "advisor-stats-wrap",
    connector: "connector-stats-wrap",
    doer: "doer-stats-wrap",
    dreamer: "dreamer-stats-wrap",
    organizer: "organizer-stats-wrap",
    original: "original-stats-wrap"
};

exports.DONUT_GRAPH_SIZE = [
    "pq-progress-6x",
    "pq-progress-5x",
    "pq-progress-4x",
    "pq-progress-3x",
    "pq-progress-2x",
    "pq-progress-1x"
];

exports.PERSONALITY_THEME_TEXT_MAP = {
    advisor: "advisor-theme-text",
    connector: "connector-theme-text",
    doer: "doer-theme-text",
    dreamer: "dreamer-theme-text",
    organizer: "organizer-theme-text",
    original: "original-theme-text"
};

exports.colorsList = [
    {
        name: 'orange',
        value: '#FF6B35',
        teamClass: 'team-orange-wrap'
    },
    {
        name: 'yellow',
        value: '#ECA900',
        teamClass: 'team-yellow-wrap'
    },
    {
        name: 'green',
        value: '#118C89',
        teamClass: 'team-green-wrap'
    },
    {
        name: 'red',
        value: '#D84154',
        teamClass: 'team-red-wrap'
    },
    {
        name: 'purple',
        value: '#754299',
        teamClass: 'team-purple-wrap'
    },
    {
        name: 'blue',
        value: '#4B91DD',
        teamClass: 'team-blue-wrap'
    }
];
