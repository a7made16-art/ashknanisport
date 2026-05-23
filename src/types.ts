// src/types.ts

export type Language = 'en' | 'ar';

export interface NavItem {
  home: string;
  about: string;
  services: string;
  achievements: string;
  deals: string;
  gallery: string;
  documents: string;
  contact: string;
  agentBenefits: string;
  playerSigning: string;
  AshknaniChampionship: string;
  sponsors: string;
}

export interface HeaderContent {
  nav: NavItem;
  transferButton: string;
  lang_toggle: string;
}

export interface HeroContent {
  title: string;
  tagline: string;
  cta1: string;
  cta2: string;
  transferButton: string;
  sliderImages: { url: string; alt: string }[];
}

export interface Founder {
  name: string;
  role: string;
  photo: string;
  credentials: string[];
}

export interface AboutContent {
  title_part1: string;
  title_part2: string;
  p1: string;
  p2: string;
  p3: string;
  founder: Founder;
}

export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
  fullDescription?: string;
}

export interface ServicesContent {
  list: ServiceItem[];
}

export interface AchievementItem {
  icon: string;
  title: string;
  description: string;
}

export interface AchievementsContent {
  list: AchievementItem[];
}

export interface DealItem {
  img: string;
  title: string;
  description: string;
}

export interface DealsContent {
  list: DealItem[];
}

export interface GalleryTabs {
  photos: string;
  videos: string;
}

export interface GalleryItem {
  title: string;
  src: string;
  thumbnail?: string;
}

export interface GalleryContent {
  tabs: GalleryTabs;
  photos: GalleryItem[];
  videos: GalleryItem[];
}

export interface DocumentItem {
  icon: string;
  title: string;
  fileUrl: string;
}

export interface DocumentsContent {
  list: DocumentItem[];
}

export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
}

export interface ContactForm {
  name: string;
  email: string;
  message: string;
  submit: string;
}

export interface ContactContent {
  title_part1: string;
  title_part2: string;
  info: ContactInfo;
  form: ContactForm;
  mapEmbedUrl: string;
}

export interface SocialMediaItem {
  platform: string;
  icon: string;
  url: string;
}

export interface FooterContent {
  copyright: string;
  quickLinks: string;
  socialMedia?: SocialMediaItem[];
}

export interface LanguageContent {
  header: HeaderContent;
  hero: HeroContent;
  about: AboutContent;
  services: ServicesContent;
  achievements: AchievementsContent;
  deals: DealsContent;
  gallery: GalleryContent;
  documents: DocumentsContent;
  contact: ContactContent;
  footer: FooterContent;
  playerSigning: PlayerSigningContent;
  agentBenefits: AgentBenefitsContent;
  transferMarket: TransferMarketContent;
}

export interface AppContent {
  en: LanguageContent;
  ar: LanguageContent;
}


export interface PlayerGallery {
  title: string;
  images: string[];
}

export interface PlayerSigningType {
  title: string;
  description: string;
  steps: string[];
  icon: string;
  videoUrl: string;
  gallery: PlayerGallery;
}

export interface PlayerSigningContent {
  title: string;
  highlight: string;
  videoTitle: string;
  professional: PlayerSigningType;
  amateur: PlayerSigningType;
  individual: PlayerSigningType;
  cta: {
    title: string;
    description: string;
    whatsappNumber: string;
    whatsappText: string;
    contactText: string;
  };
}
export interface AgentBenefitsContent {
  title: string;
  highlight: string;
  description: string;
  benefits: {
    icon: string;
    title: string;
    description: string;
  }[];
}

export interface TransferMarketContent {
  title: string;
  highlight: string;
  description: string;
  logoUrl: string;
  profileUrl: string;
  buttonText: string;
}
// أضف هذا النوع إلى ملف types.ts
export interface Advertisement {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  position: string;
  size: string;
}
export interface ConsultationService {
  id: number;
  title: string;
  price: number;
  description: string;
}

export interface ConsultationForm {
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  submit: string;
}

export interface ConsultationContact {
  address: string;
  phone: number;
  email: string;
  mapEmbedUrl: string;
}

export interface ConsultationBookingContent {
  title: string;
  description: string;
  services: ConsultationService[];
  workingHours: string;
  workingDays: string;
  form: ConsultationForm;
  contact: ConsultationContact;
}

// عدل نوع LanguageContent ليشمل الإعلانات
export interface LanguageContent {
  header: HeaderContent;
  hero: HeroContent;
  about: AboutContent;
  agentBenefits: AgentBenefitsContent;
  services: ServicesContent;
  achievements: AchievementsContent;
  deals: DealsContent;
  gallery: GalleryContent;
  playerSigning: PlayerSigningContent;
  transferMarket: TransferMarketContent;
  documents: DocumentsContent;
  contact: ContactContent;
  consultationBooking: ConsultationBookingContent;
  ashkaniChampionship: any;
  advertisements: Advertisement[];
  footer: FooterContent;
}

export interface Sponsor {
    id: number;
    name_ar: string;
    name_en: string;
    services_ar?: string;
    services_en?: string;
    logo_url: string;
    website_url?: string;
    tier?: 'diamond' | 'gold' | 'silver' | 'partner';
    images?: SponsorImage[];
    discounts?: Discount[];
}

export interface SponsorImage {
    id: number;
    image_url: string;
}

export interface Discount {
    id: number;
    title_ar: string;
    title_en: string;
    description_ar?: string;
    description_en?: string;
    code?: string;
    image_url?: string;
    sponsor_id?: number;
    sponsor?: {
        id: number;
        name_ar: string;
        name_en: string;
        logo_url: string;
    };
}


