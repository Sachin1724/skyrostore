import { getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContentEditor } from "./content-editor";

export const metadata = { title: "Homepage content" };

export default async function ContentPage() {
  if (!(await getAuthToken())) redirect("/login");
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900">Homepage content</h1>
      <p className="mt-1 text-sm text-gray-500">
        Edit the words on the storefront homepage. Save a draft as often as you like; customers see
        the text only after you publish.
      </p>
      <ContentEditor storefrontUrl={process.env.STOREFRONT_URL || "http://localhost:3000"} />
    </div>
  );
}
