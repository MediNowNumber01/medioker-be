import { Acquisition, Golongan, PrismaClient } from "@prisma/client";
import { generateSlug } from "../../../src/utils/generate-slug";

export const ProductInfoSeed = async (prisma: PrismaClient) => {
  const startNumber = 31;
  const endNumber = 70;
  const data = await prisma.$transaction(async (tx) => {
    const acquisitionz: Acquisition[] = ["GENERIK", "HERBAL", "NON_GENERIK"];
    await Promise.all(
      Array.from({ length: endNumber - startNumber + 1 }, (_, idx) => {
        const i = startNumber + idx;
        const slug = generateSlug(`Product ${i + 1}`);
        const golongan: Golongan =
          i <= 50 ? "OBAT_KERAS" : i <= 100 ? "OBAT_BEBAS" : "OBAT_TERBATAS";
        return tx.product.create({
          data: {
            id: `${i}`,
            name: `Product ${i + 1}`,
            nameMIMS: `Product MIMS ${i + 1}`,
            slug,
            description: `Description for Product ${i + 1}`,
            published: true,
            golongan: golongan,
            acquisition: acquisitionz[idx % acquisitionz.length],
            needsPrescription: true,
            brand: `Brand ${i + 1}`,
            nomorEdar: `NE-${i + 1}`,
            dose: `Dose ${i + 1}`,
            composition: `Composition ${i + 1}`,
            sideEffects: `Side Effects ${i + 1}`,
            indication: `Indication ${i + 1} lorem   ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
          },
        });
      }),
    );
    return " injected successfully";
  });
  console.log("Product Info Seeded:", data);
};
