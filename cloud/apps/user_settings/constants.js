exports.USER_PER_PAGE = 10;
exports.PERMISSION_TYPES_LIST = [
    {value: 'super_admin', displayText: 'Super Administrator'},
    {value: 'account_owner', displayText: 'Administrator'},
    {value: 'supervisor', displayText: 'Department Supervisor'},
    {value: 'regular_user', displayText: 'Regular User'}
];

exports.USER_PERMISSION_TYPE = {
    ACCOUNT_OWNER: "account_owner",
    SUPER_ADMIN: "super_admin",
    SUPERVISOR: "supervisor",
    MEMBER: "regular_user"
};
