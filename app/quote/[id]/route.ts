import { createClient } from "@supabase/supabase-js";
import { buildQuoteHTML, QuoteData, SelectedBlock } from "@/lib/buildQuoteHTML";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !quote) {
    return new Response("הצעה לא נמצאה", { status: 404 });
  }

  const q = quote.data as QuoteData;

  let selectedBlock: SelectedBlock | null = null;
  if (q.selectedBlockId) {
    const { data: block } = await supabase
      .from("blocks")
      .select("id,name,tagline,description,duration,group_size")
      .eq("id", q.selectedBlockId)
      .single();
    if (block) {
      selectedBlock = {
        id: block.id,
        name: block.name,
        tagline: block.tagline,
        description: block.description,
        duration: block.duration,
        groupSize: block.group_size,
      };
    }
  }

  const host = new URL(_req.url).origin;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || host;
  const html = buildQuoteHTML(q, {
    logoUrl: `${baseUrl}/arc-logo.png`,
    selectedBlock,
  });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
