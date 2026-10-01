import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.TODOIST_API_TOKEN!;
const PROJECT_ID = "6gg3qq9G8QhVcG5H"; // ARC project
const BASE = "https://api.todoist.com/api/v1";

const ASSIGNEES: Record<string, string> = {
  "ינון": "34771966",
  "אורי": "37077200",
};

async function todoistFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Todoist ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// GET — list existing sections in the ARC project (never creates any)
export async function GET() {
  try {
    const data = await todoistFetch(`/sections?project_id=${PROJECT_ID}`);
    const sections: { id: string; name: string }[] = (data?.results || [])
      .map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }));
    return NextResponse.json({ sections });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST — create task. sectionId must point to an EXISTING Todoist section —
// this never creates new sections, by design (the user manages categories in Todoist).
export async function POST(req: NextRequest) {
  try {
    const { title, dueDate, responsible, sectionId, notes } = await req.json();

    const assigneeId = responsible ? ASSIGNEES[responsible] : undefined;

    const body: Record<string, unknown> = {
      content: title,
      project_id: PROJECT_ID,
      ...(sectionId ? { section_id: sectionId } : {}),
      ...(dueDate ? { due_date: dueDate } : {}),
      ...(notes ? { description: notes } : {}),
      ...(assigneeId ? { assignee_id: assigneeId } : {}),
    };

    const task = await todoistFetch("/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json({ todoistId: task.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PATCH — complete/reopen, move to a different (existing) section, and/or edit content
export async function PATCH(req: NextRequest) {
  try {
    const { todoistId, completed, sectionId, title, dueDate, responsible } = await req.json();

    if (completed !== undefined) {
      await todoistFetch(`/tasks/${todoistId}/${completed ? "close" : "reopen"}`, { method: "POST" });
    }

    if (sectionId !== undefined) {
      await todoistFetch(`/tasks/${todoistId}/move`, {
        method: "POST",
        body: JSON.stringify({ section_id: sectionId || null }),
      });
    }

    if (title !== undefined || dueDate !== undefined || responsible !== undefined) {
      const assigneeId = responsible ? ASSIGNEES[responsible] : undefined;
      const body: Record<string, unknown> = {
        ...(title !== undefined ? { content: title } : {}),
        ...(dueDate !== undefined ? { due_date: dueDate || null } : {}),
        ...(assigneeId ? { assignee_id: assigneeId } : {}),
      };
      await todoistFetch(`/tasks/${todoistId}`, { method: "POST", body: JSON.stringify(body) });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE — delete task
export async function DELETE(req: NextRequest) {
  try {
    const { todoistId } = await req.json();
    await todoistFetch(`/tasks/${todoistId}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
