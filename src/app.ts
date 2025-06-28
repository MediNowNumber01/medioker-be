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
import { PharmacyRouter } from "./modules/pharmacy/pharmacy.router";
import { AdminRouter } from "./modules/admins/admin.router";
import { PrescriptionRouter } from "./modules/prescription/prescription.router";
import { AddressRouter } from "./modules/address/address.router";
import { GeocodingRouter } from "./modules/geocoding/geocoding.router";
import { AccountRouter } from "./modules/account/account.router";

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
    const pharmacyRouter = container.resolve(PharmacyRouter);// Resolve the pharmacy router
    const adminRouter = container.resolve(AdminRouter); // Resolve the admin router
    const prescriptionsRouter = container.resolve(PrescriptionRouter);
    const addressRouter = container.resolve(AddressRouter);
    const accountRouter = container.resolve(AccountRouter)
    const geocodingRouter = container.resolve(GeocodingRouter);

    this.app.get("/", (_, res) => {
      res.send("Welcome home");
    });
    this.app.use("/accounts", accountRouter.getRouter());
    this.app.use("/addresses", addressRouter.getRouter());
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/categories", categoryRouter.getRouter());
    this.app.use("/prescriptions", prescriptionsRouter.getRouter());
    this.app.use("/products", productRouter.getRouter());
    this.app.use("/pharmacies", pharmacyRouter.getRouter());
    this.app.use("/admins", adminRouter.getRouter());
    this.app.use("/geocoding", geocodingRouter.getRouter());
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
