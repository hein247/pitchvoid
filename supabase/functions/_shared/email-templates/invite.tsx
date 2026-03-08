/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

const logoUrl = 'https://kixwyufvyfnvtgzbisqy.supabase.co/storage/v1/object/public/email-assets/pitchvoid-logo.png'

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to PitchVoid</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} alt="PitchVoid" height="28" style={logo} />
        <Heading style={h1}>You're invited</Heading>
        <Text style={text}>
          Someone invited you to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>PitchVoid</strong>
          </Link>
          . Accept below to create your account and start crafting pitches.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          Wasn't expecting this? Safe to ignore.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Be Vietnam Pro', Arial, sans-serif" }
const container = { padding: '40px 32px' }
const logo = { marginBottom: '32px' }
const h1 = {
  fontSize: '24px',
  fontWeight: '600' as const,
  color: '#1a1018',
  margin: '0 0 16px',
}
const text = {
  fontSize: '14px',
  color: '#7a7068',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const link = { color: '#1a1018', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(25, 75%, 65%)',
  color: '#1a1018',
  fontSize: '14px',
  fontWeight: '500' as const,
  borderRadius: '12px',
  padding: '14px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#a09890', margin: '32px 0 0' }
