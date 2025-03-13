const planUrl = "https://data.mobilites-m.fr/api/routers/default/plan";

// On initialise la latitude et la longitude de Grenoble (centre de la carte)
var lat = 45.166672;
var lon = 5.71667;
var map = null;
var shownItinerary = [];
var shownMarkers = [];
let itineraries = [];
let startCoords = null;
let endCoords = null;
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

function fetchItinaries() {
    const startInput = document.querySelector('input#start-point');
    const endInput = document.querySelector('input#end-point');
    const modeSelect = document.querySelector('.transport-btn.active');
    const avoidHighways = document.querySelector('input#avoid-highways').checked;
    const preferBikeLanes = document.querySelector('input#prefer-bike-lanes').checked;

    var start = startInput.value; // Coordonnées de départ
    var end = endInput.value; // Coordonnées d'arrivée

    if (!isCoordinateFormat(startInput.value.replaceAll(' ', '')) || !isCoordinateFormat(endInput.value.replaceAll(' ', ''))) {
        if (!isCoordinateFormat(startInput.value)) {
            searchPlace(startInput.value, true);
            start = document.querySelector('input#start-point').value;
        }
        if (!isCoordinateFormat(endInput.value)) {
            searchPlace(endInput.value, false);
            end = document.querySelector('input#end-point').value;
        }
    }


    var mode = modeSelect.value.toUpperCase();
    var otpUrl = `${planUrl}?fromPlace=${start}&toPlace=${end}&mode=${mode}`;

    console.log(mode);

    if (avoidHighways) {
        otpUrl += "&avoid=highways";
    }

    if (preferBikeLanes) {
        otpUrl += "&bikePreference=preferBikeLanes";
    }

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

                    if (data.plan.itineraries.length > 1 && itinerary.legs.length == 1 && itinerary.legs[0].mode == 'WALK') {
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

//test si la valeur est un format de coordonnées
function isCoordinateFormat(value) {
    // Regular expression to match coordinate format like "45.7, 56.8" or "45.7,56.8"
    const coordRegex = /^[-+]?([0-9]*\.[0-9]+|[0-9]+),\s*[-+]?([0-9]*\.[0-9]+|[0-9]+)$/;

    return coordRegex.test(value);
}



function setupMapClickListener() {
    map.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        const coordStr = `${lat}, ${lng}`;

        if (!startCoords) {
            // Set starting point
            startCoords = coordStr;
            document.getElementById('start-point').value = coordStr;

            // Add a marker for the starting point
            if (shownMarkers.length > 0) {
                shownMarkers.forEach(marker => map.removeLayer(marker));
                shownMarkers = [];
            }

            const startMarker = L.marker([lat, lng]).addTo(map);
            startMarker.bindPopup('Point de départ').openPopup();
            shownMarkers.push(startMarker);

            console.log("Starting point set:", coordStr);
        }
        else if (!endCoords) {
            // Set destination
            endCoords = coordStr;
            document.getElementById('end-point').value = coordStr;

            // Add a marker for the end point
            const endMarker = L.marker([lat, lng]).addTo(map);
            endMarker.bindPopup('Point d\'arrivée').openPopup();
            shownMarkers.push(endMarker);

            console.log("Destination set:", coordStr);

            // Automatically generate the itinerary once both points are set
            fetchItinaries();
        }
        else {
            // If both points are already set, reset and start over with a new starting point
            startCoords = coordStr;
            endCoords = null;

            // Clear existing markers and itinerary
            if (shownMarkers.length > 0) {
                shownMarkers.forEach(marker => map.removeLayer(marker));
                shownMarkers = [];
            }

            if (shownItinerary.length > 0) {
                shownItinerary.forEach(itinerary => map.removeLayer(itinerary));
                shownItinerary = [];
            }

            // Set new starting point
            document.getElementById('start-point').value = coordStr;
            document.getElementById('end-point').value = '';

            // Add a marker for the new starting point
            const startMarker = L.marker([lat, lng]).addTo(map);
            startMarker.bindPopup('Point de départ').openPopup();
            shownMarkers.push(startMarker);

            console.log("Reset: new starting point set:", coordStr);
        }
    });
}



//Fonction pour rechercher une place / lieux de grenoble et obtenir les coordonnées

function searchPlace(query, bool_start = true) {

    const searchQuery = `${query}, Grenoble, France`;

    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;

    fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const place = data[0];
                const lat = place.lat;
                const lon = place.lon;
                const coords = `${lat}, ${lon}`;

                if (bool_start) {
                    startCoords = coords;
                    document.getElementById('start-point').value = coords;
                } else {
                    endCoords = coords;
                    document.getElementById('end-point').value = coords;
                }

                const marker = L.marker([lat, lon]).addTo(map);
                marker.bindPopup(query).openPopup(); //affiche le nom du lieu en pop up
                shownMarkers.push(marker);

                if (startCoords && endCoords) {
                    fetchItinaries();
                }
            } else {
                console.error('Aucun lieu trouvé.');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données de l\'itinéraire:', error);
        });

}


// Fonction pour configurer les champs de saisie pour la recherche
function setupPlaceSearch() {
    const startInput = document.getElementById('start-point');
    const endInput = document.getElementById('end-point');

    if (startInput) {
        startInput.addEventListener('keypress', function (event) {

            if (event.key === 'Enter') {
                event.preventDefault();
                const query = this.value.trim();


                // Rechercher le lieu
                searchPlace(query, true);
            }
            else {
                searchPlace(query, true);
            }
        });
    }

    // Configurer l'événement pour la destination
    if (endInput) {
        endInput.addEventListener('keypress', function (event) {

            if (event.key === 'Enter') {
                event.preventDefault();
                const query = this.value.trim();

                // Rechercher le lieu
                searchPlace(query, false);
            }
        });

    }
}




window.onload = function () {
    // Function that runs when DOM is loaded
    initMap();


    setupPlaceSearch();

    const submitItinary = document.querySelector('#generate-route');
    submitItinary.addEventListener('click', (ev) => fetchItinaries());

    const resetButton = document.querySelector('.reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetRoute);
    }

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