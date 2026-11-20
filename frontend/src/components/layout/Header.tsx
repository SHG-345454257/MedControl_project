import { Link } from "react-router-dom";

interface HeaderProps {
  showActions?: boolean;
}

export default function Header({ showActions = true }: HeaderProps) {
  return (
    <header className="w-full bg-background">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Логотип и название */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/images/layout/logo.png"
            alt="Логотип МедКонтроль"
            width={52}
            height={52}
            className="h-13 w-13 object-contain"
          />

          <span className="font-heading text-[20px] font-bold text-text-main sm:text-[26px]">
            МедКонтроль
          </span>
        </Link>

        {/* Кнопки входа и регистрации */}
        {showActions && (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-pill border border-olive-accent px-4 py-2 text-[13px] text-text-main transition hover:bg-green-bg sm:px-6 sm:text-[14px]"
            >
              Войти
            </Link>
            
            <Link
              to="/register"
              className="rounded-pill bg-olive-accent px-4 py-2 text-[13px] text-white transition hover:bg-text-secondary sm:px-6 sm:text-[14px]"
            >
              Регистрация
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}