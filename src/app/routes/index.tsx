// src/routes/index.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { paths } from "./paths";
import { PractictionerDashboardLayout } from "@/components/layouts/PractictionerDashboardLayout";
import LoginPage from "@/modules/login/LoginPage";
import ForgotPassPage from "@/modules/forgotpass/ForgotPassPage";
import OtpVerifyPage from "@/modules/otpverify/OtpVerifyPage";
import ResetPassPage from "@/modules/resetpass/ResetPassPage";
import RoleBasedRoute from "@/components/auth/RoleBasedRoute";
import SuccessPasswordPage from "@/modules/successpass/SuccessPasswordPage";
import { AdminDashboardLayout } from "@/components/layouts/AdminDashboardLayout";
import NotFoundPage from "@/modules/notfound/NotFoundPage";
import HomeRedirect from "@/components/auth/HomeRedirect";
import PractitionerDashBoard from "@/modules/practitioner/dashboard/PractitionerDashBoard";
import { CasesPage } from "@/modules/practitioner/cases/CasesPage";
import { CaseDetailPage } from "@/modules/practitioner/cases/CaseDetailPage";
import { RecordSessionPage } from "@/modules/practitioner/cases/RecordSessionPage";
import { SessionViewPage } from "@/modules/practitioner/cases/SessionViewPage";
import { EditSessionPage } from "@/modules/practitioner/cases/EditSessionPage";
import { SummaryDetailPage } from "@/modules/practitioner/cases/SummaryDetailPage";
// import { AuditPage } from "@/modules/practitioner/audit/AuditPage";
import { SettingPage } from "@/modules/practitioner/settings/SettingPage";
import AdminDashBoardPage from "@/modules/admin/dashboard/AdminDashBoardPage";
import { AdminCasesPage } from "@/modules/admin/cases/CasesPage";
import { UserManagementPage } from "@/modules/admin/usermanagement/UserManagementPage";
import { SupervisionManagementPage } from "@/modules/admin/supervision/SupervisionManagementPage";
import { AdminSettingPage } from "@/modules/admin/settings/AdminSettingPage";
import { AuditPage } from "@/modules/admin/audit/AuditPage";
import AdminCasePageDetails from "@/modules/admin/cases/AdminCasePageDetails";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home - Redirect based on auth status */}
        <Route path={paths.home} element={<HomeRedirect />} />

        {/* Auth pages with Dashboard background + Navbar + Footer */}
        <Route element={<AuthLayout />}>
          <Route path={paths.login} element={<LoginPage />} />
          <Route path={paths.forgotPassword} element={<ForgotPassPage />} />
          <Route path={paths.otpverify} element={<OtpVerifyPage />} />
          <Route path={paths.resetPassword} element={<ResetPassPage />} />
          <Route
            path={paths.successPassword}
            element={<SuccessPasswordPage />}
          />
        </Route>

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <AdminDashboardLayout />
            </RoleBasedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashBoardPage />} />
          <Route path="cases" element={<AdminCasesPage />} />
          <Route path="cases/:caseId" element={<AdminCasePageDetails />} />
          <Route path="user-management" element={<UserManagementPage />} />
          <Route
            path="supervision-management"
            element={<SupervisionManagementPage />}
          />
          <Route path="audit-logs" element={<AuditPage />} />
          <Route path="settings" element={<AdminSettingPage />} />
        </Route>

        {/* Practitioner Dashboard */}
        <Route
          path="/practitioner"
          element={
            <RoleBasedRoute allowedRoles={["practitioner"]}>
              <PractictionerDashboardLayout />
            </RoleBasedRoute>
          }
        >
          <Route
            index
            element={<Navigate to="/practitioner/dashboard" replace />}
          />
          <Route path="dashboard" element={<PractitionerDashBoard />} />
          <Route path="my-cases" element={<CasesPage />} />
          <Route path="my-cases/:caseId" element={<CaseDetailPage />} />
          <Route
            path="my-cases/:caseId/record-session"
            element={<RecordSessionPage />}
          />
          <Route
            path="my-cases/:caseId/session/:sessionId"
            element={<SessionViewPage />}
          />
          <Route
            path="my-cases/:caseId/session/:sessionId/edit"
            element={<EditSessionPage />}
          />
          <Route
            path="my-cases/:caseId/summary/:summaryId"
            element={<SummaryDetailPage />}
          />
          {/* <Route path="audit-logs" element={<AuditPage />} /> */}
          <Route path="settings" element={<SettingPage />} />
        </Route>

        {/* 404 - Catch all unmatched routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
