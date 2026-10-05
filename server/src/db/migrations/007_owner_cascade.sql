-- When an owner (or vendor) deletes their account, their homes (or products) are removed with it,
-- so nothing is left on the site without a person or photos behind it.
alter table properties drop constraint properties_owner_id_fkey,
  add constraint properties_owner_id_fkey foreign key (owner_id) references users (id) on delete cascade;
alter table products drop constraint products_vendor_id_fkey,
  add constraint products_vendor_id_fkey foreign key (vendor_id) references users (id) on delete cascade;
