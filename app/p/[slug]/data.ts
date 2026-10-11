import "server-only";
import { cache } from "react";
import { loadPublicLink } from "@/lib/public-link";

// Deduplicated per request across generateMetadata, the page and its children.
export const getPublicLink = cache((slug: string) => loadPublicLink(slug));
