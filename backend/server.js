require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); 
const { buffer } = require('stream/consumers');
const app = express();
const secretKey = process.env.JWT_SECRET;
const turf = require('@turf/turf');


app.use(bodyParser.json());
// Abilita CORS per tutte le richieste
app.use(cors());
// Configurazione del pool di connessioni
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000
});




/************************************************** ROUTES PER L'AUTENTICAZIONE + ROUTES PER LE MIGLIORI POSIZIONI *************************************************/

// Middleware per autenticare il token
function authenticateToken(req, res, next) {
 
  const token = req.header('Authorization').split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}


app.get('/api/verifyToken', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Token is valid' });
});


app.post('/api/registrati', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Verifica se l'username esiste già
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'username already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [username, hashedPassword]);
    const newUser = result.rows[0];


    res.status(201).json();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.post('/api/accedi', async (req, res) => {
  console.log("ACCEDI")
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.post('/api/suggerisciPosizioni', async (req, res) => {
  const { questionarioData, raggio_vicinato } = req.body;

  try {
    // Generare una griglia di punti in tutta l'area di Bologna
    const grigliaPunti = generateGrid();

    const promises = grigliaPunti.map(async punto => {
      const lon = punto[0];
      const lat = punto[1];

      const result = await pool.query(`
        WITH pois AS (
          SELECT 'biblioteche' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM biblioteche WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'cinema' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM cinema WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'fermate_autobus' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM fermate_autobus WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'aree_verdi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM aree_verdi WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'impianti_sportivi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM impianti_sportivi WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'musei' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM musei WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'ospedali' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM ospedali WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'teatri' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM teatri WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'stazioni_ferroviarie' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM stazioni_ferroviarie WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'wifi_gratuito' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM wifi_gratuito WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
        )
        SELECT DISTINCT ON (lon, lat) type, lon, lat, distance
        FROM pois
      `, [lon, lat, raggio_vicinato]);

      const pois = result.rows.map(row => ({
        type: row.type,
        lon: row.lon,
        lat: row.lat,
        distance: row.distance
      }));

      const rank = calculateImmobileRank(pois, questionarioData);

      return { punto, rank };
    });

    const risultati = await Promise.all(promises);

    risultati.sort((a, b) => b.rank - a.rank); // Ordina in base al rank decrescente
    const miglioriPosizioni = risultati.slice(0, 3); // Prendi le prime 3 posizioni migliori

    console.log("MIGLIORI POSIZIONI", miglioriPosizioni);
    res.json({ miglioriPosizioni });
  } catch (error) {
    console.error('Errore durante il suggerimento delle posizioni:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});


function generateGrid() {
  const confiniBologna = require('./confini_bologna.json');
  const bbox = extractBoundingBoxFromGeoJSON(confiniBologna);
  const cellSize = 0.5; // 500 metri
  const options = { units: 'kilometers' };
  const grid = turf.pointGrid(bbox, cellSize, options);
  const points = grid.features.map(feature => feature.geometry.coordinates);

  return points;
}

function extractBoundingBoxFromGeoJSON(geojson) {
  const coordinates = geojson.features[0].geometry.coordinates[0];
  const lons = coordinates.map(coord => coord[0]);
  const lats = coordinates.map(coord => coord[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  return [minLon, minLat, maxLon, maxLat];
}


/************************************************** ROUTES PER GLI IMMOBILI *************************************************/


app.post('/api/aggiungiImmobileDB', async (req, res) => {
  const { geom, username, raggio_vicinato, questionarioData } = req.body;
  try {
    
   
    const insertResult = await pool.query(`
      INSERT INTO immobili_candidati (geom, username)
      VALUES (ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), $2)
      RETURNING id, ST_AsGeoJSON(geom) AS pointGeom;
    `, [JSON.stringify(geom), username]);
      const lon = geom.coordinates[0]
      const lat = geom.coordinates[1]
    const markerId = insertResult.rows[0].id;
    
   const bufferResult = await pool.query(`
    SELECT ST_AsGeoJSON(ST_Buffer(
ST_Point($1,$2,4326)::geography
,$3)::geometry)
    `, [lon, lat, raggio_vicinato]);


    
    
    const result = await pool.query(`
      WITH pois AS (
        SELECT 'biblioteche' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM biblioteche WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
        UNION ALL
        SELECT 'cinema' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM cinema WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
        UNION ALL
        SELECT 'fermate_autobus' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM fermate_autobus WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
        UNION ALL
        SELECT 'aree_verdi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM aree_verdi WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
        UNION ALL
        SELECT 'impianti_sportivi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM impianti_sportivi WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
        UNION ALL
        SELECT 'musei' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM musei WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
        UNION ALL
        SELECT 'ospedali' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM ospedali WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
        UNION ALL
        SELECT 'teatri' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM teatri WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
        UNION ALL
        SELECT 'stazioni_ferroviarie' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM stazioni_ferroviarie WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
        UNION ALL
        SELECT 'wifi_gratuito' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM wifi_gratuito WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
      )
      SELECT DISTINCT ON (lon, lat) type, lon, lat, distance
      FROM pois
    `, [lon, lat, raggio_vicinato]);
    const pois = result.rows.map(row => ({
      type: row.type,
      lon: row.lon,
      lat: row.lat,
      distance: row.distance
    }));
    
    let rank = calculateImmobileRank(pois, questionarioData)
    res.json({ 
      id: markerId, 
      pointGeom: insertResult.rows[0].pointgeom,
      circleGeom: bufferResult.rows[0].st_asgeojson,
      pois: pois,
      rank: rank
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error adding immobile' });
  }
});


app.post('/api/modificaRaggioImmobile', async (req, res) => {
  const { geom, username, nuovo_raggio_vicinato, questionarioData } = req.body;
  try {
    
    
    const lon = JSON.stringify(geom.coordinates[0])
    const lat = JSON.stringify(geom.coordinates[1])
    
      const insertResult = await pool.query(`
         SELECT id
        FROM immobili_candidati
        WHERE username = $1 AND ST_Equals(geom, ST_SetSRID(ST_Point(${lon}, ${lat}), 4326));
      `, [username]);

        
      const markerId = insertResult.rows[0].id;
      const bufferResult = await pool.query(`
        SELECT ST_AsGeoJSON(ST_Buffer(
    ST_Point($1,$2,4326)::geography
    ,$3)::geometry)
        `, [lon, lat, nuovo_raggio_vicinato]);

      
      const result = await pool.query(`
        WITH pois AS (
          SELECT 'biblioteche' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM biblioteche WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'cinema' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM cinema WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'fermate_autobus' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM fermate_autobus WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'aree_verdi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM aree_verdi WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'impianti_sportivi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM impianti_sportivi WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'musei' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM musei WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'ospedali' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM ospedali WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'teatri' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM teatri WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'stazioni_ferroviarie' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM stazioni_ferroviarie WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'stazioni_ferroviarie' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM stazioni_ferroviarie WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
          UNION ALL
          SELECT 'wifi_gratuito' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography) AS distance FROM wifi_gratuito WHERE ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, geom::geography, $3)
        )
        SELECT DISTINCT ON (lon, lat) type, lon, lat, distance
        FROM pois
      `, [lon, lat, nuovo_raggio_vicinato]);
    
      const pois = result.rows.map(row => ({
        type: row.type,
        lon: row.lon,
        lat: row.lat,
        distance: row.distance
      }));
      let rank = calculateImmobileRank(pois, questionarioData)
      res.json({ 
        id: markerId, 
      circleGeom: bufferResult.rows[0].st_asgeojson,
      pois: pois,
      rank: rank
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error updating immobile' });
  }
});



app.get('/api/getQuartiere', async (req, res) => {
  const {lon, lat } = req.query
  try {
    const result = await pool.query(`
      SELECT name
      FROM quartieri_bologna 
      WHERE ST_Contains(geom, ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), 4326), 4326));`,
       [lon, lat]);
       
    res.status(200).json(result.rows[0].name);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});


function calculateImmobileRank(pois, questionarioData){
  try {
  
    questionarioData.forEach(poi => {
      poi.tipo = poi.tipo.replace(/\s+/g, '_');
    });
    let rank = 0;
   
    for(let i=0; i< 5; i++){
      const tipo = questionarioData[i].tipo;
      const valore = Number(questionarioData[i].value);
      let poiVicini = pois.filter(poi => poi.type === tipo);
     
      if (poiVicini.length > 0) {//vado a controllare se nella circonferenza c'è qualche punto di interesse per una specifica tipologia 
        const distanzaMinima = Math.min(...poiVicini.map(poi => Number(poi.distance)));
        if(distanzaMinima < 30){
          rank = rank + (valore / 30 ) * 100; 
        } else {
        rank = rank + (valore / distanzaMinima ) * 100; 
        }
          
      }
    }
   rank = Math.ceil(rank)

    
  for(let i=5; i< questionarioData.length; i++){
    const tipo = questionarioData[i].tipo;
    let valore = Number(questionarioData[i].value);
    let poiVicini = pois.filter(poi => poi.type === tipo);
    
    if (poiVicini.length >= 2) {//vado a controllare se nella circonferenza c'è qualche punto di interesse per una specifica tipologia 
      if(poiVicini.length > 5){
        rank = rank + valore*5;
      } else {
      
      rank = rank + valore*(poiVicini.length);
      }
     
    }
  }
 
    return rank;
  
  } catch (error) {
    console.error('Error calculating rank:', error);
    return error;
  }
}







/************************************************** ROUTES PER LE AREE *************************************************/

app.post('/api/aggiungiArea', authenticateToken, async (req, res) => {
  const { geom, username, raggio_vicinato, questionarioData } = req.body;

  try {
   
    await pool.query(`
      INSERT INTO aree_candidate (geom, username)
      VALUES (ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), $2)
    `, [JSON.stringify(geom), username]);

   
    const area_vicinato = await pool.query(`
      SELECT ST_AsGeoJSON(ST_Buffer(ST_GeomFromGeoJSON($1)::geography, $2)::geometry) as geom

    `, [geom,raggio_vicinato]);

    const pois_nuova_area = await pool.query(`
        WITH pois AS (
        SELECT 'biblioteche' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM biblioteche 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'cinema' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM cinema 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'fermate_autobus' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM fermate_autobus 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'aree_verdi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM aree_verdi 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'impianti_sportivi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM impianti_sportivi 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'musei' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM musei 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'ospedali' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM ospedali 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'teatri' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM teatri 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'stazioni_ferroviarie' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM stazioni_ferroviarie 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'wifi_gratuito' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM wifi_gratuito 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
      )
      SELECT DISTINCT ON (lon, lat) type, lon, lat, distance
      FROM pois
	  
   `, [JSON.stringify(geom), raggio_vicinato]);




   const pois_area = await pool.query(`
     WITH pois AS (
       SELECT 'biblioteche' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM biblioteche WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
       UNION ALL
       SELECT 'cinema' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM cinema WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
       UNION ALL
       SELECT 'fermate_autobus' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM fermate_autobus WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
       UNION ALL
       SELECT 'aree_verdi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM aree_verdi WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
       UNION ALL
       SELECT 'impianti_sportivi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM impianti_sportivi WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
       UNION ALL
       SELECT 'musei' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM musei WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
       UNION ALL
       SELECT 'ospedali' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM ospedali WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
       UNION ALL
       SELECT 'teatri' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM teatri WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
       UNION ALL
       SELECT 'stazioni_ferroviarie' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM stazioni_ferroviarie WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
       UNION ALL
       SELECT 'wifi_gratuito' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM wifi_gratuito WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
     )
     SELECT DISTINCT ON (lon, lat) type, lon, lat
     FROM pois
   `, [JSON.stringify(geom)]);
    
   const pois_esterni = pois_nuova_area.rows.map(row => ({
     type: row.type,
     lon: row.lon,
     lat: row.lat,
     distance: row.distance
   }));
   

   const pois_interni = pois_area.rows.map(row => ({
     type: row.type,
     lon: row.lon,
     lat: row.lat
   }));

   let rank = calculateAreaRank(pois_esterni, pois_interni, questionarioData)
   res.json({ 
   area: area_vicinato.rows[0].geom,
   pois_esterni: pois_esterni,
   pois_interni: pois_interni,
   rank: rank
   });
    
  } catch (error) {
    console.error('Errore durante l\'aggiunta dell\'area:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});



app.post('/api/modificaRaggioArea', authenticateToken, async (req, res) => {
  const { geom, nuovo_raggio_vicinato, questionarioData } = req.body;

  try {
  
    
    
    const area_vicinato = await pool.query(`
      SELECT ST_AsGeoJSON(ST_Buffer(ST_GeomFromGeoJSON($1)::geography, $2)::geometry) as geom

    `, [JSON.stringify(geom),nuovo_raggio_vicinato]);
    
    const pois_nuova_area = await pool.query(`
       WITH pois AS (
        SELECT 'biblioteche' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM biblioteche 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2) 
        AND 
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'cinema' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM cinema 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND 
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'fermate_autobus' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM fermate_autobus 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND 
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'aree_verdi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM aree_verdi 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND 
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'impianti_sportivi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM impianti_sportivi 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND 
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'musei' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM musei 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND 
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'ospedali' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM ospedali 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND 
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'teatri' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM teatri 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        UNION ALL
        SELECT 'stazioni_ferroviarie' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM stazioni_ferroviarie 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2) 
        AND 
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
        UNION ALL
        SELECT 'wifi_gratuito' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) AS distance 
        FROM wifi_gratuito 
        WHERE ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography, $2)
        AND 
        ST_Distance(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, geom::geography) > 0
      )
      SELECT DISTINCT ON (lon, lat) type, lon, lat, distance
      FROM pois
    `, [JSON.stringify(geom), nuovo_raggio_vicinato]);


    const pois_area = await pool.query(`
      WITH pois AS (
        SELECT 'biblioteche' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM biblioteche WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
        UNION ALL
        SELECT 'cinema' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM cinema WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
        UNION ALL
        SELECT 'fermate_autobus' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM fermate_autobus WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
        UNION ALL
        SELECT 'aree_verdi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM aree_verdi WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
        UNION ALL
        SELECT 'impianti_sportivi' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM impianti_sportivi WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
        UNION ALL
        SELECT 'musei' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM musei WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
        UNION ALL
        SELECT 'ospedali' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM ospedali WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
        UNION ALL
        SELECT 'teatri' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM teatri WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
        UNION ALL
        SELECT 'stazioni_ferroviarie' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM stazioni_ferroviarie WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
        UNION ALL
        SELECT 'wifi_gratuito' AS type, ST_X(geom) AS lon, ST_Y(geom) AS lat FROM wifi_gratuito WHERE ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom)
      )
      SELECT DISTINCT ON (lon, lat) type, lon, lat
      FROM pois
    `, [JSON.stringify(geom)]);

    const pois_esterni = pois_nuova_area.rows.map(row => ({
      type: row.type,
      lon: row.lon,
      lat: row.lat,
      distance: row.distance
    }));

    const pois_interni = pois_area.rows.map(row => ({
      type: row.type,
      lon: row.lon,
      lat: row.lat
    }));
    

    let rank = calculateAreaRank(pois_esterni, pois_interni, questionarioData)
    res.json({ 
    area: area_vicinato.rows[0].geom,
    pois_esterni: pois_esterni,
    pois_interni: pois_interni,
    rank: rank
    });
  } catch (error) {
    console.error('Errore durante la modifica del raggio dell\'area:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});



function calculateAreaRank(pois_esterni, pois_interni, questionarioData){
  try {
   
    
    questionarioData.forEach(poi => {
      poi.tipo = poi.tipo.replace(/\s+/g, '_');
    });

    let rank = 0;

    for(let i=0; i< 5; i++){
      const tipo = questionarioData[i].tipo;
      const valore = Number(questionarioData[i].value);
      let poiEsterni = pois_esterni.filter(poi => poi.type === tipo);
      
      if (poiEsterni.length > 0) {
        const distanzaMinima = Math.min(...poiEsterni.map(poi => Number(poi.distance)));
        if(distanzaMinima < 30){
          rank = rank + (valore / 30) * 100;
        } else {
        rank = rank + (valore / distanzaMinima) * 100;
        }
      }
      
    }

    rank = Math.ceil(rank);

    for(let i=5; i< questionarioData.length; i++){
      
      const tipo = questionarioData[i].tipo;
      let valore = Number(questionarioData[i].value);
      let poiInterni = pois_interni.filter(poi => poi.type === tipo);
      let poiEsterni = pois_esterni.filter(poi => poi.type === tipo);
    
      if (poiInterni.length >= 2) {
        if(poiInterni.length >5){
          rank = rank + valore * 5;
        } else {
        rank = rank + valore * poiInterni.length;
        }
      }
        if (poiEsterni.length >= 2) {
          if(poiEsterni.length >5){
            rank = rank + valore * 5;
          } else {
          rank = rank + valore * poiEsterni.length;
          }
        }
      
    }
    console.log("RANK DELL'AREA:", rank);
    return rank;
  } catch (error) {
    console.error('Error calculating rank:', error);
    return error;
  }
}


app.delete('/api/rimuoviAreeCandidate', authenticateToken, async (req, res) => {
  const username = req.query.username;

  try {
    const result = await pool.query('DELETE FROM aree_candidate WHERE username = $1 RETURNING *', [username]);

    res.status(200).json({ message: 'Poligoni rimossi con successo', deleted: result.rows });
  } catch (error) {
    console.error('Errore durante la rimozione dei poligoni:', error);
    res.status(500).json({ error: 'Errore del database' });
  }
});







app.listen(3000, () => {
  console.log('Server running on port 3000');
});
