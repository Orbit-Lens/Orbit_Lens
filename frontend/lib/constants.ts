export const ACCURACY_THRESHOLD_METERS = 5;

export type Language = "en" | "hi";

export const SHELL_LABELS = {
  skipToContent: {
    en: "Skip to Main Content",
    hi: "मुख्य सामग्री पर जाएं",
  },
  screenReader: {
    en: "Screen Reader Access",
    hi: "स्क्रीन रीडर का उपयोग",
  },
  textSize: {
    en: "Text Size",
    hi: "अक्षर का आकार",
  },
  highContrast: {
    en: "High Contrast",
    hi: "उच्च कंट्रास्ट",
  },
  language: {
    en: "English / हिन्दी",
    hi: "हिन्दी / English",
  },
  siteTitle: {
    en: "OrbitLens",
    hi: "ऑर्बिट लेंस",
  },
  siteSubtitle: {
    en: "Multi-Modal Lunar Image Registration — Chandrayaan-2 (OHRC · TMC-2 · IIRS)",
    hi: "मल्टी-मॉडल चंद्र छवि पंजीकरण — चंद्रयान-२ (OHRC · TMC-2 · IIRS)",
  },
  prototypeNotice: {
    en: "Prototype developed for Smart India Hackathon 2026",
    hi: "स्मार्ट इंडिया हैकथॉन २०२६ के लिए विकसित प्रोटोटाइप",
  },
  nav: {
    home: { en: "Home", hi: "मुख्य पृष्ठ" },
    dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
    datasets: { en: "Datasets", hi: "डेटासेट" },
    newAnalysis: { en: "New Analysis", hi: "नया विश्लेषण" },
    signIn: { en: "Sign In", hi: "लॉग इन" },
    signOut: { en: "Sign Out", hi: "लॉग आउट" },
  },
  footer: {
    contentOwner: {
      en: "Content owned by: OrbitLens Team",
      hi: "सामग्री स्वामित्व: ऑर्बिट लेंस टीम",
    },
    developedFor: {
      en: "Developed for Smart India Hackathon 2026",
      hi: "स्मार्ट इंडिया हैकथॉन २०२६ के लिए विकसित",
    },
    lastUpdated: {
      en: "Last updated: 21 Sep 2026",
      hi: "अंतिम अद्यतन: २१ सितंबर २०२६",
    },
    compliance: {
      en: "Best viewed in the latest versions of Chrome, Firefox, Edge, Safari at 1280x768 or higher",
      hi: "क्रोम, फ़ायरफ़ॉक्स, एज, सफ़ारी के नवीनतम संस्करणों में १२८०x७६८ या उच्चतर पर सर्वोत्तम देखा गया",
    },
    policies: [
      { id: "policies", label: { en: "Website Policies", hi: "वेबसाइट नीतियां" }, href: "#" },
      { id: "terms", label: { en: "Terms & Conditions", hi: "नियम एवं शर्तें" }, href: "#" },
      { id: "privacy", label: { en: "Privacy Policy", hi: "गोपनीयता नीति" }, href: "#" },
      { id: "accessibility", label: { en: "Accessibility Statement", hi: "पहुंच-योग्यता विवरण" }, href: "#" },
      { id: "help", label: { en: "Help", hi: "सहायता" }, href: "#" },
      { id: "feedback", label: { en: "Feedback", hi: "प्रतिक्रिया" }, href: "#" },
      { id: "sitemap", label: { en: "Sitemap", hi: "साइटमैप" }, href: "#" },
      { id: "contact", label: { en: "Contact Us", hi: "संपर्क करें" }, href: "#" },
    ],
  },
} as const;

export const SENSOR_TYPES = ["OHRC", "TMC", "IIRS"] as const;
export type SensorType = (typeof SENSOR_TYPES)[number];
