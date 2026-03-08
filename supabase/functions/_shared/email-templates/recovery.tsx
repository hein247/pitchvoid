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
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

const logoUrl = 'https://kixwyufvyfnvtgzbisqy.supabase.co/storage/v1/object/public/email-assets/pitchvoid-logo.png'

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your PitchVoid password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} alt="PitchVoid" height="28" style={logo} />
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We got a request to reset your PitchVoid password. Hit the button below to pick a new one.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reset Password
        </Button>
        <Text style={footer}>
          Didn't request this? No worries — your password stays the same.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
