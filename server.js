const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const trips = {};

// Recibir actualización de posición del móvil
app.post('/api/update', (req, res) => {
  const { tripId, lat, lng, status, distance, movingTime, stoppedTime } = req.body;
  if (!tripId) return res.status(400).json({ error: 'Falta tripId' });

  if (!trips[tripId]) trips[tripId] = { points: [], stats: {}, plannedWaypoints: [], arrivals: [] };

  trips[tripId].points.push({ lat, lng, status, timestamp: new Date().toISOString() });
  trips[tripId].stats = { distance, movingTime, stoppedTime, lastUpdate: new Date().toISOString() };

  if (trips[tripId].points.length > 500) trips[tripId].points.shift();

  res.json({ success: true });
});

// 🆕 Dashboard guarda la ruta planificada asociada al trip
app.post('/api/route/plan', (req, res) => {
  const { tripId, waypoints } = req.body;
  if (!tripId || !waypoints) return res.status(400).json({ error: 'Datos incompletos' });

  if (!trips[tripId]) trips[tripId] = { points: [], stats: {}, plannedWaypoints: [], arrivals: [] };
  trips[tripId].plannedWaypoints = waypoints;
  trips[tripId].arrivals = []; // Reiniciar llegadas al planificar nueva ruta

  res.json({ success: true });
});

// 🆕 Móvil obtiene los waypoints planificados
app.get('/api/route/:tripId', (req, res) => {
  const trip = trips[req.params.tripId];
  if (!trip) return res.status(404).json({ error: 'No encontrado' });
  res.json({ 
    plannedWaypoints: trip.plannedWaypoints,
    arrivals: trip.arrivals 
  });
});

// 🆕 Móvil reporta "Llegué" a un waypoint
app.post('/api/arrive', (req, res) => {
  const { tripId, waypointIndex, lat, lng, legDistance, legDuration, legMovingTime, legStoppedTime } = req.body;
  if (!tripId || waypointIndex === undefined) return res.status(400).json({ error: 'Datos incompletos' });

  if (!trips[tripId]) trips[tripId] = { points: [], stats: {}, plannedWaypoints: [], arrivals: [] };

  trips[tripId].arrivals.push({
    waypointIndex,
    lat, lng,
    timestamp: new Date().toISOString(),
    legDistance,
    legDuration,
    legMovingTime,
    legStoppedTime
  });

  res.json({ success: true });
});

// Obtener un viaje completo
app.get('/api/trip/:tripId', (req, res) => {
  const trip = trips[req.params.tripId];
  if (!trip) return res.status(404).json({ error: 'Viaje no encontrado' });
  res.json(trip);
});

// Listar todos los viajes
app.get('/api/trips', (req, res) => {
  const activeTrips = Object.keys(trips).map(id => ({
    tripId: id,
    stats: trips[id].stats,
    lastPoint: trips[id].points[trips[id].points.length - 1],
    hasPlannedRoute: trips[id].plannedWaypoints.length > 0,
    arrivalsCount: trips[id].arrivals.length
  }));
  res.json(activeTrips);
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
