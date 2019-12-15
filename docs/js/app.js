
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
            },
            getNeighborhoodStats: function(neighborhood) {
                var location = neighborhood;
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
            getNeighborhoodName: function(number) {
                return this.neighborhoods[number];
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
    app.neighborhoods = {
                1:{
                    title: "Conway/Battlecreek/Highwood",
                    latitude: 44.925349, 
                    longitude: -93.025231
                },
                2:{
                    title: "Greater East Side",
                    latitude: 44.973, 
                    longitude: -93.025
                },
                3:{  
                    title: "West Side",
                    latitude: 44.932094,
                    longitude: -93.077872
                },
                4:{
                    title: "Dayton's Bluff",
                    latitude: 44.954, 
                    longitude: -93.060
                },
                5:{
                    title: "North End",
                    latitude: 44.977,
                    longitude: -93.065
                },
                6:{
                    title: "Thomas/Dale(Frogtown)",
                    latitude: 44.976433, 
                    longitude: -93.110282
                },
                7:{
                    title: "Summit/University",
                    latitude: 44.959821,
                    longitude: -93.117495
                },
                8:{
                    title: "West Seventh",
                    latitude: 44.951, 
                    longitude: -93.126
                },
                9:{
                    title: "Como",
                    latitude: 44.927, 
                    longitude: 93.126
                },
                10:{
                    title: "Hamline/Midway",
                    latitude: 44.979, 
                    longitude: -93.155
                },
                11:{
                    title: "St. Anthony",
                    latitude: 44.962082, 
                    longitude: -93.166604
                },
                12:{
                    title: "Union Park",
                    latitude: 44.973181, 
                    longitude: -93.196334
                },
                13:{
                    title: "Macalester-Groveland",
                    latitude: 44.948, 
                    longitude: -93.174
                },
                14:{
                    title: "Highland",
                    latitude: 44.933, 
                    longitude: -93.167
                },
                15:{
                    title: "Summit Hill",
                    latitude: 44.912,
                    longitude: -93.177
                },
                16:{
                    title: "Capitol River",
                    latitude: 44.936, 
                    longitude: -93.136

                }
            }
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

function getIncidentMarkers(address, date, time, incident, code){
    $.getJSON('https://nominatim.openstreetmap.org/search?format=json&country=United States&state=MN&city=St. Paul&street=' + app.address)
        .then(data => {
            if(data.length > 0) {
                var latitude = data[0].lat;
                var longitude = data[0].lon;
                var popup = L.popup({
                    closeOnClick: false, 
                    autoClose: false
                }).setContent([address, date +'/'+ time, incident].join('<br/>'));
                var marker = L.marker([latitude, longitude], {title: address}).bindPopup(popup).addTo(map);
                app.iMarkers.push(marker);
            }
        });
}

function getAddress(){
    $.getJSON('https://nominatim.openstreetmap.org/search?format=json&q=saint paul minnesota' + app.address)
        .then(data => {
            if(data.length > 0) {
                app.latitude = data[0].lat;
                app.longitude = data[0].lon;
                leafletMap.panTo([app.latitude, app.longitude]);
            }
            else{
                alert("the address you typed does not exist");
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
        let bounds = leafletMap.getBounds();
        let lat = app.neighborhoods[i].latitude;
        let long = app.neighborhoods[i].longitude;
        if (lat > bounds._southWest.lat && lat < bounds._northEast.lat && long > bounds._southWest.lng && long < bounds._northEast.lng) {
            app.mapNeighborhoods.push(parseInt(i));
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