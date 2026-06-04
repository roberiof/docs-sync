import { redirect } from "next/navigation";

// Entry point: bounce to the app. Proxy redirects to /login when signed out.
export default function Home() {
  redirect("/dashboard");
}
