import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.TODOIST_API_TOKEN!;
const PROJECT_ID = "6gg3qq9G8QhVcG5H"; // ARC project
const BASE = "https://api.todoist.com/api/v1";

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

// Get or create a section for a project name
async function getOrCreateSection(sectionName: string): Promise<string> {
  const data = await todoistFetch(`/sections?project_id=${PROJECT_ID}`);
  const sections: { id: string; name: string }[] = data?.results || [];
  const existing = sections.find((s) => s.name === sectionName);
  if (existing) return existing.id;

  const created = await todoistFetch("/sections", {
    method: "POST",
    body: JSON.stringify({ project_id: PROJECT_ID, name: sectionName, order: 99 }),
  });
  return created.id;
}

// POST — create task
export async function POST(req: NextRequest) {
  try {
    const { title, dueDate, responsible, projectName, notes } = await req.json();
    const sectionId = projectName ? await getOrCreateSection(projectName) : undefined;

    const body: Record<string, unknown> = {
      content: title,
      project_id: PROJECT_ID,
      ...(sectionId ? { section_id: sectionId } : {}),
      ...(dueDate ? { due_date: dueDate } : {}),
      ...(notes ? { description: notes } : {}),
      ...(responsible ? { description: `${notes ? notes + "\n" : ""}אחראי: ${responsible}` } : {}),
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

// PATCH — complete or reopen
export async function PATCH(req: NextRequest) {
  try {
    const { todoistId, completed } = await req.json();
    if (completed) {
      await todoistFetch(`/tasks/${todoistId}/close`, { method: "POST" });
    } else {
      await todoistFetch(`/tasks/${todoistId}/reopen`, { method: "POST" });
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
