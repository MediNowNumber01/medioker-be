import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { CategoryController } from "./category.controller";
import { env } from "../../config";
import { verifyRole } from "../../middleware/role.middleware";
import { StrictValidateBody } from "../../middleware/validation.middleware";
import { CreateCategoryDTO } from "./dto/create-category.dto";
import { UpdateCategoryDTO } from "./dto/update-category.dto";
import { GetCategoriesDTO } from "./dto/get-categories.dto";

@autoInjectable()
export class CategoryRouter {
  private readonly router: Router = Router();

  constructor(
    private readonly jwtMiddleware: JwtMiddleware,
    private readonly categoryController: CategoryController,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes = (): void => {
    this.router.post(
      "/",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      StrictValidateBody(CreateCategoryDTO),
      this.categoryController.createCategory,
    );
    this.router.get("/:id", this.categoryController.getCategory);
    this.router.get(
      "/",
      StrictValidateBody(GetCategoriesDTO),
      this.categoryController.getCategories,
    );
    this.router.put(
      "/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      StrictValidateBody(UpdateCategoryDTO),
      this.categoryController.updateCategory,
    );
    this.router.delete(
      "/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.categoryController.deleteCategory,
    );
  };

  getRouter(): Router {
    return this.router;
  }
}
