import { getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsEditor } from "./settings-editor";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  if (!(await getAuthToken())) redirect("/login");
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Platform configuration.</p>
      <SettingsEditor />
    </div>
  );
}
