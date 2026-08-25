const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const trips = {};

app.post('/api/update', (req, res) => {
  const { tripId, lat, lng, status, distance, movingTime, stoppedTime } = req.body;
  if (!tripId) return res.status(400).json({ error: 'Falta tripId' });

  if (!trips[tripId]) trips[tripId] = { points: [], stats: {} };

  trips[tripId].points.push({ lat, lng, status, timestamp: new Date().toISOString() });
  trips[tripId].stats = { distance, movingTime, stoppedTime, lastUpdate: new Date().toISOString() };

  if (trips[tripId].points.length > 500) trips[tripId].points.shift();

  res.json({ success: true });
});

app.get('/api/trip/:tripId', (req, res) => {
  const trip = trips[req.params.tripId];
  if (!trip) return res.status(404).json({ error: 'Viaje no encontrado' });
  res.json(trip);
});

app.get('/api/trips', (req, res) => {
  const activeTrips = Object.keys(trips).map(id => ({
    tripId: id,
    stats: trips[id].stats,
    lastPoint: trips[id].points[trips[id].points.length - 1]
  }));
  res.json(activeTrips);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});