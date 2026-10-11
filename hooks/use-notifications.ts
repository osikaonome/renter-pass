"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { NotificationRow } from "@/lib/types";

const KEY = ["notifications"];

export function useNotifications() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api<NotificationRow[]>("/api/notifications"),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => api("/api/notifications", { method: "POST", body: { ids } }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<NotificationRow[]>(KEY);
      const now = new Date().toISOString();
      queryClient.setQueryData<NotificationRow[]>(KEY, (rows) =>
        rows?.map((n) => (!ids || ids.includes(n.id) ? { ...n, read_at: n.read_at ?? now } : n)),
      );
      return { previous };
    },
    onError: (_error, _ids, context) => queryClient.setQueryData(KEY, context?.previous),
  });
}

export function describeNotification(n: NotificationRow): { text: string; href: string } {
  const p = n.payload as Record<string, string | string[]>;
  switch (n.type) {
    case "document_request":
      return { text: `${p.requesterName} requested ${(p.documents as string[])?.length ?? ""} document(s) via “${p.linkLabel}”`, href: `/requests/${p.requestId}` };
    case "link_viewed":
      return { text: `Your link “${p.linkLabel}” was opened`, href: `/links/${p.linkId}` };
    case "access_expiring":
      return { text: `${p.requesterName}'s access to “${p.documentLabel}” expires soon`, href: "/dashboard" };
    case "household_invite":
      return { text: `${p.inviterName} invited you to join ${p.householdName}`, href: String(p.url) };
    case "household_joined":
      return { text: `${p.memberName} joined ${p.householdName}`, href: "/household" };
    default:
      return { text: "New activity", href: "/dashboard" };
  }
}
