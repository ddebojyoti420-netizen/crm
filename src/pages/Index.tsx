import { StatCard } from "@/components/dashboard/StatCard";
import { LeadStatusChart } from "@/components/dashboard/LeadStatusChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { AttendanceWidget } from "@/components/dashboard/AttendanceWidget";
import { SiteVisitsToday } from "@/components/dashboard/SiteVisitsToday";
import { Users, Building2, Calendar, IndianRupee } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

const Index = () => {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <MainLayout title={"Dashboard"} subtitle={"Overview of key metrics and activities"}>
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value="1,284"
            change={{ value: 12, type: "increase" }}
            icon={Users}
            variant="accent"
          />
          <StatCard
            title="Active Properties"
            value="156"
            change={{ value: 5, type: "increase" }}
            icon={Building2}
          />
          <StatCard
            title="Site Visits Today"
            value="18"
            change={{ value: 8, type: "decrease" }}
            icon={Calendar}
          />
          <StatCard
            title="This Month Revenue"
            value="₹2.4 Cr"
            change={{ value: 15, type: "increase" }}
            icon={IndianRupee}
            variant="primary"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <LeadStatusChart />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentLeads />
          </div>
          <div className="space-y-6">
            <AttendanceWidget />
            <UpcomingTasks />
            <SiteVisitsToday />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
