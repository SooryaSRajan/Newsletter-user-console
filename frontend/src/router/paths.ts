export const paths = {
    home: '/',
    test: '/test',
    oauthSuccess: '/oauthSuccess',
    oauth2Failure: '/oauth2Failure',
    signIn: '/signin',
    signUp: '/signup',
    contactUs: '/contactUs',
    oauth2Authentication: '/oauth2/authorization/google',
    verification: '/verification',
    forgotPassword: '/forgotPassword',
    resetPassword: '/resetPassword',
    notFound: '*'
}

export const dashboardPaths = {
    groups: 'groups',
    openForms: 'openForms',
    invitations: 'invitations',
    profile: 'profile',
    aboutUs: 'aboutUs',
    contactUs: 'contactUs',
    newGroup: 'groups/newGroup',
    manageGroup: 'groups/manageGroup',
    manageQuestions: 'groups/manageQuestions',
};

export const authorizedPaths = {
    dashboardRoot: '/dashboard/',
    dashboard: '/dashboard/*',
    groups: `/dashboard/${dashboardPaths.groups}`,
    openForms: `/dashboard/${dashboardPaths.openForms}`,
    invitations: `/dashboard/${dashboardPaths.invitations}`,
    profile: `/dashboard/${dashboardPaths.profile}`,
    aboutUs: `/dashboard/${dashboardPaths.aboutUs}`,
    contactUs: `/dashboard/${dashboardPaths.contactUs}`,
    newGroup: `/dashboard/${dashboardPaths.newGroup}`,
    manageGroup: `/dashboard/${dashboardPaths.manageGroup}`,
    manageQuestions: `/dashboard/${dashboardPaths.manageQuestions}`,
    form: '/form/:groupId',
    signOut: '/signout',
};


const allPaths = { ...paths, ...authorizedPaths } as const;
export type Path = typeof allPaths[keyof typeof allPaths]
