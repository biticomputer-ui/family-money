import { redirect } from "next/navigation";
import { getHousehold } from "../actions";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const household = await getHousehold();
  
  if (!household || !household.availableCash) {
    redirect("/onboarding");
  }

  return <DashboardClient household={household} />;
}
