import { submitAssessmentSchema } from "../validators/assessment.validation";
import { createTreatmentPlanSchema } from "../validators/treatmentPlan.validation";
import { createPrescriptionSchema } from "../validators/prescription.validation";
import { createRatingSchema } from "../validators/rating.validation";
import { raiseComplaintSchema } from "../validators/complaint.validation";
import { sendNotificationSchema } from "../validators/notification.validation";

describe("clinical validation schemas", () => {
  it("accepts a valid assessment payload", async () => {
    const parsed = await submitAssessmentSchema.body.parseAsync({
      responses: {
        mood: 4,
        anxiety: 3,
        sleep: 2,
      },
    });

    expect(parsed.responses).toBeDefined();
  });

  it("accepts valid treatment plan payload", async () => {
    const parsed = await createTreatmentPlanSchema.body.parseAsync({
      clientId: "11111111-1111-4111-8111-111111111111",
      assessmentId: "22222222-2222-4222-8222-222222222222",
      goals: "Reduce anxiety and improve sleep quality over six weeks.",
      milestones: [
        { title: "Complete breathing practice daily", progress: 20 },
      ],
      startDate: new Date().toISOString(),
    });

    expect(parsed.milestones.length).toBe(1);
  });

  it("rejects empty medications in prescription payload", async () => {
    await expect(
      createPrescriptionSchema.body.parseAsync({
        clientId: "33333333-3333-4333-8333-333333333333",
        medications: {},
        instructions: "Take regularly.",
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid rating score", async () => {
    await expect(
      createRatingSchema.body.parseAsync({
        sessionId: "44444444-4444-4444-8444-444444444444",
        score: 10,
      }),
    ).rejects.toThrow();
  });

  it("accepts valid complaint payload", async () => {
    const parsed = await raiseComplaintSchema.body.parseAsync({
      againstId: "55555555-5555-4555-8555-555555555555",
      description: "Therapist missed multiple sessions without notice.",
    });

    expect(parsed.description).toContain("missed");
  });

  it("accepts valid custom notification payload", async () => {
    const parsed = await sendNotificationSchema.body.parseAsync({
      userIds: ["66666666-6666-4666-8666-666666666666"],
      type: "PAYMENT_UPDATE",
      channels: ["PUSH", "EMAIL"],
      title: "Payment processed",
      message: "Your subscription payment was processed.",
    });

    expect(parsed.channels).toHaveLength(2);
  });
});
