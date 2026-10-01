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
`appliance-NNN.jpg` are kitchen-style appliance photos. NNN is the picture number in
`src/data/applianceCatalog.js`. Only the numbers listed in `lifestylePics` there are shown;
any other product shows the "Photo coming soon" tile. To add a photo: save it as
`appliance-NNN.jpg` (about 1200 px wide) and add NNN to `lifestylePics`.
