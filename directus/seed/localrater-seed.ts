/**
 * LocalRater — Directus Seed (UK 2026 edition)
 * -------------------------------------------------------------
 * Idempotent seed: her koleksiyon slug/unique alanla upsert edilir.
 * Çalıştırma: npm run directus:seed  (directus/package.json -> "seed")
 *
 * Model kısaltmaları:
 *  - country_code=null  -> CORE (tüm ülkelerde geçerli)
 *  - country_code="UK"  -> UK'ye özel
 *  - questions.category_id ZORUNLU (kategorisiz soru yok)
 *  - types: single_choice | multi_choice | dropdown | rating | scale_likert
 *           | nps | boolean | ranking | matrix | open_text
 *
 * Cevap saklama sözleşmesi (answers):
 *  single_choice/dropdown/boolean/open_text -> value_text
 *  rating/nps/scale_likert                  -> value_number
 *  multi_choice/ranking/matrix              -> value_json
 *
 * Not: Bu proje paylaşımlı bir Directus instance'ında yaşadığı için tüm
 * koleksiyonlar `lr_` önekiyle (LocalRater) izole edilmiştir — bkz.
 * directus/lib/client.ts. İçerik orijinal seed paketiyle birebir aynıdır.
 */
import 'dotenv/config';
import {
  readItems, createItem, updateItem,
} from '@directus/sdk';
import { client, col } from '../lib/client.js';

// ----------------------------------------------------------------------------
// Ortak Likert / anchor yardımcıları
// ----------------------------------------------------------------------------
const LIKERT_5 = {
  points: 5,
  anchors_tr: ['Kesinlikle katılmıyorum', 'Katılmıyorum', 'Kararsızım', 'Katılıyorum', 'Kesinlikle katılıyorum'],
  anchors_en: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
};
const NPS = { min: 0, max: 10 };

// opt(value, tr, en) -> question_options satırı
const opt = (value: string, label_tr: string, label_en: string) => ({ value, label_tr, label_en });

// ----------------------------------------------------------------------------
// SEED VERİSİ
// Kategoriler ve altındaki sorular. Şıklar options[] içinde.
// ----------------------------------------------------------------------------

type SeedOption = { value: string; label_tr: string; label_en: string };
type SeedQuestion = {
  slug: string;
  type: string;
  label_tr: string; label_en: string;
  help_tr?: string; help_en?: string;
  is_required?: boolean;
  config?: Record<string, unknown>;
  depends_on?: { question_slug: string; equals: string } | { question_slug: string; not_equals: string };
  options?: SeedOption[];
};
type SeedCategory = {
  slug: string;
  country_code: string | null;
  name_tr: string; name_en: string;
  description_tr?: string; description_en?: string;
  icon?: string;
  is_optional?: boolean;
  questions: SeedQuestion[];
};

const EDITION = {
  country_code: 'UK',
  year: 2026,
  title_tr: 'UK’de Yaşam Anketi 2026',
  title_en: 'Life in the UK Survey 2026',
  status: 'open',
};

const CATEGORIES: SeedCategory[] = [
  // ===================== CORE =====================
  {
    slug: 'demographics', country_code: null, icon: 'users',
    name_tr: 'Demografi', name_en: 'Demographics',
    questions: [
      { slug: 'age_band', type: 'single_choice', label_tr: 'Yaş aralığınız?', label_en: 'Your age range?',
        options: ['18-24','25-34','35-44','45-54','55-64','65+'].map(v => opt(v, v, v)) },
      { slug: 'gender', type: 'single_choice', label_tr: 'Cinsiyetiniz?', label_en: 'Gender?',
        options: [opt('female','Kadın','Female'),opt('male','Erkek','Male'),opt('other','Diğer','Other'),opt('na','Belirtmek istemiyorum','Prefer not to say')] },
      { slug: 'household_size', type: 'single_choice', label_tr: 'Hanede kaç kişi yaşıyor?', label_en: 'Household size?',
        options: ['1','2','3','4','5+'].map(v => opt(v, v, v)) },
      { slug: 'has_children', type: 'boolean', label_tr: 'Çocuğunuz var mı?', label_en: 'Do you have children?' },
      { slug: 'years_in_country', type: 'single_choice', label_tr: 'Kaç yıldır UK’desiniz?', label_en: 'Years in the UK?',
        options: [opt('lt1','<1','<1'),opt('1-3','1-3','1-3'),opt('4-6','4-6','4-6'),opt('7-10','7-10','7-10'),opt('10+','10+','10+')] },
    ],
  },
  {
    slug: 'area', country_code: null, icon: 'map-pin',
    name_tr: 'Yaşanan Şehir / Bölge', name_en: 'City / Area',
    questions: [
      { slug: 'city', type: 'dropdown', label_tr: 'Hangi şehirde yaşıyorsunuz?', label_en: 'Which city?',
        options: ['London','Manchester','Birmingham','Leeds','Glasgow','Edinburgh','Bristol','Liverpool','Other'].map(v => opt(v, v, v)) },
      { slug: 'area_ratings', type: 'matrix', label_tr: 'Yaşadığınız bölgeyi puanlayın (1-5)', label_en: 'Rate your area (1-5)',
        config: { rows_tr: ['Ulaşım','Güvenlik','Sosyal hayat','Eğitim','Yeşil alan','Yaşam maliyeti','Türk topluluğu yoğunluğu'],
                  rows_en: ['Transport','Safety','Social life','Education','Green space','Cost of living','Turkish community density'],
                  columns: [1,2,3,4,5] } },
      { slug: 'area_safety_night', type: 'scale_likert', label_tr: 'Gece bölgede güvende hissediyorum', label_en: 'I feel safe in my area at night', config: LIKERT_5 },
      { slug: 'local_amenities', type: 'matrix', label_tr: 'Yerel olanaklara erişim (1-5)', label_en: 'Access to local amenities (1-5)',
        config: { rows_tr: ['Market','Sağlık','Toplu taşıma','Park','İbadet yeri','Türk esnafı'],
                  rows_en: ['Grocery','Healthcare','Public transport','Park','Place of worship','Turkish businesses'],
                  columns: [1,2,3,4,5] } },
      { slug: 'would_recommend_area', type: 'nps', label_tr: 'Bölgenizi bir tanıdığınıza tavsiye eder misiniz? (0-10)', label_en: 'Recommend your area? (0-10)', config: NPS },
      { slug: 'area_free', type: 'open_text', label_tr: 'Bölgeniz hakkında eklemek istediğiniz?', label_en: 'Anything to add about your area?', config: { maxlength: 280 } },
    ],
  },
  {
    slug: 'work', country_code: null, icon: 'briefcase',
    name_tr: 'İş / Meslek / Sektör', name_en: 'Work / Occupation',
    questions: [
      { slug: 'employment_status', type: 'single_choice', label_tr: 'Çalışma durumunuz?', label_en: 'Employment status?',
        options: [opt('ft','Tam zamanlı','Full-time'),opt('pt','Yarı zamanlı','Part-time'),opt('freelance','Serbest/Freelance','Freelance'),opt('owner','İş sahibi','Business owner'),opt('student','Öğrenci','Student'),opt('seeking','İş arıyor','Job seeking'),opt('retired','Emekli','Retired')] },
      { slug: 'sector', type: 'dropdown', label_tr: 'Sektörünüz?', label_en: 'Sector?',
        options: [opt('it','Yazılım/IT','Software/IT'),opt('health','Sağlık','Healthcare'),opt('finance','Finans','Finance'),opt('education','Eğitim','Education'),opt('construction','İnşaat','Construction'),opt('retail','Perakende','Retail'),opt('hospitality','Yeme-içme','Hospitality'),opt('academia','Akademi','Academia'),opt('other','Diğer','Other')] },
      { slug: 'work_mode', type: 'single_choice', label_tr: 'Çalışma şekliniz?', label_en: 'Work mode?',
        options: [opt('office','Ofis','Office'),opt('hybrid','Hibrit','Hybrid'),opt('remote','Tam uzaktan','Fully remote')] },
      { slug: 'income_band', type: 'single_choice', label_tr: 'Yıllık hane geliri bandı (£)?', label_en: 'Household income band (£)?',
        options: [opt('lt25','<25k','<25k'),opt('25-40','25-40k','25-40k'),opt('40-60','40-60k','40-60k'),opt('60-90','60-90k','60-90k'),opt('90-120','90-120k','90-120k'),opt('120+','120k+','120k+'),opt('na','Belirtmek istemiyorum','Prefer not to say')] },
      { slug: 'job_satisfaction', type: 'scale_likert', label_tr: 'İşimden memnunum', label_en: 'I am satisfied with my job', config: LIKERT_5 },
      { slug: 'overqualification', type: 'single_choice', label_tr: 'Niteliklerinizin altında bir işte mi çalışıyorsunuz?', label_en: 'Working below your qualifications?',
        options: [opt('no','Hayır','No'),opt('partly','Kısmen','Partly'),opt('yes','Evet','Yes')] },
      { slug: 'qualification_recognition', type: 'boolean', label_tr: 'Türkiye’deki diplomanız/tecrübeniz UK’de tanındı mı?', label_en: 'Were your foreign qualifications recognised?' },
    ],
  },
  {
    slug: 'shopping', country_code: null, icon: 'shopping-cart',
    name_tr: 'Alışveriş / Grocery', name_en: 'Shopping / Grocery',
    questions: [
      { slug: 'grocery_main', type: 'single_choice', label_tr: 'Ana market alışverişinizi nereden yaparsınız?', label_en: 'Main grocery?',
        options: ['Tesco','Sainsbury’s','Aldi','Lidl','Asda','Morrisons','M&S','Waitrose'].map(v => opt(v, v, v)).concat([opt('turkish','Türk marketi','Turkish grocer'),opt('other','Diğer','Other')]) },
      { slug: 'turkish_grocery', type: 'multi_choice', label_tr: 'Hangi Türk/etnik marketlerden alışveriş yaparsınız?', label_en: 'Turkish/ethnic grocers?',
        options: [opt('tfc','TFC','TFC'),opt('tfm','Turkish Food Market','Turkish Food Market'),opt('local','Yerel bakkal','Local shop'),opt('online','Online','Online'),opt('none','Hiç','None')] },
      { slug: 'online_grocery', type: 'boolean', label_tr: 'Online market alışverişi yapıyor musunuz?', label_en: 'Order groceries online?' },
      { slug: 'shopping_channels', type: 'multi_choice', label_tr: 'Genel alışveriş kanallarınız?', label_en: 'Shopping channels?',
        options: [opt('amazon','Amazon','Amazon'),opt('ebay','eBay','eBay'),opt('highstreet','Yüksek sokak mağazaları','High street'),opt('outlet','Outlet','Outlet'),opt('secondhand','İkinci el (Vinted vb.)','Second-hand'),opt('marketplace','Marketplace','Marketplace')] },
      { slug: 'shopping_priority', type: 'ranking', label_tr: 'Alışverişte önceliğinizi sıralayın', label_en: 'Rank shopping priorities',
        options: [opt('price','Fiyat','Price'),opt('quality','Kalite','Quality'),opt('speed','Hız','Speed'),opt('sustainability','Sürdürülebilirlik','Sustainability'),opt('brand','Marka','Brand')] },
    ],
  },
  {
    slug: 'turkish-food', country_code: null, icon: 'utensils',
    name_tr: 'Favori Türk Restoran / Kafe', name_en: 'Favourite Turkish Places',
    questions: [
      { slug: 'eats_out_turkish', type: 'single_choice', label_tr: 'Ne sıklıkta Türk mekânına gidersiniz?', label_en: 'How often Turkish venues?',
        options: [opt('weekly','Haftada 1+','Weekly+'),opt('monthly','Ayda birkaç','A few times/month'),opt('sometimes','Ara sıra','Sometimes'),opt('rarely','Nadiren','Rarely')] },
      { slug: 'fav_turkish_place', type: 'open_text', label_tr: 'Favori Türk restoran/kafeniz ve şehri?', label_en: 'Favourite Turkish place & city?', config: { maxlength: 200 } },
      { slug: 'turkish_place_reason', type: 'multi_choice', label_tr: 'Neden tercih ediyorsunuz?', label_en: 'Why?',
        options: [opt('taste','Lezzet','Taste'),opt('price','Fiyat','Price'),opt('atmosphere','Atmosfer','Atmosphere'),opt('proximity','Yakınlık','Proximity'),opt('community','Topluluk hissi','Community feel')] },
    ],
  },
  {
    slug: 'foreign-food', country_code: null, icon: 'globe',
    name_tr: 'Favori Yabancı Restoran / Kafe', name_en: 'Favourite Non-Turkish Places',
    questions: [
      { slug: 'fav_cuisine', type: 'single_choice', label_tr: 'En sevdiğiniz yabancı mutfak?', label_en: 'Favourite non-Turkish cuisine?',
        options: [opt('italian','İtalyan','Italian'),opt('indian','Hint','Indian'),opt('chinese','Çin','Chinese'),opt('japanese','Japon','Japanese'),opt('mideast','Ortadoğu','Middle Eastern'),opt('mexican','Meksika','Mexican'),opt('british','İngiliz','British'),opt('other','Diğer','Other')] },
      { slug: 'fav_foreign_place', type: 'open_text', label_tr: 'Favori yabancı restoran/kafeniz?', label_en: 'Favourite spot?', config: { maxlength: 200 } },
    ],
  },
  {
    slug: 'health', country_code: null, icon: 'heart-pulse',
    name_tr: 'Sağlık & İyi Oluş', name_en: 'Health & Wellbeing',
    questions: [
      { slug: 'gp_registered', type: 'boolean', label_tr: 'Bir GP’ye kayıtlı mısınız?', label_en: 'Registered with a GP?' },
      { slug: 'general_health', type: 'single_choice', label_tr: 'Genel sağlığınızı nasıl değerlendirirsiniz?', label_en: 'Rate your general health',
        options: [opt('vgood','Çok iyi','Very good'),opt('good','İyi','Good'),opt('fair','Orta','Fair'),opt('poor','Kötü','Poor'),opt('vpoor','Çok kötü','Very poor')] },
      { slug: 'nhs_satisfaction', type: 'scale_likert', label_tr: 'NHS hizmetlerinden memnunum', label_en: 'Satisfied with NHS services', config: LIKERT_5 },
      { slug: 'mental_wellbeing', type: 'scale_likert', label_tr: 'Son aylarda ruhsal olarak iyi hissediyorum', label_en: 'I have felt mentally well recently', config: LIKERT_5 },
      { slug: 'loneliness', type: 'single_choice', label_tr: 'Ne sıklıkta yalnız hissediyorsunuz?', label_en: 'How often do you feel lonely?',
        options: [opt('never','Hiç','Never'),opt('rarely','Nadiren','Rarely'),opt('sometimes','Bazen','Sometimes'),opt('often','Sık','Often'),opt('always','Sürekli','Always')] },
      { slug: 'healthcare_barriers', type: 'multi_choice', label_tr: 'Sağlık hizmetine erişimde engeller?', label_en: 'Barriers to healthcare?',
        options: [opt('language','Dil','Language'),opt('appointments','Randevu bulma','Getting appointments'),opt('cost','Maliyet','Cost'),opt('understanding','Sistemi anlamama','Understanding the system'),opt('trust','Güven eksikliği','Lack of trust'),opt('none','Yok','None')] },
      { slug: 'private_health', type: 'single_choice', label_tr: 'Özel sağlık kullanıyor musunuz?', label_en: 'Use private healthcare?',
        options: [opt('no','Hayır','No'),opt('sometimes','Bazen','Sometimes'),opt('regular','Düzenli/sigortalı','Regularly/insured')] },
      { slug: 'support_when_needed', type: 'boolean', label_tr: 'Zor anda başvurabileceğiniz biri var mı?', label_en: 'Someone to turn to in hard times?' },
    ],
  },
  {
    slug: 'housing', country_code: null, icon: 'home',
    name_tr: 'Konut', name_en: 'Housing',
    questions: [
      { slug: 'housing_status', type: 'single_choice', label_tr: 'Konut durumunuz?', label_en: 'Housing status?',
        options: [opt('renter','Kiracı','Renter'),opt('mortgage','Ev sahibi (mortgage)','Owner (mortgage)'),opt('outright','Ev sahibi (tam mülk)','Owner (outright)'),opt('family','Aileyle','With family'),opt('shared','Ortak kiralama','Shared rental')] },
      { slug: 'housing_cost_band', type: 'single_choice', label_tr: 'Aylık konut gideri bandı (£)?', label_en: 'Monthly housing cost band (£)?',
        options: [opt('lt800','<800','<800'),opt('800-1200','800-1200','800-1200'),opt('1200-1800','1200-1800','1200-1800'),opt('1800-2500','1800-2500','1800-2500'),opt('2500+','2500+','2500+'),opt('na','Belirtmek istemiyorum','Prefer not to say')] },
      { slug: 'buy_intent', type: 'single_choice', label_tr: 'Önümüzdeki 2 yılda ev almayı düşünüyor musunuz?', label_en: 'Plan to buy in 2 years?',
        options: [opt('yes','Evet','Yes'),opt('no','Hayır','No'),opt('unsure','Emin değilim','Unsure')] },
      { slug: 'housing_difficulty', type: 'scale_likert', label_tr: 'Uygun konut bulmak zor', label_en: 'Finding suitable housing is hard', config: LIKERT_5 },
    ],
  },
  {
    slug: 'transport', country_code: null, icon: 'car',
    name_tr: 'Araç / Ehliyet / Sigorta', name_en: 'Car / Licence / Insurance',
    questions: [
      { slug: 'has_uk_licence', type: 'boolean', label_tr: 'UK ehliyetiniz var mı?', label_en: 'UK driving licence?' },
      { slug: 'owns_car', type: 'boolean', label_tr: 'Aracınız var mı?', label_en: 'Own a car?' },
      { slug: 'commute_mode', type: 'single_choice', label_tr: 'Ana ulaşım şekliniz?', label_en: 'Main commute?',
        options: [opt('car','Otomobil','Car'),opt('transit','Toplu taşıma','Public transport'),opt('bike','Bisiklet','Bicycle'),opt('walk','Yürüyüş','Walking'),opt('mixed','Karma','Mixed')] },
      { slug: 'insurance_cost_band', type: 'single_choice', label_tr: 'Yıllık araç sigortası bandı (£)?', label_en: 'Car insurance band (£)?',
        options: [opt('lt500','<500','<500'),opt('500-900','500-900','500-900'),opt('900-1500','900-1500','900-1500'),opt('1500+','1500+','1500+'),opt('none','Yok','None')] },
    ],
  },
  {
    slug: 'language-culture', country_code: null, icon: 'languages',
    name_tr: 'Dil / Kültür / Adaptasyon', name_en: 'Language / Culture / Adaptation',
    questions: [
      { slug: 'english_level', type: 'single_choice', label_tr: 'İngilizce seviyeniz?', label_en: 'English level?',
        options: [opt('beginner','Başlangıç','Beginner'),opt('intermediate','Orta','Intermediate'),opt('good','İyi','Good'),opt('fluent','Akıcı','Fluent'),opt('native','Anadil düzeyi','Native-like')] },
      { slug: 'adaptation', type: 'scale_likert', label_tr: 'UK yaşamına uyum sağladığımı hissediyorum', label_en: 'I feel adapted to UK life', config: LIKERT_5 },
      { slug: 'culture_challenges', type: 'multi_choice', label_tr: 'En zorlayan konular?', label_en: 'Biggest challenges?',
        options: [opt('language','Dil','Language'),opt('bureaucracy','Bürokrasi','Bureaucracy'),opt('social','Sosyal çevre','Social circle'),opt('workculture','İş kültürü','Work culture'),opt('weather','Hava/iklim','Weather'),opt('cost','Maliyet','Cost'),opt('family','Aile özlemi','Missing family')] },
      { slug: 'accent_bias', type: 'single_choice', label_tr: 'Aksanınız nedeniyle farklı muamele hissettiniz mi?', label_en: 'Treated differently due to accent?',
        options: [opt('never','Hiç','Never'),opt('rarely','Nadiren','Rarely'),opt('sometimes','Bazen','Sometimes'),opt('often','Sık','Often')] },
      { slug: 'cultural_participation', type: 'multi_choice', label_tr: 'Katıldığınız kültürel yaşam?', label_en: 'Cultural life you take part in?',
        options: [opt('turkish','Türk etkinlikleri','Turkish events'),opt('british','Yerel İngiliz etkinlikleri','Local British events'),opt('other','Diğer topluluklar','Other communities'),opt('religious','Dini etkinlikler','Religious events'),opt('none','Hiçbiri','None')] },
      { slug: 'kids_turkish', type: 'single_choice', label_tr: 'Çocuklarınız Türkçe öğreniyor mu?', label_en: 'Are your kids learning Turkish?',
        depends_on: { question_slug: 'has_children', equals: 'true' },
        options: [opt('active','Evet aktif','Yes, actively'),opt('partial','Evet kısmen','Yes, partly'),opt('no','Hayır','No')] },
    ],
  },
  {
    slug: 'community-media', country_code: null, icon: 'message-circle',
    name_tr: 'Sosyal Medya / Topluluk', name_en: 'Social Media / Community',
    questions: [
      { slug: 'community_channels', type: 'multi_choice', label_tr: 'Hangi topluluk kanallarını kullanıyorsunuz?', label_en: 'Community channels?',
        options: [opt('whatsapp','WhatsApp grupları','WhatsApp groups'),opt('facebook','Facebook grupları','Facebook groups'),opt('telegram','Telegram','Telegram'),opt('instagram','Instagram','Instagram'),opt('reddit','Reddit','Reddit'),opt('forums','Forumlar','Forums'),opt('none','Hiç','None')] },
      { slug: 'info_source', type: 'single_choice', label_tr: 'Yerel bilgi/haber için ilk kaynağınız?', label_en: 'First info source?',
        options: [opt('whatsapp','WhatsApp','WhatsApp'),opt('facebook','Facebook','Facebook'),opt('google','Google','Google'),opt('friends','Arkadaş çevresi','Friends'),opt('official','Resmi siteler','Official sites')] },
    ],
  },
  {
    slug: 'pets', country_code: null, icon: 'paw-print',
    name_tr: 'Evcil Hayvan', name_en: 'Pets',
    questions: [
      { slug: 'has_pet', type: 'boolean', label_tr: 'Evcil hayvanınız var mı?', label_en: 'Have a pet?' },
      { slug: 'pet_type', type: 'multi_choice', label_tr: 'Hangi tür?', label_en: 'What kind?',
        depends_on: { question_slug: 'has_pet', equals: 'true' },
        options: [opt('cat','Kedi','Cat'),opt('dog','Köpek','Dog'),opt('bird','Kuş','Bird'),opt('fish','Balık','Fish'),opt('other','Diğer','Other')] },
    ],
  },
  {
    slug: 'finance-resilience', country_code: null, icon: 'piggy-bank',
    name_tr: 'Finansal Dayanıklılık', name_en: 'Financial Resilience',
    questions: [
      { slug: 'emergency_fund', type: 'single_choice', label_tr: 'Beklenmedik £500’lük bir gideri karşılayabilir misiniz?', label_en: 'Could you cover an unexpected £500 expense?',
        options: [opt('easily','Rahatça','Easily'),opt('difficulty','Zorlanarak','With difficulty'),opt('no','Hayır','No'),opt('unsure','Emin değilim','Unsure')] },
      { slug: 'cost_of_living_impact', type: 'scale_likert', label_tr: 'Yaşam maliyeti artışı bütçemi ciddi zorluyor', label_en: 'Cost-of-living rise strains my budget', config: LIKERT_5 },
      { slug: 'savings_rate', type: 'single_choice', label_tr: 'Gelirinizin ne kadarını biriktiriyorsunuz?', label_en: 'How much do you save?',
        options: [opt('none','Hiç','None'),opt('lt10','<%10','<10%'),opt('10-20','%10-20','10-20%'),opt('20-40','%20-40','20-40%'),opt('40+','%40+','40%+')] },
      { slug: 'financial_products_gap', type: 'multi_choice', label_tr: 'Erişmekte zorlandığınız finansal ürünler?', label_en: 'Financial products hard to access?',
        options: [opt('mortgage','Mortgage','Mortgage'),opt('creditcard','Kredi kartı','Credit card'),opt('loan','Kredi','Loan'),opt('investment','Yatırım hesabı','Investment account'),opt('none','Hiçbiri','None')] },
      { slug: 'remittances', type: 'single_choice', label_tr: 'Yurt dışına düzenli para gönderiyor musunuz?', label_en: 'Send money abroad regularly?',
        options: [opt('no','Hayır','No'),opt('sometimes','Ara sıra','Sometimes'),opt('regular','Düzenli','Regularly')] },
    ],
  },
  {
    slug: 'belonging-identity', country_code: null, icon: 'users-round',
    name_tr: 'Aidiyet, Kimlik & Ayrımcılık', name_en: 'Belonging, Identity & Discrimination',
    questions: [
      { slug: 'belonging', type: 'scale_likert', label_tr: 'Yaşadığım yere ait hissediyorum', label_en: 'I feel I belong where I live', config: LIKERT_5 },
      { slug: 'identity_balance', type: 'single_choice', label_tr: 'Kendinizi nasıl tanımlıyorsunuz?', label_en: 'How do you identify?',
        options: [opt('turkish','Daha çok Türk','More Turkish'),opt('equal','Eşit derecede','Equally both'),opt('local','Daha çok yerel','More local'),opt('intl','Uluslararası/karma','International/mixed')] },
      { slug: 'discrimination_experienced', type: 'single_choice', label_tr: 'Son 1 yılda ayrımcılığa maruz kaldınız mı?', label_en: 'Faced discrimination last year?',
        options: [opt('no','Hayır','No'),opt('once','Bir kez','Once'),opt('several','Birkaç kez','Several times'),opt('often','Sık','Often')] },
      { slug: 'discrimination_context', type: 'multi_choice', label_tr: 'Hangi ortamda?', label_en: 'In which context?',
        depends_on: { question_slug: 'discrimination_experienced', not_equals: 'no' },
        options: [opt('work','İş','Work'),opt('housing','Konut','Housing'),opt('health','Sağlık','Healthcare'),opt('public','Sokak/kamu','Street/public'),opt('online','Online','Online'),opt('education','Eğitim','Education')] },
      { slug: 'community_pride', type: 'nps', label_tr: 'Türk topluluğunun UK’deki varlığından ne kadar gurur duyuyorsunuz? (0-10)', label_en: 'Pride in the community presence? (0-10)', config: NPS },
    ],
  },
  {
    slug: 'mobility-future', country_code: null, icon: 'plane',
    name_tr: 'Hareketlilik & Gelecek Niyeti', name_en: 'Mobility & Future Intent',
    questions: [
      { slug: 'stay_intent', type: 'single_choice', label_tr: 'Önümüzdeki 5 yıl için planınız?', label_en: 'Plan for next 5 years?',
        options: [opt('stay','UK’de kalmak','Stay in the UK'),opt('return','Türkiye’ye dönmek','Return to Türkiye'),opt('other','Başka ülkeye','Another country'),opt('unsure','Kararsız','Undecided')] },
      { slug: 'return_barriers', type: 'multi_choice', label_tr: 'Dönüşü zorlaştıran nedenler?', label_en: 'What keeps you from returning?',
        depends_on: { question_slug: 'stay_intent', not_equals: 'return' },
        options: [opt('career','İş/kariyer','Career'),opt('kids','Çocukların eğitimi','Kids education'),opt('economy','Ekonomi','Economy'),opt('quality','Yaşam kalitesi','Quality of life'),opt('health','Sağlık sistemi','Health system'),opt('family','Aile burada','Family here')] },
      { slug: 'relocation_uk', type: 'single_choice', label_tr: 'UK içinde taşınmayı düşünüyor musunuz?', label_en: 'Considering relocating within the UK?',
        options: [opt('no','Hayır','No'),opt('same','Evet aynı bölge','Yes, same area'),opt('other','Evet başka şehir','Yes, another city')] },
      { slug: 'advice_to_newcomers', type: 'open_text', label_tr: 'UK’ye yeni gelenlere bir tavsiyeniz?', label_en: 'One tip for newcomers?', config: { maxlength: 200 } },
    ],
  },
  {
    slug: 'digital-ai', country_code: null, icon: 'cpu',
    name_tr: 'Dijital Yaşam & Yapay Zeka', name_en: 'Digital Life & AI',
    questions: [
      { slug: 'ai_tools_use', type: 'single_choice', label_tr: 'Günlük hayatta yapay zeka araçlarını ne sıklıkta kullanıyorsunuz?', label_en: 'How often use AI tools?',
        options: [opt('never','Hiç','Never'),opt('sometimes','Ara sıra','Sometimes'),opt('weekly','Haftalık','Weekly'),opt('daily','Günlük','Daily')] },
      { slug: 'ai_use_cases', type: 'multi_choice', label_tr: 'Hangi amaçlarla?', label_en: 'For what?',
        depends_on: { question_slug: 'ai_tools_use', not_equals: 'never' },
        options: [opt('work','İş','Work'),opt('translation','Çeviri','Translation'),opt('learning','Eğitim/öğrenme','Learning'),opt('writing','Yazışma','Writing'),opt('shopping','Alışveriş kararları','Shopping decisions'),opt('health','Sağlık bilgisi','Health info')] },
      { slug: 'device_primary', type: 'single_choice', label_tr: 'İnternete en çok neyle bağlanıyorsunuz?', label_en: 'Primary device?',
        options: [opt('phone','Telefon','Phone'),opt('laptop','Dizüstü','Laptop'),opt('tablet','Tablet','Tablet'),opt('desktop','Masaüstü','Desktop')] },
      { slug: 'digital_gov_services', type: 'scale_likert', label_tr: 'UK dijital kamu hizmetlerini (HMRC, GOV.UK, NHS app) kolay kullanıyorum', label_en: 'UK digital gov services are easy to use', config: LIKERT_5 },
    ],
  },
  {
    slug: 'education-children', country_code: null, icon: 'graduation-cap',
    name_tr: 'Eğitim & Çocuklar', name_en: 'Education & Children',
    questions: [
      { slug: 'own_education', type: 'single_choice', label_tr: 'En yüksek eğitim seviyeniz?', label_en: 'Highest education?',
        options: [opt('highschool','Lise','High school'),opt('associate','Ön lisans','Associate'),opt('bachelor','Lisans','Bachelor'),opt('master','Yüksek lisans','Master'),opt('phd','Doktora','PhD')] },
      { slug: 'kids_school_type', type: 'single_choice', label_tr: 'Çocuklarınızın okul türü?', label_en: 'Children school type?',
        depends_on: { question_slug: 'has_children', equals: 'true' },
        options: [opt('state','Devlet','State'),opt('private','Özel','Private'),opt('grammar','Grammar','Grammar'),opt('homeschool','Ev eğitimi','Home-school'),opt('na','Uygun değil','N/A')] },
      { slug: 'supplementary_turkish_school', type: 'boolean', label_tr: 'Çocuklarınız Türkçe okuluna/derse gidiyor mu?', label_en: 'Attend Turkish supplementary school?',
        depends_on: { question_slug: 'has_children', equals: 'true' } },
      { slug: 'education_satisfaction', type: 'scale_likert', label_tr: 'Çocuklarımın eğitiminden memnunum', label_en: 'Satisfied with children education', config: LIKERT_5,
        depends_on: { question_slug: 'has_children', equals: 'true' } },
    ],
  },
  {
    slug: 'civic-trust', country_code: null, icon: 'landmark',
    name_tr: 'Sivil Katılım & Kurumlara Güven', name_en: 'Civic Engagement & Trust',
    questions: [
      { slug: 'volunteering', type: 'single_choice', label_tr: 'Gönüllülük yapıyor musunuz?', label_en: 'Do you volunteer?',
        options: [opt('no','Hayır','No'),opt('sometimes','Ara sıra','Sometimes'),opt('regular','Düzenli','Regularly')] },
      { slug: 'community_events', type: 'single_choice', label_tr: 'Türk topluluk etkinliklerine katılım sıklığınız?', label_en: 'Attend community events?',
        options: [opt('never','Hiç','Never'),opt('yearly','Yılda birkaç','A few/year'),opt('monthly','Ayda bir','Monthly'),opt('often','Sık','Often')] },
      { slug: 'civic_registration', type: 'multi_choice', label_tr: 'Şunlardan hangilerine kayıtlısınız?', label_en: 'Registered for?',
        options: [opt('gp','GP','GP'),opt('voter','Seçmen (oy)','Voter'),opt('council','Yerel konsey hizmetleri','Local council services'),opt('associations','Türk dernekleri','Turkish associations'),opt('none','Hiçbiri','None')] },
      { slug: 'trust_institutions', type: 'matrix', label_tr: 'Şu kurumlara güveniniz (1-5)', label_en: 'Trust in institutions (1-5)',
        config: { rows_tr: ['Yerel konsey','NHS','Polis','Medya','Türk dernekleri'],
                  rows_en: ['Local council','NHS','Police','Media','Turkish associations'],
                  columns: [1,2,3,4,5] } },
    ],
  },
  {
    slug: 'lifestyle', country_code: null, icon: 'dumbbell',
    name_tr: 'Hobi / Spor / Kişisel Gelişim', name_en: 'Hobbies / Sport / Growth',
    questions: [
      { slug: 'hobbies', type: 'multi_choice', label_tr: 'İlgi alanlarınız?', label_en: 'Interests?',
        options: [opt('sport','Spor','Sport'),opt('music','Müzik','Music'),opt('reading','Okuma','Reading'),opt('travel','Gezi','Travel'),opt('gaming','Oyun','Gaming'),opt('cooking','Yemek','Cooking'),opt('volunteering','Gönüllülük','Volunteering'),opt('courses','Kurslar','Courses')] },
      { slug: 'exercise_freq', type: 'single_choice', label_tr: 'Haftalık egzersiz sıklığı?', label_en: 'Exercise frequency?',
        options: [opt('none','Hiç','None'),opt('1-2','1-2','1-2'),opt('3-4','3-4','3-4'),opt('5+','5+','5+')] },
      { slug: 'learning_goal', type: 'open_text', label_tr: 'Bu yıl geliştirmek istediğiniz bir beceri?', label_en: 'A skill to develop this year?', config: { maxlength: 200 } },
    ],
  },

  // ===================== UK-ÖZEL =====================
  {
    slug: 'immigration', country_code: 'UK', icon: 'file-badge',
    name_tr: 'Vize / Göçmenlik', name_en: 'Visa / Immigration',
    questions: [
      { slug: 'immigration_status', type: 'single_choice', label_tr: 'Mevcut statünüz?', label_en: 'Current status?',
        options: [opt('visa','Vize sahibi','Visa holder'),opt('ilr','ILR','ILR'),opt('citizen','Vatandaş','Citizen'),opt('applying','Başvuru sürecinde','Applying')] },
      { slug: 'visa_type', type: 'dropdown', label_tr: 'Vize türünüz?', label_en: 'Visa type?',
        depends_on: { question_slug: 'immigration_status', equals: 'visa' },
        options: [opt('skilled','Skilled Worker','Skilled Worker'),opt('student','Student','Student'),opt('graduate','Graduate','Graduate'),opt('spouse','Spouse/Family','Spouse/Family'),opt('gt','Global Talent','Global Talent'),opt('innovator','Innovator/Startup','Innovator/Startup'),opt('other','Diğer','Other')] },
      { slug: 'visa_process_rating', type: 'nps', label_tr: 'Göçmenlik sürecini ne kadar sorunsuz buldunuz? (0-10)', label_en: 'How smooth was the process? (0-10)', config: NPS },
      { slug: 'visa_cost_concern', type: 'scale_likert', label_tr: 'Vize/BRP maliyetleri beni zorluyor', label_en: 'Visa costs are a burden', config: LIKERT_5 },
    ],
  },
  {
    slug: 'ilr-citizenship', country_code: 'UK', icon: 'stamp',
    name_tr: 'ILR & Vatandaşlık', name_en: 'ILR & Citizenship',
    questions: [
      { slug: 'ilr_timeline', type: 'single_choice', label_tr: 'ILR’a ne kadar kaldı/ne zaman aldınız?', label_en: 'ILR timeline?',
        options: [opt('have','Aldım','Have it'),opt('lt1','<1 yıl','<1 year'),opt('1-2','1-2 yıl','1-2 years'),opt('3-5','3-5 yıl','3-5 years'),opt('na','Uygun değil','N/A')] },
      { slug: 'citizenship_intent', type: 'single_choice', label_tr: 'Vatandaşlık başvurusu düşünüyor musunuz?', label_en: 'Consider citizenship?',
        options: [opt('done','Başvurdum/aldım','Applied/have it'),opt('yes','Evet','Yes'),opt('unsure','Kararsız','Undecided'),opt('no','Hayır','No')] },
      { slug: 'life_in_uk_test', type: 'boolean', label_tr: 'Life in the UK testini geçtiniz mi?', label_en: 'Passed Life in the UK test?' },
    ],
  },
  {
    slug: 'insurance-pension', country_code: 'UK', icon: 'shield',
    name_tr: 'Sigorta / Pension / Tasarruf', name_en: 'Insurance / Pension / Savings',
    questions: [
      { slug: 'pension_type', type: 'multi_choice', label_tr: 'Emeklilik planınız?', label_en: 'Pension setup?',
        options: [opt('workplace','Workplace pension','Workplace pension'),opt('sipp','Private/SIPP','Private/SIPP'),opt('state','Devlet','State'),opt('none','Yok','None')] },
      { slug: 'has_isa', type: 'boolean', label_tr: 'ISA hesabınız var mı?', label_en: 'Have an ISA?' },
      { slug: 'insurance_products', type: 'multi_choice', label_tr: 'Sahip olduğunuz sigortalar?', label_en: 'Insurance held?',
        options: [opt('life','Hayat','Life'),opt('health','Sağlık','Health'),opt('home','Home/contents','Home/contents'),opt('travel','Seyahat','Travel'),opt('gadget','Gadget','Gadget'),opt('none','Yok','None')] },
      { slug: 'has_side_income', type: 'boolean', label_tr: 'Yan geliriniz var mı?', label_en: 'Side income?' },
      { slug: 'investment_types', type: 'multi_choice', label_tr: 'Hangi yatırım araçlarını kullanıyorsunuz?', label_en: 'Investment vehicles?',
        options: [opt('isa','ISA','ISA'),opt('stocks','Hisse/ETF','Stocks/ETF'),opt('crypto','Kripto','Crypto'),opt('property','Gayrimenkul','Property'),opt('pension','Pension katkısı','Pension top-up'),opt('none','Yok','None')] },
    ],
  },
  {
    slug: 'online-services-uk', country_code: 'UK', icon: 'smartphone',
    name_tr: 'Online Hizmetler (UK)', name_en: 'Online Services (UK)',
    questions: [
      { slug: 'banking', type: 'single_choice', label_tr: 'Ana bankanız?', label_en: 'Main bank?',
        options: ['Monzo','Starling','Barclays','HSBC','Lloyds','NatWest','Revolut'].map(v => opt(v, v, v)).concat([opt('other','Diğer','Other')]) },
      { slug: 'streaming', type: 'multi_choice', label_tr: 'Kullandığınız abonelikler?', label_en: 'Subscriptions?',
        options: ['Netflix','Disney+','Prime','Spotify','YouTube Premium','BBC iPlayer'].map(v => opt(v, v, v)).concat([opt('other','Diğer','Other')]) },
      { slug: 'delivery_apps', type: 'multi_choice', label_tr: 'Yemek/teslimat uygulamaları?', label_en: 'Delivery apps?',
        options: [opt('deliveroo','Deliveroo','Deliveroo'),opt('ubereats','Uber Eats','Uber Eats'),opt('justeat','Just Eat','Just Eat'),opt('getir','Getir','Getir'),opt('none','Hiç','None')] },
      { slug: 'service_satisfaction', type: 'nps', label_tr: 'UK’deki dijital hizmetlerden genel memnuniyet (0-10)?', label_en: 'Overall satisfaction with UK digital services? (0-10)', config: NPS },
    ],
  },
];

// ----------------------------------------------------------------------------
// UPSERT yardımcıları (idempotent)
// ----------------------------------------------------------------------------
async function findOne(collection: string, filter: Record<string, unknown>) {
  const rows = await client.request(readItems(collection as any, { filter: filter as any, limit: 1 }));
  return (rows as any[])[0] ?? null;
}

async function upsert(collection: string, unique: Record<string, unknown>, data: Record<string, unknown>) {
  const existing = await findOne(collection, unique);
  if (existing) {
    await client.request(updateItem(collection as any, existing.id, data as any));
    return existing.id;
  }
  const created = await client.request(createItem(collection as any, { ...unique, ...data } as any));
  return (created as any).id;
}

// ----------------------------------------------------------------------------
// Çalıştırma
// ----------------------------------------------------------------------------
async function run() {
  // 1) country
  await upsert(col('countries'), { code: 'UK' }, {
    name_tr: 'Birleşik Krallık', name_en: 'United Kingdom',
    is_active: true, launch_year: 2026, currency: 'GBP', flag_emoji: '🇬🇧', sort_order: 1,
  });

  // 2) edition
  const editionId = await upsert(col('survey_editions'),
    { country_code: EDITION.country_code, year: EDITION.year },
    { title_tr: EDITION.title_tr, title_en: EDITION.title_en, status: EDITION.status });

  // 3) categories + questions + options
  let catOrder = 0;
  for (const cat of CATEGORIES) {
    catOrder += 10;
    const categoryId = await upsert(col('categories'),
      { slug: cat.slug, edition_id: editionId },
      {
        edition_id: editionId,
        country_code: cat.country_code,
        name_tr: cat.name_tr, name_en: cat.name_en,
        description_tr: cat.description_tr ?? '', description_en: cat.description_en ?? '',
        icon: cat.icon ?? null,
        is_optional: cat.is_optional ?? true,
        status: 'active',
        sort_order: catOrder,
      });

    let qOrder = 0;
    for (const q of cat.questions) {
      qOrder += 10;
      const questionId = await upsert(col('questions'),
        { slug: q.slug, category_id: categoryId },
        {
          category_id: categoryId,          // ZORUNLU
          edition_id: editionId,
          country_code: cat.country_code,
          type: q.type,
          label_tr: q.label_tr, label_en: q.label_en,
          help_tr: q.help_tr ?? '', help_en: q.help_en ?? '',
          is_required: q.is_required ?? false,
          status: 'active',
          sort_order: qOrder,
          config: q.config ?? null,
          depends_on: q.depends_on ?? null,
        });

      // options
      if (q.options?.length) {
        let oOrder = 0;
        for (const o of q.options) {
          oOrder += 10;
          await upsert(col('question_options'),
            { question_id: questionId, value: o.value },
            { question_id: questionId, label_tr: o.label_tr, label_en: o.label_en, sort_order: oOrder });
        }
      }
    }
  }

  const totalQ = CATEGORIES.reduce((n, c) => n + c.questions.length, 0);
  console.log(`Seed complete: 1 country, 1 edition, ${CATEGORIES.length} categories, ${totalQ} questions.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
