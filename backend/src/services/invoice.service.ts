import PDFDocument from "pdfkit";
import { Payment } from "../entities/Payment";
import { UploadService, uploadService } from "./upload.service";

export interface InvoiceContext {
  payment: Payment;
  client: { name: string; email: string };
  therapist: { name: string };
  session: { id: string; scheduledAt: Date; type: string };
}

export class InvoiceService {
  constructor(private readonly uploads: UploadService = uploadService) {}

  public async generateAndStore(ctx: InvoiceContext): Promise<{ url: string; publicId: string }> {
    const buffer = await this.renderPdf(ctx);
    const result = await this.uploads.uploadBuffer(buffer, {
      category: "misc",
      ownerId: ctx.payment.clientId,
      filename: `invoice-${ctx.payment.id}.pdf`,
      contentType: "application/pdf",
      resourceType: "raw",
    });
    return { url: result.url, publicId: result.publicId };
  }

  private renderPdf(ctx: InvoiceContext): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const chunks: Buffer[] = [];
        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Header
        doc.fontSize(22).text("Zenora", { align: "left" });
        doc.fontSize(10).fillColor("#666").text("Mental healthcare platform");
        doc.moveDown();

        doc.fillColor("#000").fontSize(18).text("Invoice", { align: "right" });
        doc
          .fontSize(10)
          .fillColor("#444")
          .text(`Invoice #: ${ctx.payment.id.substring(0, 8).toUpperCase()}`, { align: "right" })
          .text(`Date: ${(ctx.payment.paidAt ?? ctx.payment.createdAt).toISOString().slice(0, 10)}`, {
            align: "right",
          });

        doc.moveDown(2);

        // Bill to
        doc.fillColor("#000").fontSize(12).text("Billed to:", { underline: false });
        doc.fontSize(11).fillColor("#222").text(ctx.client.name).text(ctx.client.email);

        doc.moveDown();

        // Line items
        doc.fillColor("#000").fontSize(12).text("Service");
        doc
          .fontSize(11)
          .fillColor("#222")
          .text(`Therapy session with ${ctx.therapist.name}`)
          .text(`Type: ${ctx.session.type}`)
          .text(`Scheduled: ${ctx.session.scheduledAt.toISOString()}`);

        doc.moveDown(2);

        // Totals
        const total = ctx.payment.amount.toFixed(2);
        const refunded = ctx.payment.refundedAmount.toFixed(2);
        const net = (ctx.payment.amount - ctx.payment.refundedAmount).toFixed(2);

        doc.fontSize(12).fillColor("#000");
        doc.text(`Amount: ${ctx.payment.currency.toUpperCase()} ${total}`, { align: "right" });
        if (ctx.payment.refundedAmount > 0) {
          doc.text(`Refunded: ${ctx.payment.currency.toUpperCase()} ${refunded}`, {
            align: "right",
          });
        }
        doc.fontSize(14).text(`Net: ${ctx.payment.currency.toUpperCase()} ${net}`, {
          align: "right",
        });

        doc.moveDown(2);
        doc
          .fontSize(9)
          .fillColor("#999")
          .text(
            `Status: ${ctx.payment.status} • Method: ${ctx.payment.method}`,
            { align: "center" },
          );

        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }
}

export const invoiceService = new InvoiceService();
