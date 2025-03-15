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
let interestPlaces = [
    {
        name: "Musée de Grenoble",
        category: "museum",
        lat: 45.1949348449707,
        lng: 5.732178211212158
    },
    {
        name: "Bastille de Grenoble",
        category: "activity",
        lat: 45.199925,
        lng: 5.724812
    },
    {
        name: "Le Petit Bain",
        category: "restaurant",
        lat: 45.192298,
        lng: 5.720375
    },
    {
        name: "Centre Commercial Grand'Place",
        category: "shopping",
        lat: 45.1585578918457,
        lng: 5.726695537567139
    },
    {
        name: "Parc Paul Mistral",
        category: "other",
        lat: 45.185289, 
        lng: 5.736387 
    },
    {
        name: "Le 5",
        category: "restaurant",
        lat: 45.188876,
        lng: 5.724029
    },
    {
        name: "Musée Dauphinois",
        category: "museum",
        lat: 45.19521020890247, 
        lng: 5.726579754894914
    },
    {
        name: "Galeries Lafayette",
        category: "shopping",
        lat: 45.19067481647549,
        lng:  5.726839268389635
    },
    {
        name: "Téléphérique de Grenoble",
        category: "activity",
        lat: 45.19314759176473, 
        lng: 5.726047753049538
    },
    {
        name: "La Belle Électrique",
        category: "activity",
        lat: 45.18746694182053, 
        lng:5.704195397224524
    },
    {
        name: "Muséum de Grenoble",
        category: "museum",
        lat: 45.19532111980316,
        lng:  5.732162693534311
    },
    {
        name: "Le Jardin de Ville",
        category: "other",
        lat: 45.19233909444988, 
        lng: 5.726875126059759
    },
    {
        name: "La ferme à Dédé",
        category: "restaurant",
        lat: 45.1930601443852, 
        lng: 5.729873590068935
    },
    {
        name: "Fnac Grenoble",
        category: "shopping",
        lat: 45.19057217795545,
        lng:  5.726274739554589
    },
    {
        name: "Parc Jardin des Plantes",
        category: "other",
        lat: 45.18749889466797, 
        lng:5.735635683729657
    },
    {
        name: "Café de la Table Ronde",
        category: "restaurant",
        lat: 45.19294916209595, 
        lng: 5.728379126059802
    },
    {
        name: "Palais de Justice",
        category: "other",
        lat: 45.19129822065948,
        lng:  5.711579527904958
    },
    {
        name: "Hôtel de Ville de Grenoble",
        category: "other",
        lat: 45.18681570439888,
        lng:  5.736264224214195
    },
    {
        name: "Cathédrale Notre-Dame",
        category: "other",
        lat: 45.1928433883839, 
        lng: 5.7317903665444625
    },
    {
        name: "Caserne de Bonne",
        category: "shopping",
        lat: 45.18405454249616,
        lng:  5.723146295379088
    },
    {
        name: "Musée Archéologique",
        category: "museum",
        lat: 45.19776661508094, 
        lng:5.7315676260600235
    },
    {
        name: "Marché Saint-Bruno",
        category: "shopping",
        lat: 45.18749726488956,
        lng:  5.714158826059536
    },
    {
        name: "Patinoire Polesud",
        category: "activity",
        lat: 45.15793841906218, 
        lng: 5.734269289842071
    },
    {
        name: "Cinéma Pathé Chavant",
        category: "activity",
        lat: 45.18570814551838, 
        lng: 5.731412310719343
    },
    {
        name: "Bibliothèque d'Étude et du Patrimoine",
        category: "other",
        lat: 45.185520640803766, 
        lng: 5.731071887420085
    },
    {
        name: "Parc de l'Île d'Amour",
        category: "other",
        lat: 45.200516488430424, 
        lng: 5.767857081884928
    },
    {
        name: "Parc Bachelard",
        category: "other",
        lat: 45.164523510034805, 
        lng: 5.705949993532956
    },
    {
        name: "MC2 - Maison de la Culture",
        category: "activity",
        lat: 45.17227201581915, 
        lng: 5.733343668388805
    },

];


let interestMarkers = {};

const startIcon = L.divIcon({
    html: '<i class="fas fa-map-marker fa-2x" style="color:#3388ff;"></i>',
    iconSize: [20, 20],
    className: 'start-icon'
});

const interestIcon = L.divIcon({
    html: '<i class="fas fa-map-pin" style="color:#74A852; font-size: 1rem;"></i>',
    iconSize: [12, 12],
    className: 'interest-icon'
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
    addInterestsPoints();
}

function addInterestsPoints() {
    L.geoJSON(interests, {
        pointToLayer: function (feature, latlng) {
            if (!feature.properties.name) {
                return;
            }
            return L.marker(latlng, {
                icon: interestIcon,
                opacity: 0.5,
            });

        },
        onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.name) {
                let popupContent = `<h3 style="color:rgb(116, 168, 82); font-size: 14px; margin: 0; padding: 5px;">${feature.properties.name}</h3>`;
                let lat = feature.geometry.coordinates[1];
                let lng = feature.geometry.coordinates[0];
                const coordStr = `${lat}, ${lng} `;
                const name = feature.properties.name;
                if (feature.properties.description) {
                    popupContent += `<p style="margin: 0; padding: 5px;">${feature.properties.description}</p>`;
                }
                layer.bindPopup(popupContent);
                layer.on('mouseover', function (e) {
                    this.openPopup();
                });
                layer.on('mouseout', function (e) {
                    this.closePopup();
                });
                layer.on('click', function (e) {
                    if (!startCoords) {
                        // Set starting point
                        startCoords = name;

                        document.getElementById('start-point').value = name;

                        document.getElementById('start-point').setAttribute('data-coords', coordStr);

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
                        endCoords = name;
                        document.getElementById('end-point').value = name;
                        document.getElementById('end-point').setAttribute('data-coords', coordStr);

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
                        showSidebar(true);

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

                        hideItinerary();
                    }
                });
            }
        }
    }).addTo(map);


    interestPlaces.forEach(place => {
        const lat = place.lat;
        const lng = place.lng;
        const name = place.name;
        const category = place.category;
        const coordStr = `${lat}, ${lng} `;

        const finalMarker = L.marker([lat, lng], {
            icon: interestIcon,
            opacity: 0.5
        }).addTo(map);

        // Stocker le marqueur par catégorie
        if (!interestMarkers[category]) {
            interestMarkers[category] = [];
        }
        interestMarkers[category].push(finalMarker);

        let popupContent = `<h3 style="color:rgb(116, 168, 82); font-size: 14px; margin: 0; padding: 5px;">${name}</h3>`;
        popupContent += `<p style="margin: 0; padding: 5px;">${category}</p>`;

        finalMarker.bindPopup(popupContent);
        finalMarker.on('mouseover', function (e) {
            this.openPopup();
        });
        finalMarker.on('mouseout', function (e) {
            this.closePopup();
        });
        finalMarker.on('click', function (e) {
            if (!startCoords) {
                // Set starting point
                startCoords = name;

                document.getElementById('start-point').value = name;

                document.getElementById('start-point').setAttribute('data-coords', coordStr);

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
                endCoords = name;
                document.getElementById('end-point').value = name;
                document.getElementById('end-point').setAttribute('data-coords', coordStr);

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
                showSidebar(true);

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

                hideItinerary();
            }
        })
    });
}

function fetchItinaries(isSearch = false) {
    const startInput = document.querySelector('input#start-point');
    const endInput = document.querySelector('input#end-point');
    const modeSelect = document.querySelector('.transport-btn.active');
    const loader = document.querySelector('.loader');
    const noItinerary = document.querySelector('#no-itinerary');
    const departTime = document.querySelector('#journey-time').value;
    const timeType = document.querySelector('.time-btn.active').getAttribute('data-type');
    const initialMode = modeSelect.value;

    // Cacher le message "aucun itinéraire" et afficher le loader
    if (noItinerary) noItinerary.style.display = 'none';
    if (loader) loader.style.display = 'flex';

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

    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
    console.log(formattedDate);
    if (timeType !== 'now') {
        otpUrl += `&time=${departTime}&date=${formattedDate}&arriveBy=${timeType === 'arrive'}`;
    }


    const itineraryContainer = document.querySelector('.itinerary-container');
    itineraryContainer.innerHTML = '';
    itineraries = [];

    fetch(otpUrl)
        .then(response => response.json())
        .then(data => {
            // Cacher le loader une fois les données reçues
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

                    if (initialMode === 'TRANSIT' && new Date(itinerary.startTime).getTime() < now.getTime()) {
                        return;
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


                    fetchCarConsumption(start, end).then((carCo2Emission) => {
                        const carInfo = document.querySelector('.co2-info.car');
                        carInfo.classList.remove('hidden');
                        carInfo.querySelector('span').textContent = `${Math.round(carCo2Emission * 100) / 100} g`;

                        itineraryElement.children[0].appendChild(co2Container);

                        if (document.querySelector('.transport-btn.active').value === initialMode) {
                            itineraryContainer.appendChild(itineraryElement);
                            itineraries.push(itinerary);
                            if (index == 0) {
                                showItinerary(0);
                            }
                        }
                    });

                });
                if (loader) loader.style.display = 'none';
            } else {
                if (noItinerary) noItinerary.style.display = 'flex';
                const noItineraryElement = document.createElement('div');
                noItineraryElement.id = 'no-itinerary';
                noItineraryElement.textContent = 'Aucun itinéraire trouvé';
                itineraryContainer.appendChild(noItineraryElement);
            }
        })
        .catch(error => {
            if (loader) loader.style.display = 'none';
            if (noItinerary) noItinerary.style.display = 'flex';
            console.error('Erreur lors de la récupération des données de l\'itinéraire:', error);
        });
}


async function fetchCarConsumption(start, end) {
    var otpUrl = `${planUrl}?fromPlace=${start}&toPlace=${end}&mode=CAR`;

    const response = await fetch(otpUrl);
    const data = await response.json();
    let carCo2Emission = 0;
    if (data.plan && data.plan.itineraries && data.plan.itineraries.length > 0) {
        const itinerary = data.plan.itineraries[0];
        itinerary.legs.forEach(leg => {
            let km = leg.distance / 1000;
            carCo2Emission += 218 * km;
        });
    }

    return carCo2Emission;
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
            co2Emission += 4.28 * km;
        }
    });

    const arriveStep = document.createElement('div');
    arriveStep.classList.add('timeline-step');
    arriveStep.innerHTML = `
    <div class="timeline-marker"></div>
    <div class="timeline-content">
        <div class="timeline-time">
            ${new Date(legs[legs.length - 1].endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
    </div>
        `;
    routeTimeline.appendChild(arriveStep);

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
}



function hideItinerary() {
    if (shownItinerary.length > 0) {
        shownItinerary.forEach(itinerary => map.removeLayer(itinerary));
        shownItinerary = [];
    }

    // Set new starting point
    document.getElementById('start-point').value = '';
    document.getElementById('end-point').value = '';
    document.getElementById('start-point').removeAttribute('data-coords');
    document.getElementById('end-point').removeAttribute('data-coords');


    // Hide previous itinerary
    const itineraryContainer = document.querySelector('.itinerary-container');
    itineraryContainer.innerHTML = '';
    const tracker = document.querySelector('.route-tracker');
    tracker.classList.add('hidden');
    const co2Car = document.querySelector('.co2-info.car');
    co2Car.classList.add("hidden");
}


function fetchInterestPlaces() {

    const add_place = document.getElementById("add-interest-places-btn");

    let addingInterestPlace = false;
    let temp_lat = null;
    let temp_lng = null;

    // Create a container for the form that will appear after click
    const formContainer = document.createElement('div');
    formContainer.className = 'interest-place-form';
    formContainer.style.display = 'none';
    formContainer.innerHTML = `
        <div class="form-group">
            <label for="place-name">Nom:</label>
            <input type="text" id="place-name" placeholder="Nom du lieu">
        </div>
        <div class="form-group">
            <label for="place-category">Catégorie:</label>
            <select id="place-category">
                <option value="restaurant">Restaurant</option>
                <option value="museum">Musée</option>
                <option value="park">Parc</option>
                <option value="shopping">Shopping</option>
                <option value="activity">Activité</option>
                <option value="other">Autre</option>
            </select>
        </div>
        <button id="save-place-btn">Sauvegarder</button>
        <button id="cancel-place-btn">Annuler</button>
    `;

    const content_com = document.querySelector('.community-content');
    content_com.appendChild(formContainer);

    // Original map click handler reference
    const originalMapClickHandler = map._events.click[0].fn;
    let tempMarker = null;

    const addInterestPlaceHandler = function (e) {
        if (addingInterestPlace) {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);

            tempMarker = L.marker([lat, lng]).addTo(map);

            // Store the coordinates as data attributes on the form
            temp_lat = lat;
            temp_lng = lng;

            // Show the form
            formContainer.style.display = 'block';

            // Update button text
            add_place.textContent = 'Entrer un nom et une catégorie pour ce lieu';

            map.off('click', addInterestPlaceHandler);
        }
    };

    // Button click handler
    add_place.addEventListener('click', function () {
        if (!addingInterestPlace) {
            hideItinerary();
            
            reinitCommunityMarkers();

            if (shownMarkers.length > 0) {
                shownMarkers.forEach(marker => {
                    if (marker.icon = startIcon || marker.icon == endIcon) {
                        map.removeLayer(marker);
                    }
                }
                );
            }


            // Enter "add interest place" mode
            addingInterestPlace = true;

            // Change button text to indicate mode
            add_place.textContent = 'Cliquez sur la carte pour ajouter un lieu';

            // Remove the original click handler and add our special one
            map.off('click', originalMapClickHandler);
            map.on('click', addInterestPlaceHandler);
        }
    });

    // Save button click handler
    document.getElementById('save-place-btn').addEventListener('click', function () {
        const placeName = document.getElementById('place-name').value;
        const placeCategory = document.getElementById('place-category').value;
        

        if (placeName.trim() === '') {
            alert('Veuillez entrer un nom pour ce lieu.');
            return;
        }
    
        const interestPlace = {
            name: placeName,
            category: placeCategory,
            lat: temp_lat,
            lng: temp_lng
        };
        interestPlaces.push(interestPlace);
        console.log('Lieu ajouté:', interestPlace);
    
        // Reset the form
        document.getElementById('place-name').value = '';
        formContainer.style.display = 'none';
    
        // Reset the button
        add_place.textContent = 'Ajouter un lieu d\'intérêt';
    
        // Restore normal map behavior
        map.off('click', addInterestPlaceHandler);
        map.on('click', originalMapClickHandler);
    
        addingInterestPlace = false;
    
        map.removeLayer(tempMarker);
    
        // Créer le marqueur final
        const finalMarker = L.marker([temp_lat, temp_lng], {
            icon: interestIcon,
            opacity: 0.5
        }).addTo(map);
    
        // Stocker le marqueur par catégorie
        if (!interestMarkers[placeCategory]) {
            interestMarkers[placeCategory] = [];
        }
        interestMarkers[placeCategory].push(finalMarker);
    
        let popupContent = `<h3 style="color:rgb(116, 168, 82); font-size: 14px; margin: 0; padding: 5px;">${placeName}</h3>`;
        popupContent += `<p style="margin: 0; padding: 5px;">${placeCategory}</p>`;
    
        finalMarker.bindPopup(popupContent);
        finalMarker.on('mouseover', function (e) {
            this.openPopup();
        });
        finalMarker.on('mouseout', function (e) {
            this.closePopup();
        });
    });


    // Cancel button click handler
    document.getElementById('cancel-place-btn').addEventListener('click', function () {
        // Reset the form
        document.getElementById('place-name').value = '';
        formContainer.style.display = 'none';

        // Reset the button
        add_place.textContent = 'Ajouter un lieu d\'intérêt';

        // Restore normal map behavior
        map.off('click', addInterestPlaceHandler);
        map.on('click', originalMapClickHandler);

        // Remove the temporary marker (if any)
       map.removeLayer(tempMarker);

        addingInterestPlace = false;
    });
}


function reinitCommunityMarkers(){
    Object.keys(interestMarkers).forEach(cat => {
        interestMarkers[cat].forEach(marker => {
            marker.setOpacity(0.5);
            marker.setIcon(interestIcon);
        });
    });
}


function highlightCategory(category) {
    // Réinitialiser tous les marqueurs à faible opacité
    Object.keys(interestMarkers).forEach(cat => {
        interestMarkers[cat].forEach(marker => {
            marker.setOpacity(0.3);
            marker.setIcon(interestIcon);
        });
    });
    
    // Si "all" est sélectionné, remettre tous les marqueurs à l'opacité normale
    if (category === 'all') {
        reinitCommunityMarkers();
        return;
    }
    
    // Sinon, mettre en évidence uniquement la catégorie sélectionnée
    if (interestMarkers[category]) {
        interestMarkers[category].forEach(marker => {
            marker.setOpacity(1.0);
            marker.setIcon(L.divIcon({
                html: '<i class="fas fa-map-pin" style="color:red; font-size: 1rem;"></i>',
                iconSize: [12, 12],
                className: 'new-icon'
            }))
        });
    }
}


function getCategoryIcon() {
    const categories = ['restaurant', 'museum', 'shopping', 'activity', 'other', 'all'];

    categories.forEach(category => {

        const categoryButton = document.getElementById(`commu-${category}-btn`);
        categoryButton.addEventListener('click', function () {
            highlightCategory(category);
        });
    });
}


function setupMapClickListener() {
    map.on('click', function mapClickListen(e) {
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
            showSidebar(true);

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

            hideItinerary();
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
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.add('visible');
    sidebar.classList.remove('initial');

    const button = document.querySelector('.mobile-toggle')
    button.classList.toggle('active');

    // Change l'icône et le texte
    const icon = button.querySelector('i');
    const span = button.querySelector('span');
    if (sidebar.classList.contains('visible')) {
        icon.className = 'fas fa-times';
        span.textContent = 'Fermer';
    } else {
        icon.className = 'fas fa-bars';
        span.textContent = 'Options';
    }
}

function hideSidebar(e) {
    const sidebar = document.querySelector('.sidebar');
    const sidebarRect = sidebar.getBoundingClientRect();
    if (!e || (e.clientX > sidebarRect.right && !sidebar.classList.contains('initial'))) {
        sidebar.classList.remove('visible');
    }

    const button = document.querySelector('.mobile-toggle')
    button.classList.toggle('active');

    // Change l'icône et le texte
    const icon = button.querySelector('i');
    const span = button.querySelector('span');
    if (sidebar.classList.contains('visible')) {
        icon.className = 'fas fa-times';
        span.textContent = 'Fermer';
    } else {
        icon.className = 'fas fa-bars';
        span.textContent = 'Options';
    }
}



window.onload = function () {
    // Function that runs when DOM is loaded
    initMap();


    setupPlaceSearch();
    fetchInterestPlaces();
    getCategoryIcon();

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

    // Gestion de la sidebar communauté
    const communityBtn = document.getElementById('commu-button');
    const communitySidebar = document.querySelector('.community-sidebar');
    const closeCommunityBtn = document.getElementById('close-community-btn');

    communityBtn.addEventListener('click', function () {
        communitySidebar.classList.add('visible');
        hideSidebar();
    });

    closeCommunityBtn.addEventListener('click', function () {
        communitySidebar.classList.remove('visible');
        reinitCommunityMarkers();
        showSidebar();
    });

    // Gestion de l'heure
    const journeyTime = document.querySelector('input#journey-time');
    journeyTime.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    document.querySelectorAll('.time-btn').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
            document.querySelectorAll('.time-btn').forEach((btn) => {
                btn.classList.remove('active');
            });

            btn.classList.add('active');

            const departTime = document.querySelector('#depart-time');
            if (btn.getAttribute('data-type') === 'now') {
                departTime.classList.add('hidden');
                journeyTime.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            }
            else {
                departTime.classList.remove('hidden');
            }

            // if (document.getElementById('start-point').getAttribute('data-coords') ||
            //     document.getElementById('end-point').getAttribute('data-coords')) {
            // } // TODO
            fetchItinaries(true);
        });
    }

    );

    journeyTime.addEventListener('change', (ev) => {
        // if (document.getElementById('start-point').getAttribute('data-coords') ||
        //     document.getElementById('end-point').getAttribute('data-coords')) {
        //     } // TODO
        fetchItinaries(true);
    });

    // Gestion du bouton mobile
    const mobileToggle = document.querySelector('.mobile-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function () {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('visible');
            this.classList.toggle('active');

            // Change l'icône et le texte
            const icon = this.querySelector('i');
            const span = this.querySelector('span');
            if (sidebar.classList.contains('visible')) {
                icon.className = 'fas fa-times';
                span.textContent = 'Fermer';
            } else {
                icon.className = 'fas fa-bars';
                span.textContent = 'Options';
            }
        });
    }

}

window.addEventListener('beforeunload', function (event) {
    const startInput = document.querySelector('input#start-point');
    const endInput = document.querySelector('input#end-point');
    startInput.value = '';
    endInput.value = '';
    startCoords = null;
    endCoords = null;

});