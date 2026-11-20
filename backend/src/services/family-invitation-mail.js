import nodemailer from "nodemailer";

export async function sendFamilyInvitationEmail(email, token, inviter) {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM?.trim() || user;

  if (!host || !user || !pass || !from) return "not_configured";

  const port = Number(process.env.SMTP_PORT || 465);
  const secure = port === 465;

  try {
    const url = new URL("/family/invite", process.env.CLIENT_URL || "http://localhost:5173");
    url.hash = token;
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    const inviterName = inviter.name.replace(/\s+/g, " ").trim();
    const result = await transport.sendMail({
      from: { name: `${inviterName} через МедКонтроль`, address: from },
      replyTo: { name: inviterName, address: inviter.email },
      to: { name: "", address: email },
      subject: "Приглашение в семейный доступ МедКонтроля",
      text: [
        `Вы получили приглашение от ${inviterName} просматривать календарь приёмов в МедКонтроле.`,
        "",
        "Откройте ссылку и войдите под аккаунтом с адресом этой почты:",
        url.href,
        "",
        "Приглашение действует 24 часа."
      ].join("\n")
    });

    return result.accepted.length ? "sent" : "failed";
  } catch (error) {
    console.warn("Не удалось отправить семейное приглашение по SMTP", error?.code ?? "UNKNOWN");
    return "failed";
  }
}
