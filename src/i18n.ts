// Hindi strings need review by a native speaker before release

import { Category } from './types';

export type Language = 'en' | 'hi';

export interface Translations {
  appName: string;
  appSubtitle: string;
  tagline: string;
  
  // Tabs
  navScan: string;
  navSites: string;
  navLearn: string;
  navMe: string;

  // Scan Home
  takePhoto: string;
  chooseFromGallery: string;
  typeItemName: string;
  recentScanHint: string;
  sanitaryPhotoHint: string;
  pickFromList: string;
  searchPlaceholder: string;
  searchingRules: string;
  noLocalMatch: string;
  askAi: string;
  offlineNotice: string;
  offlineSearchOnly: string;
  cameraUnavailable: string;
  switchCamera: string;
  closeCamera: string;
  capturePhoto: string;

  // Confidence & Verification
  confidence: string;
  confidenceHelp: string;
  confHigh: string;
  confMed: string;
  confLow: string;
  whichLooksRight: string;
  couldAlsoBe: string;
  overriddenNote: string;
  
  // Results
  putIn: string;
  howToDispose: string;
  whyThisCategory: string;
  couldAlsoBeTitle: string;
  moreAboutRoute: string;
  wasThisRight: string;
  yes: string;
  noCorrectIt: string;
  notWasteTitle: string;
  notWasteDesc: string;
  retakePhoto: string;
  analyzingImage: string;
  analyzingText: string;
  cannotReadResult: string;
  pickCategoryManually: string;
  quotaLimitReached: string;
  aiBusyError: string;
  tryAgain: string;
  incompleteAnswer: string;
  hazardHigh: string;
  hazardLow: string;
  reuseDonateFirstStep: string;

  // Correct Sheet
  correctTitle: string;
  selectCorrectCategory: string;
  moreCategories: string;
  fewerCategories: string;
  optionalItemName: string;
  optionalNote: string;
  saveCorrection: string;
  savedToast: string;
  undo: string;
  conflictWarningTitle: string;
  conflictWarningBody: (expected: string) => string;
  saveAnyway: string;
  cancel: string;

  // History & Settings (Me)
  tabHistory: string;
  tabAccuracy: string;
  tabSettings: string;
  historyEmpty: string;
  historyTitle: string;
  settingsTitle: string;
  languageLabel: string;
  modelScanLabel: string;
  modelSmartLabel: string;
  saveThumbnailsLabel: string;
  shareWithCommunityLabel: string;
  shareWithCommunityDesc: string;
  siteVerifiedBadge: string;
  siteAddedByUserBadge: string;
  siteReportProblem: string;
  siteProblemReported: string;
  siteAlreadyReported: string;
  siteAlreadyConfirmed: string;
  siteConfirmedToast: string;
  siteHiddenNotice: string;
  aiRequestsToday: (count: number) => string;
  exportData: string;
  exportJson: string;
  exportCsv: string;
  importDataset: string;
  importData: string;
  clearData: string;
  clearDataConfirm: string;
  aboutTitle: string;
  aboutLegal: string;
  disclaimerText: string;
  campusNotice: string;

  // Accuracy Screen
  accuracyTitle: string;
  accuracyTotalScans: string;
  accuracyShareConfirmed: string;
  accuracyConfidenceBands: string;
  accuracyCalibrationNote: string;
  accuracyCalibrationPending: (count: number) => string;
  accuracyBandHigh: (pct: number, n: number) => string;
  accuracyBandMed: (pct: number, n: number) => string;
  accuracyBandLow: (pct: number, n: number) => string;
  accuracyTopConfusions: string;
  accuracyNoConfusions: string;

  // Tutor Chat (Learn)
  tutorTitle: string;
  tutorSubtitle: string;
  tutorPlaceholder: string;
  tutorDisclaimer: string;
  tutorQuickPrompts: string;
  tutorPrompt1: string;
  tutorPrompt2: string;
  tutorPrompt3: string;
  tutorPrompt4: string;
  tutorQuotaReached: string;
  tutorOfflineNotice: string;
  tutorAskBtn: string;
  tutorThinking: string;

  // First Run Onboarding
  welcomeTitle: string;
  welcomeSubtitle: string;
  privacyNoticeTitle: string;
  privacyNoticeBody: string;
  privacyNoticeBullet1: string;
  privacyNoticeBullet2: string;
  privacyNoticeBullet3: string;
  dontShowAgain: string;
  getStarted: string;
  continueBtn: string;

  // Sites & Navigation
  nearestDropOff: string;
  nearestDropOffPrefix: string;
  noDropOffForCategory: (cat: string) => string;
  addSite: string;
  filterAll: string;
  viewList: string;
  viewMap: string;
  useMyLocation: string;
  locationDenied: string;
  distanceApprox: (meters: number) => string;
  walkingTime: (mins: number) => string;
  directions: string;
  approximateLabel: string;
  confirmCorrect: string;
  confirmedCount: (count: number) => string;
  reportProblem: string;
  reportedThanks: string;
  imStandingHere: string;
  pinnedSuccess: string;
  sourceSeed: string;
  sourceUser: string;
  noSitesMatchFilter: string;
  emptyCategoryHeading: (cat: string) => string;
  emptyCategoryExplanation: string;
  campusContactsTitle: string;
  addNumber: string;
  saveContactNumber: string;
  enterPhone: string;
  outsideMapWarning: string;
  searchSitesPlaceholder: string;

  // Add Site Form
  addSiteTitle: string;
  siteNameLabel: string;
  siteTypeLabel: string;
  siteTypeOptions: Record<string, string>;
  acceptedCategoriesLabel: string;
  locationLabel: string;
  tapMapInstruction: string;
  addressLabel: string;
  phoneLabel: string;
  hoursLabel: string;
  notesLabel: string;
  localDeviceOnlyNotice: string;
  submitSiteBtn: string;
  fillRequiredFields: string;

  // Placeholder screens
  comingSoonTitle: string;
  comingSoonDesc: string;

  // Categories
  categories: Record<Category, {
    label: string;
    binName: string;
    basis: string;
    routeHint: string;
  }>;
}

export const i18n: Record<Language, Translations> = {
  en: {
    appName: 'Bin Saathi',
    appSubtitle: 'IIT Roorkee Waste Guide',
    tagline: 'Under India\'s Solid Waste Management Rules, 2026',

    navScan: 'Scan',
    navSites: 'Sites',
    navLearn: 'Learn',
    navMe: 'Me',

    takePhoto: 'Take a photo',
    chooseFromGallery: 'Choose from gallery',
    typeItemName: 'Type the item name',
    recentScanHint: 'Point your camera at food, wrappers, electronics, or campus waste.',
    sanitaryPhotoHint: 'Prefer not to take a photo? Pick it from the list',
    pickFromList: 'Pick from list',
    searchPlaceholder: 'Search item (e.g. battery, peels, paper)...',
    searchingRules: 'Checking rules database...',
    noLocalMatch: 'No direct local match found.',
    askAi: 'Ask AI',
    offlineNotice: 'Offline Mode: Local database active.',
    offlineSearchOnly: 'Photo & AI scans require network. You can still search by name or choose a category.',
    cameraUnavailable: "Camera isn't available here. You can upload a photo instead.",
    switchCamera: 'Switch camera',
    closeCamera: 'Close camera',
    capturePhoto: 'Capture photo',

    confidence: 'Confidence',
    confidenceHelp: 'This is the AI\'s own estimate, not a guarantee.',
    confHigh: 'High',
    confMed: 'Medium',
    confLow: 'Low',
    whichLooksRight: 'Which one looks right?',
    couldAlsoBe: 'Could also be {category}. Check before binning.',
    overriddenNote: 'Validated & adjusted by statutory SWM Rules 2026 table.',

    putIn: 'Put it in:',
    howToDispose: 'How to dispose',
    whyThisCategory: 'Why this category',
    couldAlsoBeTitle: 'Could also be',
    moreAboutRoute: 'More about this route',
    wasThisRight: 'Was this right?',
    yes: 'Yes',
    noCorrectIt: 'No, correct it',
    notWasteTitle: 'I can\'t see any waste here',
    notWasteDesc: 'Please point directly at an object or discarded item, avoiding faces and documents.',
    retakePhoto: 'Retake photo',
    analyzingImage: 'Identifying waste streams...',
    analyzingText: 'Checking regulations...',
    cannotReadResult: 'Couldn\'t read that result, try again.',
    pickCategoryManually: 'Pick category manually',
    quotaLimitReached: 'The free AI limit is reached for now. You can still search by name or pick a category.',
    aiBusyError: 'The AI is busy right now. Please try again in a moment.',
    tryAgain: 'Try again',
    incompleteAnswer: 'Incomplete answer. Please try again.',
    hazardHigh: 'High hazard: Handle with caution. Do not crush or burn.',
    hazardLow: 'Low hazard',
    reuseDonateFirstStep: 'Reuse or donate first if still usable or repairable.',

    correctTitle: 'Correct waste stream',
    selectCorrectCategory: 'Select the proper category',
    moreCategories: 'More categories',
    fewerCategories: 'Fewer categories',
    optionalItemName: 'Item name (optional)',
    optionalNote: 'Short note or reason (optional)',
    saveCorrection: 'Save correction',
    savedToast: 'Thanks, I\'ll remember this on this device',
    undo: 'Undo',
    conflictWarningTitle: 'Statutory Rule Difference',
    conflictWarningBody: (expected) => `Usually this goes to ${expected} under SWM Rules 2026. Save anyway?`,
    saveAnyway: 'Save anyway',
    cancel: 'Cancel',

    tabHistory: 'History',
    tabAccuracy: 'Accuracy',
    tabSettings: 'Settings',
    historyEmpty: 'No scan history yet. Scanned items will be recorded here.',
    historyTitle: 'Recent Scans',
    settingsTitle: 'Settings & Device',
    languageLabel: 'Language',
    modelScanLabel: 'Scan Model',
    modelSmartLabel: 'Fallback / Smart Model',
    saveThumbnailsLabel: 'Save photo thumbnails in history',
    shareWithCommunityLabel: 'Share with the community',
    shareWithCommunityDesc: 'Sync crowdsourced campus drop-off sites and anonymized sorting corrections via Firebase Firestore.',
    siteVerifiedBadge: 'Verified',
    siteAddedByUserBadge: 'Added by a user',
    siteReportProblem: 'Report a problem',
    siteProblemReported: 'Problem reported. Thank you for keeping campus data accurate.',
    siteAlreadyReported: 'You have already reported this site.',
    siteAlreadyConfirmed: 'You have already confirmed this site.',
    siteConfirmedToast: 'Site confirmed! Thanks for verifying campus data.',
    siteHiddenNotice: 'This site received 3 reports and is hidden from lists until reviewed.',
    aiRequestsToday: (count) => `AI requests today: ${count}`,
    exportData: 'Export all data',
    exportJson: 'Export JSON (Dataset)',
    exportCsv: 'Export CSV',
    importDataset: 'Import Dataset',
    importData: 'Import data',
    clearData: 'Clear all local data',
    clearDataConfirm: 'Are you sure you want to delete all local history and settings?',
    aboutTitle: 'About Bin Saathi',
    aboutLegal: 'Compiled for IIT Roorkee following the Ministry of Environment, Forest and Climate Change (MoEFCC) Solid Waste Management Rules 2026, E-Waste Rules 2022, and Battery Waste Rules 2022.',
    disclaimerText: 'Bin Saathi operates with on-device deterministic rules and Google Gemini Flash models. Always obey campus safety notices and institute directives.',
    campusNotice: 'IIT Roorkee Campus Edition',

    // Accuracy Screen
    accuracyTitle: 'Model Calibration & Accuracy',
    accuracyTotalScans: 'Total scans',
    accuracyShareConfirmed: 'Share confirmed',
    accuracyConfidenceBands: 'Observed Accuracy by Confidence Band',
    accuracyCalibrationNote: 'When the AI says High, you confirmed it X% of the time. This calibration signal reflects your real on-device feedback.',
    accuracyCalibrationPending: (count) => `Calibrates after 20 feedback records (currently ${count}/20). Keep scanning to train calibration.`,
    accuracyBandHigh: (pct, n) => `When the AI said High, you confirmed it ${pct}% of the time (n=${n})`,
    accuracyBandMed: (pct, n) => `When the AI said Medium, you confirmed it ${pct}% of the time (n=${n})`,
    accuracyBandLow: (pct, n) => `When the AI said Low, you confirmed it ${pct}% of the time (n=${n})`,
    accuracyTopConfusions: 'Top Misclassifications (AI vs User)',
    accuracyNoConfusions: 'No recurring misclassifications recorded yet. As you confirm or correct scans, patterns appear here.',

    // Tutor Chat (Learn)
    tutorTitle: 'Ask Bin Saathi',
    tutorSubtitle: 'Campus Waste & SWM Rules 2026 Tutor',
    tutorPlaceholder: 'Ask a question about segregation, campus bins, or rules...',
    tutorDisclaimer: 'Answers are strictly grounded in SWM Rules 2026 and national EPR guidelines, under 120 words.',
    tutorQuickPrompts: 'Quick questions',
    tutorPrompt1: 'Where do takeaway food containers go?',
    tutorPrompt2: 'How should I dispose of used batteries on campus?',
    tutorPrompt3: 'What is the statutory rule for sanitary waste?',
    tutorPrompt4: 'Can dirty plastic milk packets be recycled?',
    tutorQuotaReached: 'Daily AI tutor quota reached. You can still use the local search and campus sites directory.',
    tutorOfflineNotice: 'Tutor chat requires network. Offline search and local rules remain fully active.',
    tutorAskBtn: 'Ask',
    tutorThinking: 'Checking statutory rules...',

    welcomeTitle: 'Welcome to Bin Saathi',
    welcomeSubtitle: 'बिन साथी — Campus Waste Segregation',
    privacyNoticeTitle: 'Privacy & AI Notice',
    privacyNoticeBody: 'Bin Saathi uses Google Gemini API to analyze photos of waste. Please take note of the following guidelines:',
    privacyNoticeBullet1: 'Photos are sent securely to Google Gemini for classification.',
    privacyNoticeBullet2: 'Content sent via free-tier API may be used to improve Google products.',
    privacyNoticeBullet3: 'Please never photograph people, faces, personal ID documents, or computer screens.',
    dontShowAgain: 'Don\'t show this again',
    getStarted: 'Get Started',
    continueBtn: 'Continue',

    // Sites & Navigation
    nearestDropOff: 'Nearest drop-off',
    nearestDropOffPrefix: 'Nearest drop-off:',
    noDropOffForCategory: (cat) => `No known drop-off point on campus for ${cat}`,
    addSite: 'Add a site',
    filterAll: 'All',
    viewList: 'List',
    viewMap: 'Map',
    useMyLocation: 'Use my location',
    locationDenied: 'Location access unavailable. Sites sorted by name.',
    distanceApprox: (meters) => `about ${meters} m`,
    walkingTime: (mins) => `about ${mins} min walk`,
    directions: 'Directions',
    approximateLabel: 'approximate',
    confirmCorrect: 'Confirm this is correct',
    confirmedCount: (count) => `Confirmed by ${count} on campus`,
    reportProblem: 'Report a problem',
    reportedThanks: 'Feedback noted on this device',
    imStandingHere: "I'm standing here: pin exact location",
    pinnedSuccess: 'Exact GPS coordinates pinned',
    sourceSeed: 'Campus survey',
    sourceUser: 'Added by you',
    noSitesMatchFilter: 'No drop-off locations match this filter.',
    emptyCategoryHeading: (cat) => `No verified drop-off for ${cat} on campus yet. If you know one, add it.`,
    emptyCategoryExplanation: 'Under national rules, producers operate extended producer responsibility (EPR) take-back networks and registered recyclers for this stream.',
    campusContactsTitle: 'Campus and municipal contacts',
    addNumber: 'Add number',
    saveContactNumber: 'Save contact number',
    enterPhone: 'Enter phone or helpline number',
    outsideMapWarning: 'You seem to be outside the campus map.',
    searchSitesPlaceholder: 'Search campus sites or areas...',

    // Add Site Form
    addSiteTitle: 'Add a Campus Site',
    siteNameLabel: 'Site name (required)',
    siteTypeLabel: 'Type',
    siteTypeOptions: {
      e_waste: 'E-waste drop-off',
      battery: 'Battery drop-off',
      special_care: 'Special care collection',
      sanitary: 'Sanitary waste bin',
      recycler: 'Recycler or kabadiwala',
      compost: 'Compost unit',
      other: 'Other drop-off',
    },
    acceptedCategoriesLabel: 'Accepted categories (select at least one)',
    locationLabel: 'Location',
    tapMapInstruction: 'Tap on the map above to place marker, or use your GPS location.',
    addressLabel: 'Address or landmark',
    phoneLabel: 'Phone (optional, 10-digit or landline)',
    hoursLabel: 'Operating hours',
    notesLabel: 'Notes',
    localDeviceOnlyNotice: 'Saved on this device only.',
    submitSiteBtn: 'Save Site',
    fillRequiredFields: 'Please enter site name, select at least one category, and specify location.',

    comingSoonTitle: 'Coming soon',
    comingSoonDesc: 'This section is being prepared for the IIT Roorkee campus community.',

    categories: {
      wet: {
        label: 'Wet waste',
        binName: 'Green bin',
        basis: 'SWM Rules 2026, Rule 3(1)(zzl) Organic & biodegradable',
        routeHint: 'Daily collection for campus composting or bio-methanation.',
      },
      dry: {
        label: 'Dry waste',
        binName: 'Blue bin',
        basis: 'SWM Rules 2026, Rule 3(1)(s) Recyclable & non-recyclable',
        routeHint: 'Sorted at Material Recovery Facility (MRF). Clean and dry before binning.',
      },
      sanitary: {
        label: 'Sanitary waste',
        binName: 'Separate sanitary bin (Red bin in public toilets)',
        basis: 'SWM Rules 2026, Rule 3(1)(zp) & Rule 5(1)(c)',
        routeHint: 'Wrap securely in paper or pouch. Never mix into wet or dry bins.',
      },
      special_care: {
        label: 'Special care waste',
        binName: 'Special care collection point',
        basis: 'SWM Rules 2026, Rule 3(1)(zx) Domestic hazardous',
        routeHint: 'Keep separate. Hand over directly at designated campus collection depot.',
      },
      e_waste: {
        label: 'E-waste',
        binName: 'Authorised e-waste collection point',
        basis: 'E-Waste (Management) Rules 2022',
        routeHint: 'Deposit at campus e-waste bin or producer take-back. Never put in dry bin.',
      },
      battery: {
        label: 'Battery waste',
        binName: 'Battery take-back / registered depot',
        basis: 'Battery Waste Management Rules 2022 & SWM 2026 special care',
        routeHint: 'Keep dry. Lithium cells and power banks are high fire risks if crushed.',
      },
      horticulture: {
        label: 'Garden waste',
        binName: 'Horticulture composting point',
        basis: 'SWM Rules 2026, Rule 3(1)(y)',
        routeHint: 'Store garden clippings and leaves separately for campus composting.',
      },
      c_and_d: {
        label: 'C&D debris',
        binName: 'Designated C&D arrangement',
        basis: 'Environment (C&D) Waste Management Rules 2025',
        routeHint: 'Do not mix with household waste. Contact Institute Works Department.',
      },
      biomedical: {
        label: 'Bio-medical waste',
        binName: 'Healthcare facility stream',
        basis: 'Bio-Medical Waste Management Rules 2016',
        routeHint: 'For health centre only. Household needles/gauze go to Special care instead.',
      },
      hazardous: {
        label: 'Hazardous / lab chemical waste',
        binName: 'Institute Safety / Hygiene Office',
        basis: 'Hazardous and Other Wastes Rules 2016',
        routeHint: 'Do not bin. Contact department laboratory safety supervisor.',
      },
      reuse_donate: {
        label: 'Reuse or donate first',
        binName: 'Campus donation / repair desk',
        basis: 'Waste Hierarchy, SWM Rules 2026 Rule 3(1)(zzi)',
        routeHint: 'Usable books, clothes, and electronics should be reused before disposal.',
      },
      unknown: {
        label: 'Not sure',
        binName: 'Manual sorting needed',
        basis: 'Uncertain material',
        routeHint: 'Retake photo in better lighting or search by item name.',
      },
    },
  },

  hi: {
    appName: 'बिन साथी',
    appSubtitle: 'आईआईटी रुड़की कचरा प्रबंधन',
    tagline: 'भारत के ठोस अपशिष्ट प्रबंधन नियम, 2026 के अंतर्गत',

    navScan: 'स्कैन',
    navSites: 'केंद्र',
    navLearn: 'सीखें',
    navMe: 'मेरा',

    takePhoto: 'फ़ोटो लें',
    chooseFromGallery: 'गैलरी से चुनें',
    typeItemName: 'वस्तु का नाम लिखें',
    recentScanHint: 'भोजन, पैकेट, इलेक्ट्रॉनिक्स या परिसर के कचरे की ओर कैमरा करें।',
    sanitaryPhotoHint: 'फ़ोटो नहीं लेना चाहते? सूची से चुनें',
    pickFromList: 'सूची से चुनें',
    searchPlaceholder: 'वस्तु खोजें (उदा. बैटरी, छिलके, कागज़)...',
    searchingRules: 'नियम सूची में खोज रहे हैं...',
    noLocalMatch: 'स्थानीय सूची में नहीं मिला।',
    askAi: 'एआई से पूछें',
    offlineNotice: 'ऑफ़लाइन मोड: स्थानीय नियम डेटाबेस सक्रिय है।',
    offlineSearchOnly: 'फ़ोटो स्कैन के लिए इंटरनेट चाहिए। आप नाम से खोज सकते हैं या श्रेणी चुन सकते हैं।',
    cameraUnavailable: 'यहाँ कैमरा उपलब्ध नहीं है। आप फ़ोटो अपलोड कर सकते हैं।',
    switchCamera: 'कैमरा बदलें',
    closeCamera: 'कैमरा बंद करें',
    capturePhoto: 'तस्वीर लें',

    confidence: 'भरोसा',
    confidenceHelp: 'यह एआई का अपना अनुमान है, कोई गारंटी नहीं।',
    confHigh: 'उच्च',
    confMed: 'मध्यम',
    confLow: 'कम',
    whichLooksRight: 'इनमें से कौन सा सही लगता है?',
    couldAlsoBe: 'यह {category} भी हो सकता है। डालने से पहले जांचें।',
    overriddenNote: 'ठोस अपशिष्ट नियम 2026 के अनुसार जाँचा और ठीक किया गया।',

    putIn: 'इसमें डालें:',
    howToDispose: 'निस्तारण कैसे करें',
    whyThisCategory: 'यह श्रेणी क्यों',
    couldAlsoBeTitle: 'यह भी हो सकता है',
    moreAboutRoute: 'इस मार्ग के बारे में और जानें',
    wasThisRight: 'क्या यह सही था?',
    yes: 'हाँ',
    noCorrectIt: 'नहीं, सही करें',
    notWasteTitle: 'मुझे यहाँ कोई कचरा नहीं दिख रहा',
    notWasteDesc: 'कृपया किसी वस्तु या कचरे की स्पष्ट तस्वीर लें। चेहरे और दस्तावेज़ न दिखाएँ।',
    retakePhoto: 'दोबारा फ़ोटो लें',
    analyzingImage: 'कचरे की पहचान हो रही है...',
    analyzingText: 'नियमों की जांच की जा रही है...',
    cannotReadResult: 'परिणाम पढ़ने में समस्या हुई, कृपया पुनः प्रयास करें।',
    pickCategoryManually: 'श्रेणी स्वयं चुनें',
    quotaLimitReached: 'वर्तमान में निःशुल्क AI सीमा समाप्त हो गई है। आप नाम से खोज सकते हैं या श्रेणी चुन सकते हैं।',
    aiBusyError: 'AI अभी व्यस्त है। कृपया थोड़ी देर बाद फिर कोशिश करें।',
    tryAgain: 'पुनः प्रयास करें',
    incompleteAnswer: 'अधूरा उत्तर। कृपया पुनः प्रयास करें।',
    hazardHigh: 'उच्च जोखिम: सावधानी से रखें। तोड़ें या जलाएँ नहीं।',
    hazardLow: 'कम जोखिम',
    reuseDonateFirstStep: 'यदि वस्तु अभी भी काम कर सकती है, तो पहले दोबारा उपयोग या दान करें।',

    correctTitle: 'कचरा श्रेणी सुधारें',
    selectCorrectCategory: 'सही श्रेणी चुनें',
    moreCategories: 'अन्य श्रेणियाँ',
    fewerCategories: 'कम श्रेणियाँ',
    optionalItemName: 'वस्तु का नाम (वैकल्पिक)',
    optionalNote: 'संक्षिप्त विवरण या कारण (वैकल्पिक)',
    saveCorrection: 'सुधार सहेजें',
    savedToast: 'धन्यवाद, इस उपकरण पर याद रखा जाएगा',
    undo: 'पूर्ववत करें (Undo)',
    conflictWarningTitle: 'नियम अंतर चेतावनी',
    conflictWarningBody: (expected) => `नियम 2026 के अनुसार यह सामान्यतः ${expected} में जाता है। क्या फिर भी सहेजना है?`,
    saveAnyway: 'फिर भी सहेजें',
    cancel: 'रद्द करें',

    tabHistory: 'इतिहास',
    tabAccuracy: 'सटीकता',
    tabSettings: 'सेटिंग्स',
    historyEmpty: 'कोई स्कैन इतिहास नहीं है। स्कैन की गई वस्तुएं यहाँ दिखेंगी।',
    historyTitle: 'हाल के स्कैन',
    settingsTitle: 'सेटिंग्स और डिवाइस',
    languageLabel: 'भाषा (Language)',
    modelScanLabel: 'स्कैन मॉडल',
    modelSmartLabel: 'स्मार्ट / बैकअप मॉडल',
    saveThumbnailsLabel: 'इतिहास में फ़ोटो थंबनेल सहेजें',
    shareWithCommunityLabel: 'समुदाय के साथ साझा करें',
    shareWithCommunityDesc: 'फायरबेस फायरस्टोर के माध्यम से परिसर के ड्रॉप-ऑफ स्थानों और अनाम छँटाई सुधारों को सिंक करें।',
    siteVerifiedBadge: 'सत्यापित',
    siteAddedByUserBadge: 'उपयोगकर्ता द्वारा जोड़ा गया',
    siteReportProblem: 'समस्या की रिपोर्ट करें',
    siteProblemReported: 'समस्या रिपोर्ट दर्ज की गई। परिसर डेटा को सटीक रखने के लिए धन्यवाद।',
    siteAlreadyReported: 'आप पहले ही इस स्थान की रिपोर्ट कर चुके हैं।',
    siteAlreadyConfirmed: 'आप पहले ही इस स्थान की पुष्टि कर चुके हैं।',
    siteConfirmedToast: 'स्थान की पुष्टि हो गई! डेटा सत्यापन के लिए धन्यवाद।',
    siteHiddenNotice: 'इस स्थान को 3 रिपोर्टें मिली हैं और समीक्षा होने तक यह सूची से छिपा हुआ है।',
    aiRequestsToday: (count) => `आज के एआई अनुरोध: ${count}`,
    exportData: 'सभी डेटा निर्यात करें',
    exportJson: 'JSON निर्यात (डेटासेट)',
    exportCsv: 'CSV निर्यात',
    importDataset: 'डेटासेट आयात करें',
    importData: 'डेटा आयात करें',
    clearData: 'सभी स्थानीय डेटा मिटाएं',
    clearDataConfirm: 'क्या आप सुनिश्चित हैं कि आप संपूर्ण स्थानीय इतिहास और सेटिंग्स मिटाना चाहते हैं?',
    aboutTitle: 'बिन साथी के बारे में',
    aboutLegal: 'आईआईटी रुड़की परिसर हेतु पर्यावरण मंत्रालय के ठोस अपशिष्ट प्रबंधन नियम 2026, ई-कचरा नियम 2022 और बैटरी नियम 2022 के आधार पर निर्मित।',
    disclaimerText: 'बिन साथी ऑन-डिवाइस नियमों और जेमिनी मॉडल से चलता है। परिसर के आधिकारिक निर्देशों का पालन करें।',
    campusNotice: 'आईआईटी रुड़की परिसर संस्करण',

    // Accuracy Screen
    accuracyTitle: 'मॉडल अंशांकन एवं सटीकता',
    accuracyTotalScans: 'कुल स्कैन',
    accuracyShareConfirmed: 'सत्यापित अनुपात',
    accuracyConfidenceBands: 'भरोसा स्तर के अनुसार वास्तविक सटीकता',
    accuracyCalibrationNote: 'जब एआई ने "उच्च" कहा, आपने X% बार पुष्टि की। यह वास्तविक डिवाइस फीडबैक से अंशांकित है।',
    accuracyCalibrationPending: (count) => `20 फीडबैक रिकॉर्ड के बाद अंशांकन सक्रिय होगा (वर्तमान: ${count}/20)।`,
    accuracyBandHigh: (pct, n) => `जब एआई ने 'उच्च' कहा, आपने ${pct}% बार पुष्टि की (n=${n})`,
    accuracyBandMed: (pct, n) => `जब एआई ने 'मध्यम' कहा, आपने ${pct}% बार पुष्टि की (n=${n})`,
    accuracyBandLow: (pct, n) => `जब एआई ने 'कम' कहा, आपने ${pct}% बार पुष्टि की (n=${n})`,
    accuracyTopConfusions: 'प्रमुख गलत वर्गीकरण (एआई बनाम उपयोगकर्ता)',
    accuracyNoConfusions: 'अभी तक कोई आवर्ती गलत वर्गीकरण दर्ज नहीं हुआ। स्कैन पुष्टि से यह सूची बनेगी।',

    // Tutor Chat (Learn)
    tutorTitle: 'बिन साथी से पूछें',
    tutorSubtitle: 'परिसर कचरा व ठोस अपशिष्ट नियम 2026 ट्यूटर',
    tutorPlaceholder: 'कचरा नियमों, निस्तारण या परिसर बिन के बारे में पूछें...',
    tutorDisclaimer: 'उत्तर ठोस अपशिष्ट नियम 2026 और राष्ट्रीय EPR नियमों पर आधारित हैं (120 शब्दों में)।',
    tutorQuickPrompts: 'त्वरित प्रश्न',
    tutorPrompt1: 'खाना पैक करने वाले डिब्बे किस बिन में जाते हैं?',
    tutorPrompt2: 'परिसर में पुरानी बैटरी का निस्तारण कैसे करें?',
    tutorPrompt3: 'सैनिटरी कचरे के लिए वैधानिक नियम क्या है?',
    tutorPrompt4: 'क्या गंदे प्लास्टिक के दूध के पैकेट रीसायकल हो सकते हैं?',
    tutorQuotaReached: 'दैनिक एआई ट्यूटर कोटा समाप्त। स्थानीय खोज और परिसर केंद्र हमेशा उपलब्ध हैं।',
    tutorOfflineNotice: 'ट्यूटर चैट के लिए इंटरनेट आवश्यक है। ऑफ़लाइन खोज पूरी तरह सक्रिय है।',
    tutorAskBtn: 'पूछें',
    tutorThinking: 'नियमों में खोज रहे हैं...',

    welcomeTitle: 'बिन साथी में स्वागत है',
    welcomeSubtitle: 'IIT Roorkee Waste Segregation Guide',
    privacyNoticeTitle: 'गोपनीयता और एआई सूचना',
    privacyNoticeBody: 'बिन साथी कचरे की पहचान के लिए गूगल जेमिनी एआई का उपयोग करता है। कृपया ध्यान दें:',
    privacyNoticeBullet1: 'फ़ोटो विश्लेषण के लिए गूगल जेमिनी को सुरक्षित भेजी जाती हैं।',
    privacyNoticeBullet2: 'निःशुल्क टीयर डेटा का उपयोग गूगल उत्पादों के सुधार के लिए हो सकता है।',
    privacyNoticeBullet3: 'कृपया किसी व्यक्ति, चेहरे, निजी दस्तावेज़ या स्क्रीन की तस्वीर न लें।',
    dontShowAgain: 'दोबारा न दिखाएँ',
    getStarted: 'शुरू करें',
    continueBtn: 'आगे बढ़ें',

    // Sites & Navigation
    nearestDropOff: 'सबसे नज़दीकी जमा केंद्र',
    nearestDropOffPrefix: 'सबसे नज़दीकी केंद्र:',
    noDropOffForCategory: (cat) => `परिसर में ${cat} के लिए कोई ज्ञात केंद्र नहीं है`,
    addSite: 'केंद्र जोड़ें',
    filterAll: 'सभी',
    viewList: 'सूची',
    viewMap: 'नक्शा',
    useMyLocation: 'मेरी स्थिति उपयोग करें',
    locationDenied: 'स्थान अनुमति उपलब्ध नहीं है। नाम के अनुसार क्रमबद्ध।',
    distanceApprox: (meters) => `लगभग ${meters} मी.`,
    walkingTime: (mins) => `लगभग ${mins} मिनट पैदल`,
    directions: 'दिशा-निर्देश',
    approximateLabel: 'अनुमानित',
    confirmCorrect: 'पुष्टि करें कि यह सही है',
    confirmedCount: (count) => `परिसर में ${count} लोगों द्वारा पुष्ट`,
    reportProblem: 'समस्या रिपोर्ट करें',
    reportedThanks: 'प्रतिक्रिया इस डिवाइस पर दर्ज की गई',
    imStandingHere: 'मैं यहाँ खड़ा हूँ: सटीक स्थान पिन करें',
    pinnedSuccess: 'सटीक जीपीएस निर्देशांक पिन किए गए',
    sourceSeed: 'परिसर सर्वेक्षण',
    sourceUser: 'आपके द्वारा जोड़ा गया',
    noSitesMatchFilter: 'इस फ़िल्टर से कोई केंद्र मेल नहीं खाता।',
    emptyCategoryHeading: (cat) => `परिसर में अभी तक ${cat} के लिए कोई सत्यापित केंद्र नहीं है। यदि आप जानते हैं, तो जोड़ें।`,
    emptyCategoryExplanation: 'राष्ट्रीय नियमों के अंतर्गत इस श्रेणी हेतु निर्माता टेक-बैक व अधिकृत रीसाइक्लिंग केंद्र संचालित करते हैं।',
    campusContactsTitle: 'परिसर एवं नगर निगम संपर्क',
    addNumber: 'नंबर जोड़ें',
    saveContactNumber: 'नंबर सहेजें',
    enterPhone: 'फ़ोन या हेल्पलाइन नंबर लिखें',
    outsideMapWarning: 'आप परिसर के नक्शे से बाहर प्रतीत होते हैं।',
    searchSitesPlaceholder: 'परिसर केंद्र या क्षेत्र खोजें...',

    // Add Site Form
    addSiteTitle: 'परिसर केंद्र जोड़ें',
    siteNameLabel: 'केंद्र का नाम (आवश्यक)',
    siteTypeLabel: 'प्रकार',
    siteTypeOptions: {
      e_waste: 'ई-कचरा जमा केंद्र',
      battery: 'बैटरी जमा केंद्र',
      special_care: 'विशेष देखभाल कचरा केंद्र',
      sanitary: 'सैनिटरी कचरा बिन',
      recycler: 'रीसाइक्लर या कबाड़ी',
      compost: 'कम्पोस्ट इकाई',
      other: 'अन्य जमा केंद्र',
    },
    acceptedCategoriesLabel: 'स्वीकृत कचरा श्रेणियाँ (कम से कम एक चुनें)',
    locationLabel: 'स्थान',
    tapMapInstruction: 'स्थान चुनने के लिए ऊपर नक्शे पर टैप करें या अपना जीपीएस उपयोग करें।',
    addressLabel: 'पता या लैंडमार्क',
    phoneLabel: 'फ़ोन (वैकल्पिक, 10 अंक या लैंडलाइन)',
    hoursLabel: 'खुलने का समय',
    notesLabel: 'विवरण / निर्देश',
    localDeviceOnlyNotice: 'यह केवल इस उपकरण पर सहेजा जाएगा।',
    submitSiteBtn: 'केंद्र सहेजें',
    fillRequiredFields: 'कृपया केंद्र का नाम लिखें, कम से कम एक श्रेणी चुनें और स्थान निर्धारित करें।',

    comingSoonTitle: 'जल्द उपलब्ध होगा',
    comingSoonDesc: 'आईआईटी रुड़की परिसर के लिए यह अनुभाग तैयार किया जा रहा है।',

    categories: {
      wet: {
        label: 'गीला कचरा',
        binName: 'हरा बिन',
        basis: 'ठोस अपशिष्ट नियम 2026, नियम 3(1)(zzl) जैविक व सड़नशील',
        routeHint: 'परिसर कम्पोस्टिंग या बायो-मीथेनेशन के लिए दैनिक संग्रह।',
      },
      dry: {
        label: 'सूखा कचरा',
        binName: 'नीला बिन',
        basis: 'ठोस अपशिष्ट नियम 2026, नियम 3(1)(s) रीसाइक्लिंग व अन्य',
        routeHint: 'रीसाइक्लिंग केंद्र (MRF) में छांटा जाता है। साफ और सूखा डालें।',
      },
      sanitary: {
        label: 'सैनिटरी कचरा',
        binName: 'अलग सैनिटरी बिन (सार्वजनिक शौचालयों में लाल बिन)',
        basis: 'ठोस अपशिष्ट नियम 2026, नियम 3(1)(zp) व 5(1)(c)',
        routeHint: 'कागज़ में अच्छी तरह लपेटकर डालें। गीले या सूखे बिन में न मिलाएं।',
      },
      special_care: {
        label: 'विशेष देखभाल वाला कचरा',
        binName: 'विशेष देखभाल संग्रह केंद्र',
        basis: 'ठोस अपशिष्ट नियम 2026, नियम 3(1)(zx) घरेलू खतरनाक कचरा',
        routeHint: 'अलग रखें। सीधे परिसर के विशेष देखभाल केंद्र पर जमा करें।',
      },
      e_waste: {
        label: 'ई-कचरा',
        binName: 'अधिकृत ई-कचरा केंद्र',
        basis: 'ई-अपशिष्ट (प्रबंधन) नियम 2022',
        routeHint: 'परिसर के ई-कचरा बॉक्स या रीसाइक्लर को दें। सूखे बिन में कभी न डालें।',
      },
      battery: {
        label: 'बैटरी कचरा',
        binName: 'बैटरी संग्रह केंद्र या डीलर',
        basis: 'बैटरी अपशिष्ट प्रबंधन नियम 2022 व नियम 2026 विशेष देखभाल',
        routeHint: 'सूखा रखें। लिथियम सेल व पावर बैंक टूटने पर आग लगने का खतरा होता है।',
      },
      horticulture: {
        label: 'बागवानी / पत्तों का कचरा',
        binName: 'बागवानी खाद केंद्र',
        basis: 'ठोस अपशिष्ट नियम 2026, नियम 3(1)(y)',
        routeHint: 'पत्ते और घास की कतरन अलग रखें, परिसर में खाद बनाई जाती है।',
      },
      c_and_d: {
        label: 'निर्माण व ध्वस्तीकरण मलबा',
        binName: 'निर्धारित मलबा केंद्र',
        basis: 'पर्यावरण (C&D) अपशिष्ट प्रबंधन नियम 2025',
        routeHint: 'घरेलू कचरे में न मिलाएं। संस्थान निर्माण विभाग से संपर्क करें।',
      },
      biomedical: {
        label: 'जैव-चिकित्सा कचरा',
        binName: 'स्वास्थ्य केंद्र व्यवस्था',
        basis: 'जैव-चिकित्सा अपशिष्ट प्रबंधन नियम 2016',
        routeHint: 'अस्पताल के लिए। घर की सुई या पट्टी विशेष देखभाल कचरे में जाती है।',
      },
      hazardous: {
        label: 'ख़तरनाक रासायनिक कचरा',
        binName: 'संस्थान सुरक्षा / प्रयोगशाला कार्यालय',
        basis: 'खतरनाक अपशिष्ट नियम 2016',
        routeHint: 'कूड़ेदान में न डालें। विभाग के लैब सुरक्षा प्रभारी से संपर्क करें।',
      },
      reuse_donate: {
        label: 'पहले दोबारा उपयोग / दान करें',
        binName: 'परिसर दान या मरम्मत केंद्र',
        basis: 'कचरा पदानुक्रम, नियम 2026 नियम 3(1)(zzi)',
        routeHint: 'उपयोगी कपड़े, किताबें व उपकरण फेंकने से पहले दान करें।',
      },
      unknown: {
        label: 'पक्का नहीं',
        binName: 'जांच आवश्यक',
        basis: 'अस्पष्ट सामग्री',
        routeHint: 'अच्छी रोशनी में दोबारा फ़ोटो लें या वस्तु का नाम लिखकर खोजें।',
      },
    },
  },
};
