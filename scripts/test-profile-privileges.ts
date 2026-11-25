import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { profileProvisioningMetadata } from "@/features/auth/profile-provisioning";
import { driverProfileUpdate } from "@/features/drivers/profile-update";

type Case = { name: string; pass: boolean };

function assert(name: string, condition: boolean): Case {
  return { name, pass: condition };
}

const migration = readFileSync(
  resolve(
    "supabase/migrations/20261125120000_profile_privileged_columns.sql"
  ),
  "utf8"
);

const admin = profileProvisioningMetadata({
  companyId: "company-1",
  role: "admin",
  fullName: "Ada Admin",
});
const driver = profileProvisioningMetadata({
  companyId: "company-1",
  role: "driver",
  fullName: "Dee Driver",
  canDrive: true,
});
const officeOnly = profileProvisioningMetadata({
  companyId: "company-2",
  role: "admin",
  fullName: "Office Only",
  canDrive: false,
});

const selfName = driverProfileUpdate({
  actorId: "admin-1",
  targetId: "admin-1",
  existingIsActive: true,
  existingCanDrive: true,
  patch: {
    full_name: "Ada Admin",
    phone: "6045550100",
    is_active: true,
    can_drive: true,
  },
});

const selfDemote = driverProfileUpdate({
  actorId: "admin-1",
  targetId: "admin-1",
  existingIsActive: true,
  existingCanDrive: true,
  patch: {
    full_name: "Ada Admin",
    phone: null,
    is_active: false,
    can_drive: false,
  },
});

const otherDriver = driverProfileUpdate({
  actorId: "admin-1",
  targetId: "driver-1",
  existingIsActive: true,
  existingCanDrive: false,
  patch: {
    full_name: "Dee Driver",
    phone: null,
    is_active: false,
  },
});

const otherAdmin = driverProfileUpdate({
  actorId: "admin-1",
  targetId: "admin-2",
  existingIsActive: true,
  existingCanDrive: true,
  patch: {
    full_name: "Other Admin",
    phone: null,
    is_active: true,
    can_drive: false,
  },
});

const callerFiles = [
  "src/features/drivers/actions.ts",
  "src/features/onboarding/self-signup.server.ts",
  "src/features/platform/actions.ts",
  "scripts/seed-test-users.mjs",
  "scripts/seed-demo-company.mjs",
];

const cases: Case[] = [
  assert(
    "admin app_metadata carries company, role, and default can_drive",
    admin.app_metadata.company_id === "company-1" &&
      admin.app_metadata.role === "admin" &&
      admin.app_metadata.can_drive === true
  ),
  assert(
    "driver can_drive can be set explicitly",
    driver.app_metadata.role === "driver" && driver.app_metadata.can_drive === true
  ),
  assert(
    "admin can_drive can be turned off",
    officeOnly.app_metadata.can_drive === false
  ),
  assert(
    "display name stays in user_metadata",
    admin.user_metadata.full_name === "Ada Admin" &&
      !("full_name" in admin.app_metadata)
  ),
  assert(
    "privileged claims are mirrored for the pre-migration trigger",
    admin.user_metadata.company_id === admin.app_metadata.company_id &&
      admin.user_metadata.role === admin.app_metadata.role &&
      admin.user_metadata.can_drive === admin.app_metadata.can_drive
  ),
  assert(
    "app_metadata and user_metadata are separate objects",
    admin.app_metadata !== admin.user_metadata
  ),
  assert(
    "saving your own name does not write access flags",
    selfName.ok === true &&
      selfName.ok &&
      selfName.updates.full_name === "Ada Admin" &&
      selfName.updates.phone === "6045550100" &&
      !("is_active" in selfName.updates) &&
      !("can_drive" in selfName.updates)
  ),
  assert(
    "you cannot change your own active or driver flag",
    selfDemote.ok === false
  ),
  assert(
    "an admin can deactivate another driver",
    otherDriver.ok === true &&
      otherDriver.ok &&
      otherDriver.updates.is_active === false &&
      !("can_drive" in otherDriver.updates)
  ),
  assert(
    "an admin can change another admin's driver flag",
    otherAdmin.ok === true &&
      otherAdmin.ok &&
      otherAdmin.updates.can_drive === false &&
      otherAdmin.updates.is_active === true
  ),
  assert(
    "migration reads company and role from app metadata",
    migration.includes("raw_app_meta_data ->> 'company_id'") &&
      migration.includes("raw_app_meta_data ->> 'role'")
  ),
  assert(
    "migration does not trust user metadata for privileged claims",
    !migration.includes("raw_user_meta_data ->> 'company_id'") &&
      !migration.includes("raw_user_meta_data ->> 'role'") &&
      !migration.includes("raw_user_meta_data ->> 'can_drive'")
  ),
  assert(
    "migration still copies the display name from user metadata",
    migration.includes("raw_user_meta_data ->> 'full_name'")
  ),
  assert(
    "migration is idempotent",
    migration.includes("CREATE OR REPLACE FUNCTION public.handle_new_user()") &&
      migration.includes(
        "CREATE OR REPLACE FUNCTION public.enforce_profile_column_privileges()"
      ) &&
      migration.includes(
        "DROP TRIGGER IF EXISTS profiles_enforce_column_privileges"
      ) &&
      migration.includes("DROP TRIGGER IF EXISTS on_auth_user_app_metadata") &&
      migration.includes("DROP TRIGGER IF EXISTS on_auth_user_created")
  ),
  assert(
    "end users lose table-level update and keep harmless columns",
    migration.includes(
      "REVOKE UPDATE ON TABLE public.profiles FROM anon, authenticated, authenticator"
    ) &&
      migration.includes(
        "GRANT UPDATE (full_name, phone, role, can_drive, is_active)"
      )
  ),
  assert(
    "own-row access changes and platform-owner changes are rejected",
    migration.includes(
      "cannot change role, can_drive, or is_active on your own profile"
    ) &&
      migration.includes(
        "only the service role can change is_platform_owner or company_id"
      )
  ),
  ...callerFiles.map((file) =>
    assert(
      `${file} sets app_metadata`,
      readFileSync(resolve(file), "utf8").includes("app_metadata")
    )
  ),
  assert(
    "server actions share the provisioning helper",
    ["src/features/drivers/actions.ts", "src/features/onboarding/self-signup.server.ts", "src/features/platform/actions.ts"].every(
      (file) => readFileSync(resolve(file), "utf8").includes("profileProvisioningMetadata")
    )
  ),
  assert(
    "checklist tells operators to disable public signup",
    readFileSync(resolve("docs/production-deployment-checklist.md"), "utf8").includes(
      "Supabase → Auth → Allow new users to sign up = OFF"
    )
  ),
];

const failed = cases.filter((c) => !c.pass);
if (failed.length > 0) {
  console.error("Profile privilege tests failed:");
  for (const c of failed) console.error(`  ✗ ${c.name}`);
  process.exit(1);
}

console.log(`All ${cases.length} profile privilege tests passed.`);
