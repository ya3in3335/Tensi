import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError } from './api';

export type Lang = 'ar' | 'fr';

const ar = {
  appName: 'التنسيقية', home: 'الرئيسية', news: 'الأخبار', activities: 'النشاطات', polls: 'التصويت', volunteer: 'التطوع', account: 'حسابي',
  lectures: 'المحاضرات', gallery: 'المعرض', donations: 'التبرعات', about: 'من نحن', notifications: 'الإشعارات', myActivities: 'نشاطاتي',
  login: 'تسجيل الدخول', register: 'إنشاء حساب', logout: 'تسجيل الخروج', save: 'حفظ', cancel: 'إلغاء', confirm: 'تأكيد', retry: 'إعادة المحاولة',
  seeAll: 'عرض الكل', loading: 'جارٍ التحميل…', empty: 'لا يوجد محتوى حالياً', back: 'رجوع', close: 'إغلاق', language: 'Français',
  welcome: 'مرحباً بك', welcomeUser: 'مرحباً، {name}', heroText: 'تابع أخبار الجمعية وشارك في نشاطاتها وتصويتاتها ومحاضراتها.',
  announcements: 'إعلانات', latestNews: 'آخر الأخبار', upcomingActivities: 'النشاطات القادمة', activePolls: 'تصويتات جارية', latestMedia: 'من المعرض',
  donateTitle: 'ساهم في عمل الخير', donateBody: 'تبرعك يصنع الفرق. اطّلع على طرق التبرع.', donateCta: 'طرق التبرع',
  catAll: 'الكل', catNews: 'أخبار', catAnnouncement: 'إعلانات', catCampaign: 'حملات', catReport: 'تقارير', search: 'بحث…', loadMore: 'المزيد',
  upcoming: 'القادمة', ongoing: 'الجارية', completed: 'المنتهية', past: 'السابقة', active: 'الجارية', closed: 'المنتهية', cancelled: 'ملغى',
  seats: 'المقاعد: {n} / {max}', registeredN: 'المسجلون: {n}', campaign: 'حملة', location: 'المكان', starts: 'البداية', ends: 'النهاية',
  registerActivity: 'التسجيل في النشاط', cancelRegistration: 'إلغاء التسجيل', youAreRegistered: 'أنت مسجّل ✓', attended: 'حضرت ✓', registrationClosed: 'التسجيل مغلق',
  needLogin: 'سجّل الدخول للمشاركة', pollEnds: 'ينتهي في {d}', anonymous: 'تصويت سري', membersOnly: 'للأعضاء المعنيين فقط',
  vote: 'تأكيد التصويت', pickOption: 'اختر أحد الخيارات ثم اضغط «تأكيد التصويت»', voteConfirmTitle: 'تأكيد التصويت', voteConfirmBody: 'ستصوّت لـ «{o}». لا يمكن تغيير التصويت بعد التأكيد.',
  voted: 'تم تسجيل صوتك ✓', alreadyVoted: 'لقد صوّتّ في هذا التصويت', receipt: 'رقم الإيصال: {r}', totalVotes: 'مجموع الأصوات: {n}',
  resultsHidden: 'تظهر النتائج بعد انتهاء التصويت', resultsAdmins: 'النتائج متاحة للمشرفين فقط', needVerifyPhone: 'يجب تأكيد رقم هاتفك عبر تيليغرام للتصويت',
  notEligible: 'حسابك غير مؤهل لهذا التصويت', notMember: 'هذا التصويت خاص بأعضاء محددين',
  speaker: 'المحاضِر: {s}', lectureRegister: 'التسجيل في المحاضرة', editAnswers: 'تعديل معلوماتي', needVerifyContact: 'للتسجيل يجب تأكيد بريدك الإلكتروني أو رقم هاتفك أولاً.',
  verifyEmail: 'تأكيد البريد', verifyPhone: 'تأكيد الهاتف', formTitle: 'استمارة التسجيل', firstName: 'الاسم', lastName: 'اللقب', phoneAuto: 'رقم الهاتف (من حسابك)',
  gender: 'الجنس', male: 'ذكر', female: 'أنثى', birthYear: 'سنة الميلاد', wilaya: 'الولاية', chooseWilaya: 'اختر الولاية', marital: 'الحالة العائلية',
  single: 'أعزب / عزباء', married: 'متزوج(ة)', divorced: 'مطلّق(ة)', widowed: 'أرمل(ة)', children: 'عدد الأطفال', occupation: 'الوضعية المهنية / الدراسية',
  occ_university_student: 'طالب جامعي', occ_pupil: 'متمدرس (تلميذ)', occ_worker: 'عامل / موظف', occ_unemployed: 'بدون عمل', occ_retired: 'متقاعد', occ_other: 'أخرى',
  detail_university_student: 'التخصص والجامعة', detail_pupil: 'المستوى الدراسي (مثلاً: الثالثة ثانوي)', detail_worker: 'المهنة', detail_other: 'وضّح',
  note: 'ملاحظة أو سؤال للمحاضِر (اختياري)', submitRegistration: 'تأكيد التسجيل', fillThese: 'يرجى إكمال أو تصحيح: {f}',
  privacy: 'تُستعمل هذه المعلومات لتنظيم المحاضرة فقط، ولا يطّلع عليها إلا المشرفون.', kind_lecture: 'محاضرة', kind_meeting: 'اجتماع', kind_training: 'دورة تكوينية',
  identifier: 'البريد الإلكتروني أو رقم الهاتف', password: 'كلمة المرور', forgot: 'نسيت كلمة المرور؟', noAccount: 'ليس لديك حساب؟ أنشئ حساباً', haveAccount: 'لديك حساب؟ سجّل الدخول',
  fullName: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'رقم الهاتف (05/06/07…)', confirmPassword: 'تأكيد كلمة المرور', passwordHint: '8 أحرف على الأقل، تحتوي حروفاً وأرقاماً',
  resetTitle: 'استرجاع كلمة المرور', sendCode: 'إرسال الرمز', code: 'الرمز (6 أرقام)', newPassword: 'كلمة المرور الجديدة', resetSent: 'إن كان الحساب موجوداً، وصلك رمز عبر تيليغرام أو البريد.', resetDone: 'تم تغيير كلمة المرور، يمكنك الدخول الآن.',
  emailTitle: 'تأكيد البريد الإلكتروني', emailSending: 'جارٍ إرسال رمز التأكيد…', emailSent: 'أرسلنا رمزاً من 6 أرقام إلى:', resend: 'إعادة إرسال الرمز', resendIn: 'إعادة الإرسال بعد {s} ثانية', spamHint: 'لم تجد الرسالة؟ تحقّق من مجلد الرسائل غير المرغوب فيها (Spam).',
  phoneTitle: 'تأكيد رقم الهاتف', phoneIntro: 'نؤكد رقمك عبر بوت تيليغرام: افتح البوت، اضغط «ابدأ» ثم «مشاركة رقم هاتفي». يجب أن يكون حساب تيليغرام على نفس الرقم.',
  openTelegram: 'فتح تيليغرام', waitingTelegram: 'بانتظار التأكيد من تيليغرام…', phoneVerified: 'تم تأكيد رقم هاتفك ✓', verifyFailed: 'لم يتم التأكيد: {r}', startAgain: 'إعادة المحاولة',
  emailNotVerified: 'البريد الإلكتروني غير مؤكد', phoneNotVerified: 'رقم الهاتف غير مؤكد', verified: 'مؤكد ✓', profile: 'الملف الشخصي', settings: 'الإعدادات',
  changePassword: 'تغيير كلمة المرور', currentPassword: 'كلمة المرور الحالية', deleteAccount: 'حذف الحساب', deleteConfirm: 'سيُحذف حسابك وكل معلوماتك نهائياً. أدخل كلمة المرور للتأكيد.', done: 'تم ✓',
  volunteerTitle: 'انضم إلى المتطوعين', volunteerIntro: 'ساهم بوقتك ومهاراتك في نشاطات الجمعية.', contact: 'وسيلة التواصل', skills: 'المهارات', availability: 'أوقات التوفر', preferredAreas: 'المجالات المفضلة (اختياري)', experience: 'خبرات سابقة (اختياري)',
  apply: 'إرسال الطلب', withdraw: 'سحب الطلب', status_pending: 'قيد المراجعة', status_approved: 'مقبول ✓', status_rejected: 'مرفوض', assignments: 'مهامك',
  photos: 'صور', videos: 'فيديو', ccp: 'الحساب البريدي (CCP)', bank: 'الحساب البنكي', holder: 'باسم', key: 'المفتاح', copy: 'نسخ', copied: 'تم النسخ', campaigns: 'حملات جارية', noDonation: 'لم تُنشر معلومات التبرع بعد.',
  aboutEmpty: 'سيتم نشر معلومات الجمعية قريباً.', contactUs: 'اتصل بنا', offline: 'لا يوجد اتصال — تحقّق من الإنترنت', notFound: 'الصفحة غير موجودة', getApp: 'حمّل تطبيق أندرويد',
  err_network: 'تعذّر الاتصال بالخادم. تحقّق من اتصالك بالإنترنت.', err_invalid_credentials: 'بيانات الدخول غير صحيحة', err_account_locked: 'الحساب مقفل مؤقتاً بعد محاولات كثيرة',
  err_email_taken: 'هذا البريد مسجّل مسبقاً', err_phone_taken: 'هذا الرقم مسجّل مسبقاً', err_invalid_phone: 'رقم الهاتف غير صالح', err_password_mismatch: 'كلمتا المرور غير متطابقتين',
  err_password_weak: 'كلمة المرور ضعيفة (8 أحرف على الأقل مع حروف وأرقام)', err_invalid_code: 'الرمز غير صحيح أو منتهي الصلاحية', err_already_voted: 'لقد صوّتّ مسبقاً',
  err_poll_not_active: 'التصويت غير مفتوح', err_activity_full: 'اكتمل العدد', err_lecture_full: 'اكتمل العدد، لا توجد مقاعد شاغرة', err_registration_closed: 'التسجيل مغلق',
  err_rate_limited: 'محاولات كثيرة، انتظر قليلاً', err_validation_failed: 'يرجى التحقق من الحقول', err_contact_not_verified: 'أكّد بريدك أو هاتفك أولاً', err_email_delivery_failed: 'تعذّر إرسال الرسالة إلى بريدك',
  err_unknown: 'حدث خطأ غير متوقع', err_unauthorized: 'انتهت الجلسة، سجّل الدخول من جديد', err_not_found: 'غير موجود', err_already_registered: 'أنت مسجّل مسبقاً',
};

type Dict = typeof ar;
const fr: Dict = {
  appName: 'La Coordination', home: 'Accueil', news: 'Actualités', activities: 'Activités', polls: 'Votes', volunteer: 'Bénévolat', account: 'Compte',
  lectures: 'Conférences', gallery: 'Galerie', donations: 'Dons', about: 'À propos', notifications: 'Notifications', myActivities: 'Mes activités',
  login: 'Connexion', register: 'Créer un compte', logout: 'Déconnexion', save: 'Enregistrer', cancel: 'Annuler', confirm: 'Confirmer', retry: 'Réessayer',
  seeAll: 'Tout voir', loading: 'Chargement…', empty: 'Aucun contenu pour le moment', back: 'Retour', close: 'Fermer', language: 'العربية',
  welcome: 'Bienvenue', welcomeUser: 'Bonjour, {name}', heroText: 'Suivez l’association et participez à ses activités, votes et conférences.',
  announcements: 'Annonces', latestNews: 'Dernières actualités', upcomingActivities: 'Activités à venir', activePolls: 'Votes en cours', latestMedia: 'Galerie',
  donateTitle: 'Contribuez au bien', donateBody: 'Votre don fait la différence. Découvrez comment donner.', donateCta: 'Faire un don',
  catAll: 'Tout', catNews: 'Actualités', catAnnouncement: 'Annonces', catCampaign: 'Campagnes', catReport: 'Rapports', search: 'Rechercher…', loadMore: 'Plus',
  upcoming: 'À venir', ongoing: 'En cours', completed: 'Terminées', past: 'Passées', active: 'En cours', closed: 'Terminés', cancelled: 'Annulé',
  seats: 'Places : {n} / {max}', registeredN: 'Inscrits : {n}', campaign: 'Campagne', location: 'Lieu', starts: 'Début', ends: 'Fin',
  registerActivity: 'S’inscrire', cancelRegistration: 'Annuler l’inscription', youAreRegistered: 'Vous êtes inscrit ✓', attended: 'Présent ✓', registrationClosed: 'Inscriptions fermées',
  needLogin: 'Connectez-vous pour participer', pollEnds: 'Se termine le {d}', anonymous: 'Vote secret', membersOnly: 'Réservé aux membres concernés',
  vote: 'Confirmer mon vote', pickOption: 'Choisissez une option puis « Confirmer mon vote »', voteConfirmTitle: 'Confirmer le vote', voteConfirmBody: 'Vous votez pour « {o} ». Le vote ne peut pas être modifié.',
  voted: 'Vote enregistré ✓', alreadyVoted: 'Vous avez déjà voté', receipt: 'Reçu : {r}', totalVotes: 'Total des votes : {n}',
  resultsHidden: 'Résultats visibles après la clôture', resultsAdmins: 'Résultats réservés aux responsables', needVerifyPhone: 'Vérifiez votre téléphone via Telegram pour voter',
  notEligible: 'Votre compte n’est pas éligible', notMember: 'Vote réservé à des membres désignés',
  speaker: 'Intervenant : {s}', lectureRegister: 'S’inscrire', editAnswers: 'Modifier mes informations', needVerifyContact: 'Pour vous inscrire, vérifiez d’abord votre e-mail ou votre téléphone.',
  verifyEmail: 'Vérifier l’e-mail', verifyPhone: 'Vérifier le téléphone', formTitle: 'Formulaire d’inscription', firstName: 'Prénom', lastName: 'Nom', phoneAuto: 'Téléphone (de votre compte)',
  gender: 'Sexe', male: 'Homme', female: 'Femme', birthYear: 'Année de naissance', wilaya: 'Wilaya', chooseWilaya: 'Choisir la wilaya', marital: 'Situation familiale',
  single: 'Célibataire', married: 'Marié(e)', divorced: 'Divorcé(e)', widowed: 'Veuf / veuve', children: 'Nombre d’enfants', occupation: 'Situation professionnelle / scolaire',
  occ_university_student: 'Étudiant(e)', occ_pupil: 'Élève', occ_worker: 'Salarié(e)', occ_unemployed: 'Sans emploi', occ_retired: 'Retraité(e)', occ_other: 'Autre',
  detail_university_student: 'Spécialité et université', detail_pupil: 'Niveau scolaire', detail_worker: 'Profession', detail_other: 'Précisez',
  note: 'Remarque ou question (facultatif)', submitRegistration: 'Confirmer l’inscription', fillThese: 'Veuillez compléter : {f}',
  privacy: 'Ces informations servent uniquement à organiser la séance.', kind_lecture: 'Conférence', kind_meeting: 'Réunion', kind_training: 'Formation',
  identifier: 'E-mail ou téléphone', password: 'Mot de passe', forgot: 'Mot de passe oublié ?', noAccount: 'Pas de compte ? Inscrivez-vous', haveAccount: 'Déjà inscrit ? Connexion',
  fullName: 'Nom complet', email: 'E-mail', phone: 'Téléphone (05/06/07…)', confirmPassword: 'Confirmer le mot de passe', passwordHint: '8 caractères minimum, lettres et chiffres',
  resetTitle: 'Mot de passe oublié', sendCode: 'Envoyer le code', code: 'Code (6 chiffres)', newPassword: 'Nouveau mot de passe', resetSent: 'Si le compte existe, un code a été envoyé (Telegram ou e-mail).', resetDone: 'Mot de passe modifié. Vous pouvez vous connecter.',
  emailTitle: 'Vérification de l’e-mail', emailSending: 'Envoi du code…', emailSent: 'Code à 6 chiffres envoyé à :', resend: 'Renvoyer le code', resendIn: 'Renvoyer dans {s} s', spamHint: 'Message introuvable ? Vérifiez les spams.',
  phoneTitle: 'Vérification du téléphone', phoneIntro: 'La vérification se fait via notre bot Telegram : ouvrez-le, appuyez sur « Démarrer » puis « Partager mon numéro ». Le compte Telegram doit utiliser le même numéro.',
  openTelegram: 'Ouvrir Telegram', waitingTelegram: 'En attente de la confirmation Telegram…', phoneVerified: 'Téléphone vérifié ✓', verifyFailed: 'Échec : {r}', startAgain: 'Recommencer',
  emailNotVerified: 'E-mail non vérifié', phoneNotVerified: 'Téléphone non vérifié', verified: 'Vérifié ✓', profile: 'Profil', settings: 'Paramètres',
  changePassword: 'Changer le mot de passe', currentPassword: 'Mot de passe actuel', deleteAccount: 'Supprimer le compte', deleteConfirm: 'Votre compte sera supprimé définitivement. Saisissez votre mot de passe.', done: 'Fait ✓',
  volunteerTitle: 'Devenir bénévole', volunteerIntro: 'Offrez votre temps et vos compétences.', contact: 'Moyen de contact', skills: 'Compétences', availability: 'Disponibilités', preferredAreas: 'Domaines préférés (facultatif)', experience: 'Expérience (facultatif)',
  apply: 'Envoyer', withdraw: 'Retirer ma demande', status_pending: 'En cours d’examen', status_approved: 'Acceptée ✓', status_rejected: 'Refusée', assignments: 'Vos missions',
  photos: 'Photos', videos: 'Vidéos', ccp: 'Compte CCP', bank: 'Compte bancaire', holder: 'Titulaire', key: 'Clé', copy: 'Copier', copied: 'Copié', campaigns: 'Campagnes en cours', noDonation: 'Informations de don pas encore publiées.',
  aboutEmpty: 'Les informations seront publiées prochainement.', contactUs: 'Contact', offline: 'Hors ligne — vérifiez votre connexion', notFound: 'Page introuvable', getApp: 'Application Android',
  err_network: 'Serveur injoignable. Vérifiez votre connexion.', err_invalid_credentials: 'Identifiants incorrects', err_account_locked: 'Compte temporairement verrouillé',
  err_email_taken: 'E-mail déjà utilisé', err_phone_taken: 'Numéro déjà utilisé', err_invalid_phone: 'Numéro invalide', err_password_mismatch: 'Les mots de passe ne correspondent pas',
  err_password_weak: 'Mot de passe trop faible', err_invalid_code: 'Code incorrect ou expiré', err_already_voted: 'Vous avez déjà voté',
  err_poll_not_active: 'Vote non ouvert', err_activity_full: 'Complet', err_lecture_full: 'Complet, plus de places', err_registration_closed: 'Inscriptions fermées',
  err_rate_limited: 'Trop de tentatives, patientez', err_validation_failed: 'Vérifiez les champs', err_contact_not_verified: 'Vérifiez d’abord votre e-mail ou téléphone', err_email_delivery_failed: 'Échec de l’envoi de l’e-mail',
  err_unknown: 'Erreur inattendue', err_unauthorized: 'Session expirée, reconnectez-vous', err_not_found: 'Introuvable', err_already_registered: 'Déjà inscrit',
};

export type Key = keyof Dict;
const DICTS: Record<Lang, Dict> = { ar, fr };

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key, vars?: Record<string, string | number>) => string }>(null as never);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => { try { return localStorage.getItem('lang') === 'fr' ? 'fr' : 'ar'; } catch { return 'ar'; } });
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem('lang', l); } catch { /* private mode */ } };
  const t = (k: Key, vars?: Record<string, string | number>) => {
    let s: string = DICTS[lang][k] ?? ar[k] ?? k;
    if (vars) for (const [n, v] of Object.entries(vars)) s = s.replace(`{${n}}`, String(v));
    return s;
  };
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

/** Picks the French text when the site is in French and one exists. */
export function useLoc() {
  const { lang } = useI18n();
  return (arText: string | null | undefined, frText?: string | null) => (lang === 'fr' && frText ? frText : arText ?? '');
}

export function useErr() {
  const { t } = useI18n();
  return (e: unknown) => {
    if (!(e instanceof ApiError)) return t('err_unknown');
    const code = e.code === 'account_exists' ? 'email_taken'
      : ['password_too_short', 'password_too_weak', 'password_too_common', 'password_too_long'].includes(e.code) ? 'password_weak' : e.code;
    const key = `err_${code}` as Key;
    return key in ar ? t(key) : e.status === 401 ? t('err_unauthorized') : `${t('err_unknown')} (${e.code})`;
  };
}

const ALGIERS = 'Africa/Algiers';
export function useDates() {
  const { lang } = useI18n();
  const loc = lang === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-DZ';
  return {
    dateTime: (ms: number) => new Intl.DateTimeFormat(loc, { dateStyle: 'medium', timeStyle: 'short', timeZone: ALGIERS }).format(ms),
    date: (ms: number) => new Intl.DateTimeFormat(loc, { dateStyle: 'medium', timeZone: ALGIERS }).format(ms),
    time: (ms: number) => new Intl.DateTimeFormat(loc, { timeStyle: 'short', timeZone: ALGIERS }).format(ms),
    day: (ms: number) => new Intl.DateTimeFormat(loc, { day: 'numeric', timeZone: ALGIERS }).format(ms),
    month: (ms: number) => new Intl.DateTimeFormat(loc, { month: 'short', timeZone: ALGIERS }).format(ms),
  };
}
