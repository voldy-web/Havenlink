// The 100 home appliances from the "100 Home Appliances" picture sheet.
// Row: [picture number, name, category, price in GH₵]. Prices are mock data.
// The sharpened pictures are src/assets/photos/appliance-001.jpg ... appliance-109.jpg.
import { photo } from './photos'

const pics = [
  [1, "Refrigerator", 'appliances', 3600],
  [2, "French-door refrigerator", 'appliances', 6900],
  [3, "Side-by-side refrigerator", 'appliances', 7400],
  [4, "Upright freezer", 'appliances', 3900],
  [5, "Chest freezer", 'appliances', 4200],
  [6, "Wine cooler", 'appliances', 2800],
  [7, "Ice maker", 'appliances', 1900],
  [8, "Water dispenser", 'appliances', 1250],
  [9, "Microwave oven", 'small', 1250],
  [10, "Built-in electric oven", 'appliances', 4600],
  [11, "Gas range cooker", 'appliances', 3300],
  [12, "Electric range cooker", 'appliances', 4500],
  [13, "Induction cooktop", 'small', 1600],
  [14, "Electric hot plate", 'small', 480],
  [15, "Air fryer", 'small', 780],
  [16, "Rice cooker", 'small', 420],
  [17, "Slow cooker", 'small', 380],
  [18, "Electric pressure cooker", 'small', 690],
  [19, "Toaster", 'small', 150],
  [20, "Four-slice toaster", 'small', 260],
  [21, "Sandwich maker", 'small', 190],
  [22, "Waffle maker", 'small', 210],
  [23, "Panini press", 'small', 240],
  [24, "Drip coffee maker", 'small', 160],
  [25, "Espresso machine", 'small', 1900],
  [26, "Electric kettle", 'small', 180],
  [27, "Electric tea maker", 'small', 150],
  [28, "Countertop blender", 'small', 340],
  [29, "Hand blender", 'small', 220],
  [30, "Food processor", 'small', 880],
  [31, "Juicer", 'small', 1100],
  [32, "Meat grinder", 'small', 650],
  [33, "Stand mixer", 'small', 1200],
  [34, "Hand mixer", 'small', 260],
  [35, "Electric whisk", 'small', 120],
  [36, "Bread maker", 'small', 720],
  [37, "Electric food steamer", 'small', 260],
  [38, "Electric grill", 'small', 560],
  [39, "Popcorn maker", 'small', 140],
  [40, "Egg cooker", 'small', 150],
  [41, "Electric can opener", 'small', 90],
  [42, "Digital kitchen scale", 'small', 80],
  [43, "Dishwasher", 'appliances', 5200],
  [44, "Front-load washing machine", 'appliances', 5400],
  [45, "Top-load washing machine", 'appliances', 4200],
  [46, "Clothes dryer", 'appliances', 3800],
  [47, "Washer-dryer combination machine", 'appliances', 6800],
  [48, "Upright vacuum cleaner", 'small', 950],
  [49, "Canister vacuum cleaner", 'small', 880],
  [50, "Robot vacuum cleaner", 'small', 1900],
  [51, "Wet-and-dry vacuum cleaner", 'small', 890],
  [52, "Carpet cleaning machine", 'small', 1600],
  [53, "Steam mop", 'small', 420],
  [54, "Electric iron", 'small', 220],
  [55, "Garment steamer", 'small', 260],
  [56, "Sewing machine", 'small', 690],
  [57, "Heated clothes drying cabinet", 'small', 1200],
  [58, "Split air conditioner", 'appliances', 4800],
  [59, "Portable air conditioner", 'appliances', 3400],
  [60, "Tower fan", 'small', 320],
  [61, "Pedestal fan", 'small', 380],
  [62, "Table fan", 'small', 240],
  [63, "Ceiling fan", 'small', 520],
  [64, "Air purifier", 'small', 1200],
  [65, "Dehumidifier", 'small', 1450],
  [66, "Humidifier", 'small', 380],
  [67, "Electric space heater", 'small', 450],
  [68, "Portable air cooler", 'small', 1350],
  [69, "Electric water heater", 'appliances', 2200],
  [70, "Smart television", 'appliances', 3900],
  [71, "OLED television", 'appliances', 7500],
  [72, "Soundbar", 'small', 850],
  [73, "Home theater system", 'appliances', 2200],
  [74, "Bluetooth speaker", 'small', 320],
  [75, "Smart speaker", 'small', 280],
  [76, "Home projector", 'appliances', 1800],
  [77, "Streaming media player", 'small', 260],
  [78, "Blu-ray/DVD player", 'small', 240],
  [79, "Video game console", 'appliances', 3200],
  [80, "Digital alarm clock", 'small', 90],
  [81, "Electric fireplace", 'appliances', 2400],
  [82, "Hair dryer", 'small', 450],
  [83, "Hair straightener", 'small', 1850],
  [84, "Hair curling iron", 'small', 1300],
  [85, "Electric shaver", 'small', 1500],
  [86, "Electric beard trimmer", 'small', 180],
  [87, "Electric toothbrush", 'small', 1150],
  [88, "Electric facial cleansing brush", 'small', 320],
  [89, "Electric massage gun", 'small', 520],
  [90, "Electric treadmill", 'appliances', 3800],
  [91, "Exercise bike", 'appliances', 2200],
  [92, "Electric blanket", 'small', 320],
  [93, "Heated mattress pad", 'small', 380],
  [94, "Electric shoe dryer", 'small', 190],
  [95, "Heated clothes drying rack", 'small', 380],
  [96, "Food dehydrator", 'small', 240],
  [97, "Ice cream maker", 'small', 220],
  [98, "Electric fondue pot", 'small', 280],
  [99, "Electric tabletop grill", 'small', 300],
  [100, "Electric lunch box/food warmer", 'small', 260],
  [101, "Milk frother and warmer", 'small', 320],
  [102, "Vacuum sealer", 'small', 480],
  [103, "Range hood", 'appliances', 2200],
  [104, "Coffee grinder", 'small', 520],
  [105, "Bean-to-cup coffee machine", 'appliances', 4200],
  [106, "Sous vide cooker", 'small', 650],
  [107, "Countertop smart oven", 'small', 1800],
  [108, "Toaster oven", 'small', 950],
  [109, "Knife sharpener", 'small', 280],
]

// Products already in productCatalog.js that are the same item as a picture.
// Their product id -> picture number, so we show the photo and add no duplicate.
export const existingPhotoFor = {
  13: 54, 14: 26, 15: 28, 16: 9, 17: 19, 18: 16, 19: 15, 20: 61, 21: 62, 22: 48, 23: 82,
  24: 24, 25: 21, 26: 30, 27: 31, 28: 18, 29: 37, 30: 14, 31: 68, 32: 38, 35: 5, 36: 1,
  37: 44, 38: 45, 39: 11, 40: 58, 41: 70, 42: 8, 43: 69,
}
const taken = new Set(Object.values(existingPhotoFor))

// Pictures that are styled kitchen photos (not a product on plain white).
// They fill the card like the other shop photos; the white cut-outs are shown whole.
export const lifestylePics = new Set([
  2, 5, 6, 7, 8, 9, 10, 11, 13, 15, 16, 18, 20, 22, 23, 25, 26, 27, 28, 30, 31, 32, 33, 36, 39, 40, 43,
  96, 97, 98, 99, 101, 102, 103, 104, 105, 106, 107, 108, 109,
])

export const applianceFile = (n) => `appliance-${String(n).padStart(3, '0')}`

// Only the kitchen-style photos are used. Any other appliance-NNN file is ignored,
// so a product without one shows the "Photo coming soon" tile.
export const appliancePhoto = (n) => (lifestylePics.has(n) ? photo(applianceFile(n)) : undefined)

const brands = ['Bosch Home', 'Accra Home Hub', 'Kumasi Electricals', 'Nordic Living Co', 'Haven Living', 'Sahara Home Supplies']
const badges = ['Best Value', 'New Arrival', 'Top Rated', 'Popular Pick', 'Great Deal', 'Energy Saver']

export const applianceProducts = pics
  .filter(([n]) => !taken.has(n))
  .map(([n, name, category, price], i) => {
    const vendor = brands[i % brands.length]
    const large = category === 'appliances'
    return {
      id: 100 + n,
      sku: `HL-${category.slice(0, 2).toUpperCase()}-${7000 + n}`,
      name, category, vendor, material: 'Plastic & Steel', price,
      rating: +(4.3 + ((n * 7) % 7) / 10).toFixed(1), reviews: 40 + ((n * 37) % 400),
      badge: badges[i % badges.length],
      tag: large ? 'Delivered & installed' : 'Fits any kitchen',
      dims: 'See specification', feature: `${name} for everyday home use`,
      delivery: price >= 3000 ? 'Free delivery' : 'Standard delivery',
      stock: i % 13 === 4 ? 0 : 4 + ((n * 5) % 30),
      image: appliancePhoto(n),
      description: `A dependable ${name.toLowerCase()}. ${large ? 'Delivered and set up for you.' : 'A useful everyday appliance for a busy home.'}`,
      specs: [['Brand', vendor], ['Type', name], ['Warranty', large ? '2 years' : '1 year']],
    }
  })
