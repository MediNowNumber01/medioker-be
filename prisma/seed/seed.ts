import { PrismaClient } from "@prisma/client";
import { productSeed } from "./products/products.seed";
import { productStocksSeed } from "./products/productStock.seed";
import { productCategoriesSeed } from "./products/productCategory.seed";
import { categoriesSeed } from "./category/category.seed";
import { ProductUnitsSeed } from "./products/productUnit.seed";
import { pharmaciesSeed } from "./pharmacy/pharmacy.seed";
import { accountsSeed } from "./accounts/account.seed";
const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");
  // await productSeed(prisma);
  // await productStocksSeed(prisma);
  // await categoriesSeed(prisma);
  // await productCategoriesSeed(prisma);
  // await ProductUnitsSeed(prisma);
  await accountsSeed(prisma);
  // await pharmaciesSeed(prisma);
  console.log("Seeding finished.");
}

// Execute the main function and handle errors
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Ensure the Prisma Client disconnects
    await prisma.$disconnect();
  });
