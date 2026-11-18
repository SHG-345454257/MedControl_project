import { useState } from "react";

const navigationLinks = [
  { title: "Дашборд", href: "/dashboard" },
  { title: "Аптечка", href: "/medicine" },
  { title: "Курсы", href: "/courses" },
  { title: "Статистика", href: "/statistics" },
  { title: "Семейный доступ", href: "/family" },
];

type AppHeaderProps = {
  activePage?: string | null;
};

export default function AppHeader({
  activePage = "Дашборд"
}: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-20 w-full bg-background">
      <div className="mx-auto flex min-h-[62px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">

        {/* Логотип */}
        <a href="/" className="flex shrink-0 items-center gap-2">
          <img
            src="/images/layout/logo.png"
            alt="Логотип МедКонтроль"
            className="h-[52px] w-[52px] object-contain"
          />

          <span className="font-heading text-[20px] font-bold text-text-main sm:text-[26px]">
            МедКонтроль
          </span>
        </a>

        {/* Навигация для компьютера */}
        <nav className="group hidden items-center gap-6 md:flex">
          {navigationLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap border-b-2 px-0.5 py-1 text-[14px] font-heading text-text-main transition ${
                activePage === link.title
                  ? "border-olive-accent group-hover:border-transparent"
                  : "border-transparent hover:border-olive-accent"
              }`}
            >
              {link.title}
            </a>
          ))}
        </nav>

        {/* Профиль */}
        <a
          href="/profile"
          aria-label="Личный кабинет"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lilac-bg transition hover:bg-lilac-light"
        >
          <img
            src="/images/layout/user.svg"
            alt=""
            className="h-6 w-6 object-contain"
          />
        </a>

        {/* Мобильное меню */}
        <button
          type="button"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-lilac-bg text-text-main md:hidden"
        >
          <span className="text-2xl leading-none">
            {menuOpen ? "×" : "☰"}
          </span>
        </button>
      </div>

      {/* Навигация для телефона */}
      {menuOpen && (
        <nav className="absolute left-0 top-full flex w-full flex-col gap-1 border-t border-background-soft bg-background px-5 py-3 shadow-card md:hidden">
          {navigationLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-[15px] text-text-main transition hover:bg-green-bg"
            >
              {link.title}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}