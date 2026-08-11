alter table public.products
  add column if not exists size_chart jsonb;

comment on column public.products.size_chart is
  'Optional product-specific size table: {title, columns, rows}.';
