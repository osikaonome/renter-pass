import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f6f7f5", fontFamily: "Helvetica, Arial, sans-serif", color: "#1c2321" }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
          <Text style={{ fontWeight: 700, fontSize: 18, color: "#1f6f5c" }}>RenterPass</Text>
          <Section style={{ backgroundColor: "#ffffff", borderRadius: 12, padding: 24 }}>{children}</Section>
          <Hr style={{ borderColor: "#e3e6e3", margin: "24px 0 12px" }} />
          <Text style={{ fontSize: 12, color: "#5f6b67" }}>
            RenterPass helps renters in Ireland share their application safely. You received this email because of
            activity on your account or a request you made.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const buttonStyle = {
  backgroundColor: "#1f6f5c",
  color: "#ffffff",
  borderRadius: 8,
  padding: "12px 20px",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
} as const;
