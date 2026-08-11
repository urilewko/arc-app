"use client";
import { useState } from "react";
import { LODGING_TYPE_LABELS, type SupplierDetails } from "./supplierDetails";

interface MapSupplier {
  id: string;
  name: string;
  details?: SupplierDetails;
}

const LODGE_DOT: Record<string, string> = {
  room: "#2e5775",
  shared: "#987859",
  none: "#8a5540",
  unknown: "#a0907a",
};

export default function VenueMap({
  venues,
  onSelect,
}: {
  venues: MapSupplier[];
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const placed = venues.filter((v) => v.details?.mapX != null && v.details?.mapY != null);
  const unplaced = venues.filter((v) => v.details?.mapX == null || v.details?.mapY == null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-600">מפה סכמטית — מיקום מקורב לפי אזור</div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LODGE_DOT.room }} /> לינה בחדרים</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LODGE_DOT.shared }} /> לינה משותפת</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LODGE_DOT.none }} /> ללא לינה</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LODGE_DOT.unknown }} /> לא ידוע</span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative shrink-0" style={{ width: 260, height: 520 }}>
          <svg viewBox="0 0 100 100" width="260" height="520" className="overflow-visible">
            <path
              d="M 34 3
                 L 44 2 L 50 3 L 54 5
                 L 56 9 L 53 13 L 50 18 L 49 24
                 L 48 30 L 47 36 L 46 42
                 L 47 47 L 48 52 L 47 57
                 L 45 63 L 44 70 L 43 77 L 42 84 L 41 90 L 39.5 96 L 38 99
                 L 35 95 L 32 90 L 29 83 L 27 76 L 26 70
                 L 27 64 L 29 58 L 29 50 L 30 44 L 31 39
                 L 30 34 L 31 28 L 33 25 L 31 21 L 32 16 L 34 9 Z"
              fill="#eef0e8"
              stroke="#b9bba8"
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
            {/* Sea of Galilee */}
            <ellipse cx="51" cy="16" rx="1.4" ry="2" fill="#c7d9e0" />
            {/* Dead Sea */}
            <path d="M 47 46 L 48 51 L 47 56 L 45.5 51 Z" fill="#c7d9e0" />
            {placed.map((v) => {
              const x = v.details!.mapX!;
              const y = v.details!.mapY!;
              const lodge = v.details?.lodgingType || "unknown";
              const isHover = hover === v.id;
              return (
                <g key={v.id}>
                  <circle
                    cx={x} cy={y} r={isHover ? 2.4 : 1.6}
                    fill={LODGE_DOT[lodge]}
                    stroke="#fff"
                    strokeWidth="0.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHover(v.id)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onSelect(v.id)}
                  />
                </g>
              );
            })}
          </svg>

          {placed.map((v) => {
            if (hover !== v.id) return null;
            const x = v.details!.mapX!;
            const y = v.details!.mapY!;
            return (
              <div
                key={`tip-${v.id}`}
                className="absolute z-10 bg-[#1a1a1a] text-white text-[11px] rounded-lg px-2.5 py-1.5 pointer-events-none shadow-lg whitespace-nowrap"
                style={{
                  left: `${x * 2.6}px`,
                  top: `${y * 5.2}px`,
                  transform: "translate(-50%, -130%)",
                }}
              >
                <div className="font-semibold">{v.name}</div>
                {v.details?.lodgingType && (
                  <div className="text-gray-300 text-[10px] mt-0.5">
                    {LODGING_TYPE_LABELS[v.details.lodgingType]}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 mb-2">{placed.length} מקומות על המפה · לחיצה על נקודה פותחת את הכרטיס</div>
          <div className="grid grid-cols-2 gap-1.5 max-h-[480px] overflow-y-auto pr-1">
            {placed
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name, "he"))
              .map((v) => (
                <button
                  key={v.id}
                  onMouseEnter={() => setHover(v.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect(v.id)}
                  className={`text-right text-xs px-2.5 py-1.5 rounded-lg border transition-colors truncate ${
                    hover === v.id ? "border-gray-400 bg-gray-50" : "border-gray-100 hover:border-gray-300"}`}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full ml-1.5"
                    style={{ background: LODGE_DOT[v.details?.lodgingType || "unknown"] }}
                  />
                  {v.name}
                </button>
              ))}
          </div>
          {unplaced.length > 0 && (
            <div className="text-[11px] text-gray-400 mt-3">
              {unplaced.length} מקומות ללא מיקום ידוע לא מוצגים על המפה
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
