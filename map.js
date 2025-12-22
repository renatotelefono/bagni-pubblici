// MAPPA BASE
const map = L.map("map").setView([41.9028, 12.4964], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

let layerBagni;
let markerCentro;
let modalitaSceltaMappa = false;

// =======================
// FUNZIONE OVERPASS
// =======================
function caricaBagni(lat, lon) {
  document.getElementById("status").innerText =
    "🔄 Caricamento bagni…";

  if (layerBagni) map.removeLayer(layerBagni);
  if (markerCentro) map.removeLayer(markerCentro);

  markerCentro = L.circleMarker([lat, lon], {
    radius: 8,
    color: "red",
    fillOpacity: 0.6
  })
    .addTo(map)
    .bindPopup("📍 Punto di ricerca")
    .openPopup();

  map.setView([lat, lon], 15);

  const query = `
[out:json][timeout:25];
(
  node["amenity"="toilets"](around:3000,${lat},${lon});
);
out body;
`;

  fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "data=" + encodeURIComponent(query)
  })
    .then(r => r.json())
    .then(data => mostraBagni(data))
    .catch(() => {
      document.getElementById("status").innerText =
        "❌ Errore nel caricamento";
    });
}

// =======================
// MOSTRA BAGNI
// =======================
function mostraBagni(data) {
  layerBagni = L.layerGroup();

  data.elements.forEach(el => {
    if (el.lat && el.lon) {
      L.marker([el.lat, el.lon])
        .bindPopup("🚻 Bagno pubblico")
        .addTo(layerBagni);
    }
  });

  layerBagni.addTo(map);

  document.getElementById("status").innerText =
    `🚻 Bagni trovati: ${data.elements.length}`;
}

// =======================
// PULSANTE GPS
// =======================
document.getElementById("btn-gps").addEventListener("click", () => {
  modalitaSceltaMappa = false;

  document.getElementById("status").innerText =
    "📍 Richiesta posizione GPS…";

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      caricaBagni(lat, lon);
    },
    () => {
      document.getElementById("status").innerText =
        "❌ Posizione non concessa";
    }
  );
});

// =======================
// PULSANTE MAPPA
// =======================
document.getElementById("btn-map").addEventListener("click", () => {
  modalitaSceltaMappa = true;
  document.getElementById("status").innerText =
    "🗺️ Tocca un punto sulla mappa";
});

// =======================
// CLICK SULLA MAPPA
// =======================
map.on("click", e => {
  if (!modalitaSceltaMappa) return;

  modalitaSceltaMappa = false;
  const { lat, lng } = e.latlng;
  caricaBagni(lat, lng);
});
