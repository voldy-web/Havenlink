// About 50 more mock shop products, written as compact rows and expanded into
// full products below. Later these come from the backend.
// Row: [name, category, vendor, material, price, oldPrice (0 = none), rating,
//       reviews, feature, dims, power, warranty]
import { photo } from './photos'
import { existingPhotoFor, applianceFile } from './applianceCatalog'

const rows = [
  // ---- Small appliances ----
  ['Ceramic Soleplate Steam Iron 2400W', 'small', 'Accra Home Hub', 'Plastic & Steel', 220, 0, 4.6, 312, 'Steam burst & anti-drip', '30 x 12 x 15 cm', '2400 W', '1 year'],
  ['Stainless Steel Electric Kettle 1.7L', 'small', 'Kumasi Electricals', 'Stainless Steel', 180, 220, 4.7, 540, 'Auto shut-off, boil-dry protection', '22 x 16 x 24 cm', '2200 W', '1 year'],
  ['Glass Jug Blender 1.5L 700W', 'small', 'Accra Home Hub', 'Glass', 340, 0, 4.5, 208, 'Ice-crushing 6-blade set', '20 x 20 x 40 cm', '700 W', '1 year'],
  ['Digital Microwave Oven 25L', 'small', 'Bosch Home', 'Stainless Steel', 1250, 1450, 4.8, 173, '10 power levels, child lock', '46 x 34 x 27 cm', '900 W', '2 years'],
  ['2-Slice Pop-up Toaster', 'small', 'Kumasi Electricals', 'Stainless Steel', 150, 0, 4.4, 265, '7 browning levels', '28 x 16 x 19 cm', '850 W', '1 year'],
  ['Multi-Function Rice Cooker 1.8L', 'small', 'Accra Home Hub', 'Plastic & Steel', 420, 0, 4.7, 391, 'Non-stick pot, keep-warm', '30 x 26 x 24 cm', '700 W', '1 year'],
  ['Digital Air Fryer 5L', 'small', 'Bosch Home', 'Plastic & Steel', 780, 920, 4.9, 456, 'Oil-free frying, 8 presets', '36 x 30 x 32 cm', '1500 W', '2 years'],
  ['Standing Fan 16 inch, 3-Speed', 'small', 'Kumasi Electricals', 'Plastic & Steel', 320, 0, 4.5, 402, 'Oscillating, tilt head', '45 x 45 x 125 cm', '60 W', '1 year'],
  ['Rechargeable Table Fan', 'small', 'Accra Home Hub', 'Plastic & Steel', 240, 0, 4.6, 287, 'Works during power cuts', '30 x 25 x 42 cm', '25 W', '1 year'],
  ['Bagless Vacuum Cleaner 1600W', 'small', 'Bosch Home', 'Plastic & Steel', 950, 0, 4.7, 129, 'Strong suction, HEPA filter', '38 x 27 x 28 cm', '1600 W', '2 years'],
  ['Ionic Hair Dryer 2000W', 'small', 'Haven Living', 'Plastic & Steel', 210, 0, 4.4, 175, 'Fast dry, cool-shot button', '24 x 9 x 22 cm', '2000 W', '1 year'],
  ['Drip Coffee Maker 12-Cup', 'small', 'Nordic Living Co', 'Glass', 460, 0, 4.6, 96, 'Reusable filter, keep-warm', '32 x 22 x 36 cm', '900 W', '1 year'],
  ['Electric Sandwich Maker', 'small', 'Kumasi Electricals', 'Plastic & Steel', 190, 0, 4.3, 148, 'Non-stick triangle plates', '24 x 22 x 8 cm', '750 W', '1 year'],
  ['Food Processor 1000W', 'small', 'Bosch Home', 'Plastic & Steel', 880, 0, 4.8, 84, 'Slice, shred, chop, knead', '30 x 22 x 38 cm', '1000 W', '2 years'],
  ['Slow Juicer, Cold Press', 'small', 'Nordic Living Co', 'Plastic & Steel', 1100, 1300, 4.7, 62, 'Quiet, high juice yield', '20 x 20 x 43 cm', '200 W', '2 years'],
  ['Electric Pressure Cooker 6L', 'small', 'Accra Home Hub', 'Stainless Steel', 690, 0, 4.8, 233, '12 cooking programs', '32 x 30 x 31 cm', '1000 W', '1 year'],
  ['Food Steamer, 3-Tier', 'small', 'Kumasi Electricals', 'Plastic & Steel', 260, 0, 4.4, 91, 'Steams a full meal at once', '34 x 24 x 38 cm', '800 W', '1 year'],
  ['Electric Hot Plate, Twin Burner', 'small', 'Accra Home Hub', 'Stainless Steel', 480, 0, 4.5, 118, 'Two independent burners', '58 x 30 x 9 cm', '2000 W', '1 year'],
  ['Portable Air Cooler 30L', 'small', 'Kumasi Electricals', 'Plastic & Steel', 1350, 1500, 4.5, 77, 'Water-tank cooling, remote', '40 x 30 x 90 cm', '110 W', '1 year'],
  ['Electric Grill & Griddle', 'small', 'Bosch Home', 'Plastic & Steel', 560, 0, 4.6, 69, 'Removable plates, drip tray', '42 x 26 x 12 cm', '1800 W', '1 year'],
  ['Rechargeable LED Emergency Lantern', 'small', 'Haven Living', 'Plastic & Steel', 130, 0, 4.7, 610, 'Up to 12 hours light', '16 x 16 x 24 cm', '10 W', '6 months'],
  ['6-Way Surge-Protected Extension', 'small', 'Accra Home Hub', 'Plastic & Steel', 140, 0, 4.6, 344, 'Overload protection, 3 m cable', '32 x 6 x 4 cm', '3000 W', '1 year'],
  // ---- Large appliances ----
  ['Chest Freezer 300L', 'appliances', 'Kumasi Electricals', 'Stainless Steel', 4200, 0, 4.7, 88, 'Fast freeze, lockable lid', '112 x 56 x 85 cm', '150 W', '2 years'],
  ['Top-Freezer Fridge 250L', 'appliances', 'Bosch Home', 'Stainless Steel', 3600, 4100, 4.6, 141, 'Frost-free, energy efficient', '55 x 60 x 145 cm', '120 W', '2 years'],
  ['Front-Load Washing Machine 8kg', 'appliances', 'Bosch Home', 'Stainless Steel', 5400, 0, 4.8, 96, 'Quiet inverter motor', '60 x 55 x 85 cm', '500 W', '3 years'],
  ['Twin-Tub Washing Machine 10kg', 'appliances', 'Kumasi Electricals', 'Plastic & Steel', 2100, 0, 4.4, 175, 'Wash and spin at once', '78 x 43 x 90 cm', '400 W', '1 year'],
  ['4-Burner Gas Cooker with Oven', 'appliances', 'Accra Home Hub', 'Stainless Steel', 3300, 0, 4.7, 122, 'Auto ignition, full oven', '60 x 60 x 85 cm', 'Gas', '2 years'],
  ['Split Air Conditioner 1.5HP Inverter', 'appliances', 'Bosch Home', 'Plastic & Steel', 4800, 5400, 4.9, 203, 'Inverter saves power', '80 x 20 x 28 cm', '1100 W', '3 years'],
  ['Smart TV 43 inch 4K', 'appliances', 'Nordic Living Co', 'Plastic & Steel', 3900, 4500, 4.8, 167, 'Built-in streaming apps', '96 x 6 x 56 cm', '90 W', '2 years'],
  ['Hot & Cold Water Dispenser', 'appliances', 'Accra Home Hub', 'Plastic & Steel', 1250, 0, 4.5, 158, 'Child-safe hot tap', '31 x 33 x 105 cm', '550 W', '1 year'],
  ['Electric Water Heater 50L', 'appliances', 'Kumasi Electricals', 'Stainless Steel', 2200, 0, 4.6, 74, 'Thermostat, safety valve', '40 x 40 x 60 cm', '2000 W', '2 years'],
  ['Home Inverter 1.5kVA with Battery', 'appliances', 'Sahara Home Supplies', 'Plastic & Steel', 5900, 6500, 4.7, 59, 'Keeps lights and fans on', '46 x 36 x 30 cm', '1500 VA', '2 years'],
  // ---- Kitchenware ----
  ['Non-Stick Cookware Set, 10-Piece', 'kitchen', 'Volta Kitchenware', 'Stainless Steel', 780, 950, 4.7, 254, 'Even heating, easy clean', '5 pans and lids', '', '2 years'],
  ['Stainless Steel Pot Set, 6-Piece', 'kitchen', 'Volta Kitchenware', 'Stainless Steel', 640, 0, 4.6, 187, 'Tri-ply base', '3 pots and lids', '', '5 years'],
  ['Kitchen Knife Set with Block, 6-Piece', 'kitchen', 'Volta Kitchenware', 'Stainless Steel', 420, 0, 4.8, 136, 'Sharp forged blades', '6 knives + block', '', '2 years'],
  ['Ceramic Dinner Set, 24-Piece', 'kitchen', 'Volta Kitchenware', 'Ceramic', 560, 0, 4.7, 219, 'Chip-resistant glaze', 'Serves 6', '', '1 year'],
  ['Cutlery Set, 24-Piece', 'kitchen', 'Volta Kitchenware', 'Stainless Steel', 290, 0, 4.6, 302, 'Mirror finish, dishwasher safe', 'Serves 6', '', '2 years'],
  ['Glass Food Storage Set, 10-Piece', 'kitchen', 'Volta Kitchenware', 'Glass', 340, 0, 4.7, 178, 'Airtight lids, oven safe', '5 containers', '', '2 years'],
  // ---- Furniture ----
  ['Queen Memory Foam Mattress', 'beds', 'Haven Living', 'Cotton', 2600, 3100, 4.8, 247, 'Cooling gel, 25cm deep', '160 x 200 cm', '', '5 years'],
  ['Three-Door Wardrobe with Mirror', 'wardrobes', 'Haven Studio', 'Solid Oak', 3800, 0, 4.6, 92, 'Hanging rail and shelves', '150 x 55 x 200 cm', '', '3 years'],
  ['Bedside Tables, Pair', 'beds', 'Haven Studio', 'Solid Oak', 720, 0, 4.7, 134, 'Soft-close drawer', '45 x 38 x 52 cm', '', '3 years'],
  ['Fabric Accent Armchair', 'couches', 'Nordic Living Co', 'Bouclé & Linen', 1750, 0, 4.8, 81, 'Deep seat, wooden legs', '78 x 80 x 82 cm', '', '3 years'],
  ['Dining Chairs, Set of 4', 'dining', 'Haven Studio', 'Solid Oak', 1650, 0, 4.6, 108, 'Upholstered seats', '46 x 52 x 88 cm', '', '3 years'],
  // ---- Lighting, decor, bedding ----
  ['Arc Floor Lamp', 'decor', 'Nordic Living Co', 'Metal', 640, 0, 4.7, 66, 'Warm dimmable light', '40 x 180 cm', '15 W', '2 years'],
  ['Pendant Light Trio', 'decor', 'Haven Studio', 'Glass', 980, 0, 4.6, 43, 'Smoked glass shades', '3 pendants', '3 x 9 W', '2 years'],
  ['Round Wall Mirror, 80cm', 'decor', 'Haven Living', 'Metal', 520, 0, 4.8, 97, 'Slim brass frame', '80 cm round', '', '1 year'],
  ['Blackout Curtains, Pair', 'decor', 'Haven Living', 'Cotton', 380, 0, 4.7, 289, 'Blocks 95% of light', '2 x 140 x 240 cm', '', '1 year'],
  ['Woven Area Rug 200 x 300', 'decor', 'Sahara Home Supplies', 'Cotton', 1450, 1700, 4.6, 57, 'Soft-touch flat weave', '200 x 300 cm', '', '1 year'],
  ['Memory Foam Pillows, Pair', 'beds', 'Haven Living', 'Cotton', 360, 0, 4.7, 215, 'Contoured neck support', '60 x 40 cm', '', '1 year'],
  ['Cotton Bath Towel Set, 6-Piece', 'beds', 'Haven Living', 'Cotton', 310, 0, 4.8, 338, 'Quick-dry, 600gsm', '70 x 140 cm', '', '6 months'],
]

const badges = ['Best Value', 'New Arrival', 'Top Rated', 'Popular Pick', 'Great Deal', 'Energy Saver']
const tags = {
  small: 'Fits any kitchen', appliances: 'Delivered & installed', kitchen: 'Dishwasher friendly',
  beds: 'Free delivery over GH₵3,000', wardrobes: 'Assembly available', couches: 'Fits most rooms',
  dining: 'Assembly available', decor: 'Easy to fit',
}
const intro = {
  small: 'A dependable everyday appliance for a busy home.',
  appliances: 'A reliable home appliance, delivered and set up for you.',
  kitchen: 'Well made kitchenware that is built for daily cooking.',
  beds: 'Comfort essentials for better sleep.',
  wardrobes: 'Smart storage with a clean finish.',
  couches: 'Comfortable seating that suits everyday life.',
  dining: 'Solid dining furniture for family meals.',
  decor: 'A finishing touch that makes a house feel like home.',
}

export const moreProducts = rows.map(([name, category, vendor, material, price, oldPrice, rating, reviews, feature, dims, power, warranty], i) => {
  const id = 13 + i
  const stock = i % 17 === 5 ? 0 : i % 6 === 2 ? 3 : 5 + ((i * 7) % 36)
  const specs = [['Brand', vendor], ['Material', material], ['Size', dims]]
  if (power) specs.push(['Power', power])
  specs.push(['Warranty', warranty])
  return {
    id, sku: `HL-${category.slice(0, 2).toUpperCase()}-${5000 + id}`, name, category, vendor, material, price,
    ...(oldPrice ? { oldPrice } : {}),
    rating, reviews,
    badge: oldPrice ? 'On Sale' : badges[i % badges.length],
    tag: tags[category], dims, feature,
    delivery: price >= 3000 ? 'Free delivery' : 'Standard delivery',
    stock,
    // Drop a photo named product-<id>.jpg into src/assets/photos/ to replace the illustration.
    image: photo(`product-${id}`) ?? (existingPhotoFor[id] ? photo(applianceFile(existingPhotoFor[id])) : undefined),
    cutout: !photo(`product-${id}`) && !!existingPhotoFor[id] && !!photo(applianceFile(existingPhotoFor[id])),
    description: `${feature}. ${intro[category]}`,
    specs,
  }
})
