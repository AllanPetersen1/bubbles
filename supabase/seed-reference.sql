-- Reference data: appellations, producer villages / sub-regions, more producers and cuvées.
-- Run after schema.sql, upgrade-1.sql and seed.sql. Safe to re-run.
--
-- Compiled from general knowledge of public facts (names, places, producer type).
-- It is NOT an import of icdb.parcelles.app or champagne.fr: neither was reachable for
-- bulk use (champagne.fr disallows crawlers), so check licensing before importing from them.
-- Spot-check names against labels before a public launch. Wrong rows can be fixed or
-- removed in the table editor; check-ins keep pointing at their champagne row.

-- ------------------------------------------------------------- appellations

insert into public.appellations (name, country, region, kind) values
  ('Champagne AOC',                                    'France',       'Champagne',  'AOC'),
  ('Crémant d''Alsace',                                'France',       'Alsace',     'AOC'),
  ('Crémant de Bourgogne',                             'France',       'Burgundy',   'AOC'),
  ('Crémant de Loire',                                 'France',       'Loire',      'AOC'),
  ('Crémant de Limoux',                                'France',       'Languedoc',  'AOC'),
  ('Blanquette de Limoux',                             'France',       'Languedoc',  'AOC'),
  ('Crémant du Jura',                                  'France',       'Jura',       'AOC'),
  ('Crémant de Bordeaux',                              'France',       'Bordeaux',   'AOC'),
  ('Franciacorta DOCG',                                'Italy',        'Lombardy',   'DOCG'),
  ('Oltrepò Pavese Metodo Classico DOCG',              'Italy',        'Lombardy',   'DOCG'),
  ('Alta Langa DOCG',                                  'Italy',        'Piedmont',   'DOCG'),
  ('Trento DOC',                                       'Italy',        'Trentino',   'DOC'),
  ('Prosecco DOC',                                     'Italy',        'Veneto',     'DOC'),
  ('Conegliano Valdobbiadene Prosecco Superiore DOCG', 'Italy',        'Veneto',     'DOCG'),
  ('Asti DOCG',                                        'Italy',        'Piedmont',   'DOCG'),
  ('Cava DO',                                          'Spain',        'Catalonia',  'DO'),
  ('Sussex PDO',                                       'England',      'Sussex',     'PDO'),
  ('Cap Classique',                                    'South Africa', null,         'other')
on conflict (name) do nothing;

-- ---------------------------------------------- villages for existing producers

update public.producers p
set village = v.village, subregion = v.subregion
from (values
  ('Moët & Chandon',     'Épernay',              null),
  ('Veuve Clicquot',     'Reims',                null),
  ('Bollinger',          'Aÿ',                   null),
  ('Krug',               'Reims',                null),
  ('Ruinart',            'Reims',                null),
  ('Taittinger',         'Reims',                null),
  ('Billecart-Salmon',   'Mareuil-sur-Aÿ',       null),
  ('Pol Roger',          'Épernay',              null),
  ('Laurent-Perrier',    'Tours-sur-Marne',      null),
  ('Louis Roederer',     'Reims',                null),
  ('Dom Pérignon',       'Épernay',              null),
  ('Egly-Ouriet',        'Ambonnay',             'Montagne de Reims'),
  ('Jacques Selosse',    'Avize',                'Côte des Blancs'),
  ('Pierre Péters',      'Le Mesnil-sur-Oger',   'Côte des Blancs'),
  ('Agrapart',           'Avize',                'Côte des Blancs'),
  ('Larmandier-Bernier', 'Vertus',               'Côte des Blancs'),
  ('Charles Heidsieck',  'Reims',                null),
  ('Gosset',             'Aÿ',                   null),
  ('Ca'' del Bosco',     'Erbusco',              null),
  ('Gramona',            'Sant Sadurní d''Anoia', null),
  ('Nino Franco',        'Valdobbiadene',        null)
) as v (name, village, subregion)
where p.name = v.name;

-- ---------------------------------------------------------------- producers
-- NM négociant, RM grower-producer, CM cooperative, other. Sub-region only for growers:
-- houses blend grapes from across the region.

insert into public.producers (name, country, region, producer_type, village, subregion) values
  ('Perrier-Jouët',                'France',       'Champagne',  'NM', 'Épernay',                  null),
  ('G.H. Mumm',                    'France',       'Champagne',  'NM', 'Reims',                    null),
  ('Piper-Heidsieck',              'France',       'Champagne',  'NM', 'Reims',                    null),
  ('Deutz',                        'France',       'Champagne',  'NM', 'Aÿ',                       null),
  ('Henriot',                      'France',       'Champagne',  'NM', 'Reims',                    null),
  ('Lanson',                       'France',       'Champagne',  'NM', 'Reims',                    null),
  ('Pommery',                      'France',       'Champagne',  'NM', 'Reims',                    null),
  ('Philipponnat',                 'France',       'Champagne',  'NM', 'Mareuil-sur-Aÿ',           null),
  ('Salon',                        'France',       'Champagne',  'NM', 'Le Mesnil-sur-Oger',       null),
  ('Jacquesson',                   'France',       'Champagne',  'NM', 'Dizy',                     null),
  ('Alfred Gratien',               'France',       'Champagne',  'NM', 'Épernay',                  null),
  ('Bruno Paillard',               'France',       'Champagne',  'NM', 'Reims',                    null),
  ('Nicolas Feuillatte',           'France',       'Champagne',  'CM', 'Chouilly',                 null),
  ('Mailly Grand Cru',             'France',       'Champagne',  'CM', 'Mailly-Champagne',         null),
  ('Vilmart & Cie',                'France',       'Champagne',  'RM', 'Rilly-la-Montagne',        'Montagne de Reims'),
  ('Pierre Gimonnet & Fils',       'France',       'Champagne',  'RM', 'Cuis',                     'Côte des Blancs'),
  ('Bérêche & Fils',               'France',       'Champagne',  'RM', 'Ludes',                    'Montagne de Reims'),
  ('Chartogne-Taillet',            'France',       'Champagne',  'RM', 'Merfy',                    'Massif de Saint-Thierry'),
  ('Ulysse Collin',                'France',       'Champagne',  'RM', 'Congy',                    'Côte de Sézanne'),
  ('Roses de Jeanne',              'France',       'Champagne',  'RM', 'Celles-sur-Ource',         'Côte des Bar'),
  ('Jérôme Prévost',               'France',       'Champagne',  'RM', 'Gueux',                    'Montagne de Reims'),
  ('Marie-Courtin',                'France',       'Champagne',  'RM', 'Polisot',                  'Côte des Bar'),
  ('Benoît Lahaye',                'France',       'Champagne',  'RM', 'Bouzy',                    'Montagne de Reims'),
  ('Paul Bara',                    'France',       'Champagne',  'RM', 'Bouzy',                    'Montagne de Reims'),
  ('Tarlant',                      'France',       'Champagne',  'RM', 'Œuilly',                   'Vallée de la Marne'),
  ('Pierre Moncuit',               'France',       'Champagne',  'RM', 'Le Mesnil-sur-Oger',       'Côte des Blancs'),
  ('Guy Charlemagne',              'France',       'Champagne',  'RM', 'Le Mesnil-sur-Oger',       'Côte des Blancs'),
  ('Diebolt-Vallois',              'France',       'Champagne',  'RM', 'Cramant',                  'Côte des Blancs'),
  ('Gaston Chiquet',               'France',       'Champagne',  'RM', 'Dizy',                     'Vallée de la Marne'),
  ('David Léclapart',              'France',       'Champagne',  'RM', 'Trépail',                  'Montagne de Reims'),
  ('Jacques Lassaigne',            'France',       'Champagne',  'RM', 'Montgueux',                'Aube'),
  ('Georges Laval',                'France',       'Champagne',  'RM', 'Cumières',                 'Vallée de la Marne'),
  ('Ruppert-Leroy',                'France',       'Champagne',  'RM', 'Essoyes',                  'Côte des Bar'),
  ('Lucien Albrecht',              'France',       'Alsace',     'other', 'Orschwihr',             null),
  ('Bouvet-Ladubay',               'France',       'Loire',      'other', 'Saint-Hilaire-Saint-Florent', null),
  ('Louis Bouillot',               'France',       'Burgundy',   'other', 'Nuits-Saint-Georges',   null),
  ('Bellavista',                   'Italy',        'Franciacorta', 'other', 'Erbusco',             null),
  ('Ferrari',                      'Italy',        'Trentino',   'other', 'Trento',                null),
  ('Bisol',                        'Italy',        'Valdobbiadene', 'other', 'Valdobbiadene',      null),
  ('Freixenet',                    'Spain',        'Penedès',    'other', 'Sant Sadurní d''Anoia', null),
  ('Juvé & Camps',                 'Spain',        'Penedès',    'other', 'Sant Sadurní d''Anoia', null),
  ('Codorníu',                     'Spain',        'Penedès',    'other', 'Sant Sadurní d''Anoia', null),
  ('Ridgeview',                    'England',      'East Sussex', 'other', 'Ditchling',            null),
  ('Gusbourne',                    'England',      'Kent',       'other', 'Appledore',             null),
  ('Chapel Down',                  'England',      'Kent',       'other', 'Tenterden',             null),
  ('Hambledon',                    'England',      'Hampshire',  'other', 'Denmead',               null),
  ('Graham Beck',                  'South Africa', 'Robertson',  'other', 'Robertson',             null)
on conflict (name) do nothing;

-- ------------------------------------------------------------------ cuvées
-- (producer, cuvée, category, appellation). Vintage is chosen at check-in time.

insert into public.champagnes (producer_id, name, category, status, appellation_id)
select p.id, v.cuvee, v.category, 'approved', a.id
from (values
  -- Houses already in seed.sql: further cuvées
  ('Moët & Chandon',     'Rosé Impérial',                    'Champagne', 'Champagne AOC'),
  ('Moët & Chandon',     'Nectar Impérial',                  'Champagne', 'Champagne AOC'),
  ('Moët & Chandon',     'Grand Vintage',                    'Champagne', 'Champagne AOC'),
  ('Veuve Clicquot',     'Rosé',                             'Champagne', 'Champagne AOC'),
  ('Veuve Clicquot',     'La Grande Dame',                   'Champagne', 'Champagne AOC'),
  ('Bollinger',          'La Grande Année',                  'Champagne', 'Champagne AOC'),
  ('Bollinger',          'R.D.',                             'Champagne', 'Champagne AOC'),
  ('Bollinger',          'Rosé',                             'Champagne', 'Champagne AOC'),
  ('Krug',               'Rosé',                             'Champagne', 'Champagne AOC'),
  ('Krug',               'Clos du Mesnil',                   'Champagne', 'Champagne AOC'),
  ('Krug',               'Clos d''Ambonnay',                 'Champagne', 'Champagne AOC'),
  ('Krug',               'Vintage',                          'Champagne', 'Champagne AOC'),
  ('Ruinart',            'Rosé',                             'Champagne', 'Champagne AOC'),
  ('Ruinart',            'Dom Ruinart',                      'Champagne', 'Champagne AOC'),
  ('Ruinart',            'R de Ruinart',                     'Champagne', 'Champagne AOC'),
  ('Taittinger',         'Comtes de Champagne Blanc de Blancs', 'Champagne', 'Champagne AOC'),
  ('Taittinger',         'Prestige Rosé',                    'Champagne', 'Champagne AOC'),
  ('Taittinger',         'Nocturne',                         'Champagne', 'Champagne AOC'),
  ('Billecart-Salmon',   'Brut Réserve',                     'Champagne', 'Champagne AOC'),
  ('Billecart-Salmon',   'Blanc de Blancs',                  'Champagne', 'Champagne AOC'),
  ('Billecart-Salmon',   'Cuvée Nicolas François',           'Champagne', 'Champagne AOC'),
  ('Billecart-Salmon',   'Cuvée Elisabeth Salmon Rosé',      'Champagne', 'Champagne AOC'),
  ('Billecart-Salmon',   'Clos Saint-Hilaire',               'Champagne', 'Champagne AOC'),
  ('Pol Roger',          'Cuvée Sir Winston Churchill',      'Champagne', 'Champagne AOC'),
  ('Pol Roger',          'Pure',                             'Champagne', 'Champagne AOC'),
  ('Pol Roger',          'Brut Rosé',                        'Champagne', 'Champagne AOC'),
  ('Laurent-Perrier',    'Rosé',                             'Champagne', 'Champagne AOC'),
  ('Laurent-Perrier',    'Grand Siècle',                     'Champagne', 'Champagne AOC'),
  ('Laurent-Perrier',    'Ultra Brut',                       'Champagne', 'Champagne AOC'),
  ('Louis Roederer',     'Cristal',                          'Champagne', 'Champagne AOC'),
  ('Louis Roederer',     'Blanc de Blancs',                  'Champagne', 'Champagne AOC'),
  ('Louis Roederer',     'Brut Nature',                      'Champagne', 'Champagne AOC'),
  ('Dom Pérignon',       'Rosé',                             'Champagne', 'Champagne AOC'),
  ('Egly-Ouriet',        'Les Vignes de Vrigny',             'Champagne', 'Champagne AOC'),
  ('Egly-Ouriet',        'V.P. Extra Brut',                  'Champagne', 'Champagne AOC'),
  ('Jacques Selosse',    'Substance',                        'Champagne', 'Champagne AOC'),
  ('Jacques Selosse',    'Version Originale',                'Champagne', 'Champagne AOC'),
  ('Pierre Péters',      'Les Chétillons',                   'Champagne', 'Champagne AOC'),
  ('Agrapart',           'Avizoise',                         'Champagne', 'Champagne AOC'),
  ('Agrapart',           'Minéral',                          'Champagne', 'Champagne AOC'),
  ('Agrapart',           'Complantée',                       'Champagne', 'Champagne AOC'),
  ('Agrapart',           'Terroirs',                         'Champagne', 'Champagne AOC'),
  ('Larmandier-Bernier', 'Longitude',                        'Champagne', 'Champagne AOC'),
  ('Larmandier-Bernier', 'Terre de Vertus',                  'Champagne', 'Champagne AOC'),
  ('Larmandier-Bernier', 'Vieille Vigne du Levant',          'Champagne', 'Champagne AOC'),
  ('Larmandier-Bernier', 'Rosé de Saignée',                  'Champagne', 'Champagne AOC'),
  ('Charles Heidsieck',  'Blanc de Blancs',                  'Champagne', 'Champagne AOC'),
  ('Charles Heidsieck',  'Rosé Réserve',                     'Champagne', 'Champagne AOC'),
  ('Charles Heidsieck',  'Blanc des Millénaires',            'Champagne', 'Champagne AOC'),
  ('Gosset',             'Grand Rosé',                       'Champagne', 'Champagne AOC'),
  ('Gosset',             'Célébris',                         'Champagne', 'Champagne AOC'),
  ('Nino Franco',        'Grave di Stecca',                  'Prosecco',  'Conegliano Valdobbiadene Prosecco Superiore DOCG'),
  ('Nyetimber',          'Blanc de Blancs',                  'English sparkling', 'Sussex PDO'),
  ('Nyetimber',          '1086 Prestige Cuvée',              'English sparkling', 'Sussex PDO'),
  -- New Champagne houses
  ('Perrier-Jouët',      'Grand Brut',                       'Champagne', 'Champagne AOC'),
  ('Perrier-Jouët',      'Belle Epoque',                     'Champagne', 'Champagne AOC'),
  ('Perrier-Jouët',      'Blason Rosé',                      'Champagne', 'Champagne AOC'),
  ('G.H. Mumm',          'Cordon Rouge',                     'Champagne', 'Champagne AOC'),
  ('G.H. Mumm',          'Mumm de Cramant',                  'Champagne', 'Champagne AOC'),
  ('Piper-Heidsieck',    'Cuvée Brut',                       'Champagne', 'Champagne AOC'),
  ('Piper-Heidsieck',    'Rare',                             'Champagne', 'Champagne AOC'),
  ('Deutz',              'Brut Classic',                     'Champagne', 'Champagne AOC'),
  ('Deutz',              'Amour de Deutz',                   'Champagne', 'Champagne AOC'),
  ('Deutz',              'Cuvée William Deutz',              'Champagne', 'Champagne AOC'),
  ('Henriot',            'Brut Souverain',                   'Champagne', 'Champagne AOC'),
  ('Henriot',            'Blanc de Blancs',                  'Champagne', 'Champagne AOC'),
  ('Henriot',            'Cuvée des Enchanteleurs',          'Champagne', 'Champagne AOC'),
  ('Lanson',             'Black Label Brut',                 'Champagne', 'Champagne AOC'),
  ('Lanson',             'Green Label Organic',              'Champagne', 'Champagne AOC'),
  ('Pommery',            'Brut Royal',                       'Champagne', 'Champagne AOC'),
  ('Pommery',            'Cuvée Louise',                     'Champagne', 'Champagne AOC'),
  ('Philipponnat',       'Royale Réserve Brut',              'Champagne', 'Champagne AOC'),
  ('Philipponnat',       'Clos des Goisses',                 'Champagne', 'Champagne AOC'),
  ('Salon',              'Cuvée S',                          'Champagne', 'Champagne AOC'),
  ('Jacquesson',         'Avize Champ Caïn',                 'Champagne', 'Champagne AOC'),
  ('Jacquesson',         'Dizy Corne Bautray',               'Champagne', 'Champagne AOC'),
  ('Alfred Gratien',     'Brut Classique',                   'Champagne', 'Champagne AOC'),
  ('Alfred Gratien',     'Cuvée Paradis',                    'Champagne', 'Champagne AOC'),
  ('Bruno Paillard',     'Première Cuvée',                   'Champagne', 'Champagne AOC'),
  ('Bruno Paillard',     'N.P.U.',                           'Champagne', 'Champagne AOC'),
  ('Nicolas Feuillatte', 'Réserve Exclusive Brut',           'Champagne', 'Champagne AOC'),
  ('Nicolas Feuillatte', 'Palmes d''Or',                     'Champagne', 'Champagne AOC'),
  ('Mailly Grand Cru',   'Brut Réserve',                     'Champagne', 'Champagne AOC'),
  ('Mailly Grand Cru',   'L''Intemporelle',                  'Champagne', 'Champagne AOC'),
  -- Growers
  ('Vilmart & Cie',          'Grand Cellier',                'Champagne', 'Champagne AOC'),
  ('Vilmart & Cie',          'Grand Cellier d''Or',          'Champagne', 'Champagne AOC'),
  ('Vilmart & Cie',          'Cuvée Rubis',                  'Champagne', 'Champagne AOC'),
  ('Vilmart & Cie',          'Coeur de Cuvée',               'Champagne', 'Champagne AOC'),
  ('Pierre Gimonnet & Fils', 'Cuis 1er Cru',                 'Champagne', 'Champagne AOC'),
  ('Pierre Gimonnet & Fils', 'Fleuron',                      'Champagne', 'Champagne AOC'),
  ('Pierre Gimonnet & Fils', 'Gastronome',                   'Champagne', 'Champagne AOC'),
  ('Pierre Gimonnet & Fils', 'Oenophile Extra Brut',         'Champagne', 'Champagne AOC'),
  ('Bérêche & Fils',         'Brut Réserve',                 'Champagne', 'Champagne AOC'),
  ('Bérêche & Fils',         'Campania Remensis Rosé',       'Champagne', 'Champagne AOC'),
  ('Bérêche & Fils',         'Reflet d''Antan',              'Champagne', 'Champagne AOC'),
  ('Bérêche & Fils',         'Le Cran',                      'Champagne', 'Champagne AOC'),
  ('Chartogne-Taillet',      'Cuvée Sainte-Anne',            'Champagne', 'Champagne AOC'),
  ('Chartogne-Taillet',      'Les Barres',                   'Champagne', 'Champagne AOC'),
  ('Chartogne-Taillet',      'Heurtebise',                   'Champagne', 'Champagne AOC'),
  ('Ulysse Collin',          'Les Pierrières',               'Champagne', 'Champagne AOC'),
  ('Ulysse Collin',          'Les Roises',                   'Champagne', 'Champagne AOC'),
  ('Ulysse Collin',          'Les Maillons',                 'Champagne', 'Champagne AOC'),
  ('Ulysse Collin',          'Les Enfers',                   'Champagne', 'Champagne AOC'),
  ('Roses de Jeanne',        'La Bolorée',                   'Champagne', 'Champagne AOC'),
  ('Roses de Jeanne',        'Les Ursules',                  'Champagne', 'Champagne AOC'),
  ('Roses de Jeanne',        'La Haute Lemblée',             'Champagne', 'Champagne AOC'),
  ('Roses de Jeanne',        'Côte de Béchalin',             'Champagne', 'Champagne AOC'),
  ('Jérôme Prévost',         'Les Béguines',                 'Champagne', 'Champagne AOC'),
  ('Jérôme Prévost',         'Fac-Simile',                   'Champagne', 'Champagne AOC'),
  ('Marie-Courtin',          'Efflorescence',                'Champagne', 'Champagne AOC'),
  ('Marie-Courtin',          'Résonance',                    'Champagne', 'Champagne AOC'),
  ('Marie-Courtin',          'Concordance',                  'Champagne', 'Champagne AOC'),
  ('Benoît Lahaye',          'Brut Nature',                  'Champagne', 'Champagne AOC'),
  ('Benoît Lahaye',          'Violaine',                     'Champagne', 'Champagne AOC'),
  ('Paul Bara',              'Brut Réserve',                 'Champagne', 'Champagne AOC'),
  ('Paul Bara',              'Spécial Club',                 'Champagne', 'Champagne AOC'),
  ('Tarlant',                'Brut Zéro',                    'Champagne', 'Champagne AOC'),
  ('Tarlant',                'BAM!',                         'Champagne', 'Champagne AOC'),
  ('Tarlant',                'La Vigne d''Or',               'Champagne', 'Champagne AOC'),
  ('Pierre Moncuit',         'Hugues de Coulmet',            'Champagne', 'Champagne AOC'),
  ('Pierre Moncuit',         'Cuvée Nicole Moncuit Vieilles Vignes', 'Champagne', 'Champagne AOC'),
  ('Guy Charlemagne',        'Mesnillésime',                 'Champagne', 'Champagne AOC'),
  ('Guy Charlemagne',        'Réserve Brut',                 'Champagne', 'Champagne AOC'),
  ('Diebolt-Vallois',        'Fleur de Passion',             'Champagne', 'Champagne AOC'),
  ('Diebolt-Vallois',        'Cuvée Prestige',               'Champagne', 'Champagne AOC'),
  ('Gaston Chiquet',         'Brut Tradition',               'Champagne', 'Champagne AOC'),
  ('David Léclapart',        'L''Amateur',                   'Champagne', 'Champagne AOC'),
  ('David Léclapart',        'L''Apôtre',                    'Champagne', 'Champagne AOC'),
  ('David Léclapart',        'L''Artiste',                   'Champagne', 'Champagne AOC'),
  ('Jacques Lassaigne',      'Le Cotet',                     'Champagne', 'Champagne AOC'),
  ('Jacques Lassaigne',      'Les Vignes de Montgueux',      'Champagne', 'Champagne AOC'),
  ('Georges Laval',          'Cumières Brut Nature',         'Champagne', 'Champagne AOC'),
  ('Ruppert-Leroy',          'Fosse-Grély',                  'Champagne', 'Champagne AOC'),
  ('Ruppert-Leroy',          'Martin Fontaine',              'Champagne', 'Champagne AOC'),
  -- Other French crémants
  ('Lucien Albrecht',    'Crémant d''Alsace Brut',           'Crémant d''Alsace',     'Crémant d''Alsace'),
  ('Bouvet-Ladubay',     'Saphir',                           'Crémant de Loire',      'Crémant de Loire'),
  ('Louis Bouillot',     'Perle d''Aurore',                  'Crémant de Bourgogne',  'Crémant de Bourgogne'),
  -- Italy
  ('Bellavista',         'Alma Gran Cuvée',                  'Franciacorta', 'Franciacorta DOCG'),
  ('Ferrari',            'Perlé',                            'Trento DOC',   'Trento DOC'),
  ('Ferrari',            'Giulio Ferrari Riserva del Fondatore', 'Trento DOC', 'Trento DOC'),
  ('Bisol',              'Crede',                            'Prosecco',     'Conegliano Valdobbiadene Prosecco Superiore DOCG'),
  -- Spain
  ('Freixenet',          'Cordon Negro Brut',                'Cava', 'Cava DO'),
  ('Juvé & Camps',       'Reserva de la Familia Brut Nature', 'Cava', 'Cava DO'),
  ('Codorníu',           'Anna de Codorníu Brut',            'Cava', 'Cava DO'),
  -- England
  ('Ridgeview',          'Bloomsbury',                       'English sparkling', null),
  ('Ridgeview',          'Cavendish',                        'English sparkling', null),
  ('Gusbourne',          'Blanc de Blancs',                  'English sparkling', null),
  ('Chapel Down',        'Brut',                             'English sparkling', null),
  ('Hambledon',          'Classic Cuvée',                    'English sparkling', null),
  -- South Africa
  ('Graham Beck',        'Brut',                             'Cap Classique', 'Cap Classique')
) as v (producer, cuvee, category, appellation)
join public.producers p on p.name = v.producer
left join public.appellations a on a.name = v.appellation
on conflict (producer_id, name) do nothing;

-- Bottles from seed.sql: link the French and Italian ones to their appellation
update public.champagnes c
set appellation_id = a.id
from (values
  ('Champagne',    'Champagne AOC'),
  ('Franciacorta', 'Franciacorta DOCG')
) as m (category, appellation)
join public.appellations a on a.name = m.appellation
where c.category = m.category and c.appellation_id is null;

update public.champagnes c
set appellation_id = a.id
from public.producers p, public.appellations a
where p.id = c.producer_id and p.name = 'Nino Franco' and c.name = 'Rustico'
  and a.name = 'Conegliano Valdobbiadene Prosecco Superiore DOCG' and c.appellation_id is null;

update public.champagnes c
set appellation_id = a.id
from public.producers p, public.appellations a
where p.id = c.producer_id and p.name = 'Nyetimber' and a.name = 'Sussex PDO' and c.appellation_id is null;
