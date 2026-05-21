-- Convert legacy string roles ('user'/'admin') into a controlled Prisma enum.
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING (
  CASE lower("role"::text)
    WHEN 'admin' THEN 'ADMIN'
    WHEN 'user' THEN 'USER'
    ELSE 'USER'
  END::"UserRole"
);

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
