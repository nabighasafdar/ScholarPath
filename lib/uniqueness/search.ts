import { XMLParser } from "fast-xml-parser";
import { env } from "@/lib/env";
import type { CandidatePaper, SearchResult } from "@/lib/uniqueness/types";

const MAX_CANDIDATES = 30;
const MIN_ABSTRACT_CHARS = 40;
const SEARCH_TIMEOUT_MS = 10_000;
const PER_SOURCE_LIMIT = 15;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => name === "entry" || name === "link" || name === "author",
});

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}

function isUsableAbstract(abstract: string | null | undefined): abstract is string {
  return Boolean(abstract && abstract.replace(/\s+/g, " ").trim().length >= MIN_ABSTRACT_CHARS);
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function searchArxiv(query: string): Promise<CandidatePaper[]> {
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    start: "0",
    max_results: String(PER_SOURCE_LIMIT),
    sortBy: "relevance",
    sortOrder: "descending",
  });

  const response = await fetchWithTimeout(
    `https://export.arxiv.org/api/query?${params.toString()}`,
    { headers: { Accept: "application/atom+xml" } }
  );

  if (!response.ok) {
    throw new Error(`arXiv search failed (${response.status})`);
  }

  const xml = await response.text();
  const parsed = xmlParser.parse(xml);
  const entries = asArray(parsed?.feed?.entry);

  const papers: CandidatePaper[] = [];
  for (const entry of entries) {
    const title = String(entry?.title ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const abstract = String(entry?.summary ?? "")
      .replace(/\s+/g, " ")
      .trim();
    if (!title || !isUsableAbstract(abstract)) continue;

    const links = asArray(entry?.link);
    const htmlLink = links.find((link) => link?.["@_type"] === "text/html");
    const absId = typeof entry?.id === "string" ? entry.id : "";
    const url =
      (htmlLink?.["@_href"] as string | undefined) ||
      absId ||
      links[0]?.["@_href"] ||
      "";

    const published = typeof entry?.published === "string" ? entry.published : "";
    const year = published ? Number(published.slice(0, 4)) : null;

    papers.push({
      title,
      abstract,
      year: Number.isFinite(year) ? year : null,
      url,
      source: "arxiv",
    });
  }

  return papers;
}

export async function searchSemanticScholar(query: string): Promise<CandidatePaper[]> {
  const params = new URLSearchParams({
    query,
    limit: String(PER_SOURCE_LIMIT),
    fields: "title,abstract,year,url",
  });

  const headers: HeadersInit = { Accept: "application/json" };
  const apiKey = env.semanticScholarApiKey;
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const response = await fetchWithTimeout(
    `https://api.semanticscholar.org/graph/v1/paper/search?${params.toString()}`,
    { headers }
  );

  if (!response.ok) {
    console.warn(`[uniqueness] Semantic Scholar soft failure: HTTP ${response.status}`);
    return [];
  }

  const json = (await response.json()) as {
    data?: Array<{
      title?: string;
      abstract?: string | null;
      year?: number | null;
      url?: string | null;
      paperId?: string;
    }>;
  };

  const papers: CandidatePaper[] = [];
  for (const item of json.data ?? []) {
    const title = String(item.title ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const abstract = item.abstract ? String(item.abstract).replace(/\s+/g, " ").trim() : "";
    if (!title || !isUsableAbstract(abstract)) continue;

    papers.push({
      title,
      abstract,
      year: typeof item.year === "number" ? item.year : null,
      url: item.url || (item.paperId ? `https://www.semanticscholar.org/paper/${item.paperId}` : ""),
      source: "semantic_scholar",
    });
  }

  return papers;
}

export async function searchCandidates(ideaText: string): Promise<SearchResult> {
  const warnings: string[] = [];
  const settled = await Promise.allSettled([
    searchArxiv(ideaText),
    searchSemanticScholar(ideaText),
  ]);

  const [arxivResult, s2Result] = settled;

  const arxivPapers =
    arxivResult.status === "fulfilled"
      ? arxivResult.value
      : (() => {
          console.warn("[uniqueness] arXiv search failed:", arxivResult.reason);
          warnings.push("arXiv search was unavailable for this request.");
          return [] as CandidatePaper[];
        })();

  const s2Papers =
    s2Result.status === "fulfilled"
      ? s2Result.value
      : (() => {
          console.warn("[uniqueness] Semantic Scholar search failed:", s2Result.reason);
          warnings.push("Semantic Scholar search was unavailable for this request.");
          return [] as CandidatePaper[];
        })();

  if (arxivResult.status === "fulfilled" && arxivPapers.length === 0) {
    // Soft empty from S2 already returns [] without warning; arXiv empty is fine.
  }
  if (s2Result.status === "fulfilled" && s2Papers.length === 0 && !env.semanticScholarApiKey) {
    // Keyless pool may throttle; surface a gentle warning only when completely empty
    // and arXiv also returned nothing — handled below via corpusEmpty in scoring.
  }

  const seen = new Set<string>();
  const candidates: CandidatePaper[] = [];

  for (const paper of [...arxivPapers, ...s2Papers]) {
    const key = normalizeTitle(paper.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    candidates.push(paper);
    if (candidates.length >= MAX_CANDIDATES) break;
  }

  return { candidates, warnings };
}
