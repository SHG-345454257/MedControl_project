import { API_BASE_URL } from "../../services/api";
import { useEffect, useState } from "react";

type Profile = {
  id: string;
  name: string;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
  avatarUrl: string | null;
};

type PersonalInfoProps = {
  profile: Profile;
  onSaved: (profile: Profile) => void;
};

export default function PersonalInfo({
  profile,
  onSaved
}: PersonalInfoProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setName(profile.name ?? "");
    setPhone(profile.phone ?? "");
    setBirthDate(
      profile.birthDate ? profile.birthDate.slice(0, 10) : ""
    );
    setGender(profile.gender ?? "");
  }, [profile]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          phone,
          birthDate,
          gender
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Не удалось сохранить данные");
      }

      onSaved(data.profile);
      setSuccess("Данные успешно сохранены");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось сохранить данные"
      );
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

      <div>
        <h1 className="font-heading text-[20px] font-bold text-text-main">
          Личная информация
        </h1>

        <p className="mt-1 text-[13px] text-text-muted">
          Здесь вы можете изменить личные данные
        </p>
      </div>

      <form className="mt-5" onSubmit={handleSubmit}>
        {/* Имя */}
        <label htmlFor="profile-name" className="block font-heading text-[16px] font-bold text-text-main">
          Имя
        </label>

        <div className="mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
          <img
            src="/images/profile/person.svg"
            alt=""
            className="mr-3 h-[20px] w-[20px] object-contain"
          />

          <input
            id="profile-name"
            type="text"
            placeholder="Введите имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-full flex-1 bg-transparent text-[14px] text-text-muted outline-none placeholder:text-text-muted"
          />
        </div>

        {/* Телефон */}
        <label htmlFor="profile-phone" className="block mt-4 font-heading text-[16px] font-bold text-text-main">
          Телефон
        </label>

        <div className="mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
          <img
            src="/images/profile/phone.svg"
            alt=""
            className="mr-3 h-[20px] w-[20px] object-contain"
          />

          <input
            id="profile-phone"
            type="tel"
            placeholder="+7 (___) ___-__-__"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-full flex-1 bg-transparent text-[14px] text-text-muted outline-none placeholder:text-text-muted"
          />
        </div>

        {/* Дата рождения */}
        <label htmlFor="profile-birth-date" className="block mt-4 font-heading text-[16px] font-bold text-text-main">
          Дата рождения
        </label>

        <div className="relative mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
          <img
            src="/images/profile/calendar.svg"
            alt=""
            className="mr-3 h-[20px] w-[20px] shrink-0 object-contain"
          />

          <input
            id="profile-birth-date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="h-full flex-1 bg-transparent text-[14px] text-text-muted outline-none
              [&::-webkit-calendar-picker-indicator]:cursor-pointer
              [&::-webkit-calendar-picker-indicator]:opacity-0"
          />

          <div className="pointer-events-none absolute right-4 flex h-[20px] w-[20px] items-center justify-center">
            <img
              src="/images/profile/calendar.svg"
              alt=""
              className="h-[20px] w-[20px] object-contain"
            />
          </div>
        </div>

        {/* Пол */}
        <label htmlFor="profile-gender" className="block mt-4 font-heading text-[16px] font-bold text-text-main">
          Пол
        </label>

        <div className="relative mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4">
          <img
            src="/images/profile/gender.svg"
            alt=""
            className="mr-3 h-[20px] w-[20px] shrink-0 object-contain"
          />

          <span className="flex-1 text-[14px] text-text-muted">
            {gender === "MALE"
              ? "Мужской"
              : gender === "FEMALE"
                ? "Женский"
                : "Не указан"}
          </span>

          <img
            src="/images/profile/arrow-down.svg"
            alt=""
            className="ml-3 h-[20px] w-[20px] shrink-0 object-contain"
          />

          <select
            id="profile-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            <option value="">Не указан</option>
            <option value="MALE">Мужской</option>
            <option value="FEMALE">Женский</option>
          </select>
        </div>

        {/* Кнопка */}
        <button
          type="submit"
          disabled={saving}
          className="mt-5 rounded-pill bg-olive-accent px-8 py-3 text-[14px] font-medium text-background transition-colors hover:bg-green-accent hover:text-text-main disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Сохранение..." : "Сохранить изменения"}
        </button>
      </form>
    </div>
  );
}