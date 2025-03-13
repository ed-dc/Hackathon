const planUrl = "https://data.mobilites-m.fr/api/routers/default/plan";

// On initialise la latitude et la longitude de Grenoble (centre de la carte)
var lat = 45.166672;
var lon = 5.71667;
var map = null;
var shownItinerary = [];
var shownMarkers = [];
let itineraries = [];
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

function fetchItinaries() {
    const startInput = document.querySelector('input#start-point');
    const endInput = document.querySelector('input#end-point');
    const modeSelect = document.querySelector('.transport-btn.active');
    const avoidHighways = document.querySelector('input#avoid-highways').checked;
    const preferBikeLanes = document.querySelector('input#prefer-bike-lanes').checked;

    var start = startInput.value; // Coordonnées de départ
    var end = endInput.value; // Coordonnées d'arrivée
    var mode = modeSelect.value.toUpperCase();
    var otpUrl = `${planUrl}?fromPlace=${start}&toPlace=${end}&mode=${mode}`;

    console.log(mode);

    if (avoidHighways) {
        otpUrl += "&avoid=highways";
    }

    if (preferBikeLanes) {
        otpUrl += "&bikePreference=preferBikeLanes";
    }

    // if (currentItinary) {
    //     currentItinary.forEach((itinary) => {
    //         map.removeLayer(itinary);
    //     });
    // }

    // if (currentMarkers) {
    //     currentMarkers.forEach((marker) => {
    //         map.removeLayer(marker);
    //     });
    // }

    const itineraryContainer = document.querySelector('.itinerary-container');
    itineraryContainer.innerHTML = '';

    fetch(otpUrl)
        .then(response => response.json())
        .then(data => {
            if (data.plan && data.plan.itineraries && data.plan.itineraries.length > 0) {
                data.plan.itineraries.forEach((itinerary, index) => {
                    let transportType = '';
                    let transportIcon = '';
                    let transportLength = '';
                    let mode = modeSelect.value;

                    switch (mode) {
                        case 'WALK':
                            transportType = 'Marche';
                            transportIcon = 'walking';
                            break;
                        case 'TRANSIT':
                            transportType = 'Transport en commun';
                            transportIcon = 'bus';
                            break;
                        case 'BICYCLE':
                            transportType = 'Vélo';
                            transportIcon = 'bicycle';
                            break;
                        case 'CAR':
                            transportType = 'Voiture';
                            transportIcon = 'car';
                            break;
                    }

                    if (data.plan.itineraries.length > 1 && index == 0) {
                        // Itiniraire a pied quand transport en commun
                        transportType = 'Marche';
                        transportIcon = 'walking';
                        mode = "WALK";
                    }

                    const itineraryElement = document.createElement('div');
                    itineraryElement.classList.add('itinerary-card');
                    itineraryElement.innerHTML = `
                        <div class="itinerary-header ${mode.toLowerCase()}" num="${index}">
                            <i class="fas fa-${transportIcon}"></i>
                                <div class="itinerary-main-info">
                                    <div class="transport-type">${transportType}</div>
                                    <div class="time-info">
                                        <span>45 min</span>
                                        <span>•</span>
                                        <span>10:30 - 11:15</span>
                                    </div>
                                </div>
                                <div class="itinerary-details">
                                    <div class="route-steps">
                                        <div class="step"><i class="fas fa-walking"></i> 5 min marche</div>
                                        <div class="step"><i class="fas fa-bus"></i> Ligne C1 • 30 min</div>
                                        <div class="step"><i class="fas fa-walking"></i> 10 min marche</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    itineraryContainer.appendChild(itineraryElement);
                    itineraries.push(itinerary);
                    
                });
            } else {
                console.error('Aucun itinéraire trouvé.');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données de l\'itinéraire:', error);
        });
}

function showItinerary(itineraryIdx) {
    shownItinerary.forEach((itinerary) => {
        map.removeLayer(itinerary);
    });
    shownMarkers.forEach((marker) => {
        map.removeLayer(marker);
    });
    
    const itinerary = itineraries[itineraryIdx];

    var legs = itinerary.legs;
    let latlngs = [];

    legs.forEach(leg => {
        const polyline = L.Polyline.fromEncoded(leg.legGeometry.points);
        shownItinerary.push(polyline);
        
        latlngs = latlngs.concat(polyline.getLatLngs());
        const dashArray = leg.mode === "WALK" ? '5, 10' : 'none';
        polyline.setStyle({ dashArray: dashArray }).addTo(map);
    });

    // Ajouter des marqueurs au point de départ et d'arrivée
    shownMarkers.push(L.marker(latlngs[0]).addTo(map).bindPopup('Point de départ').openPopup());
    shownMarkers.push(L.marker(latlngs[latlngs.length - 1]).addTo(map).bindPopup('Point d\'arrivée').openPopup());

    // Zoomer sur l'itinéraire
    map.fitBounds(L.polyline([latlngs[0], latlngs[latlngs.length - 1]]).getBounds());
}

window.onload = function () {
    // Function that runs when DOM is loaded
    initMap();

    const submitItinary = document.querySelector('#generate-route');
    submitItinary.addEventListener('click', (ev) => fetchItinaries());

    document.querySelectorAll('button.transport-btn').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
            document.querySelectorAll('button.transport-btn').forEach((btn) => {
                btn.classList.remove('active');
            });

            btn.classList.add('active');
        });
    });

    document.querySelectorAll('.itinerary-container').forEach((container) => {
        container.addEventListener('click', (ev) => {
            const itineraryCard = ev.target.closest('.itinerary-header');
            if (itineraryCard) {
                showItinerary(itineraryCard.getAttribute('num'));
            }
        });
    });
}