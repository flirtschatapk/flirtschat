import {AuthLayout} from "@/components/auth/auth-layout";

export default function AuthErrorPage(){
  return <AuthLayout mode="login"><div className="image-login-card"><div className="image-login-heading"><h1>Something interrupted sign-in</h1><p>We couldn&apos;t load your account safely. Please try once more.</p></div><a className="image-login-submit" href="/login">Back to login</a></div></AuthLayout>;
}
