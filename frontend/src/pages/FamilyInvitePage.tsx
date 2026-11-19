import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { familyRequest } from "../api/family";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import { familyInviteHash } from "../services/family-invitation";
import { hasActiveSession } from "../services/session";

const primaryAction =
  "inline-flex min-h-11 items-center justify-center rounded-pill bg-olive-accent px-5 py-2 text-sm font-medium text-background transition hover:bg-green-accent hover:text-text-main disabled:cursor-not-allowed disabled:opacity-60";
const secondaryAction =
  "inline-flex min-h-11 items-center justify-center rounded-pill border border-olive-accent px-5 py-2 text-sm font-medium text-text-main transition hover:bg-green-bg";

export default function FamilyInvitePage() {
  const location = useLocation();
  const inviteHash = familyInviteHash(location.hash);

  // Reset request feedback when a different invitation is opened.
  return <FamilyInvitation key={inviteHash} inviteHash={inviteHash} />;
}

function FamilyInvitation({ inviteHash }: { inviteHash: string }) {
  const navigate = useNavigate();
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const signedIn = hasActiveSession();
  const login = { pathname: "/login", hash: inviteHash };

  async function acceptInvitation() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");

    try {
      await familyRequest("/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token: inviteHash.slice(1) })
      });
      navigate("/family", { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось принять приглашение");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  function switchAccount() {
    localStorage.removeItem("token");
    navigate(login, { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-soft">
      <Header showActions={false} />

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <section
          aria-labelledby="invitation-heading"
          className="w-full max-w-lg rounded-card bg-card p-6 shadow-card sm:p-8"
        >
          <img src="/images/family/people.svg" alt="" className="mb-4 h-12 w-12 object-contain" />
          <h1 id="invitation-heading" className="font-heading text-2xl font-bold text-text-main sm:text-[32px]">
            Семейный доступ
          </h1>

          {!inviteHash ? (
            <>
              <p className="mt-3 text-text-secondary" role="alert">
                Ссылка неполная или повреждена. Попросите отправителя прислать новое приглашение.
              </p>
              <Link to={signedIn ? "/family" : "/"} className={`mt-6 ${secondaryAction}`}>
                {signedIn ? "К семейному доступу" : "На главную"}
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-text-secondary">
                Вас пригласили просматривать календарь приёмов близкого. Используйте аккаунт
                с адресом электронной почты, на который отправили приглашение.
              </p>
              {error && <p className="mt-4 text-sm text-text-main" role="alert">{error}</p>}

              <div className="mt-6 flex flex-wrap gap-3">
                {signedIn ? (
                  <>
                    <button type="button" onClick={() => void acceptInvitation()} disabled={busy} className={primaryAction}>
                      {busy ? "Принимаем приглашение…" : "Принять приглашение"}
                    </button>
                    <button
                      type="button"
                      onClick={switchAccount}
                      disabled={busy}
                      className={`${secondaryAction} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      Войти в другой аккаунт
                    </button>
                  </>
                ) : (
                  <>
                    <Link to={login} className={primaryAction}>Войти</Link>
                    <Link to={{ pathname: "/register", hash: inviteHash }} className={secondaryAction}>
                      Зарегистрироваться
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
