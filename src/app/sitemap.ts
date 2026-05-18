import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://bhhub.co.uk';
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/hire`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/whats-on`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/bouncy-castles`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/find-us`, lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/community`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/garden-gallery`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/hire-agreement`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
