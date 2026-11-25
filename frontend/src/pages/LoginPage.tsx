import { API_BASE_URL } from "../services/api";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { familyInviteHash } from "../services/family-invitation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const inviteHash = familyInviteHash(useLocation().hash);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Ошибка входа");
        return;
      }

      localStorage.setItem("token", data.token);

      if (inviteHash) {
        navigate({ pathname: "/family/invite", hash: inviteHash }, { replace: true });
      } else {
        navigate("/dashboard");
      }
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
            src="/images/enter/leaves.svg"
            alt=""
            className="absolute bottom-[+70px] left-1/2 z-0 pointer-events-none h-auto w-[calc(100%+2rem)] max-w-none -translate-x-1/2 lg:w-auto lg:max-w-full lg:scale-[1.6] lg:scale-x-[2.0]"
          />

          {/* Карточка — передний слой */}
          <div className="relative z-10 w-full rounded-card bg-card p-8 shadow-card">
            <h1 className="font-heading text-[32px] font-bold text-text-main">
              Вход
            </h1>

            <p className="mt-2 text-[16px] text-text-secondary">
              Войдите в свой аккаунт, чтобы получить доступ ко всем функциям сервиса.
            </p>

            <form className="mt-4" onSubmit={handleLogin}>
              <label htmlFor="login-email" className="block font-heading text-[16px] font-bold text-text-main">
                Email
              </label>

              <div className="mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
                <img
                  src="/images/enter/mail.svg"
                  alt=""
                  className="mr-3 h-[20px] w-[20px] object-contain"
                />

                <input
                  id="login-email"
                  type="email"
                  placeholder="example@mail.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent text-text-muted outline-none placeholder:text-text-muted"
                />
              </div>

              <label htmlFor="login-password" className="block mt-4 font-heading text-[16px] font-bold text-text-main">
                Пароль
              </label>

              <div className="mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
                <img
                  src="/images/enter/lock.svg"
                  alt=""
                  className="mr-3 h-[20px] w-[20px] object-contain"
                />

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
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
                    alt={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    className="h-[20px] w-[20px] object-contain"
                  />
                </button>
              </div>

              <button
                type="submit"
                className="mt-7 h-[48px] w-full rounded-pill bg-olive-accent text-[16px] text-background transition-colors duration-200 hover:bg-green-bg hover:text-olive-accent"
              >
                Войти
              </button>
            </form>

            <p className="mt-6 text-center text-[14px] text-text-muted">
              Нет аккаунта?{" "}
              <Link
                to={{ pathname: "/register", hash: inviteHash }}
                className="text-text-muted underline decoration-transparent hover:text-olive-accent hover:decoration-current"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}