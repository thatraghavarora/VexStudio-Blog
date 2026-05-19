const siteUrl = 'https://blogs.vexstudio.xyz';

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function urlNode(loc, lastmod, priority = '0.7') {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : '',
    '    <changefreq>weekly</changefreq>',
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

export default async function handler(_request, response) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const urls = [
    urlNode(`${siteUrl}/`, null, '1.0'),
    urlNode(`${siteUrl}/blogs`, null, '0.8'),
  ];

  if (supabaseUrl && supabaseKey) {
    const endpoint = `${supabaseUrl}/rest/v1/posts?select=slug,updated_at,created_at&published=eq.true&order=created_at.desc`;
    const result = await fetch(endpoint, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (result.ok) {
      const posts = await result.json();
      posts
        .filter((post) => post.slug)
        .forEach((post) => {
          const lastmod = new Date(post.updated_at || post.created_at).toISOString();
          urls.push(urlNode(`${siteUrl}/blog/${post.slug}`, lastmod, '0.9'));
        });
    }
  }

  response.setHeader('Content-Type', 'application/xml; charset=utf-8');
  response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
  response.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`);
}
