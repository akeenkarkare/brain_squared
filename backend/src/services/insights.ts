import { qdrantClient, COLLECTION_NAME } from '../config/qdrant.js';

interface TimelineDataPoint {
  date: string;
  count: number;
  categories: Record<string, number>;
}

interface InsightsData {
  timeDistribution: {
    category: string;
    percentage: number;
    count: number;
  }[];
  topDomains: {
    domain: string;
    count: number;
    percentage: number;
  }[];
  topTechnologies: string[];
  productiveHours: {
    hour: number;
    count: number;
  }[];
  totalPages: number;
  averageDaily: number;
  weekOverWeek: number;
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

// Categorize URL based on domain
function categorizeUrl(url: string): string {
  const domain = extractDomain(url).toLowerCase();

  if (domain.includes('github') || domain.includes('gitlab') || domain.includes('bitbucket')) {
    return 'code';
  }
  if (domain.includes('stackoverflow') || domain.includes('docs.') || domain.includes('dev.to') || domain.includes('medium')) {
    return 'docs';
  }
  if (domain.includes('twitter') || domain.includes('linkedin') || domain.includes('facebook') || domain.includes('reddit')) {
    return 'social';
  }
  if (domain.includes('youtube') || domain.includes('netflix') || domain.includes('spotify')) {
    return 'entertainment';
  }
  if (domain.includes('amazon') || domain.includes('ebay') || domain.includes('shop')) {
    return 'shopping';
  }

  return 'other';
}

// Extract technologies from titles and URLs
function extractTechnologies(title: string, url: string): string[] {
  const text = `${title} ${url}`.toLowerCase();
  const technologies = [
    'react', 'vue', 'angular', 'svelte',
    'typescript', 'javascript', 'python', 'java', 'rust', 'go', 'cpp', 'c\\+\\+',
    'node', 'express', 'fastapi', 'django', 'flask',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'mongodb', 'postgresql', 'mysql', 'redis',
    'graphql', 'rest', 'api',
    'machine learning', 'ml', 'ai', 'deep learning',
    'nextjs', 'next.js', 'gatsby', 'remix',
  ];

  return technologies.filter(tech => new RegExp(`\\b${tech}\\b`, 'i').test(text));
}

// Get timeline data
export async function getTimelineData(userId: string, days: number = 30): Promise<TimelineDataPoint[]> {
  try {
    const now = Date.now();
    const startTime = now - (days * 24 * 60 * 60 * 1000);

    // Fetch all user's history
    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'user_id',
            match: { value: userId },
          },
        ],
      },
      limit: 10000,
      with_payload: true,
      with_vector: false,
    });

    // Group by date
    const dateMap = new Map<string, { count: number; categories: Record<string, number> }>();

    scrollResult.points.forEach((point) => {
      const lastVisitTime = point.payload?.lastVisitTime as number;
      if (lastVisitTime && lastVisitTime >= startTime) {
        const date = new Date(lastVisitTime).toISOString().split('T')[0];
        const category = categorizeUrl(point.payload?.url as string);

        if (!dateMap.has(date)) {
          dateMap.set(date, { count: 0, categories: {} });
        }

        const dayData = dateMap.get(date)!;
        dayData.count++;
        dayData.categories[category] = (dayData.categories[category] || 0) + 1;
      }
    });

    // Convert to array and fill missing dates
    const timeline: TimelineDataPoint[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(now - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      const data = dateMap.get(dateStr) || { count: 0, categories: {} };
      timeline.unshift({
        date: dateStr,
        count: data.count,
        categories: data.categories,
      });
    }

    return timeline;
  } catch (error) {
    console.error('Error getting timeline data:', error);
    throw error;
  }
}

// Get insights data
export async function getInsightsData(userId: string): Promise<InsightsData> {
  try {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);

    // Fetch all user's history
    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'user_id',
            match: { value: userId },
          },
        ],
      },
      limit: 10000,
      with_payload: true,
      with_vector: false,
    });

    // Analyze data
    const categoryCount: Record<string, number> = {};
    const domainCount: Record<string, number> = {};
    const hourCount: number[] = new Array(24).fill(0);
    const techSet = new Set<string>();
    let thisWeekCount = 0;
    let lastWeekCount = 0;

    scrollResult.points.forEach((point) => {
      const url = point.payload?.url as string;
      const title = point.payload?.title as string;
      const lastVisitTime = point.payload?.lastVisitTime as number;

      // Category distribution
      const category = categorizeUrl(url);
      categoryCount[category] = (categoryCount[category] || 0) + 1;

      // Domain count
      const domain = extractDomain(url);
      domainCount[domain] = (domainCount[domain] || 0) + 1;

      // Productive hours
      if (lastVisitTime) {
        const hour = new Date(lastVisitTime).getHours();
        hourCount[hour]++;

        // Week over week
        if (lastVisitTime >= oneWeekAgo) {
          thisWeekCount++;
        } else if (lastVisitTime >= twoWeeksAgo) {
          lastWeekCount++;
        }
      }

      // Technologies
      const techs = extractTechnologies(title, url);
      techs.forEach(tech => techSet.add(tech));
    });

    // Calculate percentages for categories
    const total = scrollResult.points.length;
    const timeDistribution = Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Top domains
    const topDomains = Object.entries(domainCount)
      .map(([domain, count]) => ({
        domain,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Productive hours (hours with most activity)
    const productiveHours = hourCount
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Week over week comparison
    const weekOverWeek = lastWeekCount > 0
      ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
      : 0;

    return {
      timeDistribution,
      topDomains,
      topTechnologies: Array.from(techSet).slice(0, 10),
      productiveHours,
      totalPages: total,
      averageDaily: Math.round(total / 30),
      weekOverWeek,
    };
  } catch (error) {
    console.error('Error getting insights data:', error);
    throw error;
  }
}
