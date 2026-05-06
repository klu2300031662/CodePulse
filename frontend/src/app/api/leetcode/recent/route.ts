import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    // Fetch recent accepted submissions from LeetCode GraphQL
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({
        query: `
          query recentAcSubmissions($username: String!, $limit: Int!) {
            recentAcSubmissionList(username: $username, limit: $limit) {
              id
              title
              titleSlug
              timestamp
              lang
            }
          }
        `,
        variables: {
          username: username,
          limit: 15,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from LeetCode' }, { status: 502 });
    }

    const data = await response.json();
    const submissions = data?.data?.recentAcSubmissionList || [];

    // Deduplicate by titleSlug (keep the latest submission per problem)
    const seen = new Set<string>();
    const unique = submissions.filter((s: any) => {
      if (seen.has(s.titleSlug)) return false;
      seen.add(s.titleSlug);
      return true;
    });

    return NextResponse.json({ submissions: unique });
  } catch (error) {
    console.error('LeetCode API error:', error);
    return NextResponse.json({ error: 'Failed to fetch recent submissions' }, { status: 500 });
  }
}
