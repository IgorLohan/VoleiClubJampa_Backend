import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function obterEmailRemetente() {
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM não foi configurado no arquivo .env.");
  }

  return process.env.EMAIL_FROM;
}

function obterUrlFrontend() {
  if (!process.env.URL_FRONTEND) {
    throw new Error("URL_FRONTEND não foi configurada no arquivo .env.");
  }

  return process.env.URL_FRONTEND;
}

function obterUrlFrontendSemBarraFinal() {
  return obterUrlFrontend().replace(/\/+$/, "");
}

function escaparHtml(valor) {
  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function enviarEmailVerificacao({ nome, email, token }) {
  if (!email) {
    throw new Error("E-mail do destinatário não informado.");
  }

  if (!token) {
    throw new Error("Token de verificação não informado.");
  }

  const urlFrontend = obterUrlFrontendSemBarraFinal();
  const linkVerificacao = `${urlFrontend}/verificar-email?token=${encodeURIComponent(token)}`;

  const resposta = await resend.emails.send({
    from: obterEmailRemetente(),
    to: email,
    subject: "Confirme seu e-mail - Vôlei Club Jampa",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Confirme seu e-mail</h2>

        <p>Olá, ${escaparHtml(nome || "participante")}!</p>

        <p>
          Recebemos seu cadastro no sistema Vôlei Club Jampa.
          Para ativar sua conta, clique no botão abaixo:
        </p>

        <p style="margin: 24px 0;">
          <a
            href="${linkVerificacao}"
            style="
              background: #e44631;
              color: #ffffff;
              padding: 12px 18px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              display: inline-block;
            "
          >
            Confirmar e-mail
          </a>
        </p>

        <p>
          Se o botão não funcionar, copie e cole este link no navegador:
        </p>

        <p style="word-break: break-all;">
          ${linkVerificacao}
        </p>

        <p>
          Se você não realizou esse cadastro, ignore este e-mail.
        </p>
      </div>
    `
  });

  return resposta;
}

async function enviarEmailInscricaoAprovada({
  nome,
  email,
  nomeCampeonato
}) {
  if (!email) {
    throw new Error("E-mail do destinatário não informado.");
  }

  const urlFrontend = obterUrlFrontendSemBarraFinal();
  const linkCampeonatos = `${urlFrontend}/dashboard/campeonatos`;

  const resposta = await resend.emails.send({
    from: obterEmailRemetente(),
    to: email,
    subject: "Inscrição aprovada - Vôlei Club Jampa",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Inscrição aprovada</h2>

        <p>Olá, ${escaparHtml(nome || "participante")}!</p>

        ${
          nomeCampeonato
            ? `
              <p>
                Sua inscrição no campeonato
                <strong>${escaparHtml(nomeCampeonato)}</strong>
                foi aprovada.
              </p>
            `
            : `
              <p>Sua inscrição foi aprovada.</p>
            `
        }

        <p>
          Queremos agradecer pela sua inscrição, ficamos muito felizes em ter você com a gente! 🙌
        </p>

        <p>
          Pode ter certeza que estamos preparando tudo com muito cuidado para que você viva uma experiência incrível.
          Cada detalhe está sendo pensado para entregar um evento organizado, animado e inesquecível.
        </p>

        <p>
          Agora é só se preparar… porque vem aí um dia top de verdade! 🔥🏐
        </p>

        <p>
          Em breve, enviaremos mais informações. Fique de olho! 👀
        </p>

        <p>
          Nos vemos em quadra!
        </p>

        <p>
          Abraço,<br />
          Equipe Vôlei Club Jampa
        </p>

        <p style="margin: 24px 0;">
          <a
            href="${linkCampeonatos}"
            style="
              background: #e44631;
              color: #ffffff;
              padding: 12px 18px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              display: inline-block;
            "
          >
            Ver campeonatos
          </a>
        </p>
      </div>
    `
  });

  return resposta;
}

async function enviarEmailInscricaoReprovada({
  nome,
  email,
  nomeCampeonato,
  observacaoAdmin
}) {
  if (!email) {
    throw new Error("E-mail do destinatário não informado.");
  }

  const urlFrontend = obterUrlFrontendSemBarraFinal();
  const linkCampeonatos = `${urlFrontend}/dashboard/campeonatos`;

  const resposta = await resend.emails.send({
    from: obterEmailRemetente(),
    to: email,
    subject: "Inscrição não aprovada - Vôlei Club Jampa",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Inscrição não aprovada</h2>

        <p>Olá, ${escaparHtml(nome || "participante")}!</p>

        <p>
          Sua inscrição no campeonato
          <strong>${escaparHtml(nomeCampeonato || "Vôlei Club Jampa")}</strong>
          foi analisada, mas não foi aprovada pela organização.
        </p>

        <div style="
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 14px;
          margin: 20px 0;
        ">
          <p style="margin: 0 0 8px 0;">
            <strong>Status:</strong> Não aprovada
          </p>

          <p style="margin: 0;">
            <strong>Observação:</strong>
            ${escaparHtml(observacaoAdmin || "Nenhuma observação informada.")}
          </p>
        </div>

        <p>
          Em caso de dúvida, entre em contato com a organização do campeonato.
        </p>

        <p style="margin: 24px 0;">
          <a
            href="${linkCampeonatos}"
            style="
              background: #e44631;
              color: #ffffff;
              padding: 12px 18px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              display: inline-block;
            "
          >
            Ver campeonatos
          </a>
        </p>

        <p>
          Atenciosamente,<br />
          Equipe Vôlei Club Jampa
        </p>
      </div>
    `
  });

  return resposta;
}

export default {
  enviarEmailVerificacao,
  enviarEmailInscricaoAprovada,
  enviarEmailInscricaoReprovada
};