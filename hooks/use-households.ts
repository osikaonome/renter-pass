"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Household } from "@/lib/types";

export type HouseholdWithMembers = Household & {
  is_owner: boolean;
  members: { profile_id: string; first_name: string; last_name: string; headline: string; occupation: string; role: string }[];
  invites: { id: string; invited_email: string; invited_at: string }[];
};

export type HouseholdsResponse = {
  households: HouseholdWithMembers[];
  pendingInvites: { id: string; invited_at: string; households: { name: string } | null }[];
};

const KEY = ["households"];

export function useHouseholds() {
  return useQuery({ queryKey: KEY, queryFn: () => api<HouseholdsResponse>("/api/households") });
}

function useInvalidating<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }) });
}

export const useCreateHousehold = () =>
  useInvalidating((name: string) => api<Household>("/api/households", { method: "POST", body: { name } }));

export const useUpdateHousehold = () =>
  useInvalidating(({ id, ...patch }: { id: string } & Partial<Pick<Household, "name" | "move_in_date" | "combined_budget" | "summary">>) =>
    api<Household>(`/api/households/${id}`, { method: "PATCH", body: patch }),
  );

export const useInvite = () =>
  useInvalidating(({ householdId, email }: { householdId: string; email: string }) =>
    api(`/api/households/${householdId}/invites`, { method: "POST", body: { email } }),
  );

export const useCancelInvite = () =>
  useInvalidating((inviteId: string) => api(`/api/households/invites/${inviteId}`, { method: "DELETE" }));

export const useLeaveHousehold = () =>
  useInvalidating((householdId: string) => api(`/api/households/${householdId}/leave`, { method: "POST" }));

export const useAcceptInvite = () =>
  useInvalidating((token: string) => api<{ householdId: string }>("/api/households/accept", { method: "POST", body: { token } }));
