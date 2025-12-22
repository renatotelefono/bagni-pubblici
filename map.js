// Inizializza la mappa
const map = L.map("map").setView([41.9, 12.5], 13);

// OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

let layerBagni;

// Ottieni posizione utente
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      map.setView([lat, lon], 15);

      // Marker utente
      L.circleMarker([lat, lon], {
        radius: 8,
        color: "blue",
        fillColor: "blue",
        fillOpacity: 0.6
      })
        .addTo(map)
        .bindPopup("📍 Sei qui")
        .openPopup();

      caricaBagni(lat, lon);
    },
    err => {
      document.getElementById("status").innerText =
        "❌ Posizione non disponibile";
    }
  );
} else {
  document.getElementById("status").innerText =
    "❌ Geolocalizzazione non supportata";
}

// Funzione Overpass API
function caricaBagni(lat, lon) {
  document.getElementById("status").innerText =
    "🔄 Caricamento bagni vicini…";

  const query = `
[out:json][timeout:25];
(
  node["amenity"="toilets"](around:3000,${lat},${lon});
);
out body;
`;

  fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query
  })
    .then(res => res.json())
    .then(data => mostraBagni(data))
    .catch(err => {
      console.error(err);
      document.getElementById("status").innerText =
        "❌ Errore nel caricamento";
    });
}

// Mostra i bagni sulla mappa
function mostraBagni(data) {
  if (layerBagni) {
    map.removeLayer(layerBagni);
  }

  layerBagni = L.layerGroup();

  data.elements.forEach(el => {
    if (el.lat && el.lon) {
      const popup = `
        <strong>🚻 Bagno pubblico</strong><br>
        ${el.tags?.wheelchair === "yes" ? "♿ Accessibile<br>" : ""}
        ${el.tags?.fee === "yes" ? "💰 A pagamento" : "Gratis"}
      `;

      const marker = L.marker([el.lat, el.lon])
        .bindPopup(popup);

      layerBagni.addLayer(marker);
    }
  });

  layerBagni.addTo(map);

  document.getElementById("status").innerText =
    `🚻 Bagni trovati: ${data.elements.length}`;
}
