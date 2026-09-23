// Shapes for the fields our wrappers read/write. Not full Zoho record
// shapes (those have 40+ standard fields we never touch) — see
// docs/ZOHO_FIELDS.md for which of these are standard vs. custom-created.

export interface ZohoContact {
  id: string;
  Phone?: string;
  Email?: string;
  Full_Name?: string;
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email: string;
  city: string;
  vehicleModel: string;
  source?: string;
}

export interface ZohoLead {
  id: string;
  Last_Name: string;
  First_Name?: string;
  Phone: string;
  Email: string;
  City: string;
  Vehicle_Model: string; // custom field
}

// Originally a custom "Closed Won - Booking Done" stage per the brief's
// wording, but that requires manually adding a new Sales Stage value in
// Zoho (Setup -> Sales Stages, with its own Probability %) before it'll
// even save correctly — a fresh org silently falls back to a default
// stage if you write an unrecognized picklist value via the API, which is
// exactly what happened during testing. Using the standard "Closed Won"
// stage instead works with zero Zoho configuration required.
export const BOOKING_STAGE = "Closed Won";

export interface ZohoDeal {
  id: string;
  Deal_Name: string;
  Stage: string;
  Contact_Name?: { id: string; name?: string };
  Follow_Up_Preference?: string; // custom field
  VIN?: string; // custom field
  Allocation_Stage?: "In Transit" | "Dispatch Pending" | "Delivered" | string; // custom field
  Payment_Link?: string; // custom field
  Booking_Id?: string; // custom field
}

export interface DealSearchParams {
  phone?: string;
  dealId?: string;
}

export interface BookingSearchParams {
  phone?: string;
  bookingId?: string; // the human-readable Booking_Id field, e.g. "BK-2024-00123" — NOT Zoho's internal record id
}

export interface DealFollowUpUpdate {
  followUpPreference: string;
}

export interface CreateCaseInput {
  contactId?: string;
  phone?: string;
  registrationNumber: string;
  odometerReading: number;
  issueType: string;
  preferredServiceCenter: string;
}

export interface ZohoCase {
  id: string;
  Subject: string;
  Contact_Name?: { id: string; name?: string };
  Registration_Number: string; // custom field
  Odometer_Reading: number; // custom field
  Issue_Type: string; // custom field
  Preferred_Service_Center: string; // custom field
  Status: string;
}
