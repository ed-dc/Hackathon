const planUrl = "https://data.mobilites-m.fr/api/routers/default/plan";

// On initialise la latitude et la longitude de Grenoble (centre de la carte)
var lat = 45.166672;
var lon = 5.71667;
var map = null;
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





window.onload = function () {
    // Fonction d'initialisation qui s'exécute lorsque le DOM est chargé
    initMap();
    // addItinary();

    //Add ability to click
    document.addEventListener('DOMContentLoaded', clickOnMap);


    const submitItinary = document.querySelector('#generate-route');
    submitItinary.addEventListener('click', (ev) => addItinary());
};