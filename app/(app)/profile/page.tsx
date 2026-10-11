import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { PHOTOS_BUCKET } from "@/lib/supabase/admin";
import { ProfileBuilder } from "./profile-builder";

export const metadata: Metadata = { title: "Your profile" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader eyebrow="Your rental passport" title="Profile" description="Build it once. Every link you share shows this profile, and you can update it any time." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Builder />
      </Suspense>
    </>
  );
}

async function Builder() {
  const { supabase, profile } = await requireSession();
  let photoUrl: string | null = null;
  if (profile.photo_path) {
    const { data } = await supabase.storage.from(PHOTOS_BUCKET).createSignedUrl(profile.photo_path, 60 * 10);
    photoUrl = data?.signedUrl ?? null;
  }
  const {
    first_name, last_name, headline, intro, occupation, employer, employment_type, move_in_date,
    budget_min, budget_max, household_size, pets, smoker, rental_history, references,
  } = profile;
  return (
    <ProfileBuilder
      initial={{
        first_name, last_name, headline, intro, occupation, employer, employment_type, move_in_date,
        budget_min, budget_max, household_size, pets, smoker, rental_history, references,
      }}
      initialPhotoUrl={photoUrl}
    />
  );
}
