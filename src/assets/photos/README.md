# Sharper photos (drop-in)

The site currently uses **placeholder photos** from `src/assets/mock/`. They were cut
out of the design PDF, so they are small. To make a photo sharp, save a better version
here with the **same file name** (for example `property-villa.jpg`) and it is used
automatically. No code changes are needed.

Tips
- Use JPG, PNG or WebP. Keep each file under about 500 KB (compress at squoosh.app).
- Aim for these widths: gallery/main photos 1600 px, cards 1000 px, small thumbnails 600 px.
- Keep the same shape (wide, about 2:1 for cards; 4:3 for product photos).
- Where the file name is not in `src/assets/mock/`, add the photo name in the data file
  that uses `photo('name')` (search for `photo(` in `src/data/`).

Names in use: property-*, detail-*, shop-*, sofa-*, work-*, home-* (see src/assets/mock/).

## Appliance photos
`appliance-001.jpg` ... `appliance-100.jpg` are the appliance pictures from the "100 Home
Appliances" sheet (the number is the picture number on that sheet, see
`src/data/applianceCatalog.js`). Some numbers are missing on purpose: those source
pictures were cut off, so the shop shows the illustration tile instead. To fill a gap, save
a good photo with that exact name, for example `appliance-070.jpg` (4:3, about 1200x900).
