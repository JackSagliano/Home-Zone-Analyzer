CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS aree_candidate (
    id serial PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    geom GEOMETRY(Polygon, 4326)
);
CREATE TABLE IF NOT EXISTS immobili_candidati (
    id serial PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    geom GEOMETRY(Point, 4326)
);
CREATE TABLE IF NOT EXISTS quartieri_bologna (
    id serial PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    geom GEOMETRY(POLYGON, 4326)
);

CREATE TABLE IF NOT EXISTS aree_verdi (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326)
);
CREATE TABLE IF NOT EXISTS biblioteche (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326)
);
CREATE TABLE IF NOT EXISTS cinema (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326)
);
CREATE TABLE IF NOT EXISTS eventi (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326)
);
CREATE TABLE IF NOT EXISTS fermate_autobus (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326)
);
CREATE TABLE IF NOT EXISTS impianti_sportivi (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326)
);
CREATE TABLE IF NOT EXISTS musei (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326)
);
CREATE TABLE IF NOT EXISTS ospedali (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326)
);
CREATE TABLE IF NOT EXISTS stazioni_ferroviarie (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326)
);
CREATE TABLE IF NOT EXISTS teatri (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326)
);
CREATE TABLE IF NOT EXISTS wifi_gratuito (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326)
);