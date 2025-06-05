import { injectable } from "tsyringe";
import { ProductService } from "./product.service";

@injectable()
export class ProductController {
  constructor(private readonly productService: ProductService) {}
}
