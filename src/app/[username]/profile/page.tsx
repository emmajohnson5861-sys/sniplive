import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

type Props = {
  params: Promise<{ username: string }> | { username: string }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { username } = resolvedParams;
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    // First try by ID (fallback for old URLs)
    let res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${username}`, { next: { revalidate: 60 } });
    let userDoc: any = null;

    if (res.ok) {
      userDoc = await res.json();
    } else {
      // If fails, try querying by username
      const queryRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'username' },
                op: 'EQUAL',
                value: { stringValue: username }
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
          userDoc = queryData[0].document;
        }
      }
    }

    if (userDoc && userDoc.fields) {
      const name = userDoc.fields.name?.stringValue || userDoc.fields.email?.stringValue || 'Someone';
      return {
        title: `${name}'s Profile | SnipLive`,
        description: `Check out ${name}'s public code snippets and collections on SnipLive!`,
      };
    }
  } catch (e) {
    // fallback
  }
  return { title: 'User Profile | SnipLive' };
}

export default function ProfilePage() {
  return <ProfileClient />;
}
