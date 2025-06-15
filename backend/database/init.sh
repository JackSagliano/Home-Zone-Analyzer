#!/bin/bash

psql -U "postgres" -d "home-zone-analyzer-db" -f /docker-entrypoint-initdb.d/create_tables.sql

ogr2ogr -f "PostgreSQL" PG:"dbname=home-zone-analyzer-db user=postgres password=context-aware-2024" /docker-entrypoint-initdb.d/data/aree_verdi.geojson -nln aree_verdi -nlt POINT

ogr2ogr -f "PostgreSQL" PG:"dbname=home-zone-analyzer-db user=postgres password=context-aware-2024" /docker-entrypoint-initdb.d/data/biblioteche.geojson -nln biblioteche -nlt POINT
  
ogr2ogr -f "PostgreSQL" PG:"dbname=home-zone-analyzer-db user=postgres password=context-aware-2024" /docker-entrypoint-initdb.d/data/cinema.geojson -nln cinema -nlt POINT

ogr2ogr -f "PostgreSQL" PG:"dbname=home-zone-analyzer-db user=postgres password=context-aware-2024" /docker-entrypoint-initdb.d/data/eventi.geojson -nln eventi -nlt POINT

ogr2ogr -f "PostgreSQL" PG:"dbname=home-zone-analyzer-db user=postgres password=context-aware-2024" /docker-entrypoint-initdb.d/data/fermate_autobus.geojson -nln fermate_autobus -nlt POINT

ogr2ogr -f "PostgreSQL" PG:"dbname=home-zone-analyzer-db user=postgres password=context-aware-2024" /docker-entrypoint-initdb.d/data/impianti_sportivi.geojson -nln impianti_sportivi -nlt POINT

ogr2ogr -f "PostgreSQL" PG:"dbname=home-zone-analyzer-db user=postgres password=context-aware-2024" /docker-entrypoint-initdb.d/data/musei.geojson -nln musei -nlt POINT

ogr2ogr -f "PostgreSQL" PG:"dbname=home-zone-analyzer-db user=postgres password=context-aware-2024" /docker-entrypoint-initdb.d/data/ospedali.geojson -nln ospedali -nlt POINT

ogr2ogr -f "PostgreSQL" PG:"dbname=home-zone-analyzer-db user=postgres password=context-aware-2024" /docker-entrypoint-initdb.d/data/stazioni_ferroviarie.geojson -nln stazioni_ferroviarie -nlt POINT

ogr2ogr -f "PostgreSQL" PG:"dbname=home-zone-analyzer-db user=postgres password=context-aware-2024" /docker-entrypoint-initdb.d/data/teatri.geojson -nln teatri -nlt POINT

ogr2ogr -f "PostgreSQL" PG:"dbname=home-zone-analyzer-db user=postgres password=context-aware-2024" /docker-entrypoint-initdb.d/data/wifi_gratuito.geojson -nln wifi_gratuito -nlt POINT

ogr2ogr -f "PostgreSQL" PG:"dbname=home-zone-analyzer-db user=postgres password=context-aware-2024" /docker-entrypoint-initdb.d/data/quartieri_bologna.geojson -nln quartieri_bologna -nlt POLYGON
