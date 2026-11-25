export type ProvisionedRole = "admin" | "driver";

export type ProfileProvisioningInput = {
  companyId: string;
  role: ProvisionedRole;
  fullName: string;
  /** Defaults to true for admins and false for drivers. */
  canDrive?: boolean;
};

/**
 * Claims that decide which company and role a new profile gets.
 * app_metadata is writable only by the service role. The same claims are
 * copied into user_metadata so profile creation still works if this build
 * is deployed before `handle_new_user` is migrated. After that migration
 * the user_metadata copy is ignored.
 */
export type ProfileProvisioningMetadata = {
  app_metadata: {
    company_id: string;
    role: ProvisionedRole;
    can_drive: boolean;
  };
  user_metadata: {
    full_name: string;
    company_id: string;
    role: ProvisionedRole;
    can_drive: boolean;
  };
};

export function profileProvisioningMetadata(
  input: ProfileProvisioningInput
): ProfileProvisioningMetadata {
  const canDrive = input.canDrive ?? input.role === "admin";
  const claims = {
    company_id: input.companyId,
    role: input.role,
    can_drive: canDrive,
  };

  return {
    app_metadata: { ...claims },
    user_metadata: {
      full_name: input.fullName,
      ...claims,
    },
  };
}
