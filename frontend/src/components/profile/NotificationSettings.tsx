import { API_BASE_URL } from "../../services/api";
import { useEffect, useState } from "react";

type NotificationSettingsData = {
  pushEnabled: boolean;
  soundEnabled: boolean;
  emailReports: boolean;
};

type NotificationSettingsProps = {
  settings: NotificationSettingsData;
  onSaved: (settings: NotificationSettingsData) => void;
};

export default function NotificationSettings({
  settings,
  onSaved
}: NotificationSettingsProps) {
  const [pushEnabled, setPushEnabled] = useState(settings.pushEnabled);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [emailReports, setEmailReports] = useState(settings.emailReports);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Синхронизация с настройками из родительского компонента
  useEffect(() => {
    setPushEnabled(settings.pushEnabled);
    setSoundEnabled(settings.soundEnabled);
    setEmailReports(settings.emailReports);
  }, [settings]);

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

  async function handleSave() {
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Пользователь не авторизован");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/profile/notifications`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            pushEnabled,
            soundEnabled,
            emailReports
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Не удалось сохранить настройки уведомлений"
        );
        return;
      }

      onSaved(data.settings);
      setSuccess("Настройки уведомлений успешно сохранены");
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
        Уведомления
      </h2>

      <p className="mt-2 text-[14px] text-text-muted">
        Настройте способы получения уведомлений
      </p>

      {/* Список настроек */}
      <div className="mt-8 space-y-4">

        {/* Push */}
        <NotificationRow
          title="Push-уведомления"
          description="Напоминания о приёме лекарств и важных событиях"
          checked={pushEnabled}
          onChange={setPushEnabled}
        />

        {/* Звук */}
        <NotificationRow
          title="Звуковые уведомления"
          description="Звуковой сигнал при получении напоминаний"
          checked={soundEnabled}
          onChange={setSoundEnabled}
        />

        {/* Email */}
        <NotificationRow
          title="Отчёты на электронную почту"
          description="Получение отчётов о лечении и активности по почте"
          checked={emailReports}
          onChange={setEmailReports}
        />

      </div>

      {/* Кнопка */}
      <div className="mt-auto flex justify-start pt-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-pill bg-olive-accent px-8 py-3 text-[14px] font-medium text-background transition-colors hover:bg-green-accent hover:text-text-main disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}


/* Отдельная строка настройки */
function NotificationRow({
  title,
  description,
  checked,
  onChange
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] border border-[#D9DDCF] bg-background px-5 py-5">

      <div className="min-w-0">
        <h3 className="text-[14px] font-medium text-text-main">
          {title}
        </h3>

        <p className="mt-1 text-[12px] leading-5 text-text-muted">
          {description}
        </p>
      </div>

      {/* Переключатель */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-[26px] w-[46px] shrink-0 rounded-pill transition-colors ${
          checked ? "bg-green-accent" : "bg-[#D5D8D0]"
        }`}
      >
        <span
          className={`absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-all ${
            checked ? "left-[23px]" : "left-[3px]"
          }`}
        />
      </button>

    </div>
  );
}