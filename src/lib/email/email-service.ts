/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/email/email-service.ts

import nodemailer, { Transporter, SendMailOptions } from "nodemailer";
import { z } from "zod";

/**
 * Interface para configuração de provedor de email
 * Suporta múltiplos provedores com fallback
 */
interface EmailProvider {
  name: string;
  transporter: Transporter;
  priority: number;
  isActive: boolean;
  successCount: number;
  failureCount: number;
  lastFailure?: Date;
}

/**
 * Schema de validação para configuração SMTP
 */
const smtpConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  secure: z.boolean(),
  auth: z.object({
    user: z.string().email(),
    pass: z.string().min(1),
  }),
  tls: z
    .object({
      rejectUnauthorized: z.boolean(),
      minVersion: z.string().optional(),
    })
    .optional(),
});

/**
 * Interface para email na fila
 */
interface QueuedEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  lastAttemptAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Classe principal do serviço de email
 * Implementa sistema robusto com retry, fallback e logging
 */
export class EmailService {
  private providers: EmailProvider[] = [];
  private emailQueue: Map<string, QueuedEmail> = new Map();
  private isProcessing = false;
  private retryInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeProviders();
    this.startQueueProcessor();
  }

  /**
   * Inicializa provedores de email com configurações adequadas
   */
  private initializeProviders(): void {
    console.log("📧 Inicializando sistema de email...");

    // Provider 1: Gmail com App Password
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const gmailTransporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD, // DEVE ser App Password, não senha normal
          },
          tls: {
            rejectUnauthorized: false,
            minVersion: "TLSv1.2",
          },
        });

        this.providers.push({
          name: "Gmail",
          transporter: gmailTransporter,
          priority: 1,
          isActive: true,
          successCount: 0,
          failureCount: 0,
        });

        console.log("✅ Gmail provider configurado");
      } catch (error) {
        console.error("❌ Erro ao configurar Gmail:", error);
      }
    }

    // Provider 2: SendGrid (Recomendado para produção)
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sendgridTransporter = nodemailer.createTransport({
          host: "smtp.sendgrid.net",
          port: 587,
          secure: false,
          auth: {
            user: "apikey",
            pass: process.env.SENDGRID_API_KEY,
          },
        });

        this.providers.push({
          name: "SendGrid",
          transporter: sendgridTransporter,
          priority: 2,
          isActive: true,
          successCount: 0,
          failureCount: 0,
        });

        console.log("✅ SendGrid provider configurado");
      } catch (error) {
        console.error("❌ Erro ao configurar SendGrid:", error);
      }
    }

    // Provider 3: SMTP Genérico (Fallback)
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
    ) {
      try {
        const config = {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false,
          },
        };

        // Validar configuração
        const validatedConfig = smtpConfigSchema.parse(config);

        const genericTransporter = nodemailer.createTransport(
          validatedConfig as any
        );

        this.providers.push({
          name: "Generic SMTP",
          transporter: genericTransporter,
          priority: 3,
          isActive: true,
          successCount: 0,
          failureCount: 0,
        });

        console.log("✅ Generic SMTP provider configurado");
      } catch (error) {
        console.error("❌ Erro ao configurar SMTP genérico:", error);
      }
    }

    // Provider 4: Desenvolvimento (Console)
    if (process.env.NODE_ENV === "development" || this.providers.length === 0) {
      const devTransporter = {
        sendMail: async (options: SendMailOptions) => {
          console.log("\n📧 EMAIL DE DESENVOLVIMENTO:");
          console.log("Para:", options.to);
          console.log("Assunto:", options.subject);
          console.log(
            "Conteúdo HTML:",
            String(options.html || "").substring(0, 200) + "..."
          );
          return { messageId: `dev-${Date.now()}` };
        },
      } as any;

      this.providers.push({
        name: "Development Console",
        transporter: devTransporter,
        priority: 99,
        isActive: true,
        successCount: 0,
        failureCount: 0,
      });

      console.log("✅ Development console provider configurado");
    }

    console.log(`📧 Total de providers configurados: ${this.providers.length}`);
  }

  /**
   * Inicia processador de fila de emails
   */
  private startQueueProcessor(): void {
    // Processar fila a cada 30 segundos
    this.retryInterval = setInterval(() => {
      this.processQueue();
    }, 30000);

    // Cleanup na saída
    if (typeof process !== "undefined" && typeof process.on === "function") {
      process.on("exit", () => {
        if (this.retryInterval) {
          clearInterval(this.retryInterval);
        }
      });
    }
  }

  /**
   * Processa emails na fila com retry logic
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.emailQueue.size === 0) return;

    this.isProcessing = true;
    console.log(
      `⏳ Processando fila de emails (${this.emailQueue.size} emails)...`
    );

    for (const [id, email] of this.emailQueue.entries()) {
      // Verificar se excedeu tentativas
      if (email.attempts >= email.maxAttempts) {
        console.error(`❌ Email ${id} excedeu tentativas máximas`);
        this.emailQueue.delete(id);
        continue;
      }

      // Verificar idade do email (máximo 24h)
      const age = Date.now() - email.createdAt.getTime();
      if (age > 24 * 60 * 60 * 1000) {
        console.error(`❌ Email ${id} expirou (>24h)`);
        this.emailQueue.delete(id);
        continue;
      }

      // Tentar enviar
      const result = await this.sendEmailInternal({
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      if (result.success) {
        console.log(
          `✅ Email ${id} enviado com sucesso após ${
            email.attempts + 1
          } tentativas`
        );
        this.emailQueue.delete(id);
      } else {
        email.attempts++;
        email.lastAttemptAt = new Date();
        email.error = result.error;
        console.log(
          `⚠️ Email ${id} falhou, tentativa ${email.attempts}/${email.maxAttempts}`
        );
      }
    }

    this.isProcessing = false;
  }

  /**
   * Obtém provider ativo com menor taxa de falha
   */
  private getActiveProvider(): EmailProvider | null {
    const activeProviders = this.providers
      .filter((p) => p.isActive)
      .sort((a, b) => {
        // Ordenar por prioridade e taxa de sucesso
        const aRate = a.successCount / (a.successCount + a.failureCount || 1);
        const bRate = b.successCount / (b.successCount + b.failureCount || 1);

        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }

        return bRate - aRate;
      });

    return activeProviders[0] || null;
  }

  /**
   * Envia email com sistema de fallback
   */
  private async sendEmailInternal(options: SendMailOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    provider?: string;
  }> {
    const from =
      options.from || process.env.EMAIL_FROM || "noreply@fradema.com.br";

    for (const provider of this.providers.filter((p) => p.isActive)) {
      try {
        console.log(`📤 Tentando enviar email via ${provider.name}...`);

        const result = await provider.transporter.sendMail({
          ...options,
          from,
        });

        provider.successCount++;

        return {
          success: true,
          messageId: result.messageId,
          provider: provider.name,
        };
      } catch (error) {
        provider.failureCount++;
        provider.lastFailure = new Date();

        console.error(`❌ Falha no provider ${provider.name}:`, error);

        // Desativar provider se muitas falhas consecutivas
        if (provider.failureCount > 5 && provider.successCount === 0) {
          provider.isActive = false;
          console.warn(
            `⚠️ Provider ${provider.name} desativado após múltiplas falhas`
          );
        }

        // Continuar para próximo provider
        continue;
      }
    }

    return {
      success: false,
      error: "Todos os providers falharam",
    };
  }

  /**
   * Interface pública para envio de email
   */
  public async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    priority?: "high" | "normal" | "low";
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      // Validação básica
      if (!options.to || !options.subject || !options.html) {
        console.error("❌ Email inválido: campos obrigatórios faltando");
        return false;
      }

      // Tentar envio direto primeiro
      const result = await this.sendEmailInternal({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (result.success) {
        console.log(`✅ Email enviado com sucesso via ${result.provider}`);
        return true;
      }

      // Se falhou, adicionar à fila para retry
      const emailId = `email-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      this.emailQueue.set(emailId, {
        id: emailId,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attempts: 0,
        maxAttempts: options.priority === "high" ? 5 : 3,
        createdAt: new Date(),
        metadata: options.metadata,
      });

      console.log(`📥 Email ${emailId} adicionado à fila para retry`);

      // Se alta prioridade, processar imediatamente
      if (options.priority === "high") {
        setTimeout(() => this.processQueue(), 5000);
      }

      return false; // Email na fila, mas não enviado ainda
    } catch (error) {
      console.error("❌ Erro crítico ao processar email:", error);
      return false;
    }
  }

  /**
   * Verifica status do serviço de email
   */
  public getStatus(): {
    isConfigured: boolean;
    activeProviders: number;
    queueSize: number;
    providers: Array<{
      name: string;
      isActive: boolean;
      successRate: number;
      lastFailure?: Date;
    }>;
  } {
    const status = {
      isConfigured: this.providers.length > 0,
      activeProviders: this.providers.filter((p) => p.isActive).length,
      queueSize: this.emailQueue.size,
      providers: this.providers.map((p) => ({
        name: p.name,
        isActive: p.isActive,
        successRate: p.successCount / (p.successCount + p.failureCount || 1),
        lastFailure: p.lastFailure,
      })),
    };

    return status;
  }

  /**
   * Limpa fila de emails
   */
  public clearQueue(): void {
    const size = this.emailQueue.size;
    this.emailQueue.clear();
    console.log(`🗑️ Fila de emails limpa (${size} emails removidos)`);
  }
}

// Singleton do serviço de email
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

// ===== TEMPLATES DE EMAIL =====

/**
 * Template de email de verificação
 */
export function getVerificationEmailTemplate(verificationUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Verificação de Email - Fradema";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #0073e6 0%, #005bb3 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .button {
          display: inline-block;
          background: #0073e6;
          color: white;
          padding: 14px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 600;
          margin: 25px 0;
          transition: background 0.3s;
        }
        .button:hover {
          background: #005bb3;
        }
        .link-text {
          word-break: break-all;
          color: #0073e6;
          font-size: 14px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        @media only screen and (max-width: 600px) {
          body {
            padding: 10px;
          }
          .content {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Fradema Consultoria</h1>
        </div>

        <div class="content">
          <h2>Verificação de Email</h2>

          <p>Olá!</p>

          <p>Obrigado por se cadastrar na Fradema. Para completar o processo de criação da sua conta, precisamos verificar seu endereço de email.</p>

          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verificar Email</a>
          </div>

          <p style="color: #666; font-size: 14px;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
          <p class="link-text">${verificationUrl}</p>

          <div class="warning">
            <strong>⚠️ Importante:</strong> Este link expira em 24 horas por questões de segurança.
          </div>

          <p>Se você não criou uma conta na Fradema, pode ignorar este email com segurança.</p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Fradema Consultoria Tributária</p>
          <p>Este é um email automático, por favor não responda.</p>
          <p style="margin-top: 10px;">
            <a href="${
              process.env.NEXTAUTH_URL
            }" style="color: #0073e6;">Visitar site</a> |
            <a href="${
              process.env.NEXTAUTH_URL
            }/privacy" style="color: #0073e6;">Política de Privacidade</a>
          </p>
        </div>
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

IMPORTANTE: Este link expira em 24 horas por questões de segurança.

Se você não criou uma conta na Fradema, pode ignorar este email com segurança.

Atenciosamente,
Equipe Fradema

© ${new Date().getFullYear()} Fradema Consultoria Tributária
  `;

  return { subject, html, text };
}

/**
 * Template de email de boas-vindas
 */
export function getWelcomeEmailTemplate(name: string): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0];
  const subject = "Bem-vindo à Fradema!";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        /* Mesmo estilo do template anterior */
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #0073e6 0%, #005bb3 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .features {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .feature-item {
          display: flex;
          align-items: start;
          margin-bottom: 15px;
        }
        .feature-icon {
          font-size: 20px;
          margin-right: 15px;
        }
        .button {
          display: inline-block;
          background: #0073e6;
          color: white;
          padding: 14px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 600;
          margin: 25px 0;
          transition: background 0.3s;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bem-vindo à Fradema!</h1>
        </div>

        <div class="content">
          <h2>Olá, ${firstName}! 👋</h2>

          <p>É um prazer tê-lo conosco! Sua conta foi criada com sucesso e você agora tem acesso ao nosso conteúdo exclusivo sobre consultoria tributária.</p>

          <div class="features">
            <h3>O que você pode fazer agora:</h3>
            <div class="feature-item">
              <span class="feature-icon">📚</span>
              <div>
                <strong>Acessar artigos especializados</strong><br>
                Conteúdo exclusivo sobre tributação e legislação fiscal
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💬</span>
              <div>
                <strong>Participar de discussões</strong><br>
                Troque experiências com outros profissionais da área
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📧</span>
              <div>
                <strong>Receber atualizações</strong><br>
                Fique por dentro das mudanças na legislação tributária
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🎯</span>
              <div>
                <strong>Conteúdo personalizado</strong><br>
                Artigos e recursos relevantes para sua área de atuação
              </div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${
              process.env.NEXTAUTH_URL
            }/dashboard" class="button">Acessar Dashboard</a>
          </div>

          <p>Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco através do email <a href="mailto:suporte@fradema.com.br">suporte@fradema.com.br</a>.</p>

          <p>Mais uma vez, seja muito bem-vindo!</p>

          <p>
            Atenciosamente,<br>
            <strong>Equipe Fradema</strong>
          </p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Fradema Consultoria Tributária</p>
          <p>Você está recebendo este email porque se cadastrou em nossa plataforma.</p>
          <p style="margin-top: 10px;">
            <a href="${
              process.env.NEXTAUTH_URL
            }" style="color: #0073e6;">Visitar site</a> |
            <a href="${
              process.env.NEXTAUTH_URL
            }/settings" style="color: #0073e6;">Configurações</a> |
            <a href="${
              process.env.NEXTAUTH_URL
            }/unsubscribe" style="color: #0073e6;">Descadastrar</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bem-vindo à Fradema!

Olá, ${firstName}! 👋

É um prazer tê-lo conosco! Sua conta foi criada com sucesso e você agora tem acesso ao nosso conteúdo exclusivo sobre consultoria tributária.

O que você pode fazer agora:
• Acessar artigos especializados em tributação
• Participar de discussões com outros profissionais
• Receber atualizações sobre mudanças na legislação
• Acessar conteúdo personalizado para sua área

Acesse seu dashboard em: ${process.env.NEXTAUTH_URL}/dashboard

Se você tiver alguma dúvida ou precisar de ajuda, entre em contato através do email suporte@fradema.com.br.

Mais uma vez, seja muito bem-vindo!

Atenciosamente,
Equipe Fradema

© ${new Date().getFullYear()} Fradema Consultoria Tributária
  `;

  return { subject, html, text };
}

// ===== FUNÇÕES AUXILIARES PARA ENVIO =====

/**
 * Envia email de verificação usando o serviço de email
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<boolean> {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  const template = getVerificationEmailTemplate(verificationUrl);

  const emailService = getEmailService();
  return await emailService.sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    priority: "high",
    metadata: { type: "verification", token },
  });
}

/**
 * Envia email de boas-vindas usando o serviço de email
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  const template = getWelcomeEmailTemplate(name);

  const emailService = getEmailService();
  return await emailService.sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    priority: "normal",
    metadata: { type: "welcome" },
  });
}

/**
 * Verifica se o serviço de email está configurado
 */
export function isEmailConfigured(): boolean {
  const emailService = getEmailService();
  const status = emailService.getStatus();
  return status.isConfigured && status.activeProviders > 0;
}
