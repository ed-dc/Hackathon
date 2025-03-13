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

const startIcon = L.divIcon({
    html: '<i class="fas fa-map-marker fa-2x" style="color:#3388ff;"></i>',
    iconSize: [20, 20],
    className: 'start-icon'
});

const endIcon = L.divIcon({
    html: '<i class="fas fa-flag fa-2x" style="color:#3388ff;"></i>',
    iconSize: [20, 20],
    className: 'end-icon'
});

// Fonction d'initialisation de la carte
function initMap() {
    // Créer l'objet "macarte" et l'insèrer dans l'élément HTML qui a l'ID "map"
    map = L.map('map', {
        zoomControl: true,
        maxZoom: 20,
        minZoom: 13
    }).setView([lat, lon], 11);

    // Utilisation d'une carte plus simple de Carto
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '',
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 13
    }).addTo(map);
    setupMapClickListener();
}

function fetchItinaries(isSearch = false) {
    const startInput = document.querySelector('input#start-point');
    const endInput = document.querySelector('input#end-point');
    const modeSelect = document.querySelector('.transport-btn.active');
    const avoidHighways = document.querySelector('input#avoid-highways').checked;
    const preferBikeLanes = document.querySelector('input#prefer-bike-lanes').checked;
    var start ;
    var end;

    if (startInput.value === '' || endInput.value === '') {
        return;
    }

    if (isSearch) {    // le cas ou l'on fait une recherche alors la value dans starting point est un lieu et non des coordonnées

        start = startInput.getAttribute('data-coords');
        end = endInput.getAttribute('data-coords');

    }
    else {
        start = startInput.value; 
        end = endInput.value; 
    }


    var mode = modeSelect.value.toUpperCase();
    var otpUrl = `${planUrl}?fromPlace=${start}&toPlace=${end}&mode=${mode}`;


    if (avoidHighways) {
        otpUrl += "&avoid=highways";
    }

    if (preferBikeLanes) {
        otpUrl += "&bikePreference=preferBikeLanes";
    }

    const itineraryContainer = document.querySelector('.itinerary-container');
    itineraryContainer.innerHTML = '';

    itineraries = [];

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
                    itineraryElement.setAttribute('num', index);
                    if (index == 0) {
                        itineraryElement.classList.add('active');
                    }
                    const startTime = new Date(itinerary.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    const endTime = new Date(itinerary.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                    itineraryElement.innerHTML = `
                        <div class="itinerary-header ${mode.toLowerCase()}">
                            <i class="fas fa-${transportIcon}"></i>
                                <div class="itinerary-main-info">
                                    <div class="transport-type">${transportType}</div>
                                    <div class="time-info">
                                        <span>${Math.round(itinerary.duration / 60)} min</span>
                                        <span>•</span>
                                        <span>${startTime} - ${endTime}</span>
                                    </div>
                                </div>
                                <!--<div class="itinerary-details">
                                    <div class="route-steps">
                                        <div class="step"><i class="fas fa-walking"></i> 5 min marche</div>
                                        <div class="step"><i class="fas fa-bus"></i> Ligne C1 • 30 min</div>
                                        <div class="step"><i class="fas fa-walking"></i> 10 min marche</div>
                                    </div>
                                </div> -->
                            </div>
                        `;
                    if (mode == "TRANSIT") {
                        const itineraryDetails = document.createElement('div');
                        itineraryDetails.classList.add('itinerary-details');
                        const routeSteps = document.createElement('div');
                        routeSteps.classList.add('route-steps');

                        itinerary.legs.forEach(leg => {
                            const legIcon = leg.mode === 'WALK' ? 'walking' : (leg.mode === 'BUS' ? 'bus' : 'tram');
                            const legLength = leg.distance.toFixed(0);
                            const legTime = Math.round(leg.duration / 60);

                            routeSteps.innerHTML += `
                                    <div class="step">
                                        <i class="fas fa-${legIcon}"></i>
                                        <!--${leg.mode === 'WALK' ? "marche" : (leg.mode === 'BUS' ? 'Bus' : 'Tram')}-->
                                        ${leg.route ? `${leg.mode === 'BUS' ? 'Bus' : 'Tram'} ${leg.routeShortName} • ` : ''}
                                        ${leg.duration > 0 ? `${legTime} min` : ''}
                                    </div>`
                        });
                        itineraryDetails.appendChild(routeSteps);
                        itineraryElement.children[0].appendChild(itineraryDetails);
                    }
                    itineraryContainer.appendChild(itineraryElement);
                    itineraries.push(itinerary);
                    showItinerary(0);

                });
            } else {
                console.error('Aucun itinéraire trouvé.');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données de l\'itinéraire:', error);
        });
}

function showItinerary(itineraryIdx = 0) {
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
        const color = (leg.mode === "BUS" || leg.mode === "TRAM") ? `#${leg.routeColor}` : '#3388ff';
        polyline.setStyle({
            dashArray: dashArray,
            weight: 5,
            opacity: 0.7,
            smoothFactor: 1,
            color: color,
        }).addTo(map);
    });

    // Ajouter des marqueurs au point de départ et d'arrivée
    shownMarkers.push(L.marker(latlngs[0], { icon: startIcon }).addTo(map));
    shownMarkers.push(L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(map));

    // Zoomer sur l'itinéraire
    map.fitBounds(L.polyline([latlngs[0], latlngs[latlngs.length - 1]]).getBounds());
}



function setupMapClickListener() {
    map.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        const coordStr = `${lat}, ${lng} `;

        if (!startCoords) {
            // Set starting point
            startCoords = coordStr;
            
            document.getElementById('start-point').value = coordStr;

            // Add a marker for the starting point
            if (shownMarkers.length > 0) {
                shownMarkers.forEach(marker => map.removeLayer(marker));
                shownMarkers = [];
            }

            const startMarker = L.marker([lat, lng], { icon: startIcon }).addTo(map);

            shownMarkers.push(startMarker);

            console.log("Starting point set:", coordStr);
        }
        else if (!endCoords) {
            // Set destination
            endCoords = coordStr;
            document.getElementById('end-point').value = coordStr;

            // Add a marker for the end point
            const endMarker = L.marker([lat, lng], { icon: endIcon }).addTo(map);

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
            const startMarker = L.marker([lat, lng], { icon: startIcon }).addTo(map);

            shownMarkers.push(startMarker);

            console.log("Reset: new starting point set:", coordStr);
        }
    });
}

//On utilise l'API nominatim pour rechercher des lieux
// search : la chaîne de recherche
// bool_start : booléen pour déterminer s'il s'agit du point de départ ou d'arrivée

function searchPlace(search, bool_start = true) {
    const searchQuery = `${search}, Grenoble, France`;
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`;
    
    // Supprimer tout menu déroulant existant
    const existingDropdowns = document.querySelectorAll('.place-dropdown');
    existingDropdowns.forEach(dropdown => dropdown.remove());
    
    fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                // Créer le menu déroulant avec les options de lieux
                createPlaceDropdown(data, bool_start);
            } else {
                console.error('Aucun lieu trouvé.');
                // Afficher un message d'erreur dans l'interface utilisateur
                const inputElement = bool_start ? document.getElementById('start-point') : document.getElementById('end-point');
                showNoResultsMessage(inputElement);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données:', error);
        });
}


// création du menu déroulant   
// places : tableau d'objets de lieux
// bool_start : booléen pour déterminer s'il s'agit du point de départ ou d'arrivée

function createPlaceDropdown(places, bool_start) {
    // Déterminer le champ d'entrée concerné
    const inputElement = bool_start ? document.getElementById('start-point') : document.getElementById('end-point');
    

    const dropdown = document.createElement('div');
    dropdown.className = 'place-dropdown';
    
    
    places.forEach(place => {
        const placeName = extractShortPlaceName(place.display_name);
        const coords = `${place.lat}, ${place.lon}`;
        
        const option = document.createElement('div');
        option.className = 'place-option';
        option.innerHTML = `
            <div class="place-name">${placeName}</div>
            <div class="place-address">${place.display_name}</div>
        `;
        
        // Ajouter un gestionnaire d'événements pour le clic sur une option
        option.addEventListener('click', function() {
   
            inputElement.value = placeName;
            

            inputElement.setAttribute('data-coords', coords);
            
            // Supprimer le menu déroulant après sélection
            dropdown.remove();
            
 
            addPlaceMarker(place.lat, place.lon, bool_start);
            
            // Si les deux points sont définis, générer l'itinéraire
            if (document.getElementById('start-point').getAttribute('data-coords') && 
                document.getElementById('end-point').getAttribute('data-coords')) {
                fetchItinaries(true);
            }
        });
        
        dropdown.appendChild(option);
    });
    
    // Positionner le menu déroulant sous le champ d'entrée
    const inputRect = inputElement.getBoundingClientRect();
    dropdown.style.top = (inputRect.bottom) + 'px';
    dropdown.style.left = inputRect.left + 'px';
    dropdown.style.width = inputRect.width + 'px';
    
    // Ajouter le menu déroulant au document
    document.body.appendChild(dropdown);
    
    // Fermer le menu si on clique ailleurs
    document.addEventListener('click', function closeDropdown(e) {
        if (!dropdown.contains(e.target) && e.target !== inputElement) {
            dropdown.remove();
            document.removeEventListener('click', closeDropdown);
        }
    });
}

function addPlaceMarker(lat, lon, bool_start) {
    // Supprimer les marqueurs existants si nécessaire
    if (bool_start) {
        // Si c'est un point de départ, on supprime tous les marqueurs
        shownMarkers.forEach(marker => map.removeLayer(marker));
        shownMarkers = [];
        startCoords = `${lat}, ${lon}`;
    } else if (!startCoords) {
        // Si c'est une destination mais qu'il n'y a pas de point de départ, on supprime aussi
        shownMarkers.forEach(marker => map.removeLayer(marker));
        shownMarkers = [];
        endCoords = `${lat}, ${lon}`;
    } else {
        // Si c'est une destination et qu'il y a déjà un point de départ,
        // on ne supprime que le marqueur de destination s'il existe
        if (shownMarkers.length > 1) {
            map.removeLayer(shownMarkers.pop());
        }
        endCoords = `${lat}, ${lon}`;
    }
    
    // Ajouter le nouveau marqueur
    const markerIcon = bool_start ? startIcon : endIcon;
    const marker = L.marker([lat, lon], { icon: markerIcon }).addTo(map);
    shownMarkers.push(marker);
    
    // Zoomer sur le marqueur
    map.setView([lat, lon], 15);
}

function showNoResultsMessage(inputElement) {

    // Créer un menu déroulant avec un message d'erreur
    const dropdown = document.createElement('div');
    dropdown.className = 'place-dropdown';
    
    const message = document.createElement('div');
    message.className = 'no-results';
    message.textContent = 'Aucun résultat trouvé';
    
    dropdown.appendChild(message);
    
    // Positionner et afficher le message
    const inputRect = inputElement.getBoundingClientRect();
    dropdown.style.top = (inputRect.bottom) + 'px';
    dropdown.style.left = inputRect.left + 'px';
    dropdown.style.width = inputRect.width + 'px';
    
    document.body.appendChild(dropdown);
    
    // Fermer le message après 2 secondes
    setTimeout(() => {
        dropdown.remove();
    }, 2000);
}


function setupPlaceSearch() {
    const startInput = document.getElementById('start-point');
    const endInput = document.getElementById('end-point');

    if (startInput) {
        startInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const query = this.value;

                searchPlace(query, true);
            }
        });
    }

    if (endInput) {
        endInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const query = this.value;
                
                searchPlace(query, false);
            }
        });
    }
}


// L'API Nominatim renvoie souvent des noms très longs avec beaucoup de détails
// Cette fonction extrait juste la partie la plus pertinente

function extractShortPlaceName(displayName) {
    
    const parts = displayName.split(',');
    

    if (parts.length < 3) return displayName;
    
    const word_0 = parts[0].trim();
    const word_1 = parts[1].trim();
    
    return `${word_0}, ${word_1}`;
}


window.onload = function () {
    // Function that runs when DOM is loaded
    initMap();


    setupPlaceSearch();

    document.querySelectorAll('button.transport-btn').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
            document.querySelectorAll('button.transport-btn').forEach((btn) => {
                btn.classList.remove('active');
            });

            btn.classList.add('active');
            fetchItinaries();
        });
    });

    document.querySelectorAll('.itinerary-container').forEach((container) => {
        container.addEventListener('click', (ev) => {
            const itineraryCard = ev.target.closest('.itinerary-card');
            document.querySelectorAll('.itinerary-card').forEach((it) => {
                it.classList.remove('active');
            });

            itineraryCard.classList.add('active');
            if (itineraryCard) {
                showItinerary(itineraryCard.getAttribute('num'));
            }
        });
    });
}