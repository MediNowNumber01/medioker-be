import { plainToInstance } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { CategoryService } from "./category.service";
import { CreateCategoryDTO } from "./dto/create-category.dto";
import { ApiError } from "../../utils/api-error";
import { GetCategoriesDTO } from "./dto/get-categories.dto";

@injectable()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  public createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as CreateCategoryDTO;
      const result = await this.categoryService.createCategory(body);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
  public getCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const result = await this.categoryService.getCategory(id);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
  public getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = plainToInstance(GetCategoriesDTO, req.query);
      const result = await this.categoryService.getCategories(query);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
  public updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as CreateCategoryDTO;
      const id = req.params.id;
      const result = await this.categoryService.updateCategory(id, body);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
  public deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ApiError("Category ID is required", 400);
      }
      const result = await this.categoryService.deleteCategory(id);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
}
