-- DropIndex
DROP INDEX IF EXISTS "User_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "User"
DROP COLUMN IF EXISTS "currentPeriodEnd",
DROP COLUMN IF EXISTS "plan",
DROP COLUMN IF EXISTS "stripeCustomerId",
DROP COLUMN IF EXISTS "stripeSubscriptionId",
DROP COLUMN IF EXISTS "subscriptionStatus",
DROP COLUMN IF EXISTS "trialEndsAt";

-- DropEnum
DROP TYPE IF EXISTS "Plan";
