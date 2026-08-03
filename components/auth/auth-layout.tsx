"use client";
export function AuthLayout({children,mode}:{children:React.ReactNode;mode:"login"|"signup"}){return <main className={`image-login-page image-${mode}-page`}><section className="image-login-container">{children}</section></main>}
