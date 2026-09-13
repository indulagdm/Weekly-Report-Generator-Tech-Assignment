import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import { AppShell } from "./components/layout/AppShell";
import {
  HomeRedirect,
  RequireAuth,
  RequireManager,
} from "./components/layout/RouteGuards";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { TeamReports } from "./pages/TeamReports";
import { SectionView } from "./pages/SectionView";
import { MemberProfile } from "./pages/MemberProfile";
import { MyReports } from "./pages/MyReports";
import { ReportEditor } from "./pages/ReportEditor";
import { ReportDetail } from "./pages/ReportDetail";
import { ReviewReport } from "./pages/ReviewReport";
import { Projects } from "./pages/Projects";
import { People } from "./pages/People";
export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route path="/" element={<HomeRedirect />} />
                <Route
                  path="/dashboard"
                  element={
                    <RequireManager>
                      <Dashboard />
                    </RequireManager>
                  }
                />

                <Route
                  path="/team"
                  element={
                    <RequireManager>
                      <TeamReports />
                    </RequireManager>
                  }
                />

                <Route
                  path="/team/sections"
                  element={
                    <RequireManager>
                      <SectionView />
                    </RequireManager>
                  }
                />

                <Route
                  path="/team/members/:userId"
                  element={
                    <RequireManager>
                      <MemberProfile />
                    </RequireManager>
                  }
                />

                <Route
                  path="/review/:reportId"
                  element={
                    <RequireManager>
                      <ReviewReport />
                    </RequireManager>
                  }
                />

                <Route
                  path="/users"
                  element={
                    <RequireManager>
                      <People />
                    </RequireManager>
                  }
                />

                <Route path="/my-reports" element={<MyReports />} />
                <Route path="/reports/:reportId" element={<ReportDetail />} />
                <Route
                  path="/reports/:reportId/edit"
                  element={<ReportEditor />}
                />
                <Route path="/projects" element={<Projects />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  );
}
