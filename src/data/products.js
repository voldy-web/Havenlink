import { photo } from './photos'

// Mock shop products. Later these come from the backend
// (see src/services/productService.js).
//   category   id from data/shopOptions.js
//   oldPrice   optional "was" price, shown crossed out
//   options    optional choices the buyer makes on the product page:
//              { name, choices: [{ label, extra }] }  (extra = added price)
//   gallery    extra photos for the product page (the first is `image`)
const bed = photo('shop-bed')
const sofa = photo('shop-sofa')
const fridge = photo('shop-fridge')
const dining = photo('shop-dining')
const desk = photo('shop-desk')
const linen = photo('shop-linen')
const sofaMain = photo('sofa-main')
const sofa2 = photo('sofa-2')
const sofa3 = photo('sofa-3')
const sofa4 = photo('sofa-4')
const wardrobe = photo('home-wardrobe-room')
const loungeSofa = photo('home-sofa-lounge')
const bedding = photo('home-blue-bedroom')
const sectional = photo('home-city-lounge')
const greyKitchen = photo('home-grey-kitchen')
const diningSet = photo('home-dining-room')

export const products = [
  {
    id: 1, sku: 'HL-BD-1001', name: 'Nordic Oak Platform Bed Frame (Queen)', category: 'beds',
    vendor: 'Haven Studio', material: 'Solid Oak', price: 2400, rating: 4.9, reviews: 142,
    badge: 'Best Seller', tag: 'Fits standard bedrooms', dims: '160W x 200L cm', feature: 'Solid Scandinavian white oak',
    delivery: 'Free assembly', stock: 12, image: bed,
    description: 'A low, clean-lined platform bed in solid white oak with a sturdy slatted base. No box spring needed.',
    specs: [['Size', 'Queen, 160 x 200 cm'], ['Frame', 'Solid white oak'], ['Base', 'Slatted, supports 300 kg'], ['Assembly', 'About 30 minutes, free'], ['Warranty', '5 years']],
    options: [{ name: 'Finish', choices: [{ label: 'Natural Oak', extra: 0 }, { label: 'Walnut Stain', extra: 150 }] }],
  },
  {
    id: 2, sku: 'HL-SF-8802', name: 'Kanso Bouclé Modular 3-Seater Sofa', category: 'couches',
    vendor: 'Nordic Living Co', material: 'Bouclé & Linen', price: 3900, oldPrice: 5100, rating: 4.85, reviews: 94,
    badge: 'White-Glove Included', tag: 'Fits service elevators', dims: '224W x 91D cm', feature: 'Stain-resistant weave',
    delivery: 'Free delivery & assembly', stock: 4, image: sofa, gallery: [sofaMain, sofa2, sofa3, sofa4],
    description: 'Handcrafted modular seating with a stain-resistant textured bouclé and a solid kiln-dried ash frame. Low, rounded and made for apartment living.',
    specs: [['Width', '224 cm'], ['Depth', '91 cm'], ['Seat height', '42 cm'], ['Frame', 'Kiln-dried ash'], ['Fabric', 'Stain-resistant bouclé'], ['Warranty', '10 years on the frame']],
    options: [
      { name: 'Upholstery', choices: [{ label: 'Warm Oat', extra: 0 }, { label: 'Stone Grey', extra: 0 }, { label: 'Forest Green', extra: 0 }, { label: 'Terracotta', extra: 0 }] },
      { name: 'Layout', choices: [{ label: '3-Seater Standard', extra: 0 }, { label: 'Left Chaise', extra: 550 }, { label: '4-Seater Corner', extra: 1200 }] },
    ],
  },
  {
    id: 3, sku: 'HL-AP-3120', name: 'Bosch Serie 6 Smart Counter-Depth Fridge', category: 'appliances',
    vendor: 'Bosch Home', material: 'Stainless Steel', price: 6800, rating: 4.9, reviews: 76,
    badge: 'Energy Efficient', tag: 'Water hookup service available', dims: '91W x 178H cm', feature: 'Wi-Fi HomeConnect',
    delivery: 'Free delivery & unboxing', stock: 6, image: fridge,
    description: 'A counter-depth smart fridge freezer that sits flush with your kitchen units, with quiet inverter cooling and a water dispenser.',
    specs: [['Capacity', '600 litres'], ['Width', '91 cm'], ['Height', '178 cm'], ['Finish', 'Stainless steel'], ['Energy rating', 'A+'], ['Warranty', '2 years']],
  },
  {
    id: 4, sku: 'HL-DN-2204', name: 'Eames Style Walnut Dining Table (Seats 6)', category: 'dining',
    vendor: 'Haven Studio', material: 'Walnut', price: 3300, rating: 4.8, reviews: 63,
    badge: 'Solid Wood', tag: 'Dining area friendly', dims: '152L x 91W cm', feature: 'FSC-certified walnut',
    delivery: 'Setup: 20 mins', stock: 8, image: dining,
    description: 'A timeless round-edged walnut table that seats six comfortably and is finished with a hard-wearing oil.',
    specs: [['Length', '152 cm'], ['Width', '91 cm'], ['Height', '75 cm'], ['Top', 'FSC-certified walnut'], ['Seats', '6'], ['Warranty', '3 years']],
  },
  {
    id: 5, sku: 'HL-DK-5560', name: 'Ergonomic Dual-Motor Standing Desk 140', category: 'dining',
    vendor: 'Nordic Living Co', material: 'Solid Oak', price: 2600, rating: 4.92, reviews: 188,
    badge: 'Haven Work', tag: 'Pre-wired cable track', dims: '140W x 70D cm', feature: '4 memory presets',
    delivery: 'Fast delivery', stock: 15, image: desk,
    description: 'A quiet dual-motor sit-stand desk with four memory presets, a built-in cable track and a solid oak top.',
    specs: [['Top size', '140 x 70 cm'], ['Height range', '62-128 cm'], ['Lift capacity', '100 kg'], ['Motors', 'Dual, whisper-quiet'], ['Presets', '4'], ['Warranty', '5 years']],
  },
  {
    id: 6, sku: 'HL-BD-1120', name: 'Luxe Organic Percale Linen Sheet & Duvet Set', category: 'beds',
    vendor: 'Haven Living', material: 'Bouclé & Linen', price: 950, rating: 4.78, reviews: 210,
    badge: '100% Organic', tag: 'Oeko-Tex certified', dims: 'Queen / King', feature: 'Pre-washed pure linen',
    delivery: 'Standard 2-day delivery', stock: 40, image: linen,
    description: 'Pre-washed pure linen that gets softer with every wash. Includes a fitted sheet, duvet cover and two pillowcases.',
    specs: [['Material', '100% organic linen'], ['Includes', 'Fitted sheet, duvet cover, 2 pillowcases'], ['Care', 'Machine wash at 40 degrees'], ['Certification', 'Oeko-Tex Standard 100']],
    options: [{ name: 'Size', choices: [{ label: 'Queen', extra: 0 }, { label: 'King', extra: 120 }] }],
  },
  {
    id: 7, sku: 'HL-ST-4410', name: 'Fluted Oak Sideboard & Storage Cabinet', category: 'wardrobes',
    vendor: 'Haven Studio', material: 'Solid Oak', price: 2900, rating: 4.86, reviews: 58,
    badge: 'Handmade', tag: 'Fits hallways & bedrooms', dims: '160W x 40D x 80H cm', feature: 'Fluted solid oak doors',
    delivery: 'Free assembly', stock: 9, image: wardrobe,
    description: 'A fluted solid oak sideboard with an open storage tower. Soft-close doors and adjustable shelves keep clothes and linens neat.',
    specs: [['Width', '160 cm'], ['Depth', '40 cm'], ['Height', '80 cm'], ['Material', 'Solid oak'], ['Shelves', 'Adjustable'], ['Warranty', '5 years']],
  },
  {
    id: 8, sku: 'HL-SF-8810', name: 'Cream Bouclé Lounge Sofa (3-Seater)', category: 'couches',
    vendor: 'Nordic Living Co', material: 'Bouclé & Linen', price: 3200, rating: 4.8, reviews: 71,
    badge: 'Cozy Pick', tag: 'Fits most living rooms', dims: '210W x 90D cm', feature: 'Soft textured weave',
    delivery: 'Free delivery over GH₵3,000', stock: 7, image: loungeSofa,
    description: 'A soft, rounded three-seater in cream bouclé, made for relaxed evenings. Removable covers make cleaning easy.',
    specs: [['Width', '210 cm'], ['Depth', '90 cm'], ['Seat height', '43 cm'], ['Fabric', 'Textured bouclé'], ['Warranty', '5 years on the frame']],
  },
  {
    id: 9, sku: 'HL-BD-1140', name: 'Sage & Oat Linen Bedding Bundle', category: 'beds',
    vendor: 'Haven Living', material: 'Bouclé & Linen', price: 780, rating: 4.83, reviews: 156,
    badge: 'Bundle & Save', tag: 'Oeko-Tex certified', dims: 'Queen / King', feature: 'Cotton-linen blend',
    delivery: 'Standard 2-day delivery', stock: 30, image: bedding,
    description: 'A layered bedding set in sage and oat: sheets, duvet cover, a knitted throw and two pillowcases.',
    specs: [['Includes', 'Sheets, duvet cover, throw, 2 pillowcases'], ['Material', 'Cotton-linen blend'], ['Care', 'Machine wash at 40 degrees'], ['Certification', 'Oeko-Tex Standard 100']],
    options: [{ name: 'Size', choices: [{ label: 'Queen', extra: 0 }, { label: 'King', extra: 100 }] }],
  },
  {
    id: 10, sku: 'HL-SF-8890', name: 'Cloud Modular Lounge Sectional', category: 'couches',
    vendor: 'Nordic Living Co', material: 'Bouclé & Linen', price: 5400, oldPrice: 6300, rating: 4.9, reviews: 43,
    badge: 'White-Glove Included', tag: 'Fits service elevators', dims: '280W x 95D cm', feature: 'Deep, modular seating',
    delivery: 'Free delivery & assembly', stock: 3, image: sectional,
    description: 'A generous modular sectional you can rearrange as your room changes. Deep seats and high-resilience foam.',
    specs: [['Width', '280 cm'], ['Depth', '95 cm'], ['Modules', '3'], ['Fabric', 'Stain-resistant bouclé'], ['Warranty', '10 years on the frame']],
  },
  {
    id: 11, sku: 'HL-AP-3155', name: 'Smart Counter-Depth Fridge Freezer (Grey)', category: 'appliances',
    vendor: 'Bosch Home', material: 'Stainless Steel', price: 5900, rating: 4.84, reviews: 52,
    badge: 'Energy Efficient', tag: 'Built-in display', dims: '90W x 176H cm', feature: 'Touch display & water dispenser',
    delivery: 'Free delivery & unboxing', stock: 5, image: greyKitchen,
    description: 'A grey-finish counter-depth fridge freezer with a built-in touch display, quiet cooling and a water dispenser.',
    specs: [['Capacity', '560 litres'], ['Width', '90 cm'], ['Height', '176 cm'], ['Finish', 'Grey stainless steel'], ['Warranty', '2 years']],
  },
  {
    id: 12, sku: 'HL-DN-2260', name: 'Round Oak Dining Set (Table + 4 Chairs)', category: 'dining',
    vendor: 'Haven Studio', material: 'Solid Oak', price: 2750, rating: 4.77, reviews: 88,
    badge: 'Set & Save', tag: 'Compact dining nooks', dims: '120 cm round', feature: 'Upholstered chairs',
    delivery: 'Setup: 30 mins', stock: 10, image: diningSet,
    description: 'A compact round oak table with four upholstered chairs, ideal for small dining areas and family meals.',
    specs: [['Table', '120 cm round'], ['Chairs', '4, upholstered'], ['Material', 'Solid oak'], ['Assembly', 'About 30 minutes'], ['Warranty', '3 years']],
  },
]
