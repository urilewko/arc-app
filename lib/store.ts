"use client";
import { create } from "zustand";
import { supabase, toSnake, toCamel } from "./supabase";
import { reportDbError } from "./dbErrors";

export type LeadStatus =
  | "פנייה יזומה"
  | "שיחה ראשונית"
  | "מחכים להצעת ערך"
  | "מחכים להצעת מחיר"
  | "פגישה"
  | "סגירות אחרונות"
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
  todoistId?: string;
  todoistSectionId?: string;
  todoistSectionName?: string;
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
  paymentReceivedBy?: "אורי" | "ינון" | "שניהם";
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
  archived?: boolean;
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
  /** Existing Todoist section new tasks for this project are filed under — never auto-created. */
  todoistSectionId?: string;
  todoistSectionName?: string;
  /** Event staffing — shown as prominent circles on the project card. */
  facilitator?: string;
  enabler?: string;
  /** Ids of pre-event checklist items already checked for this project. */
  checklistDone?: string[];
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  photoUrl: string;
  position: number;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  position: number;
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
  todoistId?: string;
  todoistSectionId?: string;
  todoistSectionName?: string;
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
  /** Existing Todoist section new tasks for this project are filed under — never auto-created. */
  todoistSectionId?: string;
  todoistSectionName?: string;
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

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  payer: string;
  startMonth: string; // "YYYY-MM"
  active: boolean;
  notes: string;
  createdAt: string;
}

export type MarketingChannelStatus = "פעיל" | "בהשהיה" | "לא בשימוש";
export interface MarketingChannel {
  id: string;
  name: string;
  status: MarketingChannelStatus;
  notes: string;
  createdAt: string;
}

export type MarketingCampaignStatus = "מתוכנן" | "פעיל" | "הסתיים";
export interface CampaignChannelPlan {
  channelId: string;
  plan: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  /** Legacy single-channel field — superseded by `channels`. */
  channelId?: string;
  channels: CampaignChannelPlan[];
  startDate: string;
  endDate: string;
  budget: number;
  status: MarketingCampaignStatus;
  resultLeads: number;
  notes: string;
  createdAt: string;
}

export type MarketingIdeaStatus = "רעיון" | "בתכנון" | "בוצע";
export interface MarketingIdea {
  id: string;
  channelId: string;
  text: string;
  status: MarketingIdeaStatus;
  createdAt: string;
}

export interface MarketingEvent {
  id: string;
  date: string; // "YYYY-MM-DD"
  title: string;
  channelId?: string;
  notes: string;
  createdAt: string;
}

// ── Supabase sync helpers ──────────────────────────────────────────
type Rec = Record<string, unknown>;

async function dbInsert(table: string, row: Rec) {
  const { error } = await supabase.from(table).insert(toSnake(row));
  if (error) reportDbError(table, "insert", error.message);
}

async function dbUpdate(table: string, id: string, patch: Rec) {
  const { error } = await supabase.from(table).update(toSnake(patch)).eq("id", id);
  if (error) reportDbError(table, "update", error.message);
}

async function dbDelete(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) reportDbError(table, "delete", error.message);
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
  recurringExpenses: RecurringExpense[];
  debriefs: Debrief[];
  marketingChannels: MarketingChannel[];
  marketingCampaigns: MarketingCampaign[];
  marketingEvents: MarketingEvent[];
  marketingIdeas: MarketingIdea[];
  checklistItems: ChecklistItem[];
  teamMembers: TeamMember[];

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

  addRecurringExpense: (r: Omit<RecurringExpense, "id" | "createdAt">) => void;
  updateRecurringExpense: (id: string, r: Partial<RecurringExpense>) => void;
  deleteRecurringExpense: (id: string) => void;

  addMarketingChannel: (c: Omit<MarketingChannel, "id" | "createdAt">) => void;
  updateMarketingChannel: (id: string, c: Partial<MarketingChannel>) => void;
  deleteMarketingChannel: (id: string) => void;

  addMarketingCampaign: (c: Omit<MarketingCampaign, "id" | "createdAt">) => void;
  updateMarketingCampaign: (id: string, c: Partial<MarketingCampaign>) => void;
  deleteMarketingCampaign: (id: string) => void;

  addTeamMember: (m: Partial<TeamMember> & { name: string }) => void;
  updateTeamMember: (id: string, patch: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;

  addChecklistItem: (text: string) => void;
  updateChecklistItem: (id: string, patch: Partial<ChecklistItem>) => void;
  deleteChecklistItem: (id: string) => void;

  addMarketingIdea: (i: Omit<MarketingIdea, "id" | "createdAt">) => void;
  updateMarketingIdea: (id: string, i: Partial<MarketingIdea>) => void;
  deleteMarketingIdea: (id: string) => void;

  addMarketingEvent: (e: Omit<MarketingEvent, "id" | "createdAt">) => void;
  updateMarketingEvent: (id: string, e: Partial<MarketingEvent>) => void;
  deleteMarketingEvent: (id: string) => void;

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
  recurringExpenses: [],
  debriefs: [],
  marketingChannels: [],
  marketingCampaigns: [],
  marketingEvents: [],
  marketingIdeas: [],
  checklistItems: [],
  teamMembers: [],

  financeYear: new Date().getFullYear(),
  financePeriod: "h1",
  setFinanceYear: (y) => set({ financeYear: y }),
  setFinancePeriod: (p) => set({ financePeriod: p }),

  loadAll: async () => {
    const [contacts, leads, projects, infraProjects, blocks, collaborators, financeRecords, recurringExpenses, debriefs, marketingChannels, marketingCampaigns, marketingEvents, marketingIdeas, checklistItems, teamMembers] =
      await Promise.all([
        dbFetch("contacts"),
        dbFetch("leads"),
        dbFetch("projects"),
        dbFetch("infra_projects"),
        dbFetch("blocks"),
        dbFetch("collaborators"),
        dbFetch("finance_records"),
        dbFetch("recurring_expenses"),
        dbFetch("debriefs"),
        dbFetch("marketing_channels"),
        dbFetch("marketing_campaigns"),
        dbFetch("marketing_events"),
        dbFetch("marketing_ideas"),
        dbFetch("event_checklist_items"),
        dbFetch("team_members"),
      ]);
    set({
      contacts: contacts as unknown as Contact[],
      leads: (leads as unknown as Lead[]).map((l) => (l.status as string) === "משא ומתן" ? { ...l, status: "סגירות אחרונות" } : l),
      projects: projects as unknown as Project[],
      infraProjects: infraProjects as unknown as InfraProject[],
      blocks: blocks as unknown as Block[],
      collaborators: collaborators as unknown as Collaborator[],
      financeRecords: financeRecords as unknown as FinanceRecord[],
      recurringExpenses: recurringExpenses as unknown as RecurringExpense[],
      debriefs: debriefs as unknown as Debrief[],
      marketingChannels: marketingChannels as unknown as MarketingChannel[],
      marketingCampaigns: marketingCampaigns as unknown as MarketingCampaign[],
      marketingEvents: marketingEvents as unknown as MarketingEvent[],
      marketingIdeas: marketingIdeas as unknown as MarketingIdea[],
      checklistItems: (checklistItems as unknown as ChecklistItem[]).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      teamMembers: (teamMembers as unknown as TeamMember[]).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
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
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
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
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
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
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
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
    // Sync to Todoist
    const project = get().projects.find((p) => p.id === projectId);
    fetch("/api/todoist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTask.title,
        dueDate: newTask.dueDate || undefined,
        responsible: newTask.responsible || undefined,
        sectionId: newTask.todoistSectionId || project?.todoistSectionId || undefined,
        notes: newTask.notes || undefined,
      }),
    })
      .then((r) => r.json())
      .then(({ todoistId }) => {
        if (!todoistId) return;
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, tasks: (p.tasks || []).map((t) => t.id === newTask.id ? { ...t, todoistId } : t) }
              : p
          ),
        }));
        const updated = get().projects.find((p) => p.id === projectId);
        if (updated) dbUpdate("projects", projectId, { tasks: updated.tasks } as Rec);
      })
      .catch(() => {});
    if (project) dbUpdate("projects", projectId, { tasks: [...(project.tasks || []), newTask] } as Rec);
  },
  updateProjectTask: (projectId, taskId, task) => {
    const prevTask = get().projects.find((p) => p.id === projectId)?.tasks?.find((t) => t.id === taskId);
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, tasks: (p.tasks || []).map((t) => t.id === taskId ? { ...t, ...task } : t) }
          : p
      ),
    }));
    // Sync changes to Todoist (completion, section move, content)
    if (prevTask?.todoistId) {
      const patch: Record<string, unknown> = { todoistId: prevTask.todoistId };
      let hasPatch = false;
      if (task.status !== undefined && task.status !== prevTask.status) {
        patch.completed = task.status === "הושלם"; hasPatch = true;
      }
      if (task.todoistSectionId !== undefined && task.todoistSectionId !== prevTask.todoistSectionId) {
        patch.sectionId = task.todoistSectionId; hasPatch = true;
      }
      if (task.title !== undefined && task.title !== prevTask.title) { patch.title = task.title; hasPatch = true; }
      if (task.dueDate !== undefined && task.dueDate !== prevTask.dueDate) { patch.dueDate = task.dueDate; hasPatch = true; }
      if (task.responsible !== undefined && task.responsible !== prevTask.responsible) { patch.responsible = task.responsible; hasPatch = true; }
      if (hasPatch) {
        fetch("/api/todoist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }).catch(() => {});
      }
    }
    const project = get().projects.find((p) => p.id === projectId);
    if (project) dbUpdate("projects", projectId, { tasks: project.tasks } as Rec);
  },
  deleteProjectTask: (projectId, taskId) => {
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
    const prevTask = get().projects.find((p) => p.id === projectId)?.tasks?.find((t) => t.id === taskId);
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, tasks: (p.tasks || []).filter((t) => t.id !== taskId) }
          : p
      ),
    }));
    // Delete from Todoist
    if (prevTask?.todoistId) {
      fetch("/api/todoist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todoistId: prevTask.todoistId }),
      }).catch(() => {});
    }
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
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
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
    // Sync to Todoist
    fetch("/api/todoist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTask.title,
        dueDate: newTask.dueDate || undefined,
        responsible: newTask.responsible || undefined,
        sectionId: newTask.todoistSectionId || project?.todoistSectionId || undefined,
        notes: newTask.notes || undefined,
      }),
    })
      .then((r) => r.json())
      .then(({ todoistId }) => {
        if (!todoistId) return;
        set((s) => ({
          infraProjects: s.infraProjects.map((p) =>
            p.id === projectId
              ? { ...p, tasks: (p.tasks || []).map((t) => t.id === newTask.id ? { ...t, todoistId } : t) }
              : p
          ),
        }));
        const updated = get().infraProjects.find((p) => p.id === projectId);
        if (updated) dbUpdate("infra_projects", projectId, { tasks: updated.tasks } as Rec);
      })
      .catch(() => {});
    if (project) dbUpdate("infra_projects", projectId, { tasks: [...(project.tasks || []), newTask] } as Rec);
  },
  updateInfraTask: (projectId, taskId, task) => {
    const prevTask = get().infraProjects.find((p) => p.id === projectId)?.tasks?.find((t) => t.id === taskId);
    set((s) => ({
      infraProjects: s.infraProjects.map((p) =>
        p.id === projectId
          ? { ...p, tasks: (p.tasks || []).map((t) => t.id === taskId ? { ...t, ...task } : t) }
          : p
      ),
    }));
    if (prevTask?.todoistId) {
      const patch: Record<string, unknown> = { todoistId: prevTask.todoistId };
      let hasPatch = false;
      if (task.status !== undefined && task.status !== prevTask.status) {
        patch.completed = task.status === "הושלם"; hasPatch = true;
      }
      if (task.todoistSectionId !== undefined && task.todoistSectionId !== prevTask.todoistSectionId) {
        patch.sectionId = task.todoistSectionId; hasPatch = true;
      }
      if (task.title !== undefined && task.title !== prevTask.title) { patch.title = task.title; hasPatch = true; }
      if (task.dueDate !== undefined && task.dueDate !== prevTask.dueDate) { patch.dueDate = task.dueDate; hasPatch = true; }
      if (task.responsible !== undefined && task.responsible !== prevTask.responsible) { patch.responsible = task.responsible; hasPatch = true; }
      if (hasPatch) {
        fetch("/api/todoist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }).catch(() => {});
      }
    }
    const project = get().infraProjects.find((p) => p.id === projectId);
    if (project) dbUpdate("infra_projects", projectId, { tasks: project.tasks } as Rec);
  },
  deleteInfraTask: (projectId, taskId) => {
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
    const prevTask = get().infraProjects.find((p) => p.id === projectId)?.tasks?.find((t) => t.id === taskId);
    set((s) => ({
      infraProjects: s.infraProjects.map((p) =>
        p.id === projectId
          ? { ...p, tasks: (p.tasks || []).filter((t) => t.id !== taskId) }
          : p
      ),
    }));
    if (prevTask?.todoistId) {
      fetch("/api/todoist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todoistId: prevTask.todoistId }),
      }).catch(() => {});
    }
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
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
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
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
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
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
    set((s) => ({ financeRecords: s.financeRecords.filter((x) => x.id !== id) }));
    dbDelete("finance_records", id);
  },

  addRecurringExpense: (r) => {
    const row: RecurringExpense = { ...r, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ recurringExpenses: [...s.recurringExpenses, row] }));
    dbInsert("recurring_expenses", row as unknown as Rec);
  },
  updateRecurringExpense: (id, r) => {
    set((s) => ({ recurringExpenses: s.recurringExpenses.map((x) => x.id === id ? { ...x, ...r } : x) }));
    dbUpdate("recurring_expenses", id, r as Rec);
  },
  deleteRecurringExpense: (id) => {
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
    set((s) => ({ recurringExpenses: s.recurringExpenses.filter((x) => x.id !== id) }));
    dbDelete("recurring_expenses", id);
  },

  // ── Marketing ──
  addMarketingChannel: (c) => {
    const row: MarketingChannel = { ...c, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ marketingChannels: [...s.marketingChannels, row] }));
    dbInsert("marketing_channels", row as unknown as Rec);
  },
  updateMarketingChannel: (id, c) => {
    set((s) => ({ marketingChannels: s.marketingChannels.map((x) => x.id === id ? { ...x, ...c } : x) }));
    dbUpdate("marketing_channels", id, c as Rec);
  },
  deleteMarketingChannel: (id) => {
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
    set((s) => ({ marketingChannels: s.marketingChannels.filter((x) => x.id !== id) }));
    dbDelete("marketing_channels", id);
  },

  addMarketingCampaign: (c) => {
    const row: MarketingCampaign = { ...c, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ marketingCampaigns: [...s.marketingCampaigns, row] }));
    dbInsert("marketing_campaigns", row as unknown as Rec);
  },
  updateMarketingCampaign: (id, c) => {
    set((s) => ({ marketingCampaigns: s.marketingCampaigns.map((x) => x.id === id ? { ...x, ...c } : x) }));
    dbUpdate("marketing_campaigns", id, c as Rec);
  },
  deleteMarketingCampaign: (id) => {
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
    set((s) => ({ marketingCampaigns: s.marketingCampaigns.filter((x) => x.id !== id) }));
    dbDelete("marketing_campaigns", id);
  },

  addTeamMember: (m) => {
    const list = get().teamMembers;
    const row: TeamMember = {
      id: m.id || uid(), name: m.name, photoUrl: m.photoUrl || "",
      position: m.position ?? (list.length ? Math.max(...list.map((x) => x.position ?? 0)) + 1 : 0),
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ teamMembers: [...s.teamMembers, row].sort((a, b) => a.position - b.position) }));
    dbInsert("team_members", row as unknown as Rec);
  },
  updateTeamMember: (id, patch) => {
    set((s) => ({ teamMembers: s.teamMembers.map((x) => x.id === id ? { ...x, ...patch } : x) }));
    dbUpdate("team_members", id, patch as Rec);
  },
  deleteTeamMember: (id) => {
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
    set((s) => ({ teamMembers: s.teamMembers.filter((x) => x.id !== id) }));
    dbDelete("team_members", id);
  },

  addChecklistItem: (text) => {
    const items = get().checklistItems;
    const row: ChecklistItem = { id: uid(), text, position: items.length ? Math.max(...items.map((x) => x.position ?? 0)) + 1 : 0, createdAt: new Date().toISOString() };
    set((s) => ({ checklistItems: [...s.checklistItems, row] }));
    dbInsert("event_checklist_items", row as unknown as Rec);
  },
  updateChecklistItem: (id, patch) => {
    set((s) => ({ checklistItems: s.checklistItems.map((x) => x.id === id ? { ...x, ...patch } : x).sort((a, b) => a.position - b.position) }));
    dbUpdate("event_checklist_items", id, patch as Rec);
  },
  deleteChecklistItem: (id) => {
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
    set((s) => ({ checklistItems: s.checklistItems.filter((x) => x.id !== id) }));
    dbDelete("event_checklist_items", id);
  },

  addMarketingIdea: (i) => {
    const row: MarketingIdea = { ...i, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ marketingIdeas: [...s.marketingIdeas, row] }));
    dbInsert("marketing_ideas", row as unknown as Rec);
  },
  updateMarketingIdea: (id, i) => {
    set((s) => ({ marketingIdeas: s.marketingIdeas.map((x) => x.id === id ? { ...x, ...i } : x) }));
    dbUpdate("marketing_ideas", id, i as Rec);
  },
  deleteMarketingIdea: (id) => {
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
    set((s) => ({ marketingIdeas: s.marketingIdeas.filter((x) => x.id !== id) }));
    dbDelete("marketing_ideas", id);
  },

  addMarketingEvent: (e) => {
    const row: MarketingEvent = { ...e, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ marketingEvents: [...s.marketingEvents, row] }));
    dbInsert("marketing_events", row as unknown as Rec);
  },
  updateMarketingEvent: (id, e) => {
    set((s) => ({ marketingEvents: s.marketingEvents.map((x) => x.id === id ? { ...x, ...e } : x) }));
    dbUpdate("marketing_events", id, e as Rec);
  },
  deleteMarketingEvent: (id) => {
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
    set((s) => ({ marketingEvents: s.marketingEvents.filter((x) => x.id !== id) }));
    dbDelete("marketing_events", id);
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
    if (typeof window !== "undefined" && !window.confirm("למחוק? הפעולה לא ניתנת לשחזור.")) return;
    set((s) => ({ debriefs: s.debriefs.filter((x) => x.id !== id) }));
    dbDelete("debriefs", id);
  },
}));
