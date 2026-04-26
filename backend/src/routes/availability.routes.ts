import { Router } from "express";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { availabilityController } from "../controllers/availability.controller";
import { Routes } from "../interfaces/route.interface";
import { Role } from "../constants/roles";
import {
  createSlotsSchema,
  listSlotsQuerySchema,
  slotIdParamSchema,
  updateSlotSchema,
} from "../validators/availability.validation";
import { therapistIdParamSchema } from "../validators/therapist.validation";

export default class AvailabilityRoutes implements Routes {
  public path = "/api/v1";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Therapist self
    this.router.post(
      "/availability",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate(createSlotsSchema),
      AsyncUtils.wrap(availabilityController.createSlots.bind(availabilityController)),
    );

    this.router.get(
      "/availability/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate(listSlotsQuerySchema),
      AsyncUtils.wrap(availabilityController.listOwnSlots.bind(availabilityController)),
    );

    this.router.patch(
      "/availability/:slotId",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate(slotIdParamSchema),
      ValidationMiddleware.validate(updateSlotSchema),
      AsyncUtils.wrap(availabilityController.updateSlot.bind(availabilityController)),
    );

    this.router.delete(
      "/availability/:slotId",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate(slotIdParamSchema),
      AsyncUtils.wrap(availabilityController.deleteSlot.bind(availabilityController)),
    );

    // Public availability for a given therapist
    this.router.get(
      "/therapists/:therapistId/availability",
      ValidationMiddleware.validate(therapistIdParamSchema),
      ValidationMiddleware.validate(listSlotsQuerySchema),
      AsyncUtils.wrap(availabilityController.listForTherapist.bind(availabilityController)),
    );
  }
}
