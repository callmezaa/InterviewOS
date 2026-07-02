import LandingPageContent from '@/components/landing/LandingPageContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'InterviewOS — AI-Powered Realtime Technical Interview Platform',
  description:
    'Experience premium, cinematic realtime technical interviews powered by WebRTC signaling, collaborative coding editors, and AI-driven Whisper transcription with automated evaluation.',
  openGraph: {
    title: 'InterviewOS — AI Realtime Interview Platform',
    description:
      'Cinematic realtime technical interviews with WebRTC video, collaborative code editors, AI transcription, and automated evaluation.',
    url: 'https://interviewos.dev',
    siteName: 'InterviewOS',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InterviewOS — AI Realtime Interview Platform',
    description:
      'Cinematic realtime technical interviews with WebRTC video, collaborative code editors, AI transcription, and automated evaluation.',
  },
  keywords: [
    'technical interviews',
    'realtime coding interviews',
    'WebRTC interview platform',
    'AI interview evaluation',
    'Whisper transcription',
    'collaborative code editor',
    'engineering hiring',
    'remote technical screening',
  ],
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'InterviewOS',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'A cinematic realtime technical interview platform combining WebRTC video calls, synchronized code editors, and live AI transcription.',
  url: 'https://interviewos.dev',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageContent />
    </>
  );
}
