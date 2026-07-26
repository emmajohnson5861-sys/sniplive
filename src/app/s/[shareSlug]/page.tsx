import { Metadata } from 'next';
import { getSnippet } from '@/lib/firebase-db';
import SharedSnippetViewerClient from './SharedSnippetViewerClient';

interface PageProps {
  params: Promise<{
    shareSlug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const shareSlug = resolvedParams.shareSlug;
  const id = shareSlug.split('-')[0];

  try {
    const snippet = await getSnippet(id);
    if (!snippet) {
      return { title: 'Snippet Not Found | SnipLive' };
    }

    const title = `${snippet.title} | SnipLive`;
    const description = `Check out this code snippet on SnipLive: ${snippet.title}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: 'SnipLive',
        images: ['/logo.png'],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/logo.png'],
      },
    };
  } catch (error) {
    return { title: 'SnipLive' };
  }
}

export default function SharedSnippetPage() {
  return <SharedSnippetViewerClient />;
}
