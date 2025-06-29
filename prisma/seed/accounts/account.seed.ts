import { AdminRole, PrismaClient, Provider, Role } from "@prisma/client";

import { PasswordService } from "../../../src/modules/auth/password.service";

export const accountsSeed = async (prisma: PrismaClient) => {
  const passwordService = new PasswordService();

  const hashedPassword = await passwordService.hashPassword("Admin123.");

  const accountsToCreate: any = [];

  for (let i = 21; i <= 25; i++) {
    accountsToCreate.push({
      id: `seed-user-${i}`,
      fullName: `User ${i}`,
      email: `user${i}@example.com`,
      password: hashedPassword,
      role: Role.USER,
      provider: Provider.CREDENTIAL,
      isVerified: i % 2 === 0,
      profilePict: `https://api.dicebear.com/8.x/initials/svg?seed=User%20${i}`,
    });
  }

  await prisma.account.createMany({
    data: accountsToCreate,
    skipDuplicates: true,
  });

  console.log("Accounts seeded successfully.");

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
