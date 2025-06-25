import { PrismaClient } from "@prisma/client";

export const productCategoriesSeed = async (prisma: PrismaClient) => {
  const startNumber = 31;
  const endNumber = 70;
  const data = await prisma.$transaction(async (tx) => {
    const categories = await tx.category.findMany({
      select: { id: true },
    });
    console.log("Categories:", categories);
    await Promise.all(
      Array.from({ length: endNumber - startNumber + 1 }, (_, idx) => {
        const i = startNumber + idx;
        const selectedCategories = categories.slice(0, i % 6);
        return tx.productCategory.createMany({
          data: selectedCategories.map((category) => ({
            productId: `${i}`,
            categoryId: category.id,
          })),
        });
      }),
    );
    return "Products injected successfully";
  });

  console.log("Product Categories Seeded:", data);
};
