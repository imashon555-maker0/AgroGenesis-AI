-- AgroGenesis AI - Database Initialization Script
-- Runs automatically when PostgreSQL container starts

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify PostGIS is installed
SELECT PostGIS_Version();
