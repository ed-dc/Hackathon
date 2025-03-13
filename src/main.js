const planUrl = "https://data.mobilites-m.fr/api/routers/default/plan";

// On initialise la latitude et la longitude de Paris (centre de la carte)
var lat = 45.166672;
var lon = 5.71667;
var map = null;
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
    // fetch(`${planUrl}?fromPlace=&toPlace`, {
    //     method: "GET",
    // }).then(res => res.json())
    //     .then(res => res.plan.itineraries.forEach(itinerarie => {
    //         itinerarie.legs.forEach(leg => {
    //             // console.log(leg.from, leg.to);
    //             const from = [leg.from.lat, leg.from.lon];
    //             const to = [leg.to.lat, leg.to.lon];
    //             var polyline = new L.polyline([from, to], {
    //                 color: 'red'
    //             });
    //             polyline.addTo(map);
    //             // console.log("added to map");
    //         })
    //     }));

    var start = '45.1871312,5.7279306'; // Coordonnées de départ (Paris)
    var end = '45.193287,5.7683957'; // Coordonnées d'arrivée
    var otpUrl = `${planUrl}?fromPlace=${start}&toPlace=${end}&mode=WALK`;

    fetch(otpUrl)
        .then(response => response.json())
        .then(data => {
            if (data.plan && data.plan.itineraries && data.plan.itineraries.length > 0) {
                var itinerary = data.plan.itineraries[0];
                var legs = itinerary.legs;
                var latlngs = [];
                console.log(legs);

                const leg = legs[0];
                leg.steps.forEach(step => {
                    const loc = [step.lat, step.lon];

                    latlngs.push(loc);
                })

                // Ajouter une ligne polyline à la carte
                var polyline = L.polyline(latlngs, { color: 'red' }).addTo(map);

                // Ajouter des marqueurs au point de départ et d'arrivée
                var startMarker = L.marker(latlngs[0]).addTo(map)
                    .bindPopup('Point de départ').openPopup();
                var endMarker = L.marker(latlngs[latlngs.length - 1]).addTo(map)
                    .bindPopup('Point d\'arrivée').openPopup();

                // Zoomer sur l'itinéraire
                map.fitBounds(polyline.getBounds());
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
    addItinary();
};