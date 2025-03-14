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
        zoomControl: false,
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
    var start;
    var end;

    if (startInput.value === '' || endInput.value === '') {
        return;
    }

    console.log('Fetching itineraries... with  search value : ', isSearch);

    if (isSearch) {    // le cas ou l'on fait une recherche alors la value dans starting point est un lieu et non des coordonnées

        if (startInput.getAttribute('data-coords')) {

            start = startInput.getAttribute('data-coords');
        }
        else {
            start = startInput.value;
        }
        if (endInput.getAttribute('data-coords')) {
            end = endInput.getAttribute('data-coords');
        }
        else {
            end = endInput.value;
        }

    }
    else {
        start = startInput.value;
        end = endInput.value;
    }


    var mode = modeSelect.value.toUpperCase();
    var otpUrl = `${planUrl}?fromPlace=${start}&toPlace=${end}&mode=${mode}`;


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

                    if (itinerary.legs.length == 1 && itinerary.legs[0].mode == 'WALK') {
                        // Itiniraire a pied quand transport en commun
                        transportType = 'Marche';
                        transportIcon = 'walking';
                        mode = "WALK";
                        if (data.plan.itineraries.length > 1) {
                            // Il y a bien des itinéraires de transport en commun
                            return;
                        }
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
                                <!--<div class="transport-type">${transportType}</div>-->
                                <div class="transport-info">
                                    <div class="time-info">
                                        <span>${Math.round(itinerary.duration / 60)} min</span>
                                        <span>•</span>
                                        <span>${startTime} - ${endTime}</span>
                                    </div>
                                </div>
                                <!--</div>-->
                            </div>
                        `;

                    // Ajouter l'empreinte carbone
                    let co2Emission = 0;
                    itinerary.legs.forEach(leg => {
                        let km = leg.distance / 1000;
                        if (leg.mode === 'WALK') {
                            co2Emission += 0;
                        } else if (leg.mode === 'BICYCLE') {
                            co2Emission += 0;
                        } else if (leg.mode === 'BUS') {
                            co2Emission += 113 * km;
                        } else if (leg.mode === 'TRAM') {
                            co2Emission += 4.28 * km;
                        }
                    });

                    const co2Container = document.createElement('div');
                    co2Container.classList.add('co2-container');

                    const co2Info = document.createElement('div');
                    co2Info.classList.add('co2-info');
                    co2Info.innerHTML = `
                                <i class="fas fa-leaf"></i>
                                <span>${Math.round(co2Emission * 100) / 100} g</span>
                            `;
                    co2Container.appendChild(co2Info);

                    const carInfo = document.createElement('div');
                    carInfo.classList.add('co2-info');
                    carInfo.classList.add('car');
                    carInfo.innerHTML = `
                                <i class="fas fa-car"></i>
                                <span>0 g</span>
                            `;
                    co2Container.appendChild(carInfo);

                    fetchCarConsumption(carInfo, start, end).then(() => {
                        itineraryElement.children[0].appendChild(co2Container);

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
                        if (index == 0) {
                            showItinerary(0);
                        }
                    });

                });
            } else {
                const noItineraryElement = document.createElement('div');
                noItineraryElement.id = 'no-itinerary';
                noItineraryElement.textContent = 'Aucun itinéraire trouvé';
                itineraryContainer.appendChild(noItineraryElement);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données de l\'itinéraire:', error);
        });
}

async function fetchCarConsumption(co2Element, start, end) {

    var otpUrl = `${planUrl}?fromPlace=${start}&toPlace=${end}&mode=CAR`;

    const response = await fetch(otpUrl);
    const data = await response.json();
    if (data.plan && data.plan.itineraries && data.plan.itineraries.length > 0) {
        const itinerary = data.plan.itineraries[0];
        let carCo2Emission = 0;
        itinerary.legs.forEach(leg => {
            let km = leg.distance / 1000;
            carCo2Emission += 218 * km;
        });
        co2Element.querySelector('span').textContent = `${Math.round(carCo2Emission * 100) / 100} g`;
    }
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

    const routeTracker = document.querySelector('.route-tracker');
    routeTracker.classList.remove('hidden');

    const routeTimeline = document.querySelector('.route-timeline');
    routeTimeline.innerHTML = '';

    const routeTrackerHeader = document.querySelector('.route-tracker-header');
    routeTrackerHeader.querySelectorAll('.co2-container').forEach((co2Container) => {
        co2Container.remove();
    });
    let co2Emission = 0;

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

        // Suivi d'itinéraire
        const legIcon = leg.mode === 'WALK' ? 'walking' : (leg.mode === 'BUS' ? 'bus' : (leg.mode === 'BICYCLE' ? 'bicycle' : 'tram'));
        const legTime = Math.round(leg.duration / 60);

        const timelineStep = document.createElement('div');
        timelineStep.classList.add('timeline-step');
        timelineStep.innerHTML = `
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <div class="timeline-time">
                    ${new Date(leg.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div class="timeline-location">
                    ${leg.from.name === 'Origin' ? 'Départ' : leg.from.name}
                    <i class="fas fa-arrow-right"></i>
                    ${leg.to.name === 'Destination' ? 'Arrivée' : leg.to.name}
                </div>
                <div class="timeline-type">
                <i class="fas fa-${legIcon}"></i>
                <!--${leg.mode === 'WALK' ? "marche" : (leg.mode === 'BUS' ? 'Bus' : 'Tram')}-->
                ${leg.route ? `${leg.mode === 'BUS' ? 'Bus' : 'Tram'} ${leg.routeShortName} • ` : ''}
                ${leg.duration > 0 ? `${legTime} min` : ''}
                </div>
                </div>
                `;
        routeTimeline.appendChild(timelineStep);
        // Ajouter l'empreinte carbone
        let km = leg.distance / 1000;
        if (leg.mode === 'WALK') {
            co2Emission += 0;
        } else if (leg.mode === 'BICYCLE') {
            co2Emission += 0;
        } else if (leg.mode === 'BUS') {
            co2Emission += 113 * km;
        } else if (leg.mode === 'TRAM') {
            console.log(leg.distance);
            co2Emission += 4.28 * km;
        }
    });

    const co2Container = document.createElement('div');
    co2Container.classList.add('co2-container');

    const co2Info = document.createElement('div');
    co2Info.classList.add('co2-info');
    co2Info.innerHTML = `
                <i class="fas fa-leaf"></i>
                <span>${Math.round(co2Emission * 100) / 100} g</span>
            `;
    co2Container.appendChild(co2Info);
    routeTrackerHeader.appendChild(co2Container);

    // Ajouter des marqueurs au point de départ et d'arrivée
    shownMarkers.push(L.marker(latlngs[0], { icon: startIcon }).addTo(map));
    shownMarkers.push(L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(map));

    // Zoomer sur l'itinéraire
    map.fitBounds(L.polyline([latlngs[0], latlngs[latlngs.length - 1]]).getBounds());


    const transportType = document.querySelector('.transport-btn.active').value;
    if (transportType === 'TRANSIT') {
        //Pour que l'on puisse choisir le mode de transport sans que la bar se ferme
    }else{
        hideSidebar();
    }

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

            document.getElementById('start-point').removeAttribute('data-coords');

            // Add a marker for the starting point
            if (shownMarkers.length > 0) {
                shownMarkers.forEach(marker => map.removeLayer(marker));
                shownMarkers = [];
            }

            const startMarker = L.marker([lat, lng], { icon: startIcon }).addTo(map);

            shownMarkers.push(startMarker);

            console.log("Starting point set:", coordStr);

            if (document.getElementById('end-point').getAttribute('data-coords')) { // si le point d'arrivé est un lieu
                fetchItinaries(true);
            }

        }
        else if (!endCoords) {
            // Set destination
            endCoords = coordStr;
            document.getElementById('end-point').value = coordStr;
            document.getElementById('end-point').removeAttribute('data-coords');

            // Add a marker for the end point
            const endMarker = L.marker([lat, lng], { icon: endIcon }).addTo(map);

            shownMarkers.push(endMarker);

            console.log("Destination set:", coordStr);

            // Automatically generate the itinerary once both points are set


            if (document.getElementById('start-point').getAttribute('data-coords')) { // si le point de départ est un lieu
                fetchItinaries(true);
            } else {
                fetchItinaries();
            }

        }
        else {
            // If both points are already set, reset and start over with a new starting point
            startCoords = null;
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
            document.getElementById('start-point').value = '';
            document.getElementById('end-point').value = '';
            document.getElementById('start-point').removeAttribute('data-coords');
            document.getElementById('end-point').removeAttribute('data-coords');

            // // Add a marker for the new starting point
            // const startMarker = L.marker([lat, lng], { icon: startIcon }).addTo(map);

            // shownMarkers.push(startMarker);

            // console.log("Reset: new starting point set:", coordStr);
        }
    });
}

//On utilise l'API nominatim pour rechercher des lieux
// search : la chaîne de recherche
// bool_start : booléen pour déterminer s'il s'agit du point de départ ou d'arrivée

function searchPlace(search, bool_start = true, isDirect = false) {

    if (search.length < 3 && isDirect) {
        removeDropdown();
        return;
    }
    const searchQuery = `${search}, Grenoble, France`;
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`;

    removeDropdown();

    fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {

                if (isDirect) {
                    removeDropdown();
                }
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
        option.addEventListener('click', function () {

            inputElement.value = placeName;


            inputElement.setAttribute('data-coords', coords);

            // Supprimer le menu déroulant après sélection
            dropdown.remove();


            addPlaceMarker(place.lat, place.lon, bool_start);

            // Si les deux points sont définis, générer l'itinéraire
            if (document.getElementById('start-point').getAttribute('data-coords') ||
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

    const delayedSearch = searchPlaceDelay(300);

    if (startInput) {

        startInput.addEventListener('input', function () {
            const query = this.value;
            delayedSearch(query, true, true);
        });

        startInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const query = this.value;

                searchPlace(query, true);
            }
        });
    }

    if (endInput) {

        endInput.addEventListener('input', function () {
            const query = this.value;
            delayedSearch(query, false, true);
        });


        endInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const query = this.value;

                searchPlace(query, false);
            }
        });
    }
}




function removeDropdown() {
    const existingDropdowns = document.querySelectorAll('.place-dropdown');
    existingDropdowns.forEach(dropdown => dropdown.remove());
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


function searchPlaceDelay(delay) {
    let timer;
    return function (search, bool_start = true, isDirect = false) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            searchPlace(search, bool_start, isDirect);
        }, delay);
    }
}



function showSidebar() {
    console.log('ok')
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.add('visible');
    sidebar.classList.remove('initial');
}

function hideSidebar(e) {
    const sidebar = document.querySelector('.sidebar');
    const sidebarRect = sidebar.getBoundingClientRect();
    if (!e || (e.clientX > sidebarRect.right && !sidebar.classList.contains('initial'))) {
        sidebar.classList.remove('visible');
    }
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
            if (document.getElementById('start-point').getAttribute('data-coords') ||
                document.getElementById('end-point').getAttribute('data-coords')) {
                fetchItinaries(true);
            }
            else {
                fetchItinaries();

            }
        });
    });

    document.querySelectorAll('.itinerary-container').forEach((container) => {
        container.addEventListener('click', (ev) => {
            const itineraryCard = ev.target.closest('.itinerary-card');
            if (itineraryCard) {
                document.querySelectorAll('.itinerary-card').forEach((it) => {
                    it.classList.remove('active');
                });

                itineraryCard.classList.add('active');
                if (itineraryCard) {
                    showItinerary(itineraryCard.getAttribute('num') - 1);
                }
            }
        });
    });

    // Gestion de la barre latérale
    const trigger = document.querySelector('.sidebar-trigger');
    const sidebar = document.querySelector('.sidebar');
    trigger.addEventListener('mouseenter', showSidebar);
    sidebar.addEventListener('mouseleave', hideSidebar);
    showSidebar();
}

window.addEventListener('beforeunload', function (event) {
    const startInput = document.querySelector('input#start-point');
    const endInput = document.querySelector('input#end-point');
    startInput.value = '';
    endInput.value = '';
    startCoords = null;
    endCoords = null;

});