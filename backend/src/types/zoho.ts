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

export const BOOKING_STAGE = "Closed Won - Booking Done";

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
