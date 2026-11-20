import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full bg-background">
      <div className="w-full px-5 py-5 sm:px-8 lg:px-[46px]">

        {/* Верхняя строка */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          {/* Логотип */}
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2"
          >
            <img
              src="/images/layout/logo.png"
              alt="Логотип МедКонтроль"
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
            />

            <span className="font-heading text-[20px] font-bold text-text-main">
              МедКонтроль
            </span>
          </Link>

          {/* Ссылки */}
          <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[16px] text-text-muted">
            <a
              href="#about"
              className="transition hover:text-text-main"
            >
              О сервисе
            </a>

            <a
              href="#support"
              className="transition hover:text-text-main"
            >
              Поддержка
            </a>

            <a
              href="#privacy"
              className="transition hover:text-text-main"
            >
              Политика конфиденциальности
            </a>
          </nav>

          {/* Контакты */}
          <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 text-[16px] text-text-muted">

            <a
              href="mailto:support@medcontrol.ru"
              className="flex items-center gap-2 underline transition hover:text-text-main"
            >
              <img
                src="/images/layout/mail.svg"
                alt=""
                className="h-[18px] w-[18px]"
              />
              support@medcontrol.ru
            </a>

            <a
              href="tel:+78005550123"
              className="flex items-center gap-2 transition hover:text-text-main"
            >
              <img
                src="/images/layout/phone.svg"
                alt=""
                className="h-[18px] w-[18px]"
              />
              8 (800) 555-01-23
            </a>

          </div>
        </div>

        {/* Нижняя строка */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-[16px] text-text-muted">
            © 2026 МедКонтроль. Забота о вашем здоровье.
          </p>

          <div className="flex items-center gap-5">

            <a
              href="#"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-olive-accent"
            >
              <img
                src="/images/layout/telegram.svg"
                alt="Telegram"
                className="h-5 w-5"
              />
            </a>

            <a
              href="#"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-olive-accent"
            >
              <img
                src="/images/layout/vk.svg"
                alt="ВКонтакте"
                className="h-5 w-5"
              />
            </a>

          </div>
        </div>

      </div>
    </footer>
  );
}