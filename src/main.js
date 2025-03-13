const planUrl = "https://data.mobilites-m.fr/api/routers/default/plan";

// On initialise la latitude et la longitude de Grenoble (centre de la carte)
var lat = 45.166672;
var lon = 5.71667;
var map = null;
var startCoords = null;
var endCoords = null;
var currentItinary = null;
var currentMarkers = [];
// Fonction d'initialisation de la carte
function initMap() {
    // Créer l'objet "macarte" et l'insèrer dans l'élément HTML qui a l'ID "map"
    map = L.map('map').setView([lat, lon], 11);
    // Leaflet ne récupère pas les cartes (tiles) sur un serveur par défaut. Nous devons lui préciser où nous souhaitons les récupérer. Ici, openstreetmap.fr
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        // Il est toujours bien de laisser le lien vers la source des données
        attributionControl: false,
        minZoom: 13,
        maxZoom: 20
    }).addTo(map);

    setupMapClickListener();    
}

function addItinary() {
    const startInput = document.querySelector('input#start-point');
    const endInput = document.querySelector('input#end-point');
    const modeSelect = document.querySelector('.transport-btn.active');
    const avoidHighways = document.querySelector('input#avoid-highways').checked;
    const preferBikeLanes = document.querySelector('input#prefer-bike-lanes').checked;

    var start = startInput.value; // Coordonnées de départ
    var end = endInput.value; // Coordonnées d'arrivée
    var mode = modeSelect.value.toUpperCase();
    var otpUrl = `${planUrl}?fromPlace=${start}&toPlace=${end}&mode=${mode}`;

    if (avoidHighways) {
        otpUrl += "&avoid=highways";
    }

    if (preferBikeLanes) {
        otpUrl += "&bikePreference=preferBikeLanes";
    }

    if (currentItinary) {
        map.removeLayer(currentItinary);
    }

    if (currentMarkers) {
        currentMarkers.forEach((marker) => {
            map.removeLayer(marker);
        });
    }

    fetch(otpUrl)
        .then(response => response.json())
        .then(data => {
            if (data.plan && data.plan.itineraries && data.plan.itineraries.length > 0) {
                var itinerary = data.plan.itineraries[0];
                var legs = itinerary.legs;
                var latlngs = [];

                const leg = legs[0];
                leg.steps.forEach(step => {
                    const loc = [step.lat, step.lon];

                    latlngs.push(loc);
                })

                // Ajouter une ligne polyline à la carte
                currentItinary = L.polyline(latlngs, { color: 'red' }).addTo(map);

                // Ajouter des marqueurs au point de départ et d'arrivée
                currentMarkers.push(L.marker(latlngs[0]).addTo(map).bindPopup('Point de départ').openPopup());
                currentMarkers.push(L.marker(latlngs[latlngs.length - 1]).addTo(map).bindPopup('Point d\'arrivée').openPopup());

                // Zoomer sur l'itinéraire
                map.fitBounds(currentItinary.getBounds());
            } else {
                console.error('Aucun itinéraire trouvé.');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données de l\'itinéraire:', error);
        });
}


function setupMapClickListener() {
    map.on('click', function(e) {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      const coordStr = `${lat}, ${lng}`;
      
      if (!startCoords) {
        // Set starting point
        startCoords = coordStr;
        document.getElementById('start-point').value = coordStr;
        
        // Add a marker for the starting point
        if (currentMarkers.length > 0) {
          currentMarkers.forEach(marker => map.removeLayer(marker));
          currentMarkers = [];
        }
        
        const startMarker = L.marker([lat, lng]).addTo(map);
        startMarker.bindPopup('Point de départ').openPopup();
        currentMarkers.push(startMarker);
        
        console.log("Starting point set:", coordStr);
      }
      else if (!endCoords) {
        // Set destination
        endCoords = coordStr;
        document.getElementById('end-point').value = coordStr;
        
        // Add a marker for the end point
        const endMarker = L.marker([lat, lng]).addTo(map);
        endMarker.bindPopup('Point d\'arrivée').openPopup();
        currentMarkers.push(endMarker);
        
        console.log("Destination set:", coordStr);
        
        // Automatically generate the itinerary once both points are set
        addItinary();
      }
      else {
        // If both points are already set, reset and start over with a new starting point
        startCoords = coordStr;
        endCoords = null;
        
        // Clear existing markers and itinerary
        if (currentMarkers.length > 0) {
          currentMarkers.forEach(marker => map.removeLayer(marker));
          currentMarkers = [];
        }
        
        if (currentItinary) {
          map.removeLayer(currentItinary);
          currentItinary = null;
        }
        
        // Set new starting point
        document.getElementById('start-point').value = coordStr;
        document.getElementById('end-point').value = '';
        
        // Add a marker for the new starting point
        const startMarker = L.marker([lat, lng]).addTo(map);
        startMarker.bindPopup('Point de départ').openPopup();
        currentMarkers.push(startMarker);
        
        console.log("Reset: new starting point set:", coordStr);
      }
    });
}



function resetRoute() {
    startCoords = null;
    endCoords = null;
    
    // Clear inputs
    document.getElementById('start-point').value = '';
    document.getElementById('end-point').value = '';
    
    // Clear existing markers and itinerary
    if (currentMarkers.length > 0) {
        currentMarkers.forEach(marker => map.removeLayer(marker));
        currentMarkers = [];
    }
    
    if (currentItinary) {
        map.removeLayer(currentItinary);
        currentItinary = null;
    }
    
    console.log("Route reset");
    }


window.onload = function () {
    // Fonction d'initialisation qui s'exécute lorsque le DOM est chargé
    initMap();
    // addItinary();

    //Add ability to click


    const submitItinary = document.querySelector('#generate-route');
    submitItinary.addEventListener('click', (ev) => addItinary());

    const resetButton = document.querySelector('.reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetRoute);
    }
}