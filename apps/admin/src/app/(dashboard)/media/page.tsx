import { getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MediaLibrary } from "./media-library";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  if (!(await getAuthToken())) redirect("/login");
  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-semibold text-gray-900">Media</h1>
      <p className="mt-1 text-sm text-gray-500">
        Every image uploaded to the store. Pick one from here when adding product images or brand
        logos instead of uploading it again. An image can be deleted only when nothing uses it.
      </p>
      <MediaLibrary />
    </div>
  );
}
