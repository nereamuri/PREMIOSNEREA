"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginResult } from "@/server/actions/admin-auth";

const initialState: LoginResult = { ok: true };

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useActionState(
    loginAction.bind(null, callbackUrl),
    initialState
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      {!state.ok && (
        <p className="rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm">
          {state.error}
        </p>
      )}
      <input
        type="password"
        name="password"
        placeholder="Contraseña"
        required
        autoFocus
        className="rounded-full border-2 border-ink px-4 py-2 text-center"
      />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-8 py-3 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}
