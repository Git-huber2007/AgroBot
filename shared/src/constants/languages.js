export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', bcp47: 'en-IN' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', bcp47: 'hi-IN' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', bcp47: 'kn-IN' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', bcp47: 'mr-IN' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', bcp47: 'ta-IN' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', bcp47: 'te-IN' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', bcp47: 'bn-IN' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', bcp47: 'gu-IN' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', bcp47: 'pa-IN' },
];
export const LANGUAGE_CODES = ['en', 'hi', 'kn', 'mr', 'ta', 'te', 'bn', 'gu', 'pa'];
export const LANGUAGE_LOOKUP = Object.fromEntries(SUPPORTED_LANGUAGES.map(l => [l.code, l]));
