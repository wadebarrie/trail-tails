import { phonesMatch } from "@/lib/phone";

export type CustomerContact = {
  phone: string;
  ownerName: string;
};

export type CustomerContactFields = {
  owner_name: string;
  phone: string;
  secondary_owner_name: string | null;
  secondary_phone: string | null;
};

/** Primary + optional secondary contact for SMS and inbound matching. */
export function listCustomerContacts(
  customer: CustomerContactFields
): CustomerContact[] {
  const contacts: CustomerContact[] = [];

  if (customer.phone?.trim()) {
    contacts.push({
      phone: customer.phone.trim(),
      ownerName: customer.owner_name,
    });
  }

  const secondaryPhone = customer.secondary_phone?.trim();
  const secondaryName = customer.secondary_owner_name?.trim();
  if (secondaryPhone && secondaryName) {
    contacts.push({ phone: secondaryPhone, ownerName: secondaryName });
  }

  return contacts;
}

export function customerHasPhone(
  customer: CustomerContactFields,
  fromNumber: string
): boolean {
  return listCustomerContacts(customer).some((c) =>
    phonesMatch(c.phone, fromNumber)
  );
}
