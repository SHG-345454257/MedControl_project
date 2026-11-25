import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const pages: Record<string, [title: string, description: string]> = {
  "/login": ["Вход", "Войдите в МедКонтроль, чтобы открыть свой календарь приёма лекарств."],
  "/register": ["Регистрация", "Создайте аккаунт МедКонтроля для учёта лекарств и курсов лечения."],
  "/dashboard": ["Дашборд", "Календарь приёма лекарств и отметки о выполнении расписания."],
  "/medicine": ["Аптечка", "Управление лекарствами, сроками годности и остатками в домашней аптечке."],
  "/medicine/:id": ["Карточка лекарства", "Данные о лекарстве, его остатке и доступных предложениях аптек."],
  "/courses": ["Курсы лечения", "Курсы лечения, дозировки и расписание приёмов."],
  "/statistics": ["Статистика", "Статистика приёмов лекарств по неделям и месяцам."],
  "/family": ["Семейный доступ", "Настройки доступа к календарю приёмов для близких."],
  "/family/invite": ["Приглашение", "Приглашение в семейный доступ МедКонтроля."],
  "/profile": ["Личный кабинет", "Личные данные, настройки уведомлений и безопасность аккаунта."]
};

export default function PageMetadata() {
  const { pathname } = useLocation();
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const page = pages[/^\/medicine\/[^/]+$/.test(path) ? "/medicine/:id" : path];

  useEffect(() => {
    if (!page) return;

    const originalTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const originalDescription = description?.getAttribute("content");
    document.title = `${page[0]} — MedControl`;
    description?.setAttribute("content", page[1]);

    return () => {
      document.title = originalTitle;
      if (originalDescription != null) {
        description?.setAttribute("content", originalDescription);
      }
    };
  }, [page]);

  return path === "/" ? null : <meta name="robots" content="noindex" />;
}
