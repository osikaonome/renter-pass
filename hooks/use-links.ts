"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { AccessRequestStatus, ShareLink } from "@/lib/types";
import type { CreateLinkInput } from "@/schemas/link";

export type LinkSummary = ShareLink & { view_count: number; pending_requests: number };
export type LinkDetail = {
  link: ShareLink;
  views: { viewed_at: string }[];
  requests: {
    id: string;
    requester_name: string;
    requester_email: string;
    status: AccessRequestStatus;
    created_at: string;
    decided_at: string | null;
  }[];
};

export function useLinks() {
  return useQuery({ queryKey: ["links"], queryFn: () => api<LinkSummary[]>("/api/links") });
}

export function useLink(id: string) {
  return useQuery({ queryKey: ["links", id], queryFn: () => api<LinkDetail>(`/api/links/${id}`) });
}

export function useCreateLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLinkInput) => api<ShareLink>("/api/links", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });
}

export function useUpdateLink(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: { label?: string; message?: string; revoked?: true }) =>
      api<ShareLink>(`/api/links/${id}`, { method: "PATCH", body: patch }),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ["links", id] });
      const previous = queryClient.getQueryData<LinkDetail>(["links", id]);
      if (previous) {
        const { revoked, ...rest } = patch;
        queryClient.setQueryData<LinkDetail>(["links", id], {
          ...previous,
          link: { ...previous.link, ...rest, ...(revoked ? { revoked_at: new Date().toISOString() } : {}) },
        });
      }
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(["links", id], context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });
}

export function publicLinkUrl(slug: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? "");
  return `${origin}/p/${slug}`;
}
