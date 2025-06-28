import { AdminRole, PrismaClient, Provider, Role } from "@prisma/client";
// Diasumsikan Anda memiliki service untuk hashing password
// Jika tidak, Anda bisa menggunakan contoh hash di bawah.
import { PasswordService } from "../../../src/modules/auth/password.service";

export const accountsSeed = async (prisma: PrismaClient) => {
  // Inisialisasi service password
  const passwordService = new PasswordService();

  // Hash satu password untuk digunakan oleh semua user seed
  // Di aplikasi nyata, setiap user akan memiliki password yang berbeda
  const hashedPassword = await passwordService.hashPassword("Admin123.");

  const accountsToCreate: any = [];

  for (let i = 21; i <= 25; i++) {
    accountsToCreate.push({
      id: `seed-user-${i}`, // Menggunakan ID yang bisa diprediksi untuk kemudahan testing
      fullName: `User ${i}`,
      email: `user${i}@example.com`,
      password: hashedPassword,
      role: Role.USER,
      provider: Provider.CREDENTIAL,
      isVerified: i % 2 === 0, // Membuat setengah user terverifikasi, setengah tidak
      profilePict: `https://api.dicebear.com/8.x/initials/svg?seed=User%20${i}`, // Avatar placeholder
    });
  }

  // Menggunakan createMany untuk efisiensi
  await prisma.account.createMany({
    data: accountsToCreate,
    skipDuplicates: true, // Lewati jika ada data dengan email/id yang sama
  });

  console.log("Accounts seeded successfully.");

  // Setelah membuat akun, buat juga entri di tabel User yang berelasi
  console.log("Creating corresponding User entries...");
  for (const accountData of accountsToCreate) {
    const existingUser = await prisma.user.findUnique({
      where: { accountId: accountData.id },
    });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          accountId: accountData.id,
          createdAt: new Date(2025, 4, 31),
        },
      });
    }
  }

  console.log("User entries created successfully.");
};
