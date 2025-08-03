import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Fradema Consultoria Tributária",
  description: "Acesse sua conta na Fradema Consultoria Tributária",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
