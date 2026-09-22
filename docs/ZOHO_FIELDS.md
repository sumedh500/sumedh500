# Zoho CRM Field Mapping

Every field the backend reads or writes, and whether it's a standard Zoho
field or one you need to create. If your org already has different API
names for any of these, change them in the `services/zoho/*Service.ts`
files (they're the only place these strings appear) rather than renaming
fields in Zoho to match this doc.

## Leads module

| Field (API name) | Type | Standard or custom |
|---|---|---|
| `Last_Name` | Single Line | Standard (mandatory) |
| `First_Name` | Single Line | Standard |
| `Phone` | Phone | Standard |
| `Email` | Email | Standard |
| `City` | Single Line | Standard |
| `Vehicle_Model` | Single Line or Picklist | **Custom — create this** |
| `Lead_Source` | Picklist | Standard (add value "Chat Agent" or reuse an existing value) |

## Contacts module (supporting — not one of the 4 stages directly, but Deals/Cases link through it)

| Field (API name) | Type | Standard or custom |
|---|---|---|
| `Last_Name`, `First_Name`, `Phone`, `Email` | — | Standard |

## Deals (Potentials) module

| Field (API name) | Type | Standard or custom |
|---|---|---|
| `Deal_Name` | Single Line | Standard (mandatory) |
| `Stage` | Picklist | Standard — must include the value `Closed Won - Booking Done` in Setup → Sales Stages |
| `Contact_Name` | Lookup → Contacts | Standard |
| `Follow_Up_Preference` | Picklist (e.g. Call / WhatsApp / Email) | **Custom — create this** |
| `VIN` | Single Line | **Custom — create this** |
| `Allocation_Stage` | Picklist (In Transit / Dispatch Pending / Delivered) | **Custom — create this** |
| `Payment_Link` | URL | **Custom — create this** |
| `Booking_Id` | Single Line, unique | **Custom — create this** |

A "Deal" is both the Ongoing Pipeline record and the Booked Vehicle record
— the only difference is `Stage`. `searchDeal` returns whatever's found;
`searchBooking` additionally filters to `Stage === "Closed Won - Booking Done"`.

## Cases module

| Field (API name) | Type | Standard or custom |
|---|---|---|
| `Subject` | Single Line | Standard (mandatory) |
| `Contact_Name` | Lookup → Contacts | Standard |
| `Status` | Picklist | Standard |
| `Registration_Number` | Single Line | **Custom — create this** |
| `Odometer_Reading` | Number | **Custom — create this** |
| `Issue_Type` | Picklist | **Custom — create this** |
| `Preferred_Service_Center` | Picklist or Single Line | **Custom — create this** |

## Setting these up

In Zoho CRM: Setup → Customization → Modules and Fields → pick the module
→ drag the relevant field type onto the layout → set its **API name**
exactly as above (Zoho auto-generates one from the label, which usually
matches if you name the field the same way, but always verify under the
field's "..." → Edit Properties → API Name before wiring the code to it).
