import { Account, Role, User } from "@prisma/client";

export const mockUserData = ({
  numberOfUsers = 10,
}: {
  numberOfUsers: number;
}): Account[] => {
  const users = new Array(numberOfUsers).fill(null).map((_, index) => {
    const userNumber = index + 1;

    return {
      id: userNumber,
      fullName: "fullName" + userNumber,
      email: "Email" + userNumber + "@mail.com",
      password: "Password" + userNumber,
      role: Role.USER,
      isVerified: true,
      profilePict: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  return users;
};
