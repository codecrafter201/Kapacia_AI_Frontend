import { useAuth } from "@/contexts/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Clock, ChevronRight, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAllCases } from "@/hooks/useCases";
import { useAllSessions } from "@/hooks/useSessions";
import { useAllUsers } from "@/hooks/useUsers";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashBoardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dashboard data
  const {
    data: allCasesData,
    isLoading: casesLoading,
    isError: casesError,
  } = useAllCases();
  const {
    data: allSessionsData,
    isLoading: allSessionsLoading,
    isError: allSessionsError,
  } = useAllSessions({ limit: 100 });
  const {
    data: recentSessionsData,
    isLoading: recentSessionsLoading,
    isError: recentSessionsError,
  } = useAllSessions({ limit: 5 });
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
  } = useAllUsers({ limit: 100 });

  const cases = allCasesData?.cases || [];
  const caseStats = allCasesData?.stats || {};
  const recentSessions = recentSessionsData?.data || [];

  // Get total sessions count from all sessions
  const totalSessions = allSessionsData?.pagination?.total ?? 0;

  // Get the first 5 cases for recent cases display
  const recentCases = cases.slice(0, 5);

  // User stats
  const allUsers = usersData?.users || [];
  const totalUsers = allUsers.length;
  const adminCount = allUsers.filter((u: any) => u.role === "admin").length;
  const practitionerCount = allUsers.filter(
    (u: any) => u.role === "practitioner",
  ).length;
  // const supervisionCount = allUsers.filter(
  //   (u: any) => u.role === "supervision",
  // ).length;

  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      bgColor: "bg-primary/5",
      iconColor: "text-primary",
    },
    {
      label: "Active Cases",
      value: caseStats.active ?? 0,
      icon: Calendar,
      bgColor: "bg-primary/5",
      iconColor: "text-primary",
    },
    {
      label: "Total Sessions",
      value: totalSessions,
      icon: Clock,
      bgColor: "bg-primary/5",
      iconColor: "text-primary",
    },
  ];

  const showSkeleton = casesLoading && allSessionsLoading;

  return (
    <div className="space-y-6 w-full">
      {showSkeleton ? (
        <div className="space-y-6">
          <div className="pb-4 border-border/60 border-b">
            <Skeleton className="w-48 h-8" />
          </div>

          <div>
            <div className="gap-4 sm:gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 sm:p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-20 h-8" />
                    </div>
                    <Skeleton className="rounded-full w-12 h-12" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-3 bg-primary/5 p-4 rounded-2xl">
            {[1, 2].map((i) => (
              <Card key={i} className="p-4 sm:p-5">
                <div className="space-y-2">
                  <Skeleton className="w-1/3 h-5" />
                  <Skeleton className="w-1/2 h-4" />
                  <Skeleton className="w-2/3 h-4" />
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 sm:p-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="w-1/2 h-5" />
                  <Skeleton className="w-2/3 h-4" />
                  <Skeleton className="w-1/3 h-4" />
                  <div className="my-4 border-accent/10 border-t" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <>
          {/* Header */}
          {/* <div className="pb-4 border-border/60 border-b">
            <h1 className="font-medium text-secondary text-2xl sm:text-4xl">
              Welcome back, {user ? `Dr. ${user.name}` : "Doctor"}
            </h1>
            <p className="mt-2 text-sm text-accent-foreground">
              Last login: Jan 15, 2024 at 2:30 PM
            </p> 
          </div> */}

          {/* Quick Stats */}
          <div>
            <h2 className="mb-4 font-normal text-secondary text-lg sm:text-2xl">
              Overview
            </h2>
            <div className="gap-4 sm:gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat, index) => (
                <Card key={index} className="p-4 sm:p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="mb-1 text-accent text-sm">{stat.label}</p>
                      <p className="font-normal text-secondary text-lg sm:text-4xl">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`flex items-center justify-center rounded-full w-12 h-12 ${stat.bgColor}`}
                    >
                      <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-normal text-secondary text-lg sm:text-2xl">
                  User Management
                </h2>
              </div>
            </div>

            <div className="bg-primary/5 p-6 rounded-2xl">
              {usersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="w-1/3 h-6" />
                  <Skeleton className="w-2/3 h-4" />
                  <Skeleton className="w-1/2 h-4" />
                </div>
              ) : usersError ? (
                <p className="text-red-600 text-sm">
                  Unable to load user data.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* User Stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-accent text-sm">Total User:</span>
                      <span className="font-medium text-secondary">
                        {totalUsers}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-accent text-sm">Admin:</span>
                      <span className="font-medium text-secondary">
                        {adminCount}
                      </span>
                    </div>
                    {/* <div className="flex justify-between items-center">
                      <span className="text-accent text-sm">Supervision:</span>
                      <span className="font-medium text-secondary">
                        {supervisionCount}
                      </span>
                    </div> */}
                    <div className="flex justify-between items-center">
                      <span className="text-accent text-sm">
                        Practitioners:
                      </span>
                      <span className="font-medium text-secondary">
                        {practitionerCount}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => navigate("/admin/user-management")}
                      className="flex-1 bg-primary hover:bg-primary/80 text-white text-sm cursor-pointer"
                    >
                      Add User
                    </Button>
                    <Button
                      onClick={() => navigate("/admin/user-management")}
                      className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-sm cursor-pointer"
                    >
                      Manage Users
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-normal text-secondary text-lg sm:text-2xl">
                  Recent Cases
                </h2>
                {/* <span className="flex justify-center items-center bg-primary/10 rounded-full w-6 h-6 font-normal text-primary text-sm">
                  {cases.length}
                </span> */}
              </div>
              <Link
                to="/admin/cases"
                className="flex items-center gap-1 font-normal text-primary text-sm hover:underline cursor-pointer"
              >
                View all cases
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3 bg-primary/5 p-4 rounded-2xl">
              {(casesLoading || casesError) && (
                <Card className="p-4 sm:p-5">
                  {casesLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="w-1/3 h-6" />
                      <Skeleton className="w-2/3 h-4" />
                      <Skeleton className="w-1/2 h-4" />
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm">
                      Unable to load cases.
                    </p>
                  )}
                </Card>
              )}

              {!casesLoading && !casesError && cases.length === 0 && (
                <Card className="p-4 sm:p-5">
                  <p className="text-accent">No recent cases</p>
                </Card>
              )}

              {!casesLoading &&
                !casesError &&
                recentCases.map((caseItem: any) => (
                  <Card key={caseItem._id} className="p-4 sm:p-5">
                    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex sm:flex-row flex-col sm:items-center gap-2">
                          {/* <h3 className="text-secondary text-base">
                            {caseItem.internalRef}
                          </h3>
                          <span className="hidden sm:inline text-gray-400 text-sm">
                            -
                          </span> */}
                          <span className="text-accent text-sm">
                            {caseItem.displayName}
                          </span>
                        </div>
                        <div className="flex sm:flex-row flex-col gap-1 sm:gap-2 text-accent text-sm">
                          <span>Status: {caseItem.status}</span>
                          <span className="hidden sm:inline text-primary/80">
                            •
                          </span>
                          <span>Sessions: {caseItem.sessionsCount ?? 0}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate(`/admin/cases/${caseItem._id}`)}
                        className="bg-primary hover:bg-primary/80 w-full sm:w-auto text-white text-sm cursor-pointer"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </div>

          {/* Recent Sessions */}
          {/* <div>
            <h2 className="mb-4 font-normal text-secondary text-lg sm:text-2xl">
              System Alerts
            </h2>
            <Card className="p-4 sm:p-6">
              <div className="space-y-4">
                {recentSessionsLoading && (
                  <div className="space-y-3">
                    <Skeleton className="w-1/2 h-5" />
                    <Skeleton className="w-2/3 h-4" />
                    <Skeleton className="w-1/3 h-4" />
                  </div>
                )}

                {recentSessionsError && (
                  <p className="text-red-600 text-sm">
                    Unable to load system alerts.
                  </p>
                )}

                {!recentSessionsLoading &&
                  !recentSessionsError &&
                  recentSessions.length === 0 && (
                    <p className="text-accent text-sm">
                      No recent system alerts
                    </p>
                  )}

                {!recentSessionsLoading &&
                  !recentSessionsError &&
                  recentSessions.map((session: any) => (
                    <div key={session._id}>
                      <div className="flex items-start gap-3">
                        <div className="flex justify-center items-center bg-primary/10 rounded-full w-10 h-10 shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-secondary text-sm sm:text-base">
                            {session.case?.displayName || "System Alert"} —
                            Alert {session.sessionNumber}
                          </p>
                          <p className="text-accent text-xs">
                            {session.case?.displayName || "Case"}
                          </p>
                          <p className="mt-0.5 text-accent text-xs">
                            {session.sessionDate
                              ? new Date(session.sessionDate).toLocaleString()
                              : new Date(session.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="my-4 border-accent/10 border-t" />
                    </div>
                  ))}
              </div>
            </Card>
          </div> */}
        </>
      )}
    </div>
  );
};

export default AdminDashBoardPage;
