import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { PageHeader, buttonClass } from "@/components/ui";
import { LinkList } from "./link-list";

export const metadata: Metadata = { title: "Links" };

export default function LinksPage() {
  return (
    <>
      <PageHeader
        title="Links"
        description="One link per listing, so you know exactly who opened what. Switch any of them off in a tap."
        action={
          <Link href="/links/new" className={buttonClass("primary", "hidden sm:inline-flex")}>
            <PlusIcon size={18} />
            New application
          </Link>
        }
      />
      <LinkList />
    </>
  );
}
