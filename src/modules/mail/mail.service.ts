import fs from "fs/promises";
import handlebars from "handlebars";
import nodemailer, { Transporter } from "nodemailer";
import path from "path";
import { env } from "../../config";

export class MailService {
  private transporter: Transporter;
  private templatesDir: string;

  constructor() {
    const isTestEnv = process.env.NODE_ENV === "test";

    this.transporter = nodemailer.createTransport(
      isTestEnv
        ? {
            host: "localhost",
            port: 1025,
            secure: false,
          }
        : {
            service: "gmail",
            auth: {
              user: env().MAIL_USER,
              pass: env().MAIL_PASSWORD,
            },
          },
    );

    this.templatesDir = path.resolve(__dirname, "./templates");
  }

  private async renderTemplate(
    templateName: string,
    context: object,
  ): Promise<string> {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

    const templateSource = await fs.readFile(templatePath, "utf-8");

    const compiledTemplate = handlebars.compile(templateSource);

    return compiledTemplate(context);
  }

  public async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    context: object,
  ): Promise<void> {
    try {
      const html = await this.renderTemplate(templateName, context);

      const mailOptions = {
        from: `"Medinow - Your Trusted Pharmacy" <${env().MAIL_USER}>`,
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw "Error sending email";
    }
  }
}
