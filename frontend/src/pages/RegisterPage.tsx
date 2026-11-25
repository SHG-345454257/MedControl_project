import { API_BASE_URL } from "../services/api";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { familyInviteHash } from "../services/family-invitation";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const navigate = useNavigate();
  const inviteHash = familyInviteHash(useLocation().hash);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password,
          repeatPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Ошибка регистрации");
        return;
      }

      alert("Регистрация прошла успешно");

      navigate({ pathname: "/login", hash: inviteHash });
    } catch (error) {
      console.error(error);
      alert("Не удалось подключиться к серверу");
    }
  }

  return (
    <div className="min-h-screen bg-background-soft">
      <Header showActions={false} />

      <main className="flex min-h-[calc(100vh-160px)] items-center justify-center px-6 py-12">
        {/* Общий контейнер слоёв */}
        <div className="relative w-full max-w-[450px]">

          {/* Картинка — задний слой */}
          <img
            src="/images/enter/leaves.webp"
            alt=""
            className="absolute bottom-[+180px] left-1/2 z-0 pointer-events-none h-auto w-[calc(100%+2rem)] max-w-none -translate-x-1/2 lg:w-auto lg:max-w-full lg:scale-[1.6] lg:scale-x-[2.0]"
          />

          {/* Карточка — передний слой */}
          <div className="relative z-10 w-full rounded-card bg-card p-8 shadow-card">
            <h1 className="font-heading text-[32px] font-bold text-text-main">
              Регистрация
            </h1>

            <p className="mt-2 text-[16px] text-text-secondary">
              Создайте аккаунт, чтобы начать заботиться о своём здоровье уже сегодня.
            </p>

            <form className="mt-4" onSubmit={handleRegister}>

              {/* Имя */}
              <label htmlFor="register-name" className="block font-heading text-[16px] font-bold text-text-main">
                Имя
              </label>

              <div className="mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
                <img
                  src="/images/enter/person.svg"
                  alt=""
                  className="mr-3 h-[20px] w-[20px] object-contain"
                />

                <input
                  id="register-name"
                  type="text"
                  placeholder="Введите ваше имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent text-text-muted outline-none placeholder:text-text-muted"
                />
              </div>

              {/* Email */}
              <label htmlFor="register-email" className="block mt-4 font-heading text-[16px] font-bold text-text-main">
                Email
              </label>

              <div className="mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
                <img
                  src="/images/enter/mail.svg"
                  alt=""
                  className="mr-3 h-[20px] w-[20px] object-contain"
                />

                <input
                  id="register-email"
                  type="email"
                  placeholder="example@mail.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent text-text-muted outline-none placeholder:text-text-muted"
                />
              </div>

              {/* Пароль */}
              <label htmlFor="register-password" className="block mt-4 font-heading text-[16px] font-bold text-text-main">
                Пароль
              </label>

              <div className="mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
                <img
                  src="/images/enter/lock.svg"
                  alt=""
                  className="mr-3 h-[20px] w-[20px] object-contain"
                />

                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Придумайте пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent text-text-muted outline-none placeholder:text-text-muted"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="ml-3 flex h-[24px] w-[24px] shrink-0 items-center justify-center"
                >
                  <img
                    src={
                      showPassword
                        ? "/images/enter/eye-off.svg"
                        : "/images/enter/eye.svg"
                    }
                    alt={
                      showPassword
                        ? "Скрыть пароль"
                        : "Показать пароль"
                    }
                    className="h-[20px] w-[20px] object-contain"
                  />
                </button>
              </div>

              {/* Повторите пароль */}
              <label htmlFor="register-password-confirmation" className="block mt-4 font-heading text-[16px] font-bold text-text-main">
                Повторите пароль
              </label>

              <div className="mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
                <img
                  src="/images/enter/lock.svg"
                  alt=""
                  className="mr-3 h-[20px] w-[20px] object-contain"
                />

                <input
                  id="register-password-confirmation"
                  type={showRepeatPassword ? "text" : "password"}
                  placeholder="Повторите пароль"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent text-text-muted outline-none placeholder:text-text-muted"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowRepeatPassword((prev) => !prev)
                  }
                  className="ml-3 flex h-[24px] w-[24px] shrink-0 items-center justify-center"
                >
                  <img
                    src={
                      showRepeatPassword
                        ? "/images/enter/eye-off.svg"
                        : "/images/enter/eye.svg"
                    }
                    alt={
                      showRepeatPassword
                        ? "Скрыть пароль"
                        : "Показать пароль"
                    }
                    className="h-[20px] w-[20px] object-contain"
                  />
                </button>
              </div>

              {/* Кнопка */}
              <button
                type="submit"
                className="mt-7 h-[48px] w-full rounded-pill bg-olive-accent text-[16px] text-background transition-colors duration-200 hover:bg-green-bg hover:text-olive-accent"
              >
                Зарегистрироваться
              </button>
            </form>

            <p className="mt-6 text-center text-[14px] text-text-muted">
              Уже есть аккаунт?{" "}
              <Link
                to={{ pathname: "/login", hash: inviteHash }}
                className="text-text-muted underline decoration-transparent hover:text-olive-accent hover:decoration-current"
              >
                Войти
              </Link>
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}