import type { Metadata } from 'next';
import GroupClient from './GroupClient';

type Props = {
  params: Promise<{ collectionSlug: string }> | { collectionSlug: string }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { collectionSlug } = resolvedParams;
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    // First try by ID
    let res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/groups/${collectionSlug}`, { next: { revalidate: 60 } });
    let data: any = null;
    
    if (res.ok) {
      data = await res.json();
    } else {
      // Query by slug
      const queryRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'groups' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'slug' },
                op: 'EQUAL',
                value: { stringValue: collectionSlug }
              }
            },
            limit: 1
          }
        }),
        next: { revalidate: 60 }
      });
      if (queryRes.ok) {
        const queryData = await queryRes.json();
        if (queryData && queryData[0] && queryData[0].document) {
          data = queryData[0].document;
        }
      }
    }

    if (data && data.fields) {
      const title = data.fields.title?.stringValue || 'Collection';
      const ownerName = data.fields.ownerName?.stringValue || 'Someone';
      return {
        title: `${title} by ${ownerName} | SnipLive`,
        description: `Check out this collection of code snippets on SnipLive!`,
      };
    }
  } catch (e) {
    // fallback
  }
  return { title: 'Collection | SnipLive' };
}

export default function GroupPage() {
  return <GroupClient />;
}
