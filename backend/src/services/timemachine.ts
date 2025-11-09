import { qdrantClient, COLLECTION_NAME } from '../config/qdrant.js';
import { generateEmbedding } from './embeddings.js';
import { SearchResult } from '../types/index.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface TimeRange {
  start: number;
  end: number;
  description: string;
}

// Parse natural language time expressions
function parseTimeExpression(query: string): TimeRange | null {
  const now = Date.now();
  const queryLower = query.toLowerCase();

  // Map written numbers to digits (including articles)
  const writtenNumbers: { [key: string]: number } = {
    'a': 1, 'an': 1,
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12
  };

  // Specific dates
  if (queryLower.includes('today')) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return {
      start: start.getTime(),
      end: now,
      description: 'today',
    };
  }

  if (queryLower.includes('yesterday')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const end = new Date(yesterday);
    end.setHours(23, 59, 59, 999);
    return {
      start: yesterday.getTime(),
      end: end.getTime(),
      description: 'yesterday',
    };
  }

  if (queryLower.includes('this week')) {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return {
      start: start.getTime(),
      end: now,
      description: 'this week',
    };
  }

  if (queryLower.includes('last week')) {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() - 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return {
      start: start.getTime(),
      end: end.getTime(),
      description: 'last week',
    };
  }

  if (queryLower.includes('this month')) {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return {
      start: start.getTime(),
      end: now,
      description: 'this month',
    };
  }

  if (queryLower.includes('last month')) {
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
    return {
      start: start.getTime(),
      end: end.getTime(),
      description: 'last month',
    };
  }

  // N days/weeks/months ago (with written numbers and articles)
  const daysAgoMatch = queryLower.match(/(?:around\s+)?(?:about\s+)?(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+days?\s+ago/);
  if (daysAgoMatch) {
    const days = writtenNumbers[daysAgoMatch[1]] || parseInt(daysAgoMatch[1]);
    const start = now - (days * 24 * 60 * 60 * 1000);
    return {
      start,
      end: start + (24 * 60 * 60 * 1000),
      description: `${days} day${days !== 1 ? 's' : ''} ago`,
    };
  }

  const weeksAgoMatch = queryLower.match(/(?:around\s+)?(?:about\s+)?(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+weeks?\s+ago/);
  if (weeksAgoMatch) {
    const weeks = writtenNumbers[weeksAgoMatch[1]] || parseInt(weeksAgoMatch[1]);
    const start = now - (weeks * 7 * 24 * 60 * 60 * 1000);
    return {
      start,
      end: start + (7 * 24 * 60 * 60 * 1000),
      description: `${weeks} week${weeks !== 1 ? 's' : ''} ago`,
    };
  }

  const monthsAgoMatch = queryLower.match(/(?:around\s+)?(?:about\s+)?(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+months?\s+ago/);
  if (monthsAgoMatch) {
    const months = writtenNumbers[monthsAgoMatch[1]] || parseInt(monthsAgoMatch[1]);
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return {
      start: start.getTime(),
      end: end.getTime(),
      description: `${months} month${months !== 1 ? 's' : ''} ago`,
    };
  }

  // In the last N days/weeks
  const lastDaysMatch = queryLower.match(/(?:in the )?last (a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+days?/);
  if (lastDaysMatch) {
    const days = writtenNumbers[lastDaysMatch[1]] || parseInt(lastDaysMatch[1]);
    return {
      start: now - (days * 24 * 60 * 60 * 1000),
      end: now,
      description: `last ${days} day${days !== 1 ? 's' : ''}`,
    };
  }

  const lastWeeksMatch = queryLower.match(/(?:in the )?last (a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+weeks?/);
  if (lastWeeksMatch) {
    const weeks = writtenNumbers[lastWeeksMatch[1]] || parseInt(lastWeeksMatch[1]);
    return {
      start: now - (weeks * 7 * 24 * 60 * 60 * 1000),
      end: now,
      description: `last ${weeks} week${weeks !== 1 ? 's' : ''}`,
    };
  }

  return null;
}

// Extract topic from query (remove time expressions)
function extractTopic(query: string): string {
  let topic = query;

  // Remove time expressions (including written numbers like "one", "two", etc.)
  const timePatterns = [
    // Time-specific patterns first
    /\b(today|yesterday|this week|last week|this month|last month)\b/gi,
    /\b(?:around\s+)?(?:about\s+)?(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+(days?|weeks?|months?)\s+ago\b/gi,
    /\b(?:in the )?last\s+(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+(days?|weeks?|months?)\b/gi,
    // Question starters
    /\bwhat (?:was|were) I\b/gi,
    /\bwhat did I\b/gi,
    /\bshow me\b/gi,
    /\bfind\b/gi,
  ];

  timePatterns.forEach(pattern => {
    topic = topic.replace(pattern, '');
  });

  // Clean up extra whitespace and punctuation
  topic = topic.replace(/\s+/g, ' ').trim();
  topic = topic.replace(/^\?+|\?+$/g, '').trim(); // Remove leading/trailing ?

  return topic;
}

// Time Machine search with temporal filtering
export async function timeMachineSearch(
  query: string,
  userId: string,
  limit: number = 10,
  minScore: number = 0.3
): Promise<{ response: string; results: SearchResult[]; timeRange: TimeRange | null }> {
  try {
    console.log(`\n⏰ [TimeMachine] Query: "${query}"`);

    // Parse time expression
    const timeRange = parseTimeExpression(query);
    console.log(`⏰ [TimeMachine] Time range:`, timeRange);

    // Extract topic
    const topic = extractTopic(query);
    console.log(`⏰ [TimeMachine] Topic: "${topic}"`);

    if (!topic || topic.length < 2) {
      return {
        response: "I need a topic to search for. For example: 'What was I reading about robotics 4 weeks ago?'",
        results: [],
        timeRange,
      };
    }

    // 🆕 SIMPLIFIED: Just get ALL items from the time range, no semantic search!
    // Let the AI figure out what's relevant based on the topic
    console.log(`⏰ [TimeMachine] Fetching ALL history from time range...`);
    console.log(`⏰ [TimeMachine] User ID: ${userId}`);
    console.log(`⏰ [TimeMachine] Topic: "${topic}"`);

    const filter: any = {
      must: [
        {
          key: 'user_id',
          match: { value: userId },
        },
      ],
    };

    if (timeRange) {
      filter.must.push({
        key: 'lastVisitTime',
        range: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      });
    }

    // Get ALL items from time range (no vector search, no filtering)
    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 100,
      with_payload: true,
      with_vector: false,
      filter,
    });

    console.log(`✅ [TimeMachine] Found ${scrollResult.points.length} total items in time range`);

    // Convert to search result format
    let searchResult = scrollResult.points.map(point => ({
      id: point.id,
      version: 0,
      score: 1.0, // All items are "relevant" since we're showing everything
      payload: point.payload,
      vector: null,
    }));

    // Map results
    const allResults: SearchResult[] = searchResult.map((result) => ({
      id: result.id.toString(),
      url: result.payload?.url as string,
      title: result.payload?.title as string,
      lastVisitTime: result.payload?.lastVisitTime as number,
      visitCount: result.payload?.visitCount as number,
      typedCount: result.payload?.typedCount as number,
      score: result.score,
    }));

    // 🆕 Have AI filter and select only relevant results + generate response
    const { filteredResults, aiResponse } = await generateTimeMachineResponse(
      query,
      topic,
      allResults,
      timeRange
    );

    console.log(`✅ [TimeMachine] AI filtered to ${filteredResults.length} relevant results`);

    return {
      response: aiResponse,
      results: filteredResults,
      timeRange,
    };
  } catch (error) {
    console.error('⏰ [TimeMachine] Error:', error);
    throw error;
  }
}

// Generate AI response for time machine queries
async function generateTimeMachineResponse(
  originalQuery: string,
  topic: string,
  results: SearchResult[],
  timeRange: TimeRange | null
): Promise<{ filteredResults: SearchResult[]; aiResponse: string }> {
  if (results.length === 0) {
    const message = timeRange
      ? `I couldn't find anything about "${topic}" from ${timeRange.description}. You might not have visited any pages matching that topic during that time period.`
      : `I couldn't find anything about "${topic}" in your browsing history.`;
    return { filteredResults: [], aiResponse: message };
  }

  // Format ALL results for AI to analyze
  const formattedResults = results.map((r, i) => {
    const date = new Date(r.lastVisitTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${i + 1}. "${r.title}" (visited ${date})\n   URL: ${r.url}\n   Visits: ${r.visitCount}`;
  }).join('\n\n');

  const systemPrompt = `You're Brain²'s Time Machine! ⏰ You help users rediscover their past browsing adventures.

Your task has TWO parts:

1. **FILTER**: Analyze all the pages and select ONLY the ones truly relevant to the user's query topic "${topic}". Be selective - quality over quantity. Ignore pages that are just tangentially related or noise.

2. **RESPOND**: Give a warm, conversational 2-4 sentence response about what they were exploring back then.

Your vibe:
- Warm and conversational, like reminiscing with a friend
- Use casual language (contractions like "you were", "I found", "looks like")
- A sprinkle of relevant emojis is great!
- Mention the time period they asked about

IMPORTANT: You MUST respond with valid JSON in this exact format:
{
  "relevantIndices": [1, 3, 5],  // Array of page numbers (1-indexed) that are actually relevant
  "response": "Your warm conversational response here..."
}`;

  const userMessage = `The user asked: "${originalQuery}"
Topic: "${topic}"
${timeRange ? `Time period: ${timeRange.description}` : 'All time'}

Here are the ${results.length} pages from their history:
${formattedResults}

Analyze these pages and return JSON with:
1. "relevantIndices": Array of page numbers (1-indexed) that truly match the topic "${topic}"
2. "response": Your friendly summary of what they were up to

Remember: Be selective! Only include pages that are actually relevant to "${topic}".`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_BASE_URL || 'http://45.32.221.76:3000',
        'X-Title': 'Brain Squared - Time Machine',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' }, // Force JSON response
      }),
    });

    if (!response.ok) {
      throw new Error('OpenRouter request failed');
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    // Parse the JSON response
    const parsed = JSON.parse(content);
    const relevantIndices = parsed.relevantIndices || [];
    const aiResponse = parsed.response || `Found ${results.length} pages about ${topic}${timeRange ? ` from ${timeRange.description}` : ''}.`;

    // Filter results based on AI's selection (convert 1-indexed to 0-indexed)
    const filteredResults = relevantIndices
      .map((idx: number) => results[idx - 1])
      .filter((r: SearchResult | undefined) => r !== undefined);

    console.log(`⏰ [TimeMachine] AI selected ${filteredResults.length} relevant pages out of ${results.length} total`);

    return { filteredResults, aiResponse };
  } catch (error) {
    console.error('Error generating AI response:', error);
    // Fallback: return top 5 results
    return {
      filteredResults: results.slice(0, 5),
      aiResponse: `Found ${results.length} pages about "${topic}"${timeRange ? ` from ${timeRange.description}` : ''}.`,
    };
  }
}
