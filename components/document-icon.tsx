import { BriefcaseIcon, FileIcon, IdCardIcon, KeyIcon, ReceiptIcon } from "@/components/icons";
import { cn } from "@/components/ui";

const ICONS = {
  employment_letter: BriefcaseIcon,
  landlord_reference: KeyIcon,
  id: IdCardIcon,
  payslip: ReceiptIcon,
  other: FileIcon,
} as const;

export function DocumentIcon({ category, className }: { category: string; className?: string }) {
  const Icon = ICONS[category as keyof typeof ICONS] ?? FileIcon;
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border border-hairline bg-sunken text-muted", className)}>
      <Icon size={18} />
    </span>
  );
}
