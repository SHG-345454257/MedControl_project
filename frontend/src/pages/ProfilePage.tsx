import { API_BASE_URL } from "../services/api";
import { useEffect, useState } from "react";

import AppHeader from "../components/layout/AppHeader";
import Footer from "../components/layout/Footer";
import ProfileSidebar from "../components/profile/ProfileSidebar";
import PersonalInfo from "../components/profile/PersonalInfo";
import NotificationSettings from "../components/profile/NotificationSettings";
import ChangePassword from "../components/profile/ChangePassword";
import { useNavigate } from "react-router-dom";

type Profile = {
  id: string;
  name: string;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
  avatarUrl: string | null;
};

type NotificationSettingsData = {
  pushEnabled: boolean;
  soundEnabled: boolean;
  emailReports: boolean;
};

type Tab = "personal" | "notifications" | "security";

const profileUrl = `${API_BASE_URL}/profile`;
const avatarSize = 192;
const avatarLimit = 60000;

async function prepareAvatar(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Выберите изображение JPG, PNG или WebP");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Изображение должно быть не больше 10 МБ");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = objectUrl;

    try {
      await image.decode();
    } catch {
      throw new Error("Не удалось открыть изображение");
    }

    const canvas = document.createElement("canvas");
    canvas.width = avatarSize;
    canvas.height = avatarSize;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Не удалось обработать изображение");
    }

    const cropSize = Math.min(image.naturalWidth, image.naturalHeight);

    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, avatarSize, avatarSize);
    context.drawImage(
      image,
      (image.naturalWidth - cropSize) / 2,
      (image.naturalHeight - cropSize) / 2,
      cropSize,
      cropSize,
      0,
      0,
      avatarSize,
      avatarSize
    );

    for (const quality of [0.8, 0.65, 0.5]) {
      const avatarUrl = canvas.toDataURL("image/jpeg", quality);
      if (
        avatarUrl.startsWith("data:image/jpeg;base64,") &&
        avatarUrl.length <= avatarLimit
      ) {
        return avatarUrl;
      }
    }

    throw new Error("Не удалось уменьшить фото. Выберите другое изображение");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [notifications, setNotifications] = useState<NotificationSettingsData>({
    pushEnabled: true,
    soundEnabled: true,
    emailReports: false
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Пользователь не авторизован");
          return;
        }

        const options = {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        };

        const [profileResponse, notificationsResponse] = await Promise.all([
          fetch(profileUrl, options),
          fetch(`${profileUrl}/notifications`, options)
        ]);

        const [profileData, notificationsData] = await Promise.all([
          profileResponse.json(),
          notificationsResponse.json()
        ]);

        if (controller.signal.aborted) return;

        if (!profileResponse.ok) {
          setError(profileData.message || "Не удалось загрузить профиль");
          return;
        }

        if (!notificationsResponse.ok) {
          setError(
            notificationsData.message || "Не удалось загрузить настройки уведомлений"
          );
          return;
        }

        setProfile(profileData.profile);
        setNotifications(notificationsData.settings);
      } catch {
        if (!controller.signal.aborted) {
          setError("Не удалось подключиться к серверу");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, []);

  async function uploadAvatar(file: File) {
    if (avatarSaving) return;

    setAvatarError("");
    setAvatarSaving(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Пользователь не авторизован");
      }

      const avatarUrl = await prepareAvatar(file);
      const response = await fetch(`${profileUrl}/avatar`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ avatarUrl })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || typeof data?.avatarUrl !== "string") {
        throw new Error(data?.message || "Не удалось сохранить аватар");
      }

      const savedAvatarUrl: string = data.avatarUrl;
      setProfile((current) =>
        current ? { ...current, avatarUrl: savedAvatarUrl } : current
      );
    } catch (error) {
      setAvatarError(
        error instanceof Error ? error.message : "Не удалось загрузить фото"
      );
    } finally {
      setAvatarSaving(false);
    }
  }

  function handlePersonalInfoSaved(savedProfile: Profile) {
    setProfile((current) =>
      current
        ? { ...savedProfile, avatarUrl: current.avatarUrl }
        : savedProfile
    );
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-soft">
      <AppHeader activePage={null} />

      <main className="account-page-main flex flex-1 flex-col">
        <section className="flex-1 px-6 pb-8 pt-8">
          <div className="mx-auto max-w-[1100px]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <h1 className="font-heading text-[32px] font-bold text-text-main">
                Личный кабинет
              </h1>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-pill px-3 font-heading text-sm font-bold text-text-main transition hover:bg-green-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive-accent"
              >
                <img src="/images/profile/exit.svg" alt="" className="h-5 w-5 object-contain" />
                Выйти
              </button>
            </div>

            {loading && (
              <div className="grid gap-6 md:grid-cols-[270px_minmax(0,1fr)]">
                <div aria-hidden="true" className="min-h-[34rem] rounded-card bg-card shadow-card md:min-h-0" />
                <p role="status" className="min-h-[560px] rounded-card bg-card p-6 text-sm text-text-secondary shadow-card">
                  Загрузка профиля…
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-card bg-card p-8 text-center shadow-card">
                <p role="alert" className="text-[14px] text-text-secondary">
                  {error}
                </p>
              </div>
            )}

            {!loading && !error && profile && (
              <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-[270px_minmax(0,1fr)]">
                <ProfileSidebar
                  name={profile.name}
                  avatarUrl={profile.avatarUrl}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  avatarSaving={avatarSaving}
                  avatarError={avatarError}
                  onAvatarSelected={(file) => void uploadAvatar(file)}
                />

                <section className="min-h-[560px] rounded-card bg-card p-6 shadow-card">
                  {activeTab === "personal" && (
                    <PersonalInfo
                      profile={profile}
                      onSaved={handlePersonalInfoSaved}
                    />
                  )}

                  {activeTab === "notifications" && (
                    <NotificationSettings
                      settings={notifications}
                      onSaved={setNotifications}
                    />
                  )}

                  {activeTab === "security" && <ChangePassword />}
                </section>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}