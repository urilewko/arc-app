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
  unknown: "#6b6b6b",
};

// Natural size of /public/israel-map-ref.jpeg
const MAP_ASPECT = 280 / 714;

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
  const hovered = placed.find((v) => v.id === hover);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-sm font-semibold text-gray-600">מפה סכמטית — מיקום מקורב לפי אזור</div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LODGE_DOT.room }} /> לינה בחדרים</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LODGE_DOT.shared }} /> לינה משותפת</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LODGE_DOT.none }} /> ללא לינה</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LODGE_DOT.unknown }} /> לא ידוע</span>
        </div>
      </div>

      <div className="flex gap-5 flex-wrap md:flex-nowrap">
        <div
          className="relative shrink-0 mx-auto md:mx-0 rounded-lg overflow-hidden border border-gray-100"
          style={{
            width: "min(100%, 380px)",
            aspectRatio: `${MAP_ASPECT}`,
            backgroundImage: "url(/israel-map-ref.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {placed.map((v) => {
            const x = v.details!.mapX!;
            const y = v.details!.mapY!;
            const lodge = v.details?.lodgingType || "unknown";
            const isHover = hover === v.id;
            return (
              <button
                key={v.id}
                onMouseEnter={() => setHover(v.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(v.id)}
                className="absolute rounded-full border-2 border-white shadow transition-transform"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: isHover ? 14 : 9,
                  height: isHover ? 14 : 9,
                  background: LODGE_DOT[lodge],
                  transform: "translate(-50%, -50%)",
                  zIndex: isHover ? 20 : 1,
                }}
                aria-label={v.name}
              />
            );
          })}

          {hovered && (
            <div
              className="absolute z-30 bg-[#1a1a1a] text-white text-[11px] rounded-lg px-2.5 py-1.5 pointer-events-none shadow-lg whitespace-nowrap"
              style={{
                left: `${hovered.details!.mapX}%`,
                top: `${hovered.details!.mapY}%`,
                transform: "translate(-50%, -135%)",
              }}
            >
              <div className="font-semibold">{hovered.name}</div>
              {hovered.details?.lodgingType && (
                <div className="text-gray-300 text-[10px] mt-0.5">
                  {LODGING_TYPE_LABELS[hovered.details.lodgingType]}
                </div>
              )}
            </div>
          )}
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
