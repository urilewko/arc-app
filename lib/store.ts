"use client";
import { create } from "zustand";
import { supabase, toSnake, toCamel } from "./supabase";

export type LeadStatus =
  | "שיחה ראשונית"
  | "מחכים להצעת ערך"
  | "מחכים להצעת מחיר"
  | "פגישה"
  | "משא ומתן"
  | "ping"
  | "נסגר"
  | "נפל";

export type ProductType = "ריטריט" | "סדנה חד פעמית" | "Offsite" | "קורס" | "אירוע";
export type ProductionStatus = "עוד לא התחלנו" | "בעבודה" | "בוצע";
export type InfraCategory = "תשתית" | "המשק" | "שטח" | "שיווק ומיצוב" | "The Hub" | "הקהילה" | "אחר";
export type TaskCategory = "תוכן" | "לוגיסטיקה" | "הנחייה" | "שיווק" | "פיננסי" | "אחר";
export type TaskStatus = "לביצוע" | "בעבודה" | "הושלם";

export interface ProjectTask {
  id: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  responsible: string;
  dueDate: string;
  notes: string;
}
export type BlockStatus = "רעיון" | "בפיתוח" | "מוכן" | "בוצע בשטח";
export type CollabDomain = "הנחייה" | "אמנות" | "מוזיקה" | "תנועה" | "טבע" | "בישול" | "טכנולוגיה" | "אחר";
export type CollabAvailability = "פנוי" | "עסוק חלקית" | "לא זמין";
export type PaymentStatus = "ממתין" | "שולם חלקית" | "שולם במלואו";
export type FinanceRecordType = "income" | "expense";

export interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  paidBy?: string;
  date?: string;
}
export type ReviewType = "שימור" | "שיפור";

export interface ReviewItem {
  id: string;
  type: ReviewType;
  what: string;
  why: string;
  howToImprove: string;
}

export interface ScheduleSlot {
  id: string;
  name: string;
  reviews: ReviewItem[];
}

export interface CollabReview {
  id: string;
  name: string;
  reviews: ReviewItem[];
  score: number;
}

export interface Debrief {
  id: string;
  projectId: string;
  orgName: string;
  eventDate: string;
  eventDateEnd: string;
  createdAt: string;
  participantsCount: number;
  location: string;
  blockName: string;
  scheduleSlots: ScheduleSlot[];
  contentSlotReviews: { slotId: string; reviews: ReviewItem[] }[];
  contentGeneralReviews: ReviewItem[];
  contentScore: number;
  logisticsGeneralReviews: ReviewItem[];
  logisticsScore: number;
  collabReviews: CollabReview[];
  orgWorkScore: number;
  orgValueScore: number;
  paymentReceived: number;
  expenses: { id: string; description: string; amount: number; paidBy?: string }[];
  photoAlbumLink: string;
  quotesLink: string;
  notes: string;
}

export interface Contact {
  id: string;
  orgName: string;
  contactName: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
  category: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  contactId: string;
  orgName: string;
  status: LeadStatus;
  source: string;
  productType: ProductType;
  dealValue: number;
  nextAction: string;
  responsible: string;
  dueDate: string;
  activityDate: string;
  notes: string;
  trustLevel?: "חם" | "בינוני" | "קר";
  createdAt: string;
}

export interface Project {
  id: string;
  leadId: string;
  contactId: string;
  orgName: string;
  productType: ProductType;
  startDate: string;
  endDate: string;
  productionStatus: ProductionStatus;
  price: number;
  teamMembers: string[];
  tasks: ProjectTask[];
  notes: string;
  driveLink?: string;
  createdAt: string;
}

export interface InfraTask {
  id: string;
  title: string;
  status: TaskStatus;
  responsible: string;
  dueDate: string;
  notes: string;
  category: TaskCategory;
}

export interface InfraProject {
  id: string;
  name: string;
  category: InfraCategory;
  productionStatus: ProductionStatus;
  owner: string;
  dueDate: string;
  notes: string;
  createdAt: string;
  expenses: ExpenseItem[];
  tasks: InfraTask[];
}

export interface BlockContentItem {
  id: string;
  title: string;
  body: string;
}

export interface BlockMarketingLink {
  id: string;
  label: string;
  url: string;
}

export interface Block {
  id: string;
  name: string;
  productType: ProductType;
  tagline: string;
  description: string;
  duration: string;
  groupSize: string;
  price: number;
  status: BlockStatus;
  completionPercent: number;
  createdAt: string;
  contentItems: BlockContentItem[];
  experience: string;
  logistics: string;
  marketingPitch: string;
  marketingAudience: string;
  marketingLinks: BlockMarketingLink[];
  expenses: ExpenseItem[];
  includes?: string;
  marketingNotes?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  domain: CollabDomain;
  specialty: string;
  phone: string;
  email: string;
  availability: CollabAvailability;
  workTerms: string;
  pastProjects: string;
  notes: string;
  createdAt: string;
}

export interface FinanceRecord {
  id: string;
  projectId: string;
  orgName: string;
  amount: number;
  paymentStatus: PaymentStatus;
  invoiceDate: string;
  paidDate: string;
  notes: string;
  recordType: FinanceRecordType;
  expenseCategory?: string;
  person?: "אורי" | "ינון" | "שניהם";
  createdAt: string;
}

// ── Supabase sync helpers ──────────────────────────────────────────
type Rec = Record<string, unknown>;

async function dbInsert(table: string, row: Rec) {
  const { error } = await supabase.from(table).insert(toSnake(row));
  if (error) console.error(`insert ${table}:`, error.message);
}

async function dbUpdate(table: string, id: string, patch: Rec) {
  const { error } = await supabase.from(table).update(toSnake(patch)).eq("id", id);
  if (error) console.error(`update ${table}:`, error.message);
}

async function dbDelete(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) console.error(`delete ${table}:`, error.message);
}

async function dbFetch(table: string): Promise<Rec[]> {
  const { data, error } = await supabase.from(table).select("*");
  if (error) { console.error(`fetch ${table}:`, error.message); return []; }
  return (data as Rec[]).map(toCamel);
}

// ── Store ──────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

interface ARCStore {
  contacts: Contact[];
  leads: Lead[];
  projects: Project[];
  infraProjects: InfraProject[];
  blocks: Block[];
  collaborators: Collaborator[];
  financeRecords: FinanceRecord[];
  debriefs: Debrief[];

  // UI state (not synced)
  financeYear: number;
  financePeriod: "h1" | "h2" | "year";
  setFinanceYear: (y: number) => void;
  setFinancePeriod: (p: "h1" | "h2" | "year") => void;

  // Load all data from Supabase
  loadAll: () => Promise<void>;

  contactCategories: string[];
  addContactCategory: (cat: string) => void;
  addContact: (c: Omit<Contact, "id" | "createdAt">) => void;
  updateContact: (id: string, c: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  addLead: (l: Omit<Lead, "id" | "createdAt">) => void;
  updateLead: (id: string, l: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  closeLead: (id: string) => void;

  addProject: (p: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addProjectTask: (projectId: string, task: Omit<ProjectTask, "id">) => void;
  updateProjectTask: (projectId: string, taskId: string, task: Partial<ProjectTask>) => void;
  deleteProjectTask: (projectId: string, taskId: string) => void;

  addInfraProject: (p: Omit<InfraProject, "id" | "createdAt">) => void;
  updateInfraProject: (id: string, p: Partial<InfraProject>) => void;
  deleteInfraProject: (id: string) => void;
  addInfraTask: (projectId: string, task: Omit<InfraTask, "id">) => void;
  updateInfraTask: (projectId: string, taskId: string, task: Partial<InfraTask>) => void;
  deleteInfraTask: (projectId: string, taskId: string) => void;

  addBlock: (b: Omit<Block, "id" | "createdAt">) => void;
  updateBlock: (id: string, b: Partial<Block>) => void;
  deleteBlock: (id: string) => void;

  addCollaborator: (c: Omit<Collaborator, "id" | "createdAt">) => void;
  updateCollaborator: (id: string, c: Partial<Collaborator>) => void;
  deleteCollaborator: (id: string) => void;

  addFinanceRecord: (f: Omit<FinanceRecord, "id" | "createdAt">) => void;
  updateFinanceRecord: (id: string, f: Partial<FinanceRecord>) => void;
  deleteFinanceRecord: (id: string) => void;

  addDebrief: (d: Omit<Debrief, "id" | "createdAt">) => void;
  updateDebrief: (id: string, d: Partial<Debrief>) => void;
  deleteDebrief: (id: string) => void;
}

export const useStore = create<ARCStore>()((set, get) => ({
  contacts: [],
  contactCategories: [],
  leads: [],
  projects: [],
  infraProjects: [],
  blocks: [],
  collaborators: [],
  financeRecords: [],
  debriefs: [],

  financeYear: new Date().getFullYear(),
  financePeriod: "h1",
  setFinanceYear: (y) => set({ financeYear: y }),
  setFinancePeriod: (p) => set({ financePeriod: p }),

  loadAll: async () => {
    const [contacts, leads, projects, infraProjects, blocks, collaborators, financeRecords, debriefs] =
      await Promise.all([
        dbFetch("contacts"),
        dbFetch("leads"),
        dbFetch("projects"),
        dbFetch("infra_projects"),
        dbFetch("blocks"),
        dbFetch("collaborators"),
        dbFetch("finance_records"),
        dbFetch("debriefs"),
      ]);
    set({
      contacts: contacts as unknown as Contact[],
      leads: leads as unknown as Lead[],
      projects: projects as unknown as Project[],
      infraProjects: infraProjects as unknown as InfraProject[],
      blocks: blocks as unknown as Block[],
      collaborators: collaborators as unknown as Collaborator[],
      financeRecords: financeRecords as unknown as FinanceRecord[],
      debriefs: debriefs as unknown as Debrief[],
    });
  },

  // ── Contacts ──
  addContactCategory: (cat) => {
    if (!cat.trim()) return;
    set((s) => {
      if (s.contactCategories.includes(cat.trim())) return s;
      return { contactCategories: [...s.contactCategories, cat.trim()] };
    });
  },
  addContact: (c) => {
    const row: Contact = { ...c, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ contacts: [...s.contacts, row] }));
    dbInsert("contacts", row as unknown as Rec);
  },
  updateContact: (id, c) => {
    set((s) => ({ contacts: s.contacts.map((x) => x.id === id ? { ...x, ...c } : x) }));
    dbUpdate("contacts", id, c as Rec);
  },
  deleteContact: (id) => {
    set((s) => ({ contacts: s.contacts.filter((x) => x.id !== id) }));
    dbDelete("contacts", id);
  },

  // ── Leads ──
  addLead: (l) => {
    const row: Lead = { ...l, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ leads: [...s.leads, row] }));
    dbInsert("leads", row as unknown as Rec);
  },
  updateLead: (id, l) => {
    set((s) => ({ leads: s.leads.map((x) => x.id === id ? { ...x, ...l } : x) }));
    dbUpdate("leads", id, l as Rec);
  },
  deleteLead: (id) => {
    set((s) => ({ leads: s.leads.filter((x) => x.id !== id) }));
    dbDelete("leads", id);
  },
  closeLead: (id) => {
    const lead = get().leads.find((l) => l.id === id);
    if (!lead) return;
    const alreadyClosed = lead.status === "נסגר";
    const newProject: Project | null = alreadyClosed ? null : {
      id: uid(),
      leadId: id,
      contactId: lead.contactId,
      orgName: lead.orgName,
      productType: lead.productType || "סדנה חד פעמית",
      startDate: lead.activityDate || "",
      endDate: "",
      productionStatus: "עוד לא התחלנו",
      price: lead.dealValue,
      teamMembers: [],
      tasks: [],
      notes: lead.notes,
      createdAt: new Date().toISOString(),
    };
    const newFinanceRecord: FinanceRecord | null = newProject ? {
      id: uid(),
      projectId: newProject.id,
      orgName: newProject.orgName,
      amount: newProject.price || 0,
      paymentStatus: "ממתין",
      invoiceDate: "",
      paidDate: "",
      notes: "",
      recordType: "income",
      person: "שניהם",
      createdAt: new Date().toISOString(),
    } : null;
    set((s) => ({
      leads: s.leads.map((x) => x.id === id ? { ...x, status: "נסגר" } : x),
      projects: newProject ? [...s.projects, newProject] : s.projects,
      financeRecords: newFinanceRecord ? [...s.financeRecords, newFinanceRecord] : s.financeRecords,
    }));
    dbUpdate("leads", id, { status: "נסגר" });
    if (newProject) dbInsert("projects", newProject as unknown as Rec);
    if (newFinanceRecord) dbInsert("finance_records", newFinanceRecord as unknown as Rec);
  },

  // ── Projects ──
  addProject: (p) => {
    const row: Project = { ...p, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ projects: [...s.projects, row] }));
    dbInsert("projects", row as unknown as Rec);
  },
  updateProject: (id, p) => {
    set((s) => ({ projects: s.projects.map((x) => x.id === id ? { ...x, ...p } : x) }));
    dbUpdate("projects", id, p as Rec);
  },
  deleteProject: (id) => {
    set((s) => ({ projects: s.projects.filter((x) => x.id !== id) }));
    dbDelete("projects", id);
  },
  addProjectTask: (projectId, task) => {
    const newTask = { ...task, id: uid() };
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, tasks: [...(p.tasks || []), newTask] } : p
      ),
    }));
    const project = get().projects.find((p) => p.id === projectId);
    if (project) dbUpdate("projects", projectId, { tasks: project.tasks } as Rec);
  },
  updateProjectTask: (projectId, taskId, task) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, tasks: (p.tasks || []).map((t) => t.id === taskId ? { ...t, ...task } : t) }
          : p
      ),
    }));
    const project = get().projects.find((p) => p.id === projectId);
    if (project) dbUpdate("projects", projectId, { tasks: project.tasks } as Rec);
  },
  deleteProjectTask: (projectId, taskId) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, tasks: (p.tasks || []).filter((t) => t.id !== taskId) }
          : p
      ),
    }));
    const project = get().projects.find((p) => p.id === projectId);
    if (project) dbUpdate("projects", projectId, { tasks: project.tasks } as Rec);
  },

  // ── Infra ──
  addInfraProject: (p) => {
    const row: InfraProject = { ...p, id: uid(), createdAt: new Date().toISOString(), tasks: p.tasks || [] };
    set((s) => ({ infraProjects: [...s.infraProjects, row] }));
    dbInsert("infra_projects", row as unknown as Rec);
  },
  updateInfraProject: (id, p) => {
    set((s) => ({ infraProjects: s.infraProjects.map((x) => x.id === id ? { ...x, ...p } : x) }));
    dbUpdate("infra_projects", id, p as Rec);
  },
  deleteInfraProject: (id) => {
    set((s) => ({ infraProjects: s.infraProjects.filter((x) => x.id !== id) }));
    dbDelete("infra_projects", id);
  },
  addInfraTask: (projectId, task) => {
    const newTask = { ...task, id: uid() };
    set((s) => ({
      infraProjects: s.infraProjects.map((p) =>
        p.id === projectId ? { ...p, tasks: [...(p.tasks || []), newTask] } : p
      ),
    }));
    const project = get().infraProjects.find((p) => p.id === projectId);
    if (project) dbUpdate("infra_projects", projectId, { tasks: project.tasks } as Rec);
  },
  updateInfraTask: (projectId, taskId, task) => {
    set((s) => ({
      infraProjects: s.infraProjects.map((p) =>
        p.id === projectId
          ? { ...p, tasks: (p.tasks || []).map((t) => t.id === taskId ? { ...t, ...task } : t) }
          : p
      ),
    }));
    const project = get().infraProjects.find((p) => p.id === projectId);
    if (project) dbUpdate("infra_projects", projectId, { tasks: project.tasks } as Rec);
  },
  deleteInfraTask: (projectId, taskId) => {
    set((s) => ({
      infraProjects: s.infraProjects.map((p) =>
        p.id === projectId
          ? { ...p, tasks: (p.tasks || []).filter((t) => t.id !== taskId) }
          : p
      ),
    }));
    const project = get().infraProjects.find((p) => p.id === projectId);
    if (project) dbUpdate("infra_projects", projectId, { tasks: project.tasks } as Rec);
  },

  // ── Blocks ──
  addBlock: (b) => {
    const row: Block = { ...b, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ blocks: [...s.blocks, row] }));
    dbInsert("blocks", row as unknown as Rec);
  },
  updateBlock: (id, b) => {
    set((s) => ({ blocks: s.blocks.map((x) => x.id === id ? { ...x, ...b } : x) }));
    dbUpdate("blocks", id, b as Rec);
  },
  deleteBlock: (id) => {
    set((s) => ({ blocks: s.blocks.filter((x) => x.id !== id) }));
    dbDelete("blocks", id);
  },

  // ── Collaborators ──
  addCollaborator: (c) => {
    const row: Collaborator = { ...c, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ collaborators: [...s.collaborators, row] }));
    dbInsert("collaborators", row as unknown as Rec);
  },
  updateCollaborator: (id, c) => {
    set((s) => ({ collaborators: s.collaborators.map((x) => x.id === id ? { ...x, ...c } : x) }));
    dbUpdate("collaborators", id, c as Rec);
  },
  deleteCollaborator: (id) => {
    set((s) => ({ collaborators: s.collaborators.filter((x) => x.id !== id) }));
    dbDelete("collaborators", id);
  },

  // ── Finance ──
  addFinanceRecord: (f) => {
    const row: FinanceRecord = { ...f, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ financeRecords: [...s.financeRecords, row] }));
    dbInsert("finance_records", row as unknown as Rec);
  },
  updateFinanceRecord: (id, f) => {
    set((s) => ({ financeRecords: s.financeRecords.map((x) => x.id === id ? { ...x, ...f } : x) }));
    dbUpdate("finance_records", id, f as Rec);
  },
  deleteFinanceRecord: (id) => {
    set((s) => ({ financeRecords: s.financeRecords.filter((x) => x.id !== id) }));
    dbDelete("finance_records", id);
  },

  // ── Debriefs ──
  addDebrief: (d) => {
    const row: Debrief = { ...d, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ debriefs: [...s.debriefs, row] }));
    dbInsert("debriefs", row as unknown as Rec);
  },
  updateDebrief: (id, d) => {
    set((s) => ({ debriefs: s.debriefs.map((x) => x.id === id ? { ...x, ...d } : x) }));
    dbUpdate("debriefs", id, d as Rec);
  },
  deleteDebrief: (id) => {
    set((s) => ({ debriefs: s.debriefs.filter((x) => x.id !== id) }));
    dbDelete("debriefs", id);
  },
}));
