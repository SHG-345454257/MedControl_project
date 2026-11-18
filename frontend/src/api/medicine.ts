import { API_BASE_URL } from "../services/api";
export const medicineForms = {
  TABLET: "Таблетки",
  CAPSULE: "Капсулы",
  DROPS: "Капли",
  SYRUP: "Сироп",
  SPRAY: "Спрей",
  OINTMENT: "Мазь или гель",
  INJECTION: "Инъекции",
  POWDER: "Порошок",
  OTHER: "Другое"
} as const;

export type MedicineForm = keyof typeof medicineForms;

export type Medicine = {
  id: string;
  name: string;
  form: MedicineForm;
  quantity: string;
  quantityUnit: string;
  strengthValue: string | null;
  strengthUnit: string | null;
  expiryDate: string | null;
  lowStockThreshold: string | null;
  prescriptionRequired: boolean;
  notifyWhenLow: boolean;
  note: string | null;
  imageUrl: string | null;
};

export type MedicineOffer = {
  id: string;
  pharmacyName: string;
  productName: string;
  price: string;
  priceFrom?: boolean;
  currency: string;
  productUrl: string;
};

const formIcons: Partial<Record<MedicineForm, string>> = {
  TABLET: "pill",
  CAPSULE: "capsule",
  DROPS: "drop",
  OINTMENT: "lotion",
  SPRAY: "spray"
};

export function medicineIcon(form: MedicineForm) {
  return `/images/medicines/${formIcons[form] ?? "pill"}.svg`;
}

export function isLowStock(medicine: Medicine) {
  const quantity = Number(medicine.quantity);
  return quantity === 0 || (
    medicine.lowStockThreshold !== null &&
    quantity <= Number(medicine.lowStockThreshold)
  );
}

export function isExpired(medicine: Medicine) {
  if (!medicine.expiryDate) return false;

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return medicine.expiryDate < `${now.getFullYear()}-${month}-${day}`;
}

export async function medicineRequest<T>(path = "", options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Войдите в аккаунт");

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}/medicine${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.message || "Не удалось выполнить запрос");
  return data as T;
}
