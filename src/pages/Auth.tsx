
import { AuthForm } from "@/components/auth/AuthForm";

const Auth = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b bg-white py-4 px-6">
        <h1 className="text-2xl font-heading font-bold text-primary">LectureAI</h1>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 bg-primary flex items-center justify-center p-6 md:p-12">
          <div className="max-w-md mx-auto text-white">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">Transform Slides into Engaging Video Lectures</h2>
            <p className="text-white/80 text-lg mb-8">
              Upload your slides and let AI generate professional narration for your educational content.
            </p>
            <ul className="space-y-4">
              {[
                "Upload slides in PDF or PPTX format",
                "AI-powered script generation",
                "Editable lecture scripts",
                "Professional text-to-speech narration",
                "Download and share your video lectures",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="bg-accent rounded-full p-1 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
          <AuthForm />
        </div>
      </main>
    </div>
  );
};

export default Auth;
