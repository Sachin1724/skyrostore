import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-offwhite">
      <div className="w-full max-w-sm rounded-md border border-gray-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-gray-900">Skyrostore Admin</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>
        <LoginForm />
      </div>
    </div>
  );
}
