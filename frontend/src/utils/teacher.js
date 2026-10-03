/**
 * Teacher branding & contact config — single source of truth
 * Update this file to change teacher info and contact links across the entire portal.
 */
import teacherPhoto from '../../pic/1.png';

export const TEACHER = {
  name: 'Ahmed Helly',
  nameAr: 'أ. أحمد حلي',
  title: 'Mr. Ahmed Helly',
  titleAr: 'الأستاذ أحمد حلي',
  subject: 'Math & Statistics',
  subjectAr: 'الرياضيات والإحصاء',
  tagline: 'Guiding students to excellence and top scores in Mathematics & Statistics',
  taglineAr: 'نحو القمة والتفوق والدرجات النهائية في الرياضيات والإحصاء',
  photo: teacherPhoto,
  initials: 'AH',

  // Contact Channels — update with actual numbers & links anytime
  contact: {
    whatsapp: '01152010597',
    phone: '01152010597',
    assistantWhatsapp: '01556960684',
    assistantPhone: '01556960684',
    facebook: 'https://www.facebook.com/profile.php?id=100084279429247',
    telegram: 'https://t.me/ali_alashkar',
    workHours: 'Sat - Thu: 10:00 AM - 9:00 PM',
    workHoursAr: 'السبت - الخميس: ١٠:٠٠ ص - ٩:٠٠ م',

    // Centers — "Where are we?" section in the Contact modal
    // Each center: name, nameEn, governorate, governorateEn, mapsUrl (Google Maps search/place link)
    centers: [
      {
        governorate: 'القليوبية',
        governorateEn: 'Qalyubia',
        name: 'سنتر Top4',
        nameEn: 'Top4 Center',
        mapsUrl: 'https://maps.app.goo.gl/q1pBm93kXoM9v2dp6?g_st=aw',
      },
      {
        governorate: 'الجيزة',
        governorateEn: 'Giza',
        name: 'سنتر كوليدج فردوس',
        nameEn: 'College Fardous Center',
        mapsUrl: 'https://maps.app.goo.gl/WbB5iW3Hj7o9fC1A8',
      },
      {
        governorate: 'الجيزة',
        governorateEn: 'Giza',
        name: 'سنتر كوليدج النادي',
        nameEn: 'College Elnady Center',
        mapsUrl: 'https://maps.google.com/?q=29.969048,31.099073',
      },
    ],
  },
};
