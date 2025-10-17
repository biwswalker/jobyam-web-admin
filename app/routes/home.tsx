import type { Route } from "./+types/home";
import { Outlet } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { LanguageProvider } from "~/context/LanguageContext";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "JobYam Admin Dashboard" },
    { name: "description", content: "Admin dashboard for JobYam platform" },
  ];
}

export default function Home() {
  return (
    <LanguageProvider>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </LanguageProvider>

  );
}
