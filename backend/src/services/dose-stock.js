const countUnits = new Set(["шт", "штука", "штуки", "штук"]);
const formUnits = {
  TABLET: ["табл", "таблетка", "таблетки", "таблеток"],
  CAPSULE: ["капс", "капсула", "капсулы", "капсул"]
};

function normalizeUnit(unit) {
  return unit.trim().toLowerCase().replace(/\.$/, "");
}

export function stockAmountForDose({ doseAmount, doseUnit, medicine }) {
  const dose = normalizeUnit(doseUnit);
  const stock = normalizeUnit(medicine.quantityUnit);
  if (dose === stock) return doseAmount;

  const equivalents = formUnits[medicine.form] ?? [];
  const doseIsPiece = equivalents.includes(dose) || countUnits.has(dose);
  const stockIsPiece = equivalents.includes(stock) || countUnits.has(stock);
  return doseIsPiece && stockIsPiece ? doseAmount : null;
}
