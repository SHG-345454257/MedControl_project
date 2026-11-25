import { useRef } from "react";
import type { ChangeEvent } from "react";

type Tab = "personal" | "notifications" | "security";

type ProfileSidebarProps = {
  name: string;
  avatarUrl: string | null;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  avatarSaving: boolean;
  avatarError: string;
  onAvatarSelected: (file: File) => void;
};

const tabs = [
  { id: "personal", label: "Личные данные", icon: "person.svg" },
  { id: "notifications", label: "Уведомления", icon: "bell.svg" },
  { id: "security", label: "Безопасность", icon: "shield.svg" }
] as const;

export default function ProfileSidebar({
  name,
  avatarUrl,
  activeTab,
  onTabChange,
  avatarSaving,
  avatarError,
  onAvatarSelected
}: ProfileSidebarProps) {
  const avatarInput = useRef<HTMLInputElement>(null);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (file) {
      onAvatarSelected(file);
    }
  }

  const avatarLabel = avatarUrl ? "Изменить фото" : "Загрузить фото";

  return (
    <aside className="relative h-full min-h-[34rem] overflow-hidden rounded-card bg-card p-6 pb-[150px] shadow-card md:min-h-0">
      <div className="relative z-10 flex flex-col items-center border-b border-[#D9DDCF] pb-6">
        <input
          ref={avatarInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => avatarInput.current?.click()}
          disabled={avatarSaving}
          aria-label={`${avatarLabel} профиля`}
          aria-busy={avatarSaving}
          className="grid h-[100px] w-[100px] cursor-pointer place-items-center overflow-hidden rounded-full bg-green-bg hover:ring-2 hover:ring-olive-accent focus-visible:ring-2 focus-visible:ring-olive-accent disabled:cursor-wait disabled:opacity-60"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-heading text-[36px] font-bold text-olive-accent">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </button>

        <span className="mt-2 text-xs text-text-secondary" aria-live="polite">
          {avatarSaving ? "Загружаем…" : avatarLabel}
        </span>

        {avatarError && (
          <p role="alert" className="mt-2 text-center text-sm text-text-secondary">
            {avatarError}
          </p>
        )}

        <h2 className="mt-4 text-center font-heading text-[20px] font-bold text-text-main">
          {name}
        </h2>

        <span className="mt-2 rounded-pill bg-green-bg px-4 py-1 text-[12px] text-olive-accent">
          Пользователь
        </span>
      </div>

      <nav aria-label="Разделы личного кабинета" className="relative z-10 mt-5 space-y-2">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            aria-current={activeTab === id ? "true" : undefined}
            className={`flex w-full items-center justify-between rounded-input px-3 py-3 transition-colors ${
              activeTab === id ? "bg-green-bg" : "hover:bg-background-soft"
            }`}
          >
            <span className="flex items-center gap-3">
              <img
                src={`/images/profile/${icon}`}
                alt=""
                className="h-[21px] w-[21px] object-contain"
              />
              <span className="font-heading text-[14px] font-bold text-text-main">
                {label}
              </span>
            </span>

            <img
              src="/images/profile/arrow.svg"
              alt=""
              className="h-[16px] w-[16px] object-contain"
            />
          </button>
        ))}
      </nav>

      <img
        src="/images/profile/leaves-LK.svg"
        alt=""
        className="pointer-events-none absolute bottom-0 left-0 z-0 w-[190px] object-contain"
      />
    </aside>
  );
}