export type DriverProfilePatch = {
  full_name: string;
  phone: string | null;
  is_active: boolean;
  can_drive?: boolean;
};

export type DriverProfileWrite =
  | {
      ok: true;
      updates: {
        full_name: string;
        phone: string | null;
        is_active?: boolean;
        can_drive?: boolean;
      };
    }
  | { ok: false; error: string };

/**
 * Admins may change is_active and can_drive on someone else's row.
 * The signed-in user may change only their name and phone. The database
 * trigger enforces the same rule; this keeps the driver form's error
 * specific when an admin edits their own roster card.
 */
export function driverProfileUpdate(input: {
  actorId: string;
  targetId: string;
  existingIsActive: boolean;
  existingCanDrive: boolean;
  patch: DriverProfilePatch;
}): DriverProfileWrite {
  const privilegedChanged =
    input.patch.is_active !== input.existingIsActive ||
    (input.patch.can_drive !== undefined &&
      input.patch.can_drive !== input.existingCanDrive);

  if (input.actorId === input.targetId) {
    if (privilegedChanged) {
      return {
        ok: false,
        error:
          "You cannot change your own access. Ask another admin to update driver access or active status.",
      };
    }

    return {
      ok: true,
      updates: {
        full_name: input.patch.full_name,
        phone: input.patch.phone,
      },
    };
  }

  const updates: {
    full_name: string;
    phone: string | null;
    is_active: boolean;
    can_drive?: boolean;
  } = {
    full_name: input.patch.full_name,
    phone: input.patch.phone,
    is_active: input.patch.is_active,
  };

  if (input.patch.can_drive !== undefined) {
    updates.can_drive = input.patch.can_drive;
  }

  return { ok: true, updates };
}
