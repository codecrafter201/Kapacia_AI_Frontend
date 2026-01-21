import { useAuth } from "@/contexts/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const PractitionerDashBoard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data - replace with real data from API
  const stats = [
    {
      label: "Active Cases",
      value: "24",
      icon: FileText,
      bgColor: "bg-primary/5",
      iconColor: "text-primary",
    },
    {
      label: "Sessions This Week",
      value: "42/50",
      icon: Calendar,
      bgColor: "bg-primary/5",
      iconColor: "text-primary",
    },
    {
      label: "Pending Reviews",
      value: "15",
      icon: Clock,
      bgColor: "bg-primary/5",
      iconColor: "text-primary",
    },
  ];

  const pendingReviews = [
    {
      id: "CASE-001",
      client: "Client A",
      session: "Session 5 (Jan 15)",
      status: "Draft note ready for review",
    },
    {
      id: "CASE-003",
      client: "Client C",
      session: "Session 5 (Jan 15)",
      status: "Draft note ready for review",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      text: "You approved Session 4 for CASE-002",
      time: "Jan 15, 2:30 PM",
      icon: CheckCircle2,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      id: 2,
      text: "You approved Session 4 for CASE-002",
      time: "Jan 15, 2:30 PM",
      icon: FileText,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: 3,
      text: "You approved Session 4 for CASE-002",
      time: "Jan 15, 2:30 PM",
      icon: AlertCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      id: 4,
      text: "You approved Session 4 for CASE-002",
      time: "Jan 15, 2:30 PM",
      icon: CheckCircle2,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
  ];

  return (
    <div className="space-y-6 w-full">
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

      {/* Pending Reviews */}
      <div>
        <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-normal text-secondary text-lg sm:text-2xl">
              Pending Reviews
            </h2>
            <span className="flex justify-center items-center bg-primary/10 rounded-full w-6 h-6 font-normal text-primary text-sm">
              {pendingReviews.length}
            </span>
          </div>
          <Link
            // onClick={navigate}
            to="/practitioner/my-cases"
            className="flex items-center gap-1 font-normal text-primary text-sm hover:underline cursor-pointer"
          >
            View all cases
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3 bg-primary/5 p-4 rounded-2xl">
          {pendingReviews.map((review) => (
            <Card key={review.id} className="p-4 sm:p-5">
              <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex sm:flex-row flex-col sm:items-center gap-2">
                    <h3 className="text-secondary text-base">{review.id}</h3>
                    <span className="hidden sm:inline text-gray-400 text-sm">
                      -
                    </span>
                    <span className="text-accent text-sm">{review.client}</span>
                  </div>
                  <div className="flex sm:flex-row flex-col gap-1 sm:gap-2 text-accent text-sm">
                    <span>{review.session}</span>
                    <span className="hidden sm:inline text-primary/80">•</span>
                    <span>{review.status}</span>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    navigate(`/practitioner/my-cases/${review.id}`)
                  }
                  className="bg-primary hover:bg-primary/80 w-full sm:w-auto text-white text-sm cursor-pointer"
                >
                  Review & Approve
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 font-normal text-secondary text-lg sm:text-2xl">
          Recent Activity
        </h2>
        <Card className="p-4 sm:p-6">
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={activity.id}>
                <div className="flex items-start gap-3">
                  <div
                    className={`flex items-center justify-center rounded-full shrink-0 w-10 h-10 ${activity.iconBg}`}
                  >
                    <activity.icon
                      className={`w-5 h-5 ${activity.iconColor}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-secondary text-sm sm:text-base">
                      {activity.text}
                    </p>
                    <p className="mt-0.5 text-accent text-xs">
                      {activity.time}
                    </p>
                  </div>
                </div>
                {index < recentActivity.length - 1 && (
                  <div className="my-4 border-accent/10 border-t" />
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PractitionerDashBoard;
