import { PageTitle } from "@/components/common/PageTitle";

const DashboardPage = () => {
  return (
    <div className="flex h-full flex-col px-4 py-6 sm:px-10 sm:py-8">
      {/* Page Title */}
      <PageTitle title="Dashboard" />

      <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Overview and quick stats will appear here.
      </p>
    </div>
  );
};

export default DashboardPage;
