FROM postgis/postgis:14-3.2

# Installa GDAL per supportare OGR2OGR
RUN apt-get update && apt-get install -y gdal-bin

# Copia i file SQL e GeoJSON nella directory di lavoro
COPY create_tables.sql /docker-entrypoint-initdb.d/
COPY data/ /docker-entrypoint-initdb.d/data/

# Aggiungi uno script di inizializzazione per eseguire ogr2ogr
COPY init.sh /docker-entrypoint-initdb.d/
RUN chmod +x /docker-entrypoint-initdb.d/init.sh


