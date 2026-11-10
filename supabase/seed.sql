-- Starter bottles. Safe to re-run. Add far more before inviting anyone (target 500+).
-- No barcodes are seeded: EANs are filled in by scans and user confirmations.

insert into public.producers (name, country, region, producer_type) values
  ('Moët & Chandon',     'France',  'Champagne', 'NM'),
  ('Veuve Clicquot',     'France',  'Champagne', 'NM'),
  ('Bollinger',          'France',  'Champagne', 'NM'),
  ('Krug',               'France',  'Champagne', 'NM'),
  ('Ruinart',            'France',  'Champagne', 'NM'),
  ('Taittinger',         'France',  'Champagne', 'NM'),
  ('Billecart-Salmon',   'France',  'Champagne', 'NM'),
  ('Pol Roger',          'France',  'Champagne', 'NM'),
  ('Laurent-Perrier',    'France',  'Champagne', 'NM'),
  ('Louis Roederer',     'France',  'Champagne', 'NM'),
  ('Dom Pérignon',       'France',  'Champagne', 'NM'),
  ('Egly-Ouriet',        'France',  'Champagne', 'RM'),
  ('Jacques Selosse',    'France',  'Champagne', 'RM'),
  ('Pierre Péters',      'France',  'Champagne', 'RM'),
  ('Agrapart',           'France',  'Champagne', 'RM'),
  ('Larmandier-Bernier', 'France',  'Champagne', 'RM'),
  ('Charles Heidsieck',  'France',  'Champagne', 'NM'),
  ('Gosset',             'France',  'Champagne', 'NM'),
  ('Nyetimber',          'England', 'West Sussex', 'other'),
  ('Ca'' del Bosco',     'Italy',   'Franciacorta', 'other'),
  ('Gramona',            'Spain',   'Penedès', 'other'),
  ('Nino Franco',        'Italy',   'Valdobbiadene', 'other')
on conflict (name) do nothing;

insert into public.champagnes (producer_id, name, category, status)
select p.id, v.cuvee, v.category, 'approved'
from (values
  ('Moët & Chandon',     'Impérial Brut',            'Champagne'),
  ('Veuve Clicquot',     'Yellow Label Brut',        'Champagne'),
  ('Bollinger',          'Spécial Cuvée',            'Champagne'),
  ('Krug',               'Grande Cuvée',             'Champagne'),
  ('Ruinart',            'Blanc de Blancs',          'Champagne'),
  ('Taittinger',         'Brut Réserve',             'Champagne'),
  ('Billecart-Salmon',   'Brut Rosé',                'Champagne'),
  ('Pol Roger',          'Brut Réserve',             'Champagne'),
  ('Laurent-Perrier',    'La Cuvée',                 'Champagne'),
  ('Louis Roederer',     'Brut Premier',             'Champagne'),
  ('Dom Pérignon',       'Vintage',                  'Champagne'),
  ('Egly-Ouriet',        'Grand Cru Brut Tradition', 'Champagne'),
  ('Jacques Selosse',    'Initial',                  'Champagne'),
  ('Pierre Péters',      'Cuvée de Réserve',         'Champagne'),
  ('Agrapart',           '7 Crus',                   'Champagne'),
  ('Larmandier-Bernier', 'Latitude',                 'Champagne'),
  ('Charles Heidsieck',  'Brut Réserve',             'Champagne'),
  ('Gosset',             'Grande Réserve',           'Champagne'),
  ('Nyetimber',          'Classic Cuvée',            'English sparkling'),
  ('Ca'' del Bosco',     'Cuvée Prestige',           'Franciacorta'),
  ('Gramona',            'La Cuvée',                 'Cava'),
  ('Nino Franco',        'Rustico',                  'Prosecco')
) as v (producer, cuvee, category)
join public.producers p on p.name = v.producer
on conflict (producer_id, name) do nothing;
