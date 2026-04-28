import { Assessment } from "../entities/Assessment";

describe("Assessment entity", () => {
  describe("PHQ9", () => {
    it("scores all-zeros as MINIMAL with no crisis flag", () => {
      const a = Assessment.create({
        clientId: "00000000-0000-0000-0000-000000000001",
        type: "PHQ9",
        responses: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      });
      expect(a.score).toBe(0);
      expect(a.severity).toBe("MINIMAL");
      expect(a.crisisFlag).toBe(false);
    });

    it("scores 11 as MODERATE", () => {
      const a = Assessment.create({
        clientId: "00000000-0000-0000-0000-000000000001",
        type: "PHQ9",
        responses: [2, 2, 1, 1, 1, 1, 1, 1, 1],
      });
      // 2+2+1+1+1+1+1+1+1 = 11, but Q9=1 triggers crisis flag
      expect(a.score).toBe(11);
      expect(a.severity).toBe("MODERATE");
      expect(a.crisisFlag).toBe(true);
    });

    it("scores 25 as SEVERE with crisis flag", () => {
      const a = Assessment.create({
        clientId: "00000000-0000-0000-0000-000000000001",
        type: "PHQ9",
        responses: [3, 3, 3, 3, 3, 3, 3, 3, 1],
      });
      expect(a.score).toBe(25);
      expect(a.severity).toBe("SEVERE");
      expect(a.crisisFlag).toBe(true);
    });

    it("rejects wrong response count", () => {
      expect(() =>
        Assessment.create({
          clientId: "00000000-0000-0000-0000-000000000001",
          type: "PHQ9",
          responses: [0, 0, 0],
        }),
      ).toThrow();
    });

    it("rejects out-of-range response values", () => {
      expect(() =>
        Assessment.create({
          clientId: "00000000-0000-0000-0000-000000000001",
          type: "PHQ9",
          responses: [0, 0, 0, 0, 0, 0, 0, 0, 4],
        }),
      ).toThrow();
    });
  });

  describe("GAD7", () => {
    it("scores 4 as MINIMAL", () => {
      const a = Assessment.create({
        clientId: "00000000-0000-0000-0000-000000000001",
        type: "GAD7",
        responses: [1, 1, 1, 1, 0, 0, 0],
      });
      expect(a.score).toBe(4);
      expect(a.severity).toBe("MINIMAL");
      expect(a.crisisFlag).toBe(false);
    });

    it("scores 21 as SEVERE with crisis flag", () => {
      const a = Assessment.create({
        clientId: "00000000-0000-0000-0000-000000000001",
        type: "GAD7",
        responses: [3, 3, 3, 3, 3, 3, 3],
      });
      expect(a.score).toBe(21);
      expect(a.severity).toBe("SEVERE");
      expect(a.crisisFlag).toBe(true);
    });
  });
});
