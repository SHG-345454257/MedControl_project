import { useEffect, useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import Footer from "../components/layout/Footer";
import CourseCard from "../components/courses/CourseCard";
import CourseFormDialog from "../components/courses/CourseFormDialog";
import { courseRequest, localDate } from "../api/course";
import type { Course, CourseInput } from "../api/course";
import { medicineRequest } from "../api/medicine";
import type { Medicine } from "../api/medicine";

const filters = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "completed", label: "Завершённые" }
] as const;
type Filter = typeof filters[number]["value"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [editor, setEditor] = useState<{ course: Course | null } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };

    Promise.all([
      courseRequest<{ courses: Course[] }>("", options),
      medicineRequest<{ medicines: Medicine[] }>("", options)
    ]).then(([courseData, medicineData]) => {
      if (controller.signal.aborted) return;
      setCourses(courseData.courses);
      setMedicines(medicineData.medicines);
    }).catch((error: Error) => {
      if (!controller.signal.aborted) setError(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, []);

  const today = localDate();
  const visible = courses.filter((course) => {
    const completed = course.status === "COMPLETED" || Boolean(course.endDate && course.endDate < today);
    return filter === "all" || (filter === "active" ? course.status === "ACTIVE" && !completed : completed);
  });

  async function save(data: CourseInput) {
    const id = editor?.course?.id;
    const { course } = await courseRequest<{ course: Course }>(id ? `/${encodeURIComponent(id)}` : "", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(data)
    });
    setCourses((current) => id
      ? current.map((item) => item.id === id ? { ...course, week: item.week } : item)
      : [{ ...course, week: [] }, ...current]
    );
    setError("");
  }

  async function remove(course: Course) {
    if (!window.confirm(`Удалить курс «${course.title}»?`)) return;
    try {
      await courseRequest(`/${encodeURIComponent(course.id)}`, { method: "DELETE" });
      setCourses((current) => current.filter(({ id }) => id !== course.id));
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось удалить курс");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-soft">
      <AppHeader activePage="Курсы" />
      <main className="account-page-main mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-[32px] font-bold">Мои курсы лечения</h1>
          <button type="button" disabled={loading} onClick={() => setEditor({ course: null })}
            className="inline-flex items-center gap-2 rounded-pill bg-olive-accent px-4 py-2 text-sm text-background hover:bg-green-accent hover:text-text-main disabled:opacity-60">
            <img src="/images/pharmacy/plus.svg" alt="" className="size-5 object-contain" />
            Создать новый курс
          </button>
        </div>

        <div role="group" aria-label="Статус курса" className="mb-6 mt-3 inline-flex flex-wrap gap-1 rounded-pill bg-card p-1">
          {filters.map(({ value, label }) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}
              className={`rounded-pill px-4 py-1.5 text-sm ${filter === value ? "bg-green-accent" : "bg-green-bg hover:bg-background-soft"}`}>
              {label}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mb-4 rounded-input bg-card p-3">{error}</p>}
        {!loading && !error && !visible.length && <p className="rounded-card bg-card p-6">Курсов пока нет.</p>}

        <div className="relative">
          <img src="/images/courses/leaves-bg.webp" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
          <div className="relative space-y-4">
            {loading && (
              <p role="status" className="min-h-64 rounded-card bg-card p-5 text-sm text-text-secondary">
                Загрузка курсов…
              </p>
            )}
            {visible.map((course) => (
              <CourseCard key={course.id} course={course} onEdit={() => setEditor({ course })} onRemove={() => void remove(course)} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
      {editor && <CourseFormDialog course={editor.course} medicines={medicines} onSave={save} onClose={() => setEditor(null)} />}
    </div>
  );
}
