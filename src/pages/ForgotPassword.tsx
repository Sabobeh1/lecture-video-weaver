
import { ForgotPassword as ForgotPasswordForm } from "@/components/auth/ForgotPassword";

const ForgotPassword = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b bg-white py-4 px-6">
        <h1 className="text-2xl font-heading font-bold text-primary">LectureAI</h1>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <ForgotPasswordForm />
      </main>
    </div>
  );
};

export default ForgotPassword;
