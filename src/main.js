const planUrl = "https://data.mobilites-m.fr/api/routers/default/plan";

// On initialise la latitude et la longitude de Paris (centre de la carte)
var lat = 45.166672;
var lon = 5.71667;
var macarte = null;
// Fonction d'initialisation de la carte
function initMap() {
    // Créer l'objet "macarte" et l'insèrer dans l'élément HTML qui a l'ID "map"
    macarte = L.map('map').setView([lat, lon], 11);
    // Leaflet ne récupère pas les cartes (tiles) sur un serveur par défaut. Nous devons lui préciser où nous souhaitons les récupérer. Ici, openstreetmap.fr
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        // Il est toujours bien de laisser le lien vers la source des données
        attributionControl: false,
        minZoom: 13,
        maxZoom: 20
    }).addTo(macarte);
}

function addItinary() {
    fetch(`${planUrl}?fromPlace=45.1871312,5.7279306&toPlace=45.193287,5.7683957`, {
        method: "GET",
    }).then(res => res.json())
        .then(res => res.plan.itineraries.forEach(itinerarie => {
            console.log(itinerarie.legs);
        }));
}

window.onload = function () {
    // Fonction d'initialisation qui s'exécute lorsque le DOM est chargé
    initMap();
    addItinary();
};