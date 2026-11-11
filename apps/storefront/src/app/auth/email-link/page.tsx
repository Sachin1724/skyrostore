import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EmailLinkForm } from "./email-link-form";

/** Where the emailed sign-in link lands. Finishes the sign-in on our own page. */
export default function EmailLinkPage() {
  return (
    <>
      <Header />
      <EmailLinkForm />
      <Footer />
    </>
  );
}
