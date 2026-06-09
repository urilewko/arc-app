"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LeadStatus =
  | "שיחה ראשונית"
  | "הצעת עבודה"
  | "משא ומתן"
  | "פגישה"
  | "ping"
  | "נסגר"
  | "נפל";

export type ProductType = "ריטריט" | "סדנה חד פעמית" | "Offsite" | "קורס";
export type ProductionStatus = "עוד לא התחלנו" | "בעבודה" | "בוצע";

export type InfraCategory =
  | "The Blocks"
  | "מרחב פיזי"
  | "ארגוני"
  | "שיווק"
  | "אחר";

export interface Contact {
  id: string;
  orgName: string;
  contactName: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  contactId: string;
  orgName: string;
  status: LeadStatus;
  source: string;
  dealValue: number;
  nextAction: string;
  responsible: string;
  dueDate: string;
  notes: string;
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
  notes: string;
  createdAt: string;
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
}

interface ARCStore {
  contacts: Contact[];
  leads: Lead[];
  projects: Project[];
  infraProjects: InfraProject[];

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

  addInfraProject: (p: Omit<InfraProject, "id" | "createdAt">) => void;
  updateInfraProject: (id: string, p: Partial<InfraProject>) => void;
  deleteInfraProject: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useStore = create<ARCStore>()(
  persist(
    (set, get) => ({
      contacts: [],
      leads: [],
      projects: [],
      infraProjects: [],

      addContact: (c) =>
        set((s) => ({
          contacts: [
            ...s.contacts,
            { ...c, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateContact: (id, c) =>
        set((s) => ({
          contacts: s.contacts.map((x) => (x.id === id ? { ...x, ...c } : x)),
        })),
      deleteContact: (id) =>
        set((s) => ({ contacts: s.contacts.filter((x) => x.id !== id) })),

      addLead: (l) =>
        set((s) => ({
          leads: [
            ...s.leads,
            { ...l, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateLead: (id, l) =>
        set((s) => ({
          leads: s.leads.map((x) => (x.id === id ? { ...x, ...l } : x)),
        })),
      deleteLead: (id) =>
        set((s) => ({ leads: s.leads.filter((x) => x.id !== id) })),
      closeLead: (id) => {
        const lead = get().leads.find((l) => l.id === id);
        if (!lead) return;
        set((s) => ({
          leads: s.leads.map((x) =>
            x.id === id ? { ...x, status: "נסגר" } : x
          ),
          projects: [
            ...s.projects,
            {
              id: uid(),
              leadId: id,
              contactId: lead.contactId,
              orgName: lead.orgName,
              productType: "סדנה חד פעמית",
              startDate: "",
              endDate: "",
              productionStatus: "עוד לא התחלנו",
              price: lead.dealValue,
              notes: "",
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      addProject: (p) =>
        set((s) => ({
          projects: [
            ...s.projects,
            { ...p, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateProject: (id, p) =>
        set((s) => ({
          projects: s.projects.map((x) => (x.id === id ? { ...x, ...p } : x)),
        })),
      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((x) => x.id !== id) })),

      addInfraProject: (p) =>
        set((s) => ({
          infraProjects: [
            ...s.infraProjects,
            { ...p, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateInfraProject: (id, p) =>
        set((s) => ({
          infraProjects: s.infraProjects.map((x) =>
            x.id === id ? { ...x, ...p } : x
          ),
        })),
      deleteInfraProject: (id) =>
        set((s) => ({
          infraProjects: s.infraProjects.filter((x) => x.id !== id),
        })),
    }),
    { name: "arc-store" }
  )
);
