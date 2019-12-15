
var app;
var leafletMap;
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
            port: 8000,
            isPort: false,
            show: false,
            notification: "",
            address: "",
            mapNeighborhoods: [],
            nMarkers: [],
            iMarkers: [],
            start: "2019-10-01",
            end: "2019-10-31",
            timeStart: "",
            timeEnd: "",
            incidentFilter: [],
            neighborhoodFilter: [],

        },
        methods: {
            getCrimeData: function() {
                var incidents = [];
                $.getJSON('http://localhost:8000/incidents?limit=10&start_date=2019-10-01&end_date=2019-10-31')
                    .then(data => {
                        for(var i in data){
                            var incident = data[i];
                            var neighborhood_name;
                            var incident_type;
                            $.when(
                                $.getJSON('http://localhost:8000/neighborhoods?id=' + incident.neighborhood_number, (data) => {
                                    neighborhood_name = data['N' + incident.neighborhood_number];
                                    incident.neighborhood_name = neighborhood_name;
                                }),
                                $.getJSON('http://localhost:8000/codes?code=' + incident.code, (data) => {
                                    incident_type = data['C' + incident.code];
                                    incident.incident_type = incident_type;
                                })
                            ).then(() => {
                                incidents.push(incident);
                                this.incidents = incidents;
                                console.log(incidents);
                            })
                        }
                    })
                    app.neighborhoods = {
                        1: {
                            name: "Conway/Battlecreek/Highwood",
                            latitude: 44.956758,
                            longitude: -93.025231
                        },
                        2: {
                            name: "Greater East Side",
                            latitude: 44.973, 
                            longitude: -93.025
                        },
                        3: {
                            name: "West Side",
                            latitude: 44.932094, 
                            longitude: -93.077872
                        },
                        4: {
                            name: "Dayton's Bluff",
                            latitude: 44.957164,
                            longitude: -93.057100
                        },
                        5: {
                            name: "Payne/Phalen",
                            latitude: 44.978208,
                            longitude: -93.069673
                        },
                        6: {
                            name: "North End",
                            latitude: 44.977405,
                            longitude: -93.110969
                        },
                        7: {
                            name: "Thomas/Dale(Frogtown)",
                            latitude: 44.960265,
                            longitude: -93.118686
                        },
                        8: {
                            name: "Summit/University",
                            latitude: 44.948581,
                            longitude: -93.128205
                        },
                        9: {
                            name: "West Seventh",
                            latitude: 44.931735,
                            longitude: -93.119224
                        },
                        10: {
                            name: "Como",
                            latitude: 44.982860,
                            longitude: -93.150844
                        },
                        11: {
                            name: "Hamline/Midway",
                            latitude: 44.962891,
                            longitude: -93.167436
                        },
                        12: {
                            name: "St. Anthony",
                            latitude: 44.973546,
                            longitude: -93.195991
                        },
                        13: {
                            name: "Union Park",
                            latitude: 44.948401,
                            longitude: -93.174050
                        },
                        14: {
                            name: "Macalester-Groveland",
                            latitude: 44.934301,
                            longitude: -93.175363
                        },
                        15: {
                            name: "Highland",
                            latitude: 44.911489,
                            longitude: -93.172075
                        },
                        16: {
                            name: "Summit Hill",
                            latitude: 44.937493,
                            longitude: -93.136353
                        },
                        17: {
                            name: "Capitol River",
                            latitude: 44.950459,
                            longitude: -93.096462
                        }
}
            },
            getNeighborhoodStats: function() {
                var location = [[44.925349, -93.025231],[44.973, -93.025],[44.932094, -93.077872],[44.954, -93.060],[44.977, -93.065],[44.976433, -93.110282],[44.959821, -93.117495],[44.951, -93.126],[44.927, -93.126],[44.979, -93.155],[44.962082, -93.166604],[44.973181, -93.196334],[44.948, -93.174],[44.933, -93.167],[44.912, -93.177],[44.936, -93.136],[44.957989, -93.103815]];
                var stats = new Array(17).fill(0);
                $.getJSON('http://localhost:8000/incidents')
                    .then(data => {
                        for(var i in data){
                            var incident = data[i];
                            stats[incident.neighborhood_number-1]++;
                        }
                    })
                for (var i in stats){
                    $.getJSON('http://localhost:8000/neighborhoods?id=' + i+1, (data) => {
                        neighborhood_name = data['N' + (i+1)];
                        
                        L.marker(location[i]).addTo(leafletMap)
                            .bindPopup(neighborhood_name + '\n Crimes in this neighborhood:' + stats[i]).openPopup;
                    })
                    
                }
            },
            crimeColor: function(code){
                if(600 <= code && code <= 1436){
                    return "color: #fff569";
                }else if(110 <= code && code <= 566){
                    return "color: #ff0000";
                }else{
                    return "color: #00ff00";
                }
            },
            changeCoordinates: function() {
                leafletMap.panTo([this.mapLatitude, this.mapLongitude]);
            },
            getNeighborhoodName: function(neighborhoodNumber) {
                return this.neighborhoods[neighborhoodNumber].name;
            },
            getIncidentType: function(code) {
                return this.codes[code];
            },
            updateNeighborhoods: function(){
                this.mapNeighborhoods = [];
                for(var i in this.neighborhoods) {
                    var lat = this.neighborhoods[i].latitude;
                    var long = this.neighborhoods[i].longitude;
                    var boundary = map.getBounds();
                    if (lat > bounds._southWest.lat && long < bounds._northEast.lng && lat < bounds._northEast.lat && long > bounds._southWest.long) {
                        this.neighborhoods.push(parseInt(i));
                    }
                }
            },
            removeMarkers: function(){
                app.incidentMarkers.forEach(marker => {
                    marker.remove();
                });
            },
            crimeBackgroundColor: function(code){
                if (600 <= code && code <= 1436){
                    return "background: #ffffaa";
                }else if(110 <= code && code <= 566){
                    return "background: #ffaaaa";
                }
                else{
                    return "background: #aaffaa";
                }
            },

        }
    });

    leafletMapInit();
    requestCodes();
    requestIncidents();
}

function leafletMapInit(){
    var latLong = [app.mapLatitude, app.mapLongitude]; // Latitude and longitude of St. Paul
    leafletMap = L.map('map', {minZoom: 11, maxZoom: 18, maxBounds: [[44.875822, -92.984848],[44.99564, -93.229122]], center: latLong, zoom: 12});

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        minZoom: 11, 
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiYWpwMCIsImEiOiJjazN4cGd4MGQxNW1hM3F0NnU5M3Jiem80In0.71DleDv1Fm-ArumkU37BjA'
    }).addTo(leafletMap);

    leafletMap.on('click', onMapClick);
    leafletMap.on('move', onMapChange);
    leafletMap.on('zoom', onMapChange);
/*
    L.marker([44.925349, -93.025231]).addTo(leafletMap)
        .bindPopup("Conway/Battlecreek/Highwood").openPopup();
    L.marker([44.973, -93.025]).addTo(leafletMap)
        .bindPopup("Greater East Side").openPopup();
    L.marker([44.932094, -93.077872]).addTo(leafletMap)
        .bindPopup("West Side").openPopup();
    L.marker([44.954, -93.060]).addTo(leafletMap)
        .bindPopup("Dayton's Bluff").openPopup();
    L.marker([44.977, -93.065]).addTo(leafletMap)
        .bindPopup("Payne/Phalen").openPopup();   
    L.marker([44.976433, -93.110282]).addTo(leafletMap)
        .bindPopup("North End").openPopup();    
    L.marker([44.959821, -93.117495]).addTo(leafletMap)
        .bindPopup("Thomas/Dale(Frogtown)").openPopup();
    L.marker([44.951, -93.126]).addTo(leafletMap)
        .bindPopup("Summit/University").openPopup();
    L.marker([44.927, -93.126]).addTo(leafletMap)
        .bindPopup("West Seventh").openPopup();
    L.marker([44.979, -93.155]).addTo(leafletMap)
        .bindPopup("Como").openPopup();
    L.marker([44.962082, -93.166604]).addTo(leafletMap)
        .bindPopup("Hamline/Midway").openPopup();
    L.marker([44.973181, -93.196334]).addTo(leafletMap)
        .bindPopup("St. Anthony").openPopup();
    L.marker([44.948, -93.174]).addTo(leafletMap)
        .bindPopup("Union Park").openPopup();
    L.marker([44.933, -93.167]).addTo(leafletMap)
        .bindPopup("Macalester-Groveland").openPopup();
    L.marker([44.912, -93.177]).addTo(leafletMap)
        .bindPopup("Highland").openPopup();
    L.marker([44.936, -93.136]).addTo(leafletMap)
        .bindPopup("Summit Hill").openPopup();
    L.marker([44.957989, -93.103815]).addTo(leafletMap)
        .bindPopup("Capitol River").openPopup();

*/
    /* unused St.Paul neighborhoods (not present in crime database)
    L.marker([44.948, -93.190]).addTo(leafletMap)
        .bindPopup("Merriam Park").openPopup();
    L.marker([44.948, -93.190]).addTo(leafletMap)
        .bindPopup("Merriam Park West").openPopup();
    L.marker([44.947, -93.116]).addTo(leafletMap)
        .bindPopup("Cathedral Hill").openPopup();
    L.marker([44.946, -93.164]).addTo(leafletMap)
        .bindPopup("Snelling Hamline").openPopup();   
    L.marker([44.959, -93.121]).addTo(leafletMap)
       .bindPopup("Thomas - Dale").openPopup();
    L.marker([44.945, -93.150]).addTo(leafletMap)
        .bindPopup("Lexington - Hamline").openPopup();
    L.marker([44.950, -93.086]).addTo(leafletMap)
       .bindPopup("Lowertown").openPopup();
    */


    addPolygon();
}


function getAddress(){
    $.getJSON('https://nominatim.openstreetmap.org/search?format=json&q=saint paul minnesota' + app.address)
        .then(data => {
            if(data.length > 0) {
                app.latitude = data[0].lat;
                app.longitude = data[0].lon;
                leafletMap.panTo([app.latitude, app.longitude]);
            } else {
                alert("Address '"+ app.address +"' not found")
            }
        });
}

function requestIncidents(){
    var path = 'http://localhost:8000/incidents?start_date=2019-10-01&end_date=2019-10-31';
    $.getJSON(path)
        .then(data => {
            app.incidents = data;
        });
}

function requestCodes(){
    var path = 'http://localhost:8000/codes';
    $.getJSON(path)
        .then(data => {
            for(var i in data){
                app.codes[i.substring(1)] = data[i];
            }
        });
}

function onMapChange(){
    var center = leafletMap.getCenter();
    app.mapLatitude = center.lat;
    app.mapLongitude =  center.lng;
    app.mapNeighborhoods = [];
    for(var i in app.neighborhoods) {
        let bounds = map.getBounds();
        let lat = app.neighborhoods[i].latitude;
        let long = app.neighborhoods[i].longitude;
        if (lat > bounds._southWest.lat && lat < bounds._northEast.lat && long > bounds._southWest.lng && long < bounds._northEast.lng) {
            app.mapNeighborhoods.push(parseInt(n));
        }
    }
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