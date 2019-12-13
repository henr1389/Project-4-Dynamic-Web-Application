var app;

function init() {

    app = new Vue({
        el: "#app",
        data: {
            mapLatitude: 44.953,
            mapLongitude: -93.09,
            incidents: {},
            neighborhoods: {},
            codes: {},
            showTable: true,
            address: "",
            visibleNeighborhoods: [],
            mapNeighborhoods: [],
            nMarkers: [],
            iMarkers: [],
            open: true,
        },
        methods: {
            getLocationFromLatLong: function() {
                $.getJSON('http://nominatim.openstreetmap.org/reverse?format=json&lat=' + this.mapLatitude + '&lon='+ this.mapLongitude, function(data) {
                    var items = [];
                    console.log(data);
                });
            },
            changeLatLong: function() {
                leafletMap.panTo([this.mapLatitude, this.mapLongitude]);
            },
            getCrimeData: function() {
                var incidents = [];
                $.getJSON('http://localhost:8000/incidents?limit=10&start_date=2019-10-01&end_date=2019-10-31')
                    .then(data => {
                        for(var i in data){
                            var incident = data[i];
                            var neighborhood_name, incident_type;
                            $.when(
                                $.getJSON('http://localhost:8000/neighborhoods?id='+incident.neighborhood_number, (data) => {
                                    neighborhood_name = data['N'+incident.neighborhood_number];
                                    incident.neighborhood_name = neighborhood_name;
                                }),
                                $.getJSON('http://localhost:8000/codes?code='+incident.code, (data) => {
                                    incident_type = data['C'+incident.code];
                                    incident.incident_type = incident_type;
                                })
                            ).then(() => {
                                incidents.push(incident);
                                this.incidents = incidents;
                                console.log(incidents);
                            })
                        }
                    })
            },
            neighborhoodName: function(neighborhoodNumber) {
                return this.neighborhoods[neighborhoodNumber].name
            },
            incidentType: function(code) {
                return this.codes[code]
            },
            updateNeighborhoods: function(){
                this.mapNeighborhoods = [];
                for(var i in this.neighborhoods) {
                    var lat = this.neighborhoods[i].latitude;
                    var long = this.neighborhoods[i].longitude;
                    var boundary = map.getBounds();
                    if (lat > bounds._southWest.lat && lng < bounds._northEast.lng && lat < bounds._northEast.lat && lng > bounds._southWest.lng) {
                        this.neighborhoods.push(parseInt(i));
                    }
                }
            }
        }
    });

    leafletMapInit();
    getCodes();
    getIncidents();
}

var leafletMap;
function leafletMapInit(){
    var latLong = [app.mapLatitude, app.mapLongitude]; // Latitude and longitude of St. Paul
    leafletMap = L.map('map', {minZoom: 11, maxZoom: 18, maxBounds: [[44.875822, -92.984848],[44.99564, -93.229122]], center: latLong, zoom: 13});

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 17,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiYWpwMCIsImEiOiJjazN4cGd4MGQxNW1hM3F0NnU5M3Jiem80In0.71DleDv1Fm-ArumkU37BjA'
    }).addTo(leafletMap);

    leafletMap.on('click', onMapClick);
    leafletMap.on('move', onMapChange);
    leafletMap.on('zoom', onMapChange);

    L.marker([44.948, -93.190]).addTo(leafletMap)
        .bindPopup("Merriam Park").openPopup();
    L.marker([44.968, -93.198]).addTo(leafletMap)
        .bindPopup("Saint Anothony Park").openPopup();
    L.marker([44.933, -93.167]).addTo(leafletMap)
        .bindPopup("Macalester-Groveland").openPopup();
    L.marker([44.948, -93.174]).addTo(leafletMap)
        .bindPopup("Union Park").openPopup();
    L.marker([44.948, -93.190]).addTo(leafletMap)
        .bindPopup("Merriam Park West").openPopup();
    L.marker([44.947, -93.116]).addTo(leafletMap)
        .bindPopup("Cathedral Hill").openPopup();
    L.marker([44.936, -93.136]).addTo(leafletMap)
        .bindPopup("Summit Hill").openPopup();
    L.marker([44.963, -93.167]).addTo(leafletMap)
        .bindPopup("Midway").openPopup();
    L.marker([44.951, -93.126]).addTo(leafletMap)
        .bindPopup("Summit - University").openPopup();
    L.marker([44.954, -93.060]).addTo(leafletMap)
        .bindPopup("Dayton's Bluff").openPopup();
    L.marker([44.977, -93.065]).addTo(leafletMap)
        .bindPopup("Payne - Phalen").openPopup();   
    L.marker([44.927, -93.126]).addTo(leafletMap)
        .bindPopup("West Seventh").openPopup();
    L.marker([44.979, -93.155]).addTo(leafletMap)
       .bindPopup("Como").openPopup();
    L.marker([44.946, -93.164]).addTo(leafletMap)
        .bindPopup("Snelling Hamline").openPopup();   
    L.marker([44.973, -93.025]).addTo(leafletMap)
        .bindPopup("Greater East Side").openPopup();
    L.marker([44.959, -93.121]).addTo(leafletMap)
       .bindPopup("Thomas - Dale").openPopup();
    L.marker([44.943, -93.025]).addTo(leafletMap)
        .bindPopup("Battle Creek").openPopup();   
    L.marker([44.945, -93.150]).addTo(leafletMap)
        .bindPopup("Lexington - Hamline").openPopup();
    L.marker([44.950, -93.086]).addTo(leafletMap)
       .bindPopup("Lowertown").openPopup();
    L.marker([44.912, -93.177]).addTo(leafletMap)
       .bindPopup("Highland Park").openPopup();
    addPolygon();
}

function getIncidents(){
    var path = 'http://localhost:8000/incidents?start_date=2019-10-01&end_date=2019-10-31';
    $.getJSON(path)
        .then(data => {
            app.incidents = data;
        });
}

function getCodes(){
    var path = 'http://localhost:8000/codes';
    $.getJSON(path)
        .then(data => {
            for(var i in data){
                app.codes[i.substring(1)] = data[i];
            }
        });
}

function onMapChange(){
    var latLong = leafletMap.getCenter();
    app.mapLatitude = latLong.lat;
    app.mapLongitude = latLong.lng;
}

let popup = L.popup();
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(leafletMap);
}


function addPolygon(){
    let polygon = L.polygon([
        [44.98792, -93.207506],
        [44.99168, -93.005289],
        [44.89132, -93.004774],
        [44.91940, -93.050779],
        [44.91964, -93.128541],
        [44.88742, -93.173517],
        [44.90919, -93.202013]
    ]).addTo(leafletMap);
}