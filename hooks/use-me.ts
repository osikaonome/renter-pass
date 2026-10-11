"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Profile } from "@/lib/types";

/** The signed-in renter, for the app chrome (name, email, avatar initial). */
export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => api<Profile>("/api/profile"), staleTime: 5 * 60_000 });
}

export function displayName(profile: Pick<Profile, "first_name" | "last_name" | "email"> | undefined) {
  if (!profile) return "";
  const name = `${profile.first_name} ${profile.last_name}`.trim();
  return name || profile.email;
}
