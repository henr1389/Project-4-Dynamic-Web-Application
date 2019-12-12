// Built-in Node.js modules
var fs = require('fs')
var path = require('path')

// NPM modules
var bodyParser = require('body-parser');
var express = require('express')
var sqlite3 = require('sqlite3')

var db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

var app = express();
var port = 8001;

//open St. Paul crimes database
var db = new sqlite3.Database(db_filename, (err) => {
	if(err){
		console.log('Error opening ' + db_filename);
    }
    else{
        console.log('Now connected to ' + db_filename);
	}
});

app.use(bodyParser.urlencoded({ extended:true }));

// GET request handler for '/'
app.get('/codes',(req,res) => {
	db.all("SELECT * FROM Codes ORDER BY code", function(err ,rows){
		var max;
		if(req.query.code != null){
			max = req.query.code.split(",");
		}else{
			max = [rows[0].code, rows[rows.length - 1].code];
		}
		var object = fillCodesObject(rows, max);
		if(req.query.format == null || req.query.format == 0){
			var response = JSON.stringify(object, null, 4);
			res.type('json').send(response);
		}else{
			var xmlResponse = xmlCodesResponse(rows);
			res.type('xml').send(xmlResponse);
		}
		
	});	
	
});

function fillCodesObject(rows, limit){
	var filler = {};
	for(var i = 0; i < rows.length; i++){
		if(rows[i].code >= limit[0] && rows[i].code <= limit[1]){
			var key = 'C' + rows[i].code;
			filler[key] = rows[i].incident_type;
		}
	}
	return filler; 	
}
function xmlCodesResponse(rows){
	var xml = "";
	for(var i = 0;i < rows.length; i++){
		var code = 'C' + rows[i].code;
		xml = xml + "<code>" + code + "</code>\n";
		xml = xml + "<incident_type>" + rows[i].incident_type + "</incident_type>\n";
	}
	xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + "<codes>\n" + xml + "</codes>";
	return xml;
}

app.get('/neighborhoods',(req, res)=>{
	db.all("SELECT * FROM Neighborhoods ORDER BY neighborhood_number ", function(err, rows){
		var max; 		
		if(req.query.id != null){
			max = req.query.id.split(",");
		}else{
			max = [rows[0].neighborhood_number, rows[rows.length - 1].neighborhood_number];
		}
		var object = fillNeighborhoodsObject(rows, max);
		if(req.query.format == null || req.query.format == 0){
			var response = JSON.stringify(object, null, 4);
			res.type('json').send(response);
		}else{
			var xmlResponse = xmlNeighborhoodResponse(rows);
			res.type('xml').send(xmlResponse);
		}	
	});	
});

function fillNeighborhoodsObject(rows, limit){
	var filler = {};
	for(var i = 0; i < rows.length; i++){
		if(rows[i].neighborhood_number >= limit[0] && rows[i].neighborhood_number <= limit[1]){
			var key = 'N' + rows[i].neighborhood_number;
			filler[key] = rows[i].neighborhood_name;
		}
	}
	return filler;
}
function xmlNeighborhoodResponse(rows){
	var xml = "";
	for(var i = 0; i < rows.length; i++){
		var num = 'N' + rows[i].neighborhood_number;
		xml = xml + "<neighborhood_number>" + num + "</neighborhood_number>\n";
		xml = xml + "<neighborhood_name >" + rows[i].neighborhood_name + "</neighborhood_name >\n";
	}
	xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + "<Neighborhoods>\n" + xml + "</Neighborhoods>";
	return xml;
}

app.get('/incidents',(req,res)=>{
	var format = req.query.format;
    var query = req.query;
    var sql = 'SELECT * FROM Incidents';
    var check = true;
    var max = 1000; 
    var values = {
    	code: 'code', 
    	grid: 'police_grid', 
    	id: 'neighborhood_number'
    }; 
 	for(var i in query){
        if(query.hasOwnProperty(i)) {
            var index = i.trim();
            if (Object.keys(values).includes(index)) {
                var splitQuery = query[i].split(',');
                if(check){
                	sql = sql + ' WHERE ' 
                }else{
                	sql = sql + ' OR ';
				}
                first = false;
                sql = sql + values[index] + ' = ' + splitQuery.join(' OR ' + values[index] + ' = ');
            }
        }
    }

    
    if(Object.keys(query).includes('limit')){ 
        max = query['limit'];
    }
    if(Object.keys(query).includes('start_date')){  
        if(check){
        	sql = sql + ' WHERE ';
        } else { 
        	sql = sql + ' OR ';
        }
        check = false;
        sql = sql + 'date_time > '+ query['start_date'];
    }
    if(Object.keys(query).includes('end_date')){ 
        if(check){
        	sql = sql + ' WHERE ';
        } else { 
        	sql = sql + ' OR ';
        }
        check = false;
        sql = sql + 'date_time < ' + query['end_date'];
    }
    sql = sql + ' ORDER BY date_time DESC LIMIT ' + max;
    db.all(sql, function(err, rows){
		var object = {};
		for(var i = 0; i < rows.length; i++){
			var num = 'I'+rows[i].case_number;
			var date_time = rows[i].date_time.split("T");
			object[num] = {
				"date": date_time[0], 
				"time": date_time[1],
				"code": rows[i].code,
				"incident": rows[i].incident,
				"police_grid": rows[i].police_grid,
				"neighborhood_number": rows[i].neighborhood_number,
				"block": rows[i].block,
			};
		}
		if(format == 'xml'){
			var xml = "";
			for(var i = 0; i<rows.length;i++){
				var xml = "";
				var num = 'I' + rows[i].case_number;
				var date_time = rows[i].date_time.split("T");
				var date = date_time[0]; 
				var time = date_time[1]; 
				var code = rows[i].code;
				var incident = rows[i].incident;
				var police_grid = rows[i].police_grid;
				var neighborhood_number= rows[i].neighborhood_number;
				var block = rows[i].block;
				block = block.split("&").join("&amp;");
				xml = xml + "\n<date>" + date + "</date>\n" + "<time>" + time + "</time>\n" + "<code>" + code + "</code>\n" + "<incident>" + incident + "</incident>\n" + "<police_grid>" + police_grid + "</police_grid>\n"+"<neighborhood_number>"+neighborhood_number+"</neighborhood_number>\n"+"<block>"+block+"</block>\n";
				xml = "<case_number>"+ num + xml + "</case_number>\n";
				result = result + xml;
			}
			result = '<?xml version="1.0" encoding="UTF-8"?>\n'+"<Incidents>\n"+xml+"</Incidents>";
			res.type('xml').send(result);
		}else{
			var result = JSON.stringify(object,null,4);
			res.type("json").send(result);
		}
    });
});

function fillIncidentsObject(object, rows, limit){
	for(var i = 0; i < limit; i++){
		var filler = {}
		var case_number = 'I' + rows[i].case_number;
		var date_time = rows[i].date_time.split("T");
		filler["date"] = date_time[0]; 
		filler["time"] = date_time[1]; 
		filler["code"] = rows[i].code;
		filler["incident"] = rows[i].incident;
		filler["police_grid"] = rows[i].police_grid;
		filler["neighborhood_number"] = rows[i].neighborhood_number;
		filler["block"] = rows[i].block;
		object[number] = filler;
	}
	return object;
}


app.put('/new-incident',(req, res)=>{
	var case_number = req.body.case_number;
	console.log(req.body.case_number);
	var date_time = req.body.date + "T" + req.body.time;
	db.all("SELECT * FROM Incidents ORDER BY case_number", function(err, rows){	
		var match = false;
		for(var i = 0; i < rows.length; i++){
			if(rows[count].case_number == case_number){
				match = true;
			}
		}
		if(match){
			res.writeHead(500, {'Content-Type': 'text/plain'});
			res.write('Case number already exists');
		}
		else{
			let result = [
				case_number,
				date_time,
				req.body.block,
				req.body.incident,
				req.body.code,
				req.body.police_grid,
				req.body.neighborhood_number
			];
			db.run("INSERT INTO Incidents VALUES( ?, ?, ?, ?, ?, ?, ?)", result, (err, rows) => {
				if(err){
					console.log(date_time); 
					res.write('Error inerting new incident'); }
				else{
					res.status(200).send("success");	
				}	
			});
		}
	});
});
var server = app.listen(port);
