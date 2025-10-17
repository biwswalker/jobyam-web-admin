import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Auth routes (without sidebar)
  index("auth/login.tsx"),
  // We need to use a different component for the explicit login route
  // to avoid the duplicate route ID error
  route("login", "auth/login-route.tsx"),
  route("register", "auth/register.tsx"),
  route("forgot-password", "auth/forgot-password.tsx"),

  // Home route as the parent for all authenticated routes
  route("", "routes/home.tsx", [
    // All authenticated routes as children of home
    route("dashboard", "dashboard/index.tsx"),

    // Notifications routes
    route("notifications", "notifications/index.tsx"),

    // Applicants routes
    route("applicants", "applicants/index.tsx"),
    route("applicantlist", "applicants/list.tsx"),
    route("applicants/:id", "applicants/detail.tsx"),
    route("applicants/status", "applicants/jobStatus.tsx"),

    // Jobs routes
    route("jobs", "jobs/index.tsx"),
    route("jobs/create", "jobs/create.tsx"),
    route("jobs/history", "jobs/history.tsx"),
    route("jobs/:id/edit", "jobs/edit.tsx"),
    route("jobs/:id", "jobs/detail.tsx"),

    // Advisors routes
    route("advisors", "advisors/index.tsx"),

    // Log Report routes
    route("logreport", "logreport/index.tsx"),

    // Report routes
    route("report/:reportType", "report/index.tsx"),
    // route("interestedusers", "report/index.tsx"),
    // route("jobapplicants", "report/index.tsx"),
    // route("reportreferralapplicants", "report/index.tsx"),

    // Company routes
    route("company", "master-data/company/page.tsx"),
    route("company/create", "master-data/company/create.tsx"),
    route("company/edit/:id", "master-data/company/edit.tsx"),

    // Job Types routes
    route("jobs/types", "master-data/types/page.tsx"),
    route("jobs/types/create", "master-data/types/create.tsx"),
    route("jobs/types/edit/:id", "master-data/types/edit.tsx"),

    // JobManpower routes
    route("jobmanpower", "master-data/jobmanpower/page.tsx"),
    route("jobmanpower/create", "master-data/jobmanpower/create.tsx"),
    route("jobmanpower/edit/:id", "master-data/jobmanpower/edit.tsx"),

    // Template Plans routes
    route("templateplans", "master-data/templateplans/page.tsx"),
    route("templateplans/create", "master-data/templateplans/create.tsx"),
    route("templateplans/edit/:id", "master-data/templateplans/edit.tsx"),

    // Prepare Documents routes
    route("preparedocuments", "master-data/preparedocuments/page.tsx"),
    route("preparedocuments/create", "master-data/preparedocuments/create.tsx"),
    route("preparedocuments/edit/:id", "master-data/preparedocuments/edit.tsx"),

    // Users routes
    route("manageadmin", "settings/manage-admin/page.tsx"),
    route("manageadmin/create", "settings/manage-admin/create.tsx"),
    route("manageadmin/:id/edit", "settings/manage-admin/edit.tsx"),
    route("manageusers", "settings/manage-users/page.tsx"),
    route("manageusers/:id/edit", "settings/manage-users/edit.tsx"),
    route("settings/aboutarticle", "settings/about-article/index.tsx"),
    route("settings/aboutarticle/:id", "settings/about-article/edit.tsx"),

    // Role routes
    route("role", "settings/role/index.tsx"),

    // JobsActivity routes
    route("jobsActivity/:id", "applicants/jobsActivity.tsx"),

    // Profile routes
    route("profile", "settings/profile/index.tsx"),
    route("settings/language", "settings/language.tsx"),

  ])
] satisfies RouteConfig;
