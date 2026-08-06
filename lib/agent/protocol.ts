/** Sentinel separating chat text from the agent's attachments in the stream. */
export const DOC_MARKER = "␟__ARC_DOC__␟";

export interface GeneratedDoc {
  name: string;
  html: string;
}

/** A page the agent consulted — shown so external claims stay auditable. */
export interface WebSource {
  url: string;
  title: string;
}

/** Something the agent chose to remember this turn. */
export interface NewMemory {
  content: string;
  kind: string;
}

export interface AgentPayload {
  documents: GeneratedDoc[];
  sources: WebSource[];
  memories: NewMemory[];
}

const EMPTY: AgentPayload = { documents: [], sources: [], memories: [] };

/** Splits a raw agent stream into prose and whatever it attached. */
export function splitStream(raw: string): { text: string } & AgentPayload {
  const i = raw.indexOf(DOC_MARKER);
  if (i === -1) return { text: raw, ...EMPTY };

  const text = raw.slice(0, i);
  try {
    const parsed = JSON.parse(raw.slice(i + DOC_MARKER.length)) as AgentPayload;
    return {
      text,
      documents: parsed.documents ?? [],
      sources: parsed.sources ?? [],
      memories: parsed.memories ?? [],
    };
  } catch {
    // Marker arrived but the JSON is still streaming in — show the prose now.
    return { text, ...EMPTY };
  }
}
