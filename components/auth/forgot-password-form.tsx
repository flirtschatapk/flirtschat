"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { emailSchema, type EmailValues } from "@/lib/auth-schema";
import { requestPasswordReset } from "@/lib/auth-service";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const submit = async ({ email }: EmailValues) => {
    if (isSubmitting) return;
    setNotice(null);
    try {
      await requestPasswordReset(email);
      setSentTo(email);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Request failed. Please try again.");
    }
  };

  return (
    <div className="auth-card glass auth-simple-card">
      <div className="auth-illustration" aria-hidden="true">
        {sentTo ? <CheckCircle2 /> : <KeyRound />}
      </div>
      <div className="auth-card-heading">
        <span className="kicker">Account recovery</span>
        <h2>{sentTo ? "Check your email" : "Forgot your password?"}</h2>
        <p>
          {sentTo
            ? <>We sent a password reset link to <strong>{sentTo}</strong>.</>
            : "Enter your email and we’ll send you a secure reset link."}
        </p>
      </div>

      {notice && <div className="auth-toast error" role="alert">{notice}</div>}

      {sentTo ? (
        <div className="forgot-success-actions">
          <a className="auth-submit btn-gradient" href="/reset-password?token=mock-reset-token">
            Open mock reset link <ArrowRight />
          </a>
          <button type="button" className="auth-text-link" onClick={() => setSentTo(null)}>
            Use a different email
          </button>
          <small>Mock link is shown only while email delivery is not connected.</small>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} noValidate>
          <div className="field-group">
            <label htmlFor="resetEmail">Email address</label>
            <div className={`auth-input ${errors.email ? "error" : ""}`}>
              <Mail aria-hidden="true" />
              <input
                id="resetEmail"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "resetEmailError" : undefined}
                {...register("email")}
              />
            </div>
            {errors.email && <p id="resetEmailError" className="field-error" role="alert">{errors.email.message}</p>}
          </div>
          <button type="submit" className="auth-submit btn-gradient" disabled={isSubmitting}>
            {isSubmitting ? <><LoaderCircle className="spin" /> Sending...</> : <>Send reset link <ArrowRight /></>}
          </button>
        </form>
      )}

      <a className="auth-text-link" href="/login">← Back to login</a>
    </div>
  );
}
