"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { getBrowserClient } from "@/lib/supabase/client";
import type { DocumentCategory, DocumentRow } from "@/lib/types";

const KEY = ["documents"];

export function useDocuments() {
  return useQuery({ queryKey: KEY, queryFn: () => api<DocumentRow[]>("/api/documents") });
}

type UploadInput = { file: File; category: DocumentCategory; label: string; replacesId?: string };

/**
 * Three-step upload: ask the server for a signed upload URL, upload the file
 * straight to the private bucket (bypassing the function body limit), then ask
 * the server to verify and register it.
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, category, label, replacesId }: UploadInput) => {
      const { path, token } = await api<{ path: string; token: string }>("/api/documents/upload-url", {
        method: "POST",
        body: { fileName: file.name, mimeType: file.type, sizeBytes: file.size },
      });
      const { error } = await getBrowserClient().storage.from("documents").uploadToSignedUrl(path, token, file, {
        contentType: file.type,
      });
      if (error) throw new Error("Upload failed. Please try again.");
      return api<DocumentRow>("/api/documents", {
        method: "POST",
        body: { storagePath: path, category, label, replacesId },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; label?: string; category?: DocumentCategory }) =>
      api<DocumentRow>(`/api/documents/${id}`, { method: "PATCH", body: patch }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/documents/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<DocumentRow[]>(KEY);
      queryClient.setQueryData<DocumentRow[]>(KEY, (docs) => docs?.filter((d) => d.id !== id));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
