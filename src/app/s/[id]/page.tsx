import type { Metadata } from 'next';
import SnippetClient from './SnippetClient';

type Props = {
  params: Promise<{ id: string }> | { id: string }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/snippets/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.fields) {
        const title = data.fields.title?.stringValue || 'Snippet';
        const ownerName = data.fields.ownerName?.stringValue || 'Someone';
        return {
          title: `${title} by ${ownerName} | SnipLive`,
          description: `Check out this code snippet on SnipLive!`,
        };
      }
    }
  } catch (e) {
    // fallback
  }
  return { title: 'Snippet | SnipLive' };
}

export default function SnippetPage() {
  return <SnippetClient />;
}
