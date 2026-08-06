"use client";
import { Plus, X, ExternalLink, BedDouble, Users, Banknote } from "lucide-react";

/**
 * Category-specific supplier fields.
 *
 * Everything here lives in one `details` JSONB column, so adding a field to a
 * category never needs another migration.
 */

export const VENUE_CATEGORY = "מרחבים ומקומות";

export interface VenueDetails {
  region?: string;
  address?: string;
  website?: string;
  capacitySeated?: number;
  capacityStanding?: number;
  hasLodging?: boolean;
  lodgingRooms?: number;
  lodgingBeds?: number;
  pricePerDay?: number;
  pricePerPersonNight?: number;
  spaces?: string[];
  catering?: string;
  accessibility?: string;
  season?: string;
  cancellation?: string;
  photos?: string[];
}

/** Venue fields plus room for other categories to add their own later. */
export interface SupplierDetails extends VenueDetails {
  [key: string]: unknown;
}

export const SPACE_OPTIONS = [
  "אולם מרכזי",
  "שטח פתוח",
  "חדרי פירוק",
  "בריכה",
  "חדר אוכל",
  "מרחב שקט",
  "חניה",
];

export const CATERING_OPTIONS = [
  "מטבח פנימי בלבד",
  "קייטרינג חיצוני מותר",
  "מטבח לשימוש עצמי",
  "ללא מזון",
];

const money = (n?: number) => (n ? `${n.toLocaleString("he-IL")} ₪` : null);

// ─── Read-only summary, shown on the expanded supplier card ───────────

export function VenueSummary({ d }: { d: VenueDetails }) {
  const cap =
    d.capacitySeated || d.capacityStanding
      ? [
          d.capacitySeated ? `${d.capacitySeated} בישיבה` : null,
          d.capacityStanding ? `${d.capacityStanding} בעמידה` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  const rows: Array<[string, string | null]> = [
    ["אזור", d.region || null],
    ["כתובת", d.address || null],
    ["קיבולת", cap],
    [
      "לינה",
      d.hasLodging
        ? [
            d.lodgingRooms ? `${d.lodgingRooms} חדרים` : null,
            d.lodgingBeds ? `${d.lodgingBeds} מיטות` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "יש"
        : "ללא לינה",
    ],
    ["מחיר ליום (ללא לינה)", money(d.pricePerDay)],
    ["מחיר לאדם/לילה", money(d.pricePerPersonNight)],
    ["מרחבים", d.spaces?.length ? d.spaces.join(" · ") : null],
    ["מזון", d.catering || null],
    ["נגישות", d.accessibility || null],
    ["עונתיות", d.season || null],
    ["ביטול", d.cancellation || null],
  ];

  const visible = rows.filter(([, v]) => v);
  if (!visible.length && !d.photos?.length && !d.website) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-3 mb-2 text-xs">
        <span className="font-semibold text-green-700">פרטי המרחב</span>
        {d.hasLodging ? (
          <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
            <BedDouble size={11} /> עם לינה
          </span>
        ) : (
          <span className="text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
            ללא לינה
          </span>
        )}
        {d.website && (
          <a
            href={d.website}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            <ExternalLink size={11} /> אתר
          </a>
        )}
      </div>

      {!!d.photos?.length && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
          {d.photos.map((src, i) => (
            // Remote host is unknown at build time, so next/image can't optimise it.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              className="h-24 w-36 object-cover rounded-lg border border-gray-200 shrink-0"
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        {visible.map(([k, v]) => (
          <div key={k}>
            <span className="text-xs text-gray-400 block">{k}</span>
            <span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Compact badges for the collapsed row ─────────────────────────────

export function VenueBadges({ d }: { d: VenueDetails }) {
  const cap = d.capacitySeated || d.capacityStanding;
  return (
    <>
      {!!cap && (
        <span className="flex items-center gap-1">
          <Users size={11} /> {cap}
        </span>
      )}
      {d.hasLodging && (
        <span className="flex items-center gap-1 text-green-600">
          <BedDouble size={11} /> לינה
        </span>
      )}
      {!!d.pricePerDay && (
        <span className="flex items-center gap-1">
          <Banknote size={11} /> {money(d.pricePerDay)}/יום
        </span>
      )}
    </>
  );
}

// ─── Editor ───────────────────────────────────────────────────────────

const label = "block text-xs font-semibold mb-1 text-gray-600";
const input = "w-full border rounded-lg px-3 py-2 text-sm";

export function VenueEditor({
  d,
  onChange,
}: {
  d: SupplierDetails;
  onChange: (next: SupplierDetails) => void;
}) {
  const set = (patch: Partial<VenueDetails>) => onChange({ ...d, ...patch });
  const num = (v: string) => (v === "" ? undefined : Number(v));

  const toggleSpace = (s: string) => {
    const cur = d.spaces || [];
    set({ spaces: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] });
  };

  const photos = d.photos || [];

  return (
    <div className="space-y-3 pt-3 mt-3 border-t border-gray-200">
      <div className="text-sm font-semibold text-green-700">פרטי המרחב</div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>אזור</label>
          <input
            className={input}
            placeholder="לדוג׳ גליל עליון"
            value={d.region || ""}
            onChange={(e) => set({ region: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>כתובת</label>
          <input
            className={input}
            value={d.address || ""}
            onChange={(e) => set({ address: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className={label}>אתר</label>
        <input
          className={input}
          placeholder="https://"
          value={d.website || ""}
          onChange={(e) => set({ website: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>קיבולת בישיבה</label>
          <input
            type="number"
            className={input}
            value={d.capacitySeated ?? ""}
            onChange={(e) => set({ capacitySeated: num(e.target.value) })}
          />
        </div>
        <div>
          <label className={label}>קיבולת בעמידה</label>
          <input
            type="number"
            className={input}
            value={d.capacityStanding ?? ""}
            onChange={(e) => set({ capacityStanding: num(e.target.value) })}
          />
        </div>
      </div>

      {/* Lodging */}
      <div className="rounded-lg bg-gray-50 p-3">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={!!d.hasLodging}
            onChange={(e) => set({ hasLodging: e.target.checked })}
            className="w-4 h-4 accent-green-600"
          />
          יש לינה במקום
        </label>
        {d.hasLodging && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className={label}>מספר חדרים</label>
              <input
                type="number"
                className={input}
                value={d.lodgingRooms ?? ""}
                onChange={(e) => set({ lodgingRooms: num(e.target.value) })}
              />
            </div>
            <div>
              <label className={label}>מספר מיטות</label>
              <input
                type="number"
                className={input}
                value={d.lodgingBeds ?? ""}
                onChange={(e) => set({ lodgingBeds: num(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>מחיר ליום — ללא לינה (₪)</label>
          <input
            type="number"
            className={input}
            value={d.pricePerDay ?? ""}
            onChange={(e) => set({ pricePerDay: num(e.target.value) })}
          />
        </div>
        <div>
          <label className={label}>מחיר לאדם ללילה (₪)</label>
          <input
            type="number"
            className={input}
            value={d.pricePerPersonNight ?? ""}
            onChange={(e) => set({ pricePerPersonNight: num(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <label className={label}>מרחבים במקום</label>
        <div className="flex flex-wrap gap-2">
          {SPACE_OPTIONS.map((s) => {
            const on = d.spaces?.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpace(s)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  on
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>מזון</label>
          <select
            className={input}
            value={d.catering || ""}
            onChange={(e) => set({ catering: e.target.value })}
          >
            <option value="">—</option>
            {CATERING_OPTIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>נגישות</label>
          <input
            className={input}
            placeholder="לדוג׳ נגיש לכיסא גלגלים"
            value={d.accessibility || ""}
            onChange={(e) => set({ accessibility: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>עונתיות / מזג אוויר</label>
          <input
            className={input}
            placeholder="לדוג׳ חורף — האולם בלבד"
            value={d.season || ""}
            onChange={(e) => set({ season: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>תנאי ביטול</label>
          <input
            className={input}
            value={d.cancellation || ""}
            onChange={(e) => set({ cancellation: e.target.value })}
          />
        </div>
      </div>

      {/* Photos */}
      <div>
        <label className={label}>תמונות — קישורים</label>
        <div className="space-y-2">
          {photos.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              {p && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p}
                  alt=""
                  className="h-10 w-14 object-cover rounded border border-gray-200 shrink-0"
                />
              )}
              <input
                className={input}
                placeholder="https://…"
                value={p}
                onChange={(e) => {
                  const next = [...photos];
                  next[i] = e.target.value;
                  set({ photos: next });
                }}
              />
              <button
                type="button"
                onClick={() => set({ photos: photos.filter((_, j) => j !== i) })}
                className="text-gray-400 hover:text-red-500 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set({ photos: [...photos, ""] })}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
          >
            <Plus size={14} /> הוסף תמונה
          </button>
        </div>
      </div>
    </div>
  );
}
