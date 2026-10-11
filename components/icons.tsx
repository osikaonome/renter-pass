import type { SVGProps } from "react";

// 24px stroke icons, 1.75 weight. Server-safe: no client JS.
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></Icon>
);
export const LinkIcon = (p: IconProps) => (
  <Icon {...p}><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" /></Icon>
);
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);
export const InboxIcon = (p: IconProps) => (
  <Icon {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" /></Icon>
);
export const VaultIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="12" cy="12" r="3.5" /><path d="M12 8.5V7M12 17v-1.5M15.5 12H17M7 12h1.5" /></Icon>
);
export const UserIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>
);
export const UsersIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.2A6.5 6.5 0 0 1 21.5 20" /></Icon>
);
export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></Icon>
);
export const BellIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Icon>
);
export const LogOutIcon = (p: IconProps) => (
  <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></Icon>
);
export const SunIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></Icon>
);
export const MoonIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Icon>
);
export const MonitorIcon = (p: IconProps) => (
  <Icon {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></Icon>
);
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>
);
export const ShieldCheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></Icon>
);
export const LockIcon = (p: IconProps) => (
  <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>
);
export const UnlockIcon = (p: IconProps) => (
  <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.75-1.4" /></Icon>
);
export const EyeIcon = (p: IconProps) => (
  <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Icon>
);
export const ClockIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
);
export const CopyIcon = (p: IconProps) => (
  <Icon {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></Icon>
);
export const ShareIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 3v12M8 7l4-4 4 4" /><path d="M20 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5" /></Icon>
);
export const ExternalIcon = (p: IconProps) => (
  <Icon {...p}><path d="M15 3h6v6M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Icon>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}><path d="m15 6-6 6 6 6" /></Icon>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
);
export const UploadIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 15V3M7 8l5-5 5 5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></Icon>
);
export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></Icon>
);
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></Icon>
);
export const PencilIcon = (p: IconProps) => (
  <Icon {...p}><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></Icon>
);
export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5M3 21v-5h5" /></Icon>
);
export const MailIcon = (p: IconProps) => (
  <Icon {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></Icon>
);
export const AlertIcon = (p: IconProps) => (
  <Icon {...p}><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></Icon>
);
export const InfoIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></Icon>
);
export const XIcon = (p: IconProps) => (
  <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>
);
export const PenIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></Icon>
);
export const FileIcon = (p: IconProps) => (
  <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></Icon>
);
export const BriefcaseIcon = (p: IconProps) => (
  <Icon {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20" /></Icon>
);
export const IdCardIcon = (p: IconProps) => (
  <Icon {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M5 16a3 3 0 0 1 6 0M14 10h5M14 14h3" /></Icon>
);
export const ReceiptIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 2v20l3-2 3 2 2-2 2 2 3-2 3 2V2l-3 2-3-2-2 2-2-2-3 2Z" /><path d="M8 9h8M8 13h6" /></Icon>
);
export const KeyIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 9.3-9.3M17 6l3 3M15 8l2 2" /></Icon>
);
export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>
);
export const WalletIcon = (p: IconProps) => (
  <Icon {...p}><path d="M20 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-4a2 2 0 0 0 0 4h4v2a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6" /></Icon>
);
export const MoreIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></Icon>
);
export const QuoteIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 21c3 0 7-1 7-8V5H3v7h4c0 4-1 6-4 6M14 21c3 0 7-1 7-8V5h-7v7h4c0 4-1 6-4 6" /></Icon>
);
