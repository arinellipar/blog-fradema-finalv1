// src/app/verify-email/page.tsx

import * as React from "react";
import { Suspense } from "react";
import VerifyEmailForm from "./verify-email-form";

/**
 * Página de Verificação de Email
 * Permite ao usuário verificar seu email usando um token
 */
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
