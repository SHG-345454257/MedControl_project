import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import AppHeader from "../components/layout/AppHeader";
import Footer from "../components/layout/Footer";
import { familyRequest } from "../api/family";

type FamilyProfile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  relationLabel: string | null;
  isSelf: boolean;
  total: number;
  taken: number;
  planned: number;
};

type Invitation = {
  id: string;
  invitedEmail: string;
  status: "ACTIVE" | "PENDING";
};

type FamilyData = {
  profiles: FamilyProfile[];
  invitations: Invitation[];
};

const mailFeedback = {
  sent: "Письмо с приглашением отправлено.",
  not_configured: "Отправка писем не настроена. Скопируйте ссылку и передайте её близкому.",
  failed: "Не удалось отправить письмо. Приглашение создано, ссылку можно скопировать."
};

const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-pill " +
  "bg-olive-accent px-4 py-3 text-[14px] font-medium text-background " +
  "transition-colors hover:bg-green-accent hover:text-text-main " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "disabled:hover:bg-olive-accent disabled:hover:text-background";

function getDoseSummary(profile: FamilyProfile) {
  if (profile.total === 0) return "На сегодня приёмов нет";
  if (profile.taken === profile.total) return "Все приёмы отмечены";
  if (profile.planned > 0) return `Осталось принять: ${profile.planned}`;

  return `Принято ${profile.taken} из ${profile.total}`;
}

export default function FamilyPage() {
  const [data, setData] = useState<FamilyData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [email, setEmail] = useState("");
  const [invitation, setInvitation] = useState<{
    email: string;
    url: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    familyRequest<FamilyData>("", { signal: controller.signal })
      .then(setData)
      .catch((error: Error) => {
        if (!controller.signal.aborted) {
          setLoadError(error.message);
        }
      });

    return () => controller.abort();
  }, []);

  async function handleInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback("");
    setInvitation(null);

    try {
      const recipient = email.trim().toLowerCase();
      const { token, mailStatus } = await familyRequest<{
        token: string;
        mailStatus: keyof typeof mailFeedback;
      }>(
        "/invitations",
        {
          method: "POST",
          body: JSON.stringify({ email: recipient })
        }
      );

      setInvitation({
        email: recipient,
        url: new URL(
          `/family/invite#${token}`,
          window.location.origin
        ).href
      });

      setFeedback(mailFeedback[mailStatus] ?? mailFeedback.not_configured);

      try {
        setData(await familyRequest<FamilyData>());
        setLoadError("");
      } catch (error) {
        setLoadError((error as Error).message);
      }
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copyInvitation() {
    if (!invitation) return;

    try {
      await navigator.clipboard.writeText(invitation.url);
      setFeedback("Ссылка скопирована");
    } catch {
      setFeedback("Выделите ссылку в поле и скопируйте её вручную");
    }
  }

  async function revokeInvitation(access: Invitation) {
    setBusy(true);
    setFeedback("");

    try {
      await familyRequest(`/invitations/${access.id}`, { method: "DELETE" });

      setInvitation((current) =>
        current?.email === access.invitedEmail ? null : current
      );

      setData((current) =>
        current && {
          ...current,
          invitations: current.invitations.filter(
            (item) => item.invitedEmail !== access.invitedEmail
          )
        }
      );

      setFeedback("Доступ отозван");
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-soft">
      <AppHeader activePage="Семейный доступ" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8">
        <div className="relative pb-8 sm:min-h-[144px] sm:pr-40">
          <img
            src="/images/family/leaves.svg"
            alt=""
            className="pointer-events-none absolute bottom-0 right-0 hidden h-[128px] w-auto object-contain object-right-bottom sm:block lg:h-[144px]"
          />

          <div className="relative">
            <h1 className="font-heading text-[32px] font-bold text-text-main">
              Семейный доступ
            </h1>
            <p className="mt-2 max-w-xs text-text-secondary">
              Следите за приёмами лекарств близких, которые поделились с вами
              календарём.
            </p>
          </div>
        </div>

        <div className="relative grid items-stretch gap-4 lg:grid-cols-[1.18fr_1fr]">
          <section className="flex flex-col rounded-card bg-card p-5 shadow-card sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-bg">
                <img
                  src="/images/family/people.svg"
                  alt=""
                  className="h-6 w-6 object-contain"
                />
              </div>
              <h2 className="font-heading text-2xl font-bold text-text-main">
                Члены семьи
              </h2>
            </div>

            {loadError && <p role="alert">{loadError}</p>}
            {!data && !loadError && <p role="status">Загрузка профилей…</p>}
            {data?.profiles.length === 0 && <p>Доступных профилей пока нет.</p>}

            <div className="grid flex-1 auto-rows-fr gap-4 sm:grid-cols-2">
              {data?.profiles.map((profile) => (
                <article
                  key={profile.id}
                  className={`flex min-w-0 flex-col rounded-[18px] border border-olive-accent/50 p-4 ${
                    profile.isSelf ? "bg-[#ADBF98]" : "bg-background"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-lilac-light font-heading text-xl text-text-main">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        profile.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part.charAt(0).toUpperCase())
                          .join("")
                      )}
                    </div>

                    {profile.isSelf && (
                      <span className="rounded-md bg-background-soft px-2 py-1 text-xs">
                        Вы
                      </span>
                    )}
                  </div>

                  <h3 className="break-words font-heading font-bold text-text-main">
                    {profile.name}
                  </h3>

                  {profile.relationLabel && (
                    <p className="text-sm text-text-secondary">
                      {profile.relationLabel}
                    </p>
                  )}

                  <p className="mb-5 mt-4 flex items-center gap-2 text-sm text-text-secondary">
                    {profile.total > 0 && (
                      <img
                        src={
                          profile.taken === profile.total
                            ? "/images/family/completed.svg"
                            : "/images/family/round-watch.svg"
                        }
                        alt=""
                        className="h-8 w-8 shrink-0 object-contain"
                      />
                    )}
                    {getDoseSummary(profile)}
                  </p>

                  <Link
                    to={`/dashboard?profileId=${encodeURIComponent(profile.id)}`}
                    className={`${buttonClass} mt-auto text-center`}
                  >
                    Перейти в дашборд
                    <img
                      src="/images/arrow.svg"
                      alt=""
                      className="ml-2 h-4 w-4 shrink-0 object-contain"
                    />
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-card bg-card p-5 shadow-card sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-bg">
                <img
                  src="/images/family/mail.svg"
                  alt=""
                  className="h-6 w-6 object-contain"
                />
              </div>
              <h2 className="font-heading text-2xl font-bold text-text-main">
                Пригласить близкого
              </h2>
            </div>

            <p className="mb-4 text-sm text-text-secondary">
              Укажите email близкого, чтобы поделиться своим календарём приёмов.
            </p>

            <form onSubmit={handleInvitation} className="mt-5">
              <label htmlFor="family-email" className="block font-heading text-[16px] font-bold text-text-main">
                Email близкого
              </label>

              <div className="mt-2 flex h-[48px] items-center rounded-input border border-text-muted bg-background px-4 focus-within:border-olive-accent">
                <img
                  src="/images/family/mail.svg"
                  alt=""
                  className="mr-3 h-[20px] w-[20px] shrink-0 object-contain"
                />
                <input
                  id="family-email"
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setInvitation(null);
                    setFeedback("");
                  }}
                  disabled={busy}
                  placeholder="family@mail.ru"
                  className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-text-muted outline-none placeholder:text-text-muted"
                />
              </div>

              <label htmlFor="family-link" className="mt-4 block font-heading text-[16px] font-bold text-text-main">
                Ссылка для приглашения
              </label>

              <div className="mt-2 flex h-[48px] items-center gap-2 rounded-input border border-text-muted bg-background pl-4 pr-1.5 focus-within:border-olive-accent">
                <input
                  id="family-link"
                  readOnly
                  value={invitation?.url ?? ""}
                  placeholder="Появится после создания"
                  className="h-full min-w-0 flex-1 truncate bg-transparent text-[14px] text-text-muted outline-none placeholder:text-text-muted"
                />
                <button
                  type="button"
                  onClick={copyInvitation}
                  disabled={!invitation}
                  className="inline-flex h-8 shrink-0 items-center gap-2 rounded-input bg-green-bg px-2.5 text-[13px] text-text-main transition-colors enabled:hover:bg-green-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <img
                    src="/images/family/copy.svg"
                    alt=""
                    className="h-4 w-4 shrink-0 object-contain"
                  />
                  Скопировать
                </button>
              </div>

              <button
                type="submit"
                disabled={busy}
                className={`${buttonClass} mt-5 w-full`}
              >
                {busy ? "Подождите…" : "Отправить приглашение"}
              </button>
            </form>

            {feedback && (
              <p role="status" className="mt-3 text-sm">
                {feedback}
              </p>
            )}

            {!!data?.invitations.length && (
              <div className="mt-5 border-t border-text-muted/30 pt-4">
                <h3 className="mb-2 font-semibold">Приглашения</h3>

                <ul className="space-y-3">
                  {data.invitations.map((access) => (
                    <li
                      key={access.id}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0 break-words">
                        <p>{access.invitedEmail}</p>
                        <p className="text-text-secondary">
                          {access.status === "ACTIVE"
                            ? "Доступ открыт"
                            : "Ожидает принятия"}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => revokeInvitation(access)}
                        className="shrink-0 underline disabled:opacity-50"
                      >
                        Отозвать
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}