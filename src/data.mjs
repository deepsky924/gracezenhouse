// Business content, sourced from the live gracezenhouse.com (Sept 2026).
// Everything the site says about Grace Zen House lives here.

const SQUARE = 'https://book.squareup.com/appointments/uygy7dzwjc2w1n/location/L7T5J8AT26S97/services';
const sq = (id) => `${SQUARE}/${id}`;

export const site = {
  name: 'Grace Zen House',
  url: 'https://gracezenhouse.com',
  tagline: 'Holistic Skincare & Energy Healing',
  description:
    'A sanctuary of calm where expert skincare meets energy healing. Facials, Reiki and waxing in Rancho Cucamonga.',
  bookingUrl: SQUARE,
  phone: '(626) 806-5016',
  phoneHref: 'tel:+16268065016',
  email: 'salientbeauty@icloud.com',
  instagram: { handle: '@ggbeauty.ie', url: 'https://www.instagram.com/ggbeauty.ie' },
  hours: 'By appointment only',
  address: {
    street: '7365 Carnelian St, Suite 222A',
    city: 'Rancho Cucamonga',
    region: 'CA',
    postal: '91730',
    landmark: 'Haven Village Shopping Center',
  },
  geo: { lat: 34.1006509, lng: -117.6067755 },
  rating: { value: '5.0', count: 24 },
  reviewsUrl: 'https://www.google.com/maps/search/?api=1&query=Grace+Zen+House+Rancho+Cucamonga',
  themeColor: '#F4EEE4',
  // Fill in to enable. Booking clicks are sent as a "Book" event with the service name.
  analytics: { plausibleDomain: '' },
  // Google Search Console HTML-tag verification token (content="…" value only).
  googleSiteVerification: '',
};

site.address.full = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postal}`;
site.mapsQuery = encodeURIComponent(`${site.address.full}`);
site.mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.mapsQuery}`;

// PLACEHOLDER — replace with the owner's real name and credentials.
export const owner = {
  isPlaceholder: true,
  name: 'Grace [Last Name]',
  title: 'Founder, Esthetician & Reiki Master',
  credentials: [
    '[Licensed Esthetician, California — License # ______]',
    '[Usui Reiki Master — level / lineage]',
    '[Additional certifications, e.g. Circadia, HydraFacial]',
  ],
  bio: [
    'I’m a certified esthetician and Reiki master with [over a decade — confirm years] of experience. I trained in both advanced facials and the practice of Usui Reiki, so I can care for your skin and your nervous system in the same visit.',
    'I believe everyone deserves to feel radiant in their own skin, and I tailor every session to make that happen.',
  ],
};

export const testimonials = [
  {
    quote:
      'I feel blessed to have the Reiki experience I had. I’m just in awe to be honest. She is a beautiful being with a beautiful spirit that is very gifted. I felt the energy move through different parts of my body. I felt so relaxed and happy afterwards.',
    author: 'Sharon Mitchell',
    service: 'Reiki',
  },
  {
    quote:
      'Grace is AMAZING! She is so kind and welcoming every visit, making your experience very personalized. She always knows just what you need depending on your skin type and concerns. Her facials are so relaxing and rejuvenating — and her space is adorable.',
    author: 'Ally French',
    service: 'Facials',
  },
  {
    quote:
      'Great experience! Grace is so helpful and listens to her clients. It also helps that she has a super calming personality. If you’re having a rough day it might do you good just to hang out with her for an hour.',
    author: 'E. O.',
    service: 'Facials',
  },
  {
    quote: 'Great service! Very friendly and calm. I loved the scalp massage and how smooth my skin feels.',
    author: 'Crystal Arriola',
    service: 'Facials',
  },
  {
    quote: 'Grace was very professional and did an amazing job. I feel brand new.',
    author: 'Coleen Smith',
    service: 'Facials',
  },
];

// ── Facials ────────────────────────────────────────────────────────────────
// `summary`/`includes`/`benefits` come from the live service menu; the
// longer `about`/`steps`/care copy comes from the live treatment pages.
export const facials = [
  {
    slug: 'custom-facial',
    name: 'Custom Facial',
    price: 150,
    book: sq('ZCQVYNXTRGPSWUOVGTBINXHJ'),
    summary: 'A personalized facial designed specifically for your skin’s needs. Ideal for both men and women.',
    benefits: ['Addresses individual skin concerns', 'Nourishment', 'Relaxation', 'Skin restoration'],
    note: 'For best results, facials are recommended every four weeks — skin cell turnover typically takes about one month.',
    related: ['hydrafacial', 'sensitive-skin-facial'],
  },
  {
    slug: 'dermaplaning-facial',
    name: 'Dermaplaning Facial',
    price: 130,
    book: sq('XPPW22DJX4ZB4PHS3D7PLJBW'),
    summary: 'Removes peach fuzz (vellus hair) and dead skin for an instantly smoother, brighter surface.',
    about:
      'Dermaplaning is a manual exfoliation method that uses a sterile blade to gently remove dead skin cells and fine vellus hair. The result is an immediately smoother surface, a brighter complexion, and better absorption of your skincare.',
    includes: ['Double cleanse', 'Skin analysis', 'Dermaplaning', 'Enzyme treatment', 'Extractions', 'Finishing products'],
    benefits: [
      'Instantly softer, more radiant skin',
      'Removes peach fuzz for smoother makeup application',
      'Enhances penetration of serums and moisturizers',
      'Non-invasive, with no downtime',
    ],
    ideal:
      'Dry, rough texture or unwanted facial hair — and a luminous glow before a special event. Not suitable for active acne or rosacea-prone skin.',
    before: 'Avoid exfoliating products and retinoids for 3 days prior.',
    after: 'Keep skin hydrated, avoid direct sun, and always wear SPF. Avoid harsh scrubs for a week.',
    note: 'Optional customized nourishing mask available for an additional $20.',
    related: ['microdermabrasion', 'custom-facial'],
  },
  {
    slug: 'microdermabrasion',
    name: 'Microdermabrasion',
    price: 150,
    book: sq('TIE7HVRW7ZWIYDFVNFB3PW2Y'),
    summary:
      'Professional microdermabrasion paired with award-winning Circadia products and an antioxidant Cocoa Enzyme treatment.',
    about:
      'A precision diamond tip gently exfoliates the outermost layer of dead skin cells. This non-invasive treatment improves texture, softens the look of fine lines, and helps your products absorb — leaving a refreshed, even-toned complexion.',
    benefits: ['Deep exfoliation', 'Skin resurfacing', 'Brighter complexion', 'Smoother texture', 'Healthy glow'],
    ideal:
      'Tired, dull skin — particularly sun damage, age spots, mild acne scarring or uneven texture. Not recommended for active rosacea or severe sensitivity.',
    steps: [
      'Your skin is cleansed and prepped.',
      'The diamond-tipped wand is passed gently over the face with a mild vacuum sensation.',
      'A soothing serum and SPF are applied.',
      'No downtime — resume your day with a healthy glow.',
    ],
    before: 'Avoid retinols, acids and sun exposure for 3 days prior. Arrive with clean skin.',
    after: 'Use gentle skincare, avoid direct sun and heat, and apply a high-SPF moisturizer.',
    faq: [
      [
        'How often should I get microdermabrasion?',
        'For best results, a series of 4–6 treatments spaced 2–4 weeks apart, followed by monthly maintenance.',
      ],
      [
        'Is microdermabrasion safe for all skin types?',
        'Yes, when performed by a trained professional. The intensity is customized to your skin’s tolerance.',
      ],
    ],
    related: ['dermaplaning-facial', 'hydrafacial'],
  },
  {
    slug: 'hydrafacial',
    name: 'Hydrafacial',
    price: 150,
    book: sq('MIZ5KR53GO4Q6TZPIMJUBSBL'),
    summary: 'A deep cleansing and hydrating facial — cleanse, extract and hydrate in a single treatment.',
    includes: [
      'Double cleanse',
      'Skin analysis',
      'Hydrafacial system',
      'Enzyme treatment',
      'Extractions',
      'Hydrojelly mask',
      'Finishing products',
    ],
    benefits: ['Hyperpigmentation', 'Congestion', 'Dehydration', 'Overall skin rejuvenation'],
    benefitsLabel: 'Excellent for',
    ideal:
      'Anyone wanting a noticeable glow before an event, or regular maintenance for congested, dehydrated or aging skin.',
    before: 'No special prep needed; avoid strong peels for 3 days before.',
    after: 'Use gentle skincare for 24 hours, avoid heavy makeup, and wear SPF.',
    related: ['oxygen-rx-facial', 'brightening-facial-with-led'],
  },
  {
    slug: 'beyond-botox-facial',
    name: 'Beyond Botox Facial',
    price: 200,
    book: sq('EXPVABQPO56F3LJQNFSW5LJJ'),
    summary: 'An advanced, needle-free anti-aging facial for a lifted, firmer-looking complexion.',
    includes: [
      'Dermaplaning',
      'Removal of dead skin and peach fuzz',
      'Gel-based peel',
      'Hydration',
      'Peptide-rich firming mask',
    ],
    benefits: [
      'Supports collagen',
      'Improved elasticity',
      'Softens the look of wrinkles',
      'Firmer skin',
      'Enhanced circulation',
      'Youthful glow',
    ],
    ideal: 'Adults with early to moderate signs of aging who want a non-invasive alternative.',
    before: 'Avoid alcohol and heavy meals the night before.',
    after: 'Drink plenty of water, avoid high-intensity workouts for 4 hours, and use gentle products.',
    related: ['firming-peptide-facial', 'c-peptide-facial'],
  },
  {
    slug: 'swich-treatment',
    name: 'SWiCH Treatment',
    price: 165,
    book: sq('F2SIVMT5C2UFDKUAG3C2UJUP'),
    summary:
      'Circadia’s signature alternative to chemical peels. It stimulates the skin’s natural repair mechanisms without causing damage.',
    benefits: ['Brightens skin', 'Tightens skin', 'Encourages younger-looking skin', 'Supports long-term skin renewal'],
    note: 'Recommended as a 3-treatment series. Please book your first treatment before scheduling follow-up sessions.',
    related: ['c-peptide-facial', 'brightening-facial-with-led'],
  },
  {
    slug: 'firming-peptide-facial',
    name: 'Firming Peptide Facial',
    price: 165,
    book: sq('PBQ3MB3DEMJTHO3A7QVEGFYB'),
    summary: 'Advanced peptide technology combined with antioxidants and dermal regeneration science.',
    about:
      'A concentrated peptide complex encourages collagen production. Combined with massage and a firming mask, the treatment focuses on firmness around the jawline, cheeks and neck.',
    benefits: ['Improved microcirculation', 'Purifying', 'Instant firming', 'Tightening', 'Lifting'],
    ideal: 'Anyone noticing a loss of firmness. Suitable for all skin types, including sensitive.',
    steps: [
      'Double cleanse and gentle exfoliation.',
      'Peptide treatment with lymphatic drainage massage.',
      'A firming mask while you rest.',
      'Finishing serums and SPF.',
    ],
    before: 'No special prep needed.',
    after: 'Maintain results with a peptide-rich home regimen, and avoid sun exposure.',
    related: ['beyond-botox-facial', 'c-peptide-facial'],
  },
  {
    slug: 'c-peptide-facial',
    name: 'C Peptide Facial',
    price: 175,
    book: sq('UXXUG7A2AJLUR7BQDPLFIBFO'),
    summary: 'Designed to renew and revitalize aging skin with vitamin C and anti-aging peptides.',
    includes: [
      'Anti-aging peptides',
      'Antioxidants',
      'Stem cells',
      'Botanicals',
      'Vitamin C',
      'Vitamin A',
    ],
    includesLabel: 'Features',
    benefits: ['Brightening', 'Tightening', 'Exfoliation', 'Supports skin renewal', 'Improved firmness', 'Radiant glow'],
    ideal: 'Dull, sun-damaged or pigmented skin — a pre-event glow or regular maintenance.',
    before: 'Avoid retinoids for 2 days before.',
    after: 'Wear SPF diligently and continue with a vitamin C serum at home.',
    related: ['brightening-facial-with-led', 'firming-peptide-facial'],
  },
  {
    slug: 'brightening-facial-with-led',
    name: 'Brightening Facial with LED',
    price: 180,
    book: sq('5HRLICNCSFTAZ62VZ7IN7PGT'),
    summary: 'A luxurious facial designed to soften visible signs of aging and restore luminosity.',
    includes: ['Raspberry Enzyme Mask', 'Australian Super-Berries', 'LED red light therapy'],
    includesLabel: 'Features',
    benefits: ['Brightens skin', 'Supports collagen', 'Supports elastin', 'Energizes tired-looking skin', 'Boosts luminosity'],
    related: ['triple-berry-brightening', 'c-peptide-facial'],
  },
  {
    slug: 'oxygen-rx-facial',
    name: 'Oxygen RX Facial',
    price: 155,
    book: sq('JN5SC77NPHIHJOK5C5IVH42U'),
    summary: 'Oxygen is introduced into the skin to support healthier skin function. Suitable for all skin types.',
    includes: ['Acne', 'Rosacea', 'Sensitive skin', 'Inflamed skin', 'Pre-event glow'],
    includesLabel: 'Excellent for',
    benefits: [
      'Purifying, clarifying action',
      'Helps clear breakouts',
      'Calms redness',
      'Skin brightening',
      'Softens the look of sun damage',
      'Improved circulation',
      'Collagen support',
      'Better hydration',
    ],
    related: ['hydrafacial', 'sensitive-skin-facial'],
  },
  {
    slug: 'sensitive-skin-facial',
    name: 'Sensitive Skin Facial',
    price: 115,
    book: sq('OLLMNLGLMOYSFAVKMCUNXK2J'),
    summary: 'A calming treatment for sensitive skin, using Hale & Hush products.',
    benefits: ['Calms irritation', 'Calms redness', 'Soothes itchiness', 'Deep hydration', 'Supports the skin barrier'],
    related: ['custom-facial', 'oxygen-rx-facial'],
  },
  {
    slug: 'acneic-skin-facial',
    name: 'Acneic Skin Facial',
    price: 110,
    book: sq('DSKOUHZAEZ7YVR2U3P6CFYS4'),
    summary: 'Designed for normal to oily skin that’s prone to breakouts and congestion.',
    benefits: ['Purifying', 'Clarifying', 'Brightening', 'Balances oil', 'Helps clear breakouts', 'Reduced congestion'],
    related: ['custom-facial', 'microdermabrasion'],
  },
  {
    slug: 'triple-berry-brightening',
    name: 'Triple Berry Brightening Facial',
    price: 155,
    book: sq('H3YSR4DE2I5YSUOGPL2XUDSW'),
    summary: 'Australian Riberry, Muntries and Pepperberries for bright, deeply hydrated skin.',
    benefits: ['Brightens skin', 'Deep hydration', 'Revives dull skin', 'Helps with sun damage', 'Helps with hyperpigmentation'],
    note: 'Recommended every four weeks.',
    related: ['brightening-facial-with-led', 'c-peptide-facial'],
  },
  {
    slug: 'customized-back-facial',
    name: 'Customized Back Facial',
    price: 155,
    book: sq('GKZWAXJG36GLUSYVP6V77AKX'),
    summary: 'A deep-cleansing back treatment, customized to what your skin needs.',
    benefits: ['Acne', 'Pigmentation', 'Aging skin', 'Individual skin concerns'],
    benefitsLabel: 'Addresses',
    related: ['acneic-skin-facial', 'custom-facial'],
  },
];

// Shown on every facial page. Facts from the live site's About and Contact pages.
export const facialVisit = [
  ['Tailored on the day', 'Every facial begins with a thorough skin analysis, so the treatment matches what your skin needs that day.'],
  ['Tell us what you need', 'Share any skin concerns, allergies or special requests when you book, and we’ll plan around them.'],
  ['Keep a rhythm', 'Facials are recommended every four weeks — skin cell turnover typically takes about one month.'],
];

// Menu groups (by goal). Custom Facial is the suggested starting point.
export const startHere = 'custom-facial';
export const facialGroups = [
  {
    name: 'Glow & hydration',
    intro: 'For dull, dehydrated or tired-looking skin.',
    slugs: ['hydrafacial', 'oxygen-rx-facial', 'brightening-facial-with-led', 'triple-berry-brightening', 'dermaplaning-facial'],
  },
  {
    name: 'Firming & anti-aging',
    intro: 'For fine lines, firmness and long-term renewal.',
    slugs: ['beyond-botox-facial', 'firming-peptide-facial', 'c-peptide-facial', 'swich-treatment'],
  },
  {
    name: 'Clear & calm',
    intro: 'For breakouts, congestion and sensitive or reactive skin.',
    slugs: ['acneic-skin-facial', 'sensitive-skin-facial', 'microdermabrasion', 'customized-back-facial'],
  },
];

// Shown beside every Book action. Facts only — add a cancellation policy once the owner confirms it.
export const reassurance = [
  'You’ll see Grace herself, every visit',
  'Pick your time online — Square handles the booking',
  'Not sure yet? Call and I’ll help you choose',
];

// Practical first-visit notes the owner still needs to confirm (arrival time, parking,
// what to wear for Reiki, rescheduling policy). Each entry: [title, text]. Shown on every
// service page once filled in; left empty so nothing is invented.
export const visitNotes = [];

export const concernGuide = [
  ['Anti-aging & wrinkles', ['beyond-botox-facial', 'firming-peptide-facial', 'c-peptide-facial']],
  ['Dullness & uneven tone', ['brightening-facial-with-led', 'triple-berry-brightening', 'dermaplaning-facial']],
  ['Acne & congestion', ['acneic-skin-facial', 'custom-facial', 'microdermabrasion']],
  ['Sensitivity & redness', ['sensitive-skin-facial', 'custom-facial']],
  ['Deep hydration', ['hydrafacial', 'oxygen-rx-facial', 'custom-facial']],
  ['Back breakouts', ['customized-back-facial']],
];

// ── Reiki ──────────────────────────────────────────────────────────────────
export const reiki = [
  {
    slug: 'reiki',
    name: 'Reiki',
    fullName: 'Usui Reiki Session',
    price: 111,
    book: sq('2IVHXLKBDYWQ742VSCPBYIKJ'),
    summary: 'An in-person Usui Reiki session to release stress and restore inner calm.',
    about: [
      'Reiki is a gentle, non-invasive energy healing practice originating in Japan. It uses light hand placements with the intention of guiding the flow of healthy energy through the body, helping to ease stress, fatigue and tension and to promote a sense of well-being.',
      'The universal energy flows not from the practitioner but through the practitioner to the recipient. Once you are relaxed — physically, mentally, emotionally and spiritually — well-being can take place.',
    ],
    benefits: [
      'Eases stress and worry',
      'Helps release physical and emotional tension',
      'Encourages deep rest and relaxation',
      'Many clients report calmer sleep and a clearer mind',
    ],
    steps: [
      'You lie down, fully clothed, in a quiet, dimly lit treatment room.',
      'Hands are placed lightly on or just above the body’s energy centers.',
      'You may feel warmth, tingling, or simply a deep, peaceful relaxation.',
    ],
    stepsLabel: 'What to expect',
  },
  {
    slug: 'distance-reiki',
    name: 'Distance Reiki',
    fullName: 'Distance Reiki · 30 minutes',
    price: 88,
    duration: '30 minutes',
    book: sq('FLHORDA3KDZRP75DS75L5VFC'),
    summary: 'A 30-minute remote Reiki session, received from the comfort of your own home.',
    about: [
      'Distance Reiki allows you to receive the restorative benefits of Reiki from anywhere. It is designed to be just as effective as an in-person session, allowing deep relaxation in your own familiar space.',
    ],
    benefits: [
      'No travel required — ideal for busy schedules or limited mobility',
      'Deep relaxation in your own space',
      'Available wherever you are',
      'Emotional balance and stress relief',
    ],
    steps: [
      'We schedule a time when you can lie down undisturbed.',
      'At that time, the practitioner connects with your energy using intention and distance symbols.',
      'You simply relax, close your eyes, and stay open to receiving.',
      'Afterwards, we follow up to talk through any sensations or insights.',
    ],
    stepsLabel: 'How it works',
  },
];

// ── Waxing ─────────────────────────────────────────────────────────────────
export const waxing = {
  groups: [
    {
      name: 'Face',
      items: [
        ['Brow', 20, 'IQEQUOKTU7LMX32TP272NS7C'],
        ['Nose', 10, 'FWXPW6S4NVG6HECM5OLICPFB'],
        ['Upper lip', 10, 'SMNDIKIUAZV3QYGFLJ3TBSGD'],
        ['Chin', 10, 'WYAVD6ZCFYSLDPJPDBUPLDGM'],
        ['Cheeks', 10, 'Q6NRBMPOUOAQH4EZJ4AEY2QJ'],
        ['Sideburns', 10, 'BIQYPT7KJRTKZELZPTCD66RB'],
        ['Ears', 10, 'ITJKPFEJOVWZ5WWWBK33FLLY'],
        ['Full face', 50, 'GCWISRAC256SE7HKBHRC5QGP'],
      ],
    },
    {
      name: 'Body',
      items: [
        ['Neckline', 25, '7CP3SNUKRFVIZTDMSK3CHLJC'],
        ['Underarms', 25, '6CC5MNYWBVFGU3KQE7R6TDZ3'],
        ['Half arm', 30, 'FVTXDICDMZTT53D7W2UV4FK7'],
        ['Full arm', 45, 'JQ3AVYIV6INHMO3QBSTEYV3J'],
        ['Chest', null, 'WIPPE2YL6P2FN2JVHAVYPU6K'],
        ['Stomach', null, 'AXPFJD7YLZNZWTIDB4LWWHTD'],
        ['Half back', 35, '3JUBUIGJJBX5JO2WUVD5M5RR'],
        ['Full back', null, 'CX25FDHUKO6HXIWTD36ZS5CD'],
        ['Back strip', 15, 'OXRK4J6BNACTGEBMEN4T3OMR'],
        ['Half legs', 45, 'CVZSVQ4YWFN3AY5GTHTMWXMK'],
        ['Full legs', 70, 'Z7Q4YCELCUBQWFELFKP43QB6'],
        ['Feet & toes', 15, 'HHORPFGEPIF7FENQSSR6C3A4'],
        ['Full butt', 30, 'OMDUU2REURE4P5RXSKNPJUSL'],
      ],
    },
    {
      name: 'Intimate',
      items: [
        ['Bikini line', 25, '2L64BEYKLIUQYEUG6VXDZFEG'],
        ['Bikini', 50, 'BTS5HP7XRUTGKNHCQU4VZDDB'],
        ['Brazilian', 60, '3RHVUIF5KQK7XEP3W7OTBLVR', '/services/waxing-services/brazilian-wax/'],
      ],
    },
    {
      name: 'Full body',
      items: [['Full body wax', 300, 'GMPJJ6NFQ6NYXHDUWR5K7NH2', '/services/waxing-services/full-body-wax/']],
    },
  ].map((g) => ({
    ...g,
    items: g.items.map(([name, price, id, href]) => ({ name, price, book: sq(id), href })),
  })),
  addons: [
    {
      name: 'LED add-on',
      price: 10,
      book: sq('QVQEK27L6J4YCYJX3UDM2JZG'),
      desc: 'Helps improve the look of wrinkles, scars, redness and acne.',
    },
    {
      name: 'Hydrojelly mask (small area)',
      price: 15,
      book: sq('BIUH2X55CUB2HTZXYUJJCQH2'),
      desc: 'Hydrates, soothes, moisturizes and calms inflammation after waxing.',
    },
  ],
  before:
    'For best results, hair should be at least ¼ inch long. Exfoliate the area 24 hours before, and avoid caffeine or alcohol on the day of your appointment.',
  after:
    'Keep the area clean and avoid heat, friction and heavy lotions for 24 hours. Wear loose clothing, and use an aloe-based gel if needed. Exfoliate gently after 48 hours to prevent ingrown hairs.',
  pages: {
    'brazilian-wax': {
      name: 'Brazilian Wax',
      price: 60,
      book: sq('3RHVUIF5KQK7XEP3W7OTBLVR'),
      summary: 'Expert, discreet Brazilian waxing for a smooth, confident bikini area.',
      about: [
        'A Brazilian wax removes hair from front to back. Using gentle, high-quality wax, the treatment is performed efficiently and respectfully to minimize discomfort — and tailored to your preference, from a landing strip to fully bare.',
      ],
      benefits: [
        'Smoothness that lasts 4–6 weeks',
        'Less irritation than shaving',
        'Precise technique for clean edges',
        'A private, serene treatment room',
      ],
      steps: [
        'You’re positioned comfortably on the treatment table; disposable garments are provided.',
        'The area is cleansed and a pre-wax oil applied to protect the skin.',
        'Warm wax is applied in small sections and quickly removed.',
        'A soothing lotion is applied and we talk through aftercare.',
      ],
      after:
        'Avoid hot baths, steam rooms, exercise, tight clothing and sexual activity for 24 hours. Exfoliate gently after 2–3 days, and wear breathable cotton underwear.',
    },
    'full-body-wax': {
      name: 'Full Body Wax',
      price: 300,
      priceNote: 'Customizable; final price confirmed during consultation.',
      book: sq('GMPJJ6NFQ6NYXHDUWR5K7NH2'),
      summary: 'Head-to-toe smoothness in one comprehensive session.',
      about: [
        'From face to legs, arms, back and intimate areas, unwanted hair is carefully removed with efficiency and skill. Ideal before vacations and weddings, or whenever you want a completely fresh start.',
        'A full body wax typically covers full legs, arms, underarms, back, chest and stomach as needed, the bikini area and face. The package can be customized to include or exclude specific areas, and a consultation beforehand makes sure it matches your preferences.',
      ],
    },
  },
};

export const facialBySlug = Object.fromEntries(facials.map((f) => [f.slug, f]));
