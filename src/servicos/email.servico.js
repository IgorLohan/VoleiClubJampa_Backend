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

async function enviarEmailVerificacao({ nome, email, token }) {
  if (!email) {
    throw new Error("E-mail do destinatário não informado.");
  }

  if (!token) {
    throw new Error("Token de verificação não informado.");
  }

  const urlFrontend = obterUrlFrontend().replace(/\/+$/, "");
  const linkVerificacao = `${urlFrontend}/verificar-email?token=${encodeURIComponent(token)}`;

  const resposta = await resend.emails.send({
    from: obterEmailRemetente(),
    to: email,
    subject: "Confirme seu e-mail - Volei Club Jampa",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Confirme seu e-mail</h2>

        <p>Olá, ${nome || "participante"}!</p>

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

export default {
  enviarEmailVerificacao
};