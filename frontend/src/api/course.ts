import { API_BASE_URL } from "../services/api";
export type CourseMedicineInput = {
  medicineId: string;
  doseAmount: string;
  doseUnit: string;
  times: string[];
  reminderEnabled: boolean;
};

export type CourseInput = {
  title: string;
  note: string;
  startDate: string;
  endDate: string;
  isContinuous: boolean;
  medicines: CourseMedicineInput[];
};

export type Course = Omit<CourseInput, "note" | "endDate" | "medicines"> & {
  id: string;
  note: string | null;
  endDate: string | null;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  medicines: (CourseMedicineInput & { name: string; form: string })[];
  week: { taken: number; missed: number; planned?: number }[];
};

export async function courseRequest<T>(path = "", options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Войдите в аккаунт");

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}/courses${path}`, { ...options, headers });
  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.message ?? "Не удалось загрузить данные курса");
  return data as T;
}

export function localDate() {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")].join("-");
}
