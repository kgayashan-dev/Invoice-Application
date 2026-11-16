import { Suspense } from "react";
import LoginComponent from "./LoginComponent";

export default function LoginPage() {
  return (

    // suspense is used for  
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        </div>
      }
    >
      <LoginComponent />
    </Suspense>
  );
}
