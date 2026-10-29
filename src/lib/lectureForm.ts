// Lecture registration form rules (same as the server and the Android app).

export interface MemberProfile {
  firstName: string; lastName: string; gender: string | null; birthYear: number | null; wilaya: string | null;
  maritalStatus: string | null; childrenCount: number | null; occupation: string | null; occupationDetail: string | null;
}

export const GENDERS = ['male', 'female'] as const;
export const MARITAL = ['single', 'married', 'divorced', 'widowed'] as const;
export const OCCUPATIONS = ['university_student', 'pupil', 'worker', 'unemployed', 'retired', 'other'] as const;

/** The 58 wilayas, numbered as in official codes. */
export const WILAYAS = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار', 'البليدة', 'البويرة',
  'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر', 'الجلفة', 'جيجل', 'سطيف', 'سعيدة',
  'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة', 'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة',
  'وهران', 'البيض', 'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تيسمسيلت', 'الوادي', 'خنشلة',
  'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت', 'غرداية', 'غليزان', 'تيميمون', 'برج باجي مختار',
  'أولاد جلال', 'بني عباس', 'عين صالح', 'عين قزام', 'تقرت', 'جانت', 'المغير', 'المنيعة',
].map((n, i) => `${String(i + 1).padStart(2, '0')} - ${n}`);

export const needsDetail = (o: string | null) => o === 'university_student' || o === 'pupil' || o === 'worker' || o === 'other';
const NAME = /^[\p{L}\p{M}' .-]{2,60}$/u;

/** Names of the fields that are missing or invalid (empty when the form can be sent). */
export function missingFields(p: MemberProfile, nowYear = new Date().getFullYear()): string[] {
  const out: string[] = [];
  if (!NAME.test(p.firstName.trim())) out.push('firstName');
  if (!NAME.test(p.lastName.trim())) out.push('lastName');
  if (!p.gender) out.push('gender');
  if (p.birthYear == null || p.birthYear < 1920 || p.birthYear > nowYear - 5) out.push('birthYear');
  if (!p.wilaya) out.push('wilaya');
  if (!p.maritalStatus) out.push('maritalStatus');
  if (p.maritalStatus && p.maritalStatus !== 'single' && p.childrenCount == null) out.push('childrenCount');
  if (!p.occupation) out.push('occupation');
  if (needsDetail(p.occupation) && !p.occupationDetail?.trim()) out.push('occupationDetail');
  return out;
}

/** Payload for the server: children only when married before, detail only when asked. */
export function normalize(p: MemberProfile): MemberProfile {
  return {
    ...p, firstName: p.firstName.trim(), lastName: p.lastName.trim(),
    childrenCount: p.maritalStatus && p.maritalStatus !== 'single' ? p.childrenCount : null,
    occupationDetail: needsDetail(p.occupation) ? p.occupationDetail?.trim() || null : null,
  };
}
