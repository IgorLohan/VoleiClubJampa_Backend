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

function formatarMoedaCentavos(valorCentavos) {
  const valor = Number(valorCentavos || 0) / 100;

  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
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
    subject: "Confirme seu e-mail - Volei Club Jampa",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Confirme seu e-mail</h2>

        <p>Olá, ${escaparHtml(nome || "participante")}!</p>

        <p>
          Recebemos seu cadastro no sistema Volei Club Jampa.
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
  nomeCampeonato,
  tamanhoCamisa,
  valorTotalCentavos,
  campeonatoId
}) {
  if (!email) {
    throw new Error("E-mail do destinatário não informado.");
  }

  const urlFrontend = obterUrlFrontendSemBarraFinal();
  const linkCampeonato = campeonatoId
    ? `${urlFrontend}/campeonato/${campeonatoId}`
    : urlFrontend;

  const resposta = await resend.emails.send({
    from: obterEmailRemetente(),
    to: email,
    subject: "Inscrição aprovada - Volei Club Jampa",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Inscrição aprovada</h2>

        <p>Olá, ${escaparHtml(nome || "participante")}!</p>

        <p>
          Sua inscrição no campeonato
          <strong>${escaparHtml(nomeCampeonato || "Volei Club Jampa")}</strong>
          foi analisada e aprovada pela organização.
        </p>

        <div style="
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 10px;
          padding: 14px;
          margin: 20px 0;
        ">
          <p style="margin: 0 0 8px 0;">
            <strong>Status:</strong> Aprovada
          </p>

          <p style="margin: 0 0 8px 0;">
            <strong>Tamanho da camisa:</strong> ${escaparHtml(tamanhoCamisa || "Não informado")}
          </p>

          <p style="margin: 0;">
            <strong>Valor:</strong> ${formatarMoedaCentavos(valorTotalCentavos)}
          </p>
        </div>

        <p>
          Agora sua inscrição está confirmada e você ficará disponível para a formação das equipes.
        </p>

        <p style="margin: 24px 0;">
          <a
            href="${linkCampeonato}"
            style="
              background: #2563eb;
              color: #ffffff;
              padding: 12px 18px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              display: inline-block;
            "
          >
            Ver campeonato
          </a>
        </p>

        <p>
          Atenciosamente,<br />
          Volei Club Jampa
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
  observacaoAdmin,
  campeonatoId
}) {
  if (!email) {
    throw new Error("E-mail do destinatário não informado.");
  }

  const urlFrontend = obterUrlFrontendSemBarraFinal();
  const linkCampeonato = campeonatoId
    ? `${urlFrontend}/campeonato/${campeonatoId}`
    : urlFrontend;

  const resposta = await resend.emails.send({
    from: obterEmailRemetente(),
    to: email,
    subject: "Inscrição não aprovada - Volei Club Jampa",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Inscrição não aprovada</h2>

        <p>Olá, ${escaparHtml(nome || "participante")}!</p>

        <p>
          Sua inscrição no campeonato
          <strong>${escaparHtml(nomeCampeonato || "Volei Club Jampa")}</strong>
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
            href="${linkCampeonato}"
            style="
              background: #2563eb;
              color: #ffffff;
              padding: 12px 18px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              display: inline-block;
            "
          >
            Ver campeonato
          </a>
        </p>

        <p>
          Atenciosamente,<br />
          Volei Club Jampa
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