/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const logoUrl = 'https://kixwyufvyfnvtgzbisqy.supabase.co/storage/v1/object/public/email-assets/pitchvoid-logo.png'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your PitchVoid verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} alt="PitchVoid" height="28" style={logo} />
        <Heading style={h1}>Verification code</Heading>
        <Text style={text}>Use this code to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires shortly. Didn't request it? Safe to ignore.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: "'Be Vietnam Pro', Courier, monospace",
  fontSize: '28px',
  fontWeight: '600' as const,
  color: '#1a1018',
  letterSpacing: '4px',
  margin: '0 0 32px',
}
const footer = { fontSize: '12px', color: '#a09890', margin: '32px 0 0' }
