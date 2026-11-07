import type {
  CreditScoreRange,
  CurrentHousing,
  EmployerType,
  EmploymentStatus,
  EnrollmentStatus,
  HousingArrangement,
  IncomeSourceType,
  InstitutionType,
  MaritalStatus,
  MemberRole,
  MilitaryStatus,
  OccupationCategory,
  ParkingPreference,
  PropertyType,
} from "./types";

export interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export const MARITAL_STATUS_OPTIONS: Option<MaritalStatus>[] = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "domestic_partnership", label: "Domestic partnership" },
  { value: "divorced", label: "Divorced" },
  { value: "separated", label: "Separated" },
  { value: "widowed", label: "Widowed" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const EMPLOYMENT_STATUS_OPTIONS: Option<EmploymentStatus>[] = [
  { value: "full_time", label: "Full-time employee" },
  { value: "part_time", label: "Part-time employee" },
  { value: "self_employed", label: "Self-employed" },
  { value: "independent_contractor", label: "Independent contractor" },
  { value: "student", label: "Student" },
  { value: "working_student", label: "Working student" },
  { value: "unemployed", label: "Not currently working" },
  { value: "retired", label: "Retired" },
  { value: "unable_to_work", label: "Unable to work", description: "Optional. Share only if you want to." },
  { value: "active_duty", label: "Active-duty military" },
  { value: "veteran", label: "Military veteran" },
  { value: "other", label: "Other" },
];

export const OCCUPATION_OPTIONS: Option<OccupationCategory>[] = [
  { value: "teacher_educator", label: "Teacher or educator" },
  { value: "healthcare", label: "Healthcare" },
  { value: "public_sector", label: "Public-sector employee" },
  { value: "government", label: "Government employee" },
  { value: "first_responder", label: "First responder" },
  { value: "police", label: "Police officer" },
  { value: "firefighter", label: "Firefighter" },
  { value: "military", label: "Military personnel" },
  { value: "veteran", label: "Veteran" },
  { value: "nonprofit", label: "Nonprofit employee" },
  { value: "university_employee", label: "University or college employee" },
  { value: "other", label: "Other occupation" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const EMPLOYER_TYPE_OPTIONS: Option<EmployerType>[] = [
  { value: "private", label: "Private company" },
  { value: "public", label: "Public agency" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "university", label: "College or university" },
  { value: "self", label: "My own business" },
  { value: "other", label: "Other" },
];

export const INSTITUTION_OPTIONS: Option<InstitutionType>[] = [
  { value: "community_college", label: "Community college" },
  { value: "public_university", label: "Public university" },
  { value: "private_university", label: "Private university" },
  { value: "graduate_school", label: "Graduate school" },
  { value: "vocational", label: "Vocational or trade school" },
  { value: "other", label: "Other" },
  { value: "none", label: "Not in school" },
];

export const ENROLLMENT_OPTIONS: Option<EnrollmentStatus>[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "recently_graduated", label: "Recently graduated" },
  { value: "not_enrolled", label: "Not currently enrolled" },
];

export const CURRENT_HOUSING_OPTIONS: Option<CurrentHousing>[] = [
  { value: "renting", label: "Renting" },
  { value: "with_family", label: "Living with family" },
  { value: "with_friends_roommates", label: "Living with friends or roommates" },
  { value: "owns_home", label: "Own a home" },
  { value: "temporary", label: "Temporary housing" },
  { value: "other", label: "Other" },
];

export const PROPERTY_TYPE_OPTIONS: Option<PropertyType>[] = [
  { value: "single_family", label: "Single-family home" },
  { value: "condo", label: "Condominium" },
  { value: "townhouse", label: "Townhouse" },
  { value: "duplex", label: "Duplex" },
  { value: "multifamily", label: "Multifamily" },
  { value: "manufactured", label: "Manufactured home" },
  { value: "other", label: "Other" },
];

export const ARRANGEMENT_OPTIONS: Option<HousingArrangement>[] = [
  { value: "primary_residence", label: "Primary residence", description: "You will live there." },
  {
    value: "house_hacking",
    label: "House hacking",
    description: "Live in one unit and rent the others.",
  },
  {
    value: "owner_occupied_multifamily",
    label: "Owner-occupied multifamily",
    description: "Live in one unit of a small building.",
  },
  { value: "multigenerational", label: "Multigenerational", description: "Share with extended family." },
  { value: "co_purchase", label: "Co-purchase", description: "Buy with family or another buyer." },
];

export const MILITARY_OPTIONS: Option<MilitaryStatus>[] = [
  { value: "none", label: "Not military-affiliated" },
  { value: "active_duty", label: "Active duty" },
  { value: "veteran", label: "Veteran" },
  { value: "national_guard_reserve", label: "National Guard or Reserve" },
  { value: "surviving_spouse", label: "Surviving spouse of a veteran" },
  { value: "other", label: "Other military affiliation" },
];

export const CREDIT_RANGE_OPTIONS: Option<CreditScoreRange>[] = [
  { value: "below_580", label: "Below 580" },
  { value: "580_619", label: "580–619" },
  { value: "620_659", label: "620–659" },
  { value: "660_699", label: "660–699" },
  { value: "700_739", label: "700–739" },
  { value: "740_799", label: "740–799" },
  { value: "800_plus", label: "800+" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const INCOME_SOURCE_OPTIONS: Option<IncomeSourceType>[] = [
  { value: "employment", label: "Employment (W-2)" },
  { value: "self_employment", label: "Self-employment" },
  { value: "social_security", label: "Social Security" },
  { value: "pension", label: "Pension" },
  { value: "disability", label: "Disability benefits" },
  { value: "child_support", label: "Child support" },
  { value: "investment", label: "Investment income" },
  { value: "rental", label: "Rental income" },
  { value: "other", label: "Other" },
];

export const MEMBER_ROLE_OPTIONS: Option<MemberRole>[] = [
  { value: "buyer", label: "Buyer" },
  { value: "co_buyer", label: "Co-buyer" },
  { value: "spouse_partner", label: "Spouse or partner" },
  { value: "dependent", label: "Dependent" },
  { value: "other_adult", label: "Other adult" },
];

export const PARKING_OPTIONS: Option<ParkingPreference>[] = [
  { value: "any", label: "No preference" },
  { value: "garage", label: "Garage" },
  { value: "driveway", label: "Driveway" },
  { value: "street", label: "Street parking is fine" },
  { value: "none", label: "Do not need parking" },
];

export const ACCESSIBILITY_OPTIONS: Option<string>[] = [
  { value: "step_free", label: "Step-free entry" },
  { value: "single_story", label: "Single story" },
  { value: "wide_doorways", label: "Wide doorways" },
  { value: "elevator", label: "Elevator" },
  { value: "grab_bars", label: "Grab bars" },
];

export function labelOf<T extends string>(options: Option<T>[], value: T | undefined | null): string {
  if (!value) return "Not answered";
  return options.find((option) => option.value === value)?.label ?? value;
}
