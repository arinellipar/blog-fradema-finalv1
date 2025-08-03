// src/lib/email.ts

import nodemailer from "nodemailer";

// Configuração do transporter de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Interface para envio de email
 */
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envia email genérico
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@fradema.com.br",
      to,
      subject,
      html,
      text,
    });

    console.log("Email enviado:", info.messageId);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

/**
 * Envia email de verificação de conta
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verificação de Email - Fradema</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          background: #0073e6;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background: #0073e6;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Fradema Consultoria Tributária</h1>
      </div>

      <div class="content">
        <h2>Verificação de Email</h2>

        <p>Olá!</p>

        <p>Obrigado por se cadastrar na Fradema. Para completar o processo de criação da sua conta, precisamos verificar seu endereço de email.</p>

        <p>Clique no botão abaixo para verificar seu email:</p>

        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verificar Email</a>
        </div>

        <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>

        <p>Este link expira em 24 horas por questões de segurança.</p>

        <p>Se você não criou uma conta na Fradema, pode ignorar este email.</p>

        <p>Atenciosamente,<br>Equipe Fradema</p>
      </div>

      <div class="footer">
        <p>Fradema Consultoria Tributária</p>
        <p>Este é um email automático, não responda.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Verificação de Email - Fradema

    Olá!

    Obrigado por se cadastrar na Fradema. Para completar o processo de criação da sua conta, precisamos verificar seu endereço de email.

    Acesse o link abaixo para verificar seu email:
    ${verificationUrl}

    Este link expira em 24 horas por questões de segurança.

    Se você não criou uma conta na Fradema, pode ignorar este email.

    Atenciosamente,
    Equipe Fradema
  `;

  return await sendEmail({
    to: email,
    subject: "Verificação de Email - Fradema",
    html,
    text,
  });
}

/**
 * Envia email de recuperação de senha
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Recuperação de Senha - Fradema</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          background: #0073e6;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background: #0073e6;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Fradema Consultoria Tributária</h1>
      </div>

      <div class="content">
        <h2>Recuperação de Senha</h2>

        <p>Olá!</p>

        <p>Recebemos uma solicitação para redefinir a senha da sua conta na Fradema.</p>

        <p>Clique no botão abaixo para criar uma nova senha:</p>

        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Redefinir Senha</a>
        </div>

        <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>

        <div class="warning">
          <strong>⚠️ Importante:</strong>
          <ul>
            <li>Este link expira em 1 hora por questões de segurança</li>
            <li>Só pode ser usado uma vez</li>
            <li>Se você não solicitou esta recuperação, ignore este email</li>
          </ul>
        </div>

        <p>Se você não solicitou a redefinição de senha, pode ignorar este email. Sua senha atual permanecerá inalterada.</p>

        <p>Atenciosamente,<br>Equipe Fradema</p>
      </div>

      <div class="footer">
        <p>Fradema Consultoria Tributária</p>
        <p>Este é um email automático, não responda.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Recuperação de Senha - Fradema

    Olá!

    Recebemos uma solicitação para redefinir a senha da sua conta na Fradema.

    Acesse o link abaixo para criar uma nova senha:
    ${resetUrl}

    IMPORTANTE:
    - Este link expira em 1 hora por questões de segurança
    - Só pode ser usado uma vez
    - Se você não solicitou esta recuperação, ignore este email

    Se você não solicitou a redefinição de senha, pode ignorar este email. Sua senha atual permanecerá inalterada.

    Atenciosamente,
    Equipe Fradema
  `;

  return await sendEmail({
    to: email,
    subject: "Recuperação de Senha - Fradema",
    html,
    text,
  });
}

/**
 * Envia email de boas-vindas
 */
export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bem-vindo à Fradema</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          background: #0073e6;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background: #0073e6;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .features {
          background: white;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Bem-vindo à Fradema!</h1>
      </div>

      <div class="content">
        <h2>Olá, ${name}!</h2>

        <p>É um prazer tê-lo conosco! Sua conta foi criada com sucesso e você agora tem acesso ao nosso conteúdo exclusivo sobre consultoria tributária.</p>

        <div class="features">
          <h3>O que você pode fazer agora:</h3>
          <ul>
            <li>📚 Acessar artigos especializados em tributação</li>
            <li>💬 Participar de discussões com outros profissionais</li>
            <li>📧 Receber nossa newsletter com atualizações regulares</li>
            <li>🎯 Acompanhar mudanças na legislação tributária</li>
          </ul>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Acessar Dashboard</a>
        </div>

        <p>Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.</p>

        <p>Mais uma vez, bem-vindo à Fradema!</p>

        <p>Atenciosamente,<br>Equipe Fradema</p>
      </div>

      <div class="footer">
        <p>Fradema Consultoria Tributária</p>
        <p>Este é um email automático, não responda.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Bem-vindo à Fradema!

    Olá, ${name}!

    É um prazer tê-lo conosco! Sua conta foi criada com sucesso e você agora tem acesso ao nosso conteúdo exclusivo sobre consultoria tributária.

    O que você pode fazer agora:
    - Acessar artigos especializados em tributação
    - Participar de discussões com outros profissionais
    - Receber nossa newsletter com atualizações regulares
    - Acompanhar mudanças na legislação tributária

    Acesse seu dashboard em: ${process.env.NEXTAUTH_URL}/dashboard

    Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.

    Mais uma vez, bem-vindo à Fradema!

    Atenciosamente,
    Equipe Fradema
  `;

  return await sendEmail({
    to: email,
    subject: "Bem-vindo à Fradema!",
    html,
    text,
  });
}

/**
 * Verifica se o serviço de email está configurado
 */
export function isEmailConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );
}
