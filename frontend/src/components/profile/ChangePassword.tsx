import { API_BASE_URL } from "../../services/api";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Автоматически убираем уведомление через 3 секунды
  useEffect(() => {
    if (!success && !error) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success, error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("Новый пароль должен содержать не менее 8 символов");
      return;
    }

    if (newPassword !== repeatPassword) {
      setError("Новые пароли не совпадают");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Пользователь не авторизован");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/change-password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            repeatPassword
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Не удалось изменить пароль");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");

      setSuccess("Пароль успешно изменён");
    } catch (error) {
      console.error(error);
      setError("Не удалось подключиться к серверу");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative flex h-full flex-col">

      {/* Всплывающее уведомление */}
      {(success || error) && (
        <div
          className={`absolute right-0 top-0 z-20 rounded-input px-4 py-3 text-[13px] shadow-card ${
            success
              ? "bg-olive-accent text-background"
              : "bg-red-500 text-white"
          }`}
        >
          {success || error}
        </div>
      )}

      {/* Заголовок */}
      <h2 className="font-heading text-[24px] font-bold text-text-main">
        Безопасность
      </h2>

      <p className="mt-2 text-[14px] text-text-muted">
        Изменение пароля вашей учётной записи
      </p>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="mt-8 flex flex-1 flex-col">

        {/* Текущий пароль */}
        <div>
          <label htmlFor="current-password" className="block font-heading text-[16px] font-bold text-text-main">
            Текущий пароль
          </label>

          <div className="mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
            <img
              src="/images/profile/lock.svg"
              alt=""
              className="mr-3 h-[20px] w-[20px] shrink-0 object-contain"
            />

            <input
              id="current-password"
              type={showCurrentPassword ? "text" : "password"}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Введите текущий пароль"
              required
              className="h-full flex-1 bg-transparent text-[14px] text-text-muted outline-none placeholder:text-text-muted"
            />

            <button
              type="button"
              onClick={() =>
                setShowCurrentPassword((prev) => !prev)
              }
              className="ml-3 flex h-[24px] w-[24px] shrink-0 items-center justify-center"
            >
              <img
                src={
                  showCurrentPassword
                    ? "/images/enter/eye-off.svg"
                    : "/images/enter/eye.svg"
                }
                alt={
                  showCurrentPassword
                    ? "Скрыть пароль"
                    : "Показать пароль"
                }
                className="h-[20px] w-[20px] object-contain"
              />
            </button>
          </div>
        </div>

        {/* Новый пароль */}
        <div className="mt-4">
          <label htmlFor="new-password" className="block font-heading text-[16px] font-bold text-text-main">
            Новый пароль
          </label>

          <div className="mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
            <img
              src="/images/profile/lock.svg"
              alt=""
              className="mr-3 h-[20px] w-[20px] shrink-0 object-contain"
            />

            <input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Введите новый пароль"
              required
              minLength={8}
              maxLength={72}
              className="h-full flex-1 bg-transparent text-[14px] text-text-muted outline-none placeholder:text-text-muted"
            />

            <button
              type="button"
              onClick={() =>
                setShowNewPassword((prev) => !prev)
              }
              className="ml-3 flex h-[24px] w-[24px] shrink-0 items-center justify-center"
            >
              <img
                src={
                  showNewPassword
                    ? "/images/enter/eye-off.svg"
                    : "/images/enter/eye.svg"
                }
                alt={
                  showNewPassword
                    ? "Скрыть пароль"
                    : "Показать пароль"
                }
                className="h-[20px] w-[20px] object-contain"
              />
            </button>
          </div>

          <p className="mt-2 text-[11px] text-text-muted">
            Не менее 8 символов
          </p>
        </div>

        {/* Повтор пароля */}
        <div className="mt-4">
          <label htmlFor="repeat-password" className="block font-heading text-[16px] font-bold text-text-main">
            Повторите новый пароль
          </label>

          <div className="mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
            <img
              src="/images/profile/lock.svg"
              alt=""
              className="mr-3 h-[20px] w-[20px] shrink-0 object-contain"
            />

            <input
              id="repeat-password"
              type={showRepeatPassword ? "text" : "password"}
              autoComplete="new-password"
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              placeholder="Повторите новый пароль"
              required
              minLength={8}
              maxLength={72}
              className="h-full flex-1 bg-transparent text-[14px] text-text-muted outline-none placeholder:text-text-muted"
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
        </div>

        {/* Кнопка */}
        <div className="mt-auto flex justify-start pt-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-pill bg-olive-accent px-8 py-3 text-[14px] font-medium text-background transition-colors hover:bg-green-accent hover:text-text-main disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Обновление..." : "Обновить пароль"}
          </button>
        </div>

      </form>
    </div>
  );
}
