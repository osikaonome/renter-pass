import type { Metadata } from "next";
import { NewApplication } from "./new-application";

export const metadata: Metadata = { title: "New application" };

export default function NewApplicationPage() {
  return <NewApplication />;
}
