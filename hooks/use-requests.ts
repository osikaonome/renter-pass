"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type RequestSummary = {
  id: string;
  requesterName: string;
  requesterEmail: string;
  requesterMessage: string | null;
  linkLabel: string;
  createdAt: string;
  status: string;
  myDocuments: { id: string; label: string; decision: string }[];
  awaitingMe: boolean;
};

export type ActiveGrant = {
  id: string;
  expires_at: string;
  view_count: number;
  documents: { label: string } | null;
  access_requests: { requester_name: string; share_links: { label: string } | null } | null;
};

const KEY = ["requests"];

export function useRequests() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api<{ requests: RequestSummary[]; activeGrants: ActiveGrant[] }>("/api/requests"),
    refetchInterval: 60_000,
  });
}

export function useDecide(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { approvedDocumentIds: string[]; expiresInHours: number }) =>
      api<{ approved: number; declined: number }>(`/api/requests/${requestId}/decision`, { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });
}

export function useRevokeGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (grantId: string) => api(`/api/grants/${grantId}/revoke`, { method: "POST" }),
    onMutate: async (grantId) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<{ requests: RequestSummary[]; activeGrants: ActiveGrant[] }>(KEY);
      if (previous) {
        queryClient.setQueryData(KEY, { ...previous, activeGrants: previous.activeGrants.filter((g) => g.id !== grantId) });
      }
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
