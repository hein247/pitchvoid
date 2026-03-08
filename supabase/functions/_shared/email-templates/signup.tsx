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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const logoUrl = 'https://kixwyufvyfnvtgzbisqy.supabase.co/storage/v1/object/public/email-assets/pitchvoid-logo.png'

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're in // confirm your PitchVoid account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} alt="PitchVoid" height="28" style={logo} />
        <Heading style={h1}>You're almost in.</Heading>
        <Text style={text}>
          Welcome to{' '}
          <Link href={siteUrl} style={link}>
            <strong>PitchVoid</strong>
          </Link>
          . One click and you're ready to craft your next pitch.
        </Text>
        <Text style={text}>
          Confirm your email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to get started:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm &amp; Get Started
        </Button>
        <Text style={footer}>
          Didn't sign up? Ignore this — nothing will change.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
