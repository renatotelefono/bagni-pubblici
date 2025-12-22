// 1. Inizializza mappa (Roma come fallback)
const map = L.map("map").setView([41.9028, 12.4964], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

let layerBagni;

// 2. Funzione Overpass
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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "data=" + encodeURIComponent(query)
  })
    .then(res => {
      if (!res.ok) throw new Error("Errore Overpass");
      return res.json();
    })
    .then(data => mostraBagni(data))
    .catch(err => {
      console.error("OVERPASS ERROR:", err);
      document.getElementById("status").innerText =
        "❌ Errore nel caricamento dei bagni";
    });
}

// 3. Mostra bagni
function mostraBagni(data) {
  if (layerBagni) map.removeLayer(layerBagni);

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

// 4. Geolocalizzazione CON DEBUG
if ("geolocation" in navigator) {
  document.getElementById("status").innerText =
    "📍 Richiesta posizione…";

  navigator.geolocation.getCurrentPosition(
    pos => {
      console.log("POSIZIONE OK", pos.coords);

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      map.setView([lat, lon], 15);

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
      console.error("GEO ERROR:", err);

      document.getElementById("status").innerText =
        "⚠️ Posizione non concessa, uso Roma";

      // 🔴 Fallback FORZATO (Roma)
      caricaBagni(41.9028, 12.4964);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000
    }
  );
} else {
  document.getElementById("status").innerText =
    "❌ Geolocalizzazione non supportata";
}
