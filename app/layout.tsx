import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-fitness-coach-spread.butterbase.dev"),
  title: {
    default: "AI Fitness Coach",
    template: "%s | AI Fitness Coach"
  },
  description:
    "Premium fitness studio software that turns one member profile into a personalized five-video onboarding flow.",
  openGraph: {
    title: "AI Fitness Coach",
    description:
      "Create a branded five-video onboarding plan for every new gym member in under two minutes.",
    url: "https://ai-fitness-coach-spread.butterbase.dev",
    siteName: "AI Fitness Coach",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Fitness Coach",
    description:
      "Personalized AI video onboarding for gyms, built with Next.js, TypeScript, and Butterbase."
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
