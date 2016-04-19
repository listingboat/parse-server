exports.EMAIL_REGEX = /\S+@\S+\.\S+/i;
exports.DOMAIN_REGEX = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/;
exports.LAST_ACTIVITY_UPDATE_INTERVAL = 24*60*60*100;
exports.MONTH_NAME_MAP =  // map for months full name
    [
        "January", "February", "March",
        "April", "May", "June",
        "July", "August", "September",
        "October", "November", "December"
    ];

exports.SHORT_MONTH_NAME_MAP =  // map for months short name
    [
        "Jan.", "Feb.", "Mar.",
        "Apr.", "May.", "Jun.",
        "Jul.", "Aug.", "Sept.",
        "Oct.", "Nov.", "Dec."
    ];

exports.CST_TO_UTC_OFFSET = 5 * 60 * 60 * 1000;
