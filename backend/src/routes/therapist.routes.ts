import { Router } from "express";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { UploadMiddleware } from "../middlewares/upload";
import { therapistController } from "../controllers/therapist.controller";
import { Routes } from "../interfaces/route.interface";
import { Role } from "../constants/roles";
import {
  createTherapistProfileSchema,
  documentIdParamSchema,
  therapistIdParamSchema,
  therapistSearchQuerySchema,
  updateTherapistProfileSchema,
  uploadDocumentSchema,
} from "../validators/therapist.validation";

export default class TherapistRoutes implements Routes {
  public path = "/api/v1/therapists";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public discovery & search
    this.router.get(
      "/",
      ValidationMiddleware.validate(therapistSearchQuerySchema),
      AsyncUtils.wrap(therapistController.search.bind(therapistController)),
    );

    // Therapist self profile
    this.router.post(
      "/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate(createTherapistProfileSchema),
      AsyncUtils.wrap(therapistController.createOwnProfile.bind(therapistController)),
    );

    this.router.get(
      "/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      AsyncUtils.wrap(therapistController.getOwnProfile.bind(therapistController)),
    );

    this.router.patch(
      "/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate(updateTherapistProfileSchema),
      AsyncUtils.wrap(therapistController.updateOwnProfile.bind(therapistController)),
    );

    // Documents
    this.router.post(
      "/me/documents",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate(uploadDocumentSchema),
      AsyncUtils.wrap(therapistController.uploadDocument.bind(therapistController)),
    );

    // Direct multipart upload (uploads to Cloudinary then stores metadata)
    this.router.post(
      "/me/documents/upload",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      UploadMiddleware.single("file"),
      AsyncUtils.wrap(
        therapistController.uploadDocumentMultipart.bind(therapistController),
      ),
    );

    this.router.get(
      "/me/documents",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      AsyncUtils.wrap(therapistController.listOwnDocuments.bind(therapistController)),
    );

    this.router.delete(
      "/me/documents/:documentId",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(documentIdParamSchema),
      AsyncUtils.wrap(therapistController.deleteDocument.bind(therapistController)),
    );

    // Public profile by id (must be after /me routes)
    this.router.get(
      "/:therapistId",
      ValidationMiddleware.validate(therapistIdParamSchema),
      AsyncUtils.wrap(therapistController.getPublicProfile.bind(therapistController)),
    );
  }
}
