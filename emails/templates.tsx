import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout, buttonStyle } from "./layout";

export function VerificationCodeEmail({ code, renterName }: { code: string; renterName: string }) {
  return (
    <EmailLayout preview={`Your RenterPass code is ${code}`}>
      <Heading as="h1" style={{ fontSize: 20 }}>
        Your verification code
      </Heading>
      <Text>Enter this code to request documents from {renterName}:</Text>
      <Text style={{ fontSize: 32, fontWeight: 700, letterSpacing: 6 }}>{code}</Text>
      <Text style={{ fontSize: 13, color: "#5f6b67" }}>
        The code expires in 10 minutes. If you didn&apos;t ask for it, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

export function DocumentRequestEmail({
  requesterName,
  requesterEmail,
  linkLabel,
  documentLabels,
  url,
}: {
  requesterName: string;
  requesterEmail: string;
  linkLabel: string;
  documentLabels: string[];
  url: string;
}) {
  return (
    <EmailLayout preview={`${requesterName} requested documents`}>
      <Heading as="h1" style={{ fontSize: 20 }}>
        New document request
      </Heading>
      <Text>
        <strong>{requesterName}</strong> ({requesterEmail}, verified) asked to see these documents via your link
        &ldquo;{linkLabel}&rdquo;:
      </Text>
      <ul>
        {documentLabels.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
      <Text>Nothing is shared until you approve it.</Text>
      <Button href={url} style={buttonStyle}>
        Review request
      </Button>
    </EmailLayout>
  );
}

export function RequestDecisionEmail({
  renterName,
  approvedCount,
  declinedCount,
  expiresAt,
  url,
}: {
  renterName: string;
  approvedCount: number;
  declinedCount: number;
  expiresAt: string | null;
  url: string | null;
}) {
  return (
    <EmailLayout preview={`${renterName} responded to your document request`}>
      <Heading as="h1" style={{ fontSize: 20 }}>
        {renterName} responded to your request
      </Heading>
      {approvedCount > 0 ? (
        <>
          <Text>
            {approvedCount} document{approvedCount === 1 ? "" : "s"} approved
            {declinedCount > 0 ? `, ${declinedCount} declined` : ""}. Access expires {expiresAt}.
          </Text>
          <Text style={{ fontSize: 13, color: "#5f6b67" }}>
            Documents are watermarked with your name. This link is personal to you; please don&apos;t forward it.
          </Text>
          {url && (
            <Button href={url} style={buttonStyle}>
              View documents
            </Button>
          )}
        </>
      ) : (
        <Text>{renterName} has declined this request.</Text>
      )}
    </EmailLayout>
  );
}

export function HouseholdInviteEmail({
  inviterName,
  householdName,
  url,
}: {
  inviterName: string;
  householdName: string;
  url: string;
}) {
  return (
    <EmailLayout preview={`${inviterName} invited you to apply together`}>
      <Heading as="h1" style={{ fontSize: 20 }}>
        Join {householdName} on RenterPass
      </Heading>
      <Text>
        {inviterName} wants to apply for homes together. You keep your own profile and your own documents, and you
        decide who sees them.
      </Text>
      <Button href={url} style={buttonStyle}>
        Accept invite
      </Button>
    </EmailLayout>
  );
}

export function ViewDigestEmail({ rows, url }: { rows: { label: string; views: number }[]; url: string }) {
  return (
    <EmailLayout preview="Your links were viewed today">
      <Heading as="h1" style={{ fontSize: 20 }}>
        Today&apos;s link views
      </Heading>
      <ul>
        {rows.map((row) => (
          <li key={row.label}>
            {row.label}: {row.views} view{row.views === 1 ? "" : "s"}
          </li>
        ))}
      </ul>
      <Button href={url} style={buttonStyle}>
        Open dashboard
      </Button>
    </EmailLayout>
  );
}
