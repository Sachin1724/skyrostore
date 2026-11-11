import { getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModerationView } from "./moderation-view";

export const metadata = { title: "Moderation" };

export default async function ModerationPage() {
  if (!(await getAuthToken())) redirect("/login");
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Moderation</h1>
      <p className="mt-1 text-sm text-gray-500">Approve or reject customer reviews and answer product questions.</p>
      <ModerationView />
    </div>
  );
}
