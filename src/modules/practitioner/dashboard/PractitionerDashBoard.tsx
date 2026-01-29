import { useAuth } from "@/contexts/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Clock, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMyCasesPreview } from "@/hooks/useCases";
import { useRecentSessions } from "@/hooks/useSessions";
import { Skeleton } from "@/components/ui/skeleton";

const PractitionerDashBoard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dashboard data
  const {
    data: myCasesData,
    isLoading: casesLoading,
    isError: casesError,
  } = useMyCasesPreview("2");
  const {
    data: recentSessionsData,
    isLoading: sessionsLoading,
    isError: sessionsError,
  } = useRecentSessions({ limit: "5" });

  const cases = myCasesData?.cases || [];
  const caseStats = myCasesData?.stats || {};
  const recentSessions = recentSessionsData?.sessions || [];

  const stats = [
    {
      label: "Active Cases",
      value: caseStats.active ?? 0,
      icon: FileText,
      bgColor: "bg-primary/5",
      iconColor: "text-primary",
    },
    {
      label: "Closed Cases",
      value: caseStats.closed ?? 0,
      icon: Calendar,
      bgColor: "bg-primary/5",
      iconColor: "text-primary",
    },
    {
      label: "On Hold",
      value: caseStats.onHold ?? 0,
      icon: Clock,
      bgColor: "bg-primary/5",
      iconColor: "text-primary",
    },
  ];

  const showSkeleton = casesLoading && sessionsLoading;

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
          <div className="pb-4 border-border/60 border-b">
            <h1 className="font-medium text-secondary text-2xl sm:text-4xl">
              Welcome back, {user ? `Dr. ${user.name}` : "Doctor"}
            </h1>
            {/* <p className="mt-2 text-sm text-accent-foreground">
              Last login: Jan 15, 2024 at 2:30 PM
            </p> */}
          </div>

          {/* Quick Stats */}
          <div>
            <h2 className="mb-4 font-normal text-secondary text-lg sm:text-2xl">
              Quick Stats
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
                  Recent Cases
                </h2>
                <span className="flex justify-center items-center bg-primary/10 rounded-full w-6 h-6 font-normal text-primary text-sm">
                  {cases.length}
                </span>
              </div>
              <Link
                to="/practitioner/my-cases"
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
                cases.map((caseItem: any) => (
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
                        onClick={() =>
                          navigate(`/practitioner/my-cases/${caseItem._id}`)
                        }
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
          <div>
            <h2 className="mb-4 font-normal text-secondary text-lg sm:text-2xl">
              Recent Sessions
            </h2>
            <Card className="p-4 sm:p-6">
              <div className="space-y-4">
                {sessionsLoading && (
                  <div className="space-y-3">
                    <Skeleton className="w-1/2 h-5" />
                    <Skeleton className="w-2/3 h-4" />
                    <Skeleton className="w-1/3 h-4" />
                  </div>
                )}

                {sessionsError && (
                  <p className="text-red-600 text-sm">
                    Unable to load sessions.
                  </p>
                )}

                {!sessionsLoading &&
                  !sessionsError &&
                  recentSessions.length === 0 && (
                    <p className="text-accent text-sm">No recent sessions</p>
                  )}

                {!sessionsLoading &&
                  !sessionsError &&
                  recentSessions.map((session: any) => (
                    <div key={session._id}>
                      <div className="flex items-start gap-3">
                        <div className="flex justify-center items-center bg-primary/10 rounded-full w-10 h-10 shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-secondary text-sm sm:text-base">
                            {session.case?.displayName || "Session"} — Session{" "}
                            {/* {session.case?.internalRef || "Session"} — Session{" "} */}
                            {session.sessionNumber}
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
          </div>
        </>
      )}
    </div>
  );
};

export default PractitionerDashBoard;
