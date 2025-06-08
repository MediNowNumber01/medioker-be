import cors from "cors";
import express, { json } from "express";
import helmet from "helmet";
import "reflect-metadata";
import { container } from "tsyringe";
import { env } from "./config";
import { errorMiddleware } from "./middleware/error.middleware";
import { AuthRouter } from "./modules/auth/auth.router";
import { CategoryRouter } from "./modules/category/category.router";
import { ProductRouter } from "./modules/product/product.router";

export default class App {
  public app;

  constructor() {
    this.app = express();
    this.configure();
    this.routes();
    this.handleError();
  }

  private configure(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(json());
  }

  private routes(): void {
    const authRouter = container.resolve(AuthRouter);
    const categoryRouter = container.resolve(CategoryRouter);
    const productRouter = container.resolve(ProductRouter);
    this.app.get("/", (_, res) => {
      res.send("Welcome");
    });
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/categories", categoryRouter.getRouter());
    this.app.use("/products", productRouter.getRouter());
  }

  private handleError(): void {
    this.app.use(errorMiddleware);
  }

  public start(): void {
    this.app.listen(env().PORT, () => {
      console.log(`  ➜  [API] Local:   http://localhost:${env().PORT}`);
    });
  }
}
