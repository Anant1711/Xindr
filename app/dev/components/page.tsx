import { notFound } from "next/navigation";
import { Showcase } from "./Showcase";

export const metadata = { title: "Components" };

export default function DevComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Showcase />;
}
