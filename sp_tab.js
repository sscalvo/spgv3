//SP_TAB.JS
//All SPG code starts here

//MODEL
var hall = null;
var layout = null;
var form_data = {}; // control panel values (gender, ncols, etc) are stored here
var view = { 
				//METHODS
				//Show Chrome PRINT window
				"buttonPrint": function () { window.print(); }
		};

//layout.js will inject different tables on sp_tab.html using this id's (of course, should also exist on sp_tab.html)
var entry_points = { /** descriptive_name": "real id on sp_tab.html" */
						"table_arrivals": "arrivals",
						"table_students": "students", 
						"table_letters":  "letters",
						"table_numbers":  "numbers",
						"venue_name":     "venue_name",
						"start_date":     "start_date",
						"start_year":     "start_year",
						"end_year":     "end_year",
						"end_date":       "end_date",
						"gender":         "gender",
						"num_new":        "num_new",
						"num_old":        "num_old",
						"num_total":      "num_total"
}

//DDBS endpoints for download and upload
var url_download_json   = "";
var url_POST_seat_map   = "";
var url_course          = ""; 
var calm_tabId = 0;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//\_________________________________________________________A U T O - U P D A T E R______________________________________________/


function getTime(){
	var time = new Date();
  return   (("0" + time.getHours()).slice(-2)   + ":" +  ("0" + time.getMinutes()).slice(-2) + ":" +  ("0" + time.getSeconds()).slice(-2));
}
//\_________________________________________________________A U T O - U P D A T E R______________________________________________/


/** Downloads the sutdents-JSON object or this course and stores it on the global "sp" object. Asynchronous.
* This method is invoked on the first creation of the SPG-tab or on "F5", but not by the auto-updater 
* @param url_download_json  url for this course
* TODO: deferred objects https://stackoverflow.com/questions/14754619/jquery-ajax-success-callback-function-definition
*/
function ajax_get(url_download_json, callback, description){
	$.ajax({ 
		url: url_download_json,
		type: "GET",
		dataType: "json",
		timeout: 10000,
		error: function(request, status, err) {
			// timeout (or anything else) -> reload the page and try again
			console.log("SPG->sp_tab.js->getStudentsJSON says: Error - " + request + status + err);
			alert("Your CALM session has expired (timed-out)\n You will be redirected to CALM.\n Please login again into CALM and then come back to SPG\n. " );//+ calm_tabId);
			screenBlock.style.display = "none";  //SPGv2: unblock screen after AJAX in sp_tab.js
			chrome.tabs.update(calm_tabId, {active: true}); 
		},
		complete: function (data_response) {// data_response includes ALL the info
		},
		success: function(course_json,status,xhr){ //json is the JSON object
			console.log("sp_tab.js -> ajax_get( callback: " + description + " )");
				//HERE default gender will be always 'male' (unless CALM tracks the real gender assigned to the AT. Beware a male AT can conduct only female, only male or both. Same for female AT)
			form_data = getFormData(); //get defaut values from html form
			
				//Un par de gmails con especificaciones acerca del formato del JSON
				//https://mail.google.com/mail/u/0/#search/number_of_columns/15eaf12423e2e1f8
				//https://mail.google.com/mail/u/0/#inbox/15eaf12423e2e1f8			
			
			callback(course_json);
			screenBlock.style.display = "none";  //SPGv2: unblock screen after AJAX in sp_tab.js
		}
	});
}

function update_course_changes(course_json){
	var hall2 = new Hall(course_json); //A new hall
	var course_changes = hall.find_updates(hall2, layout.gender);
	// {"left": before, "remain": remain, "arrived": cp_after, "any_left": any_left, "any_arrived": any_arrived, "debug": debug};
	hall2.reset_no_seats(form_data.gender); //very small chances that a new students joined while executing the constructor of hall2
	
	hall = hall2;
	layout = new Layout(hall, form_data.gender, "studentsTable", entry_points, url_course); //"studentsTable" must correlate name in sitPlan.css
	layout.render(course_changes.arrived);

}

function init(course_json){
			hall = new Hall(course_json);
			layout = new Layout(hall, form_data.gender, "studentsTable", entry_points, url_course); //"studentsTable" must correlate name in sitPlan.css
			layout.render();
			
			//no_seats
			var ns = hall[form_data.gender].no_seat;
			if(ns.length != 0){
				var msg =  "Some students have joined the course: \n";
				ns.forEach( function (i, index) {  msg +=  "          " + i.applicant_given_name + " " + i.applicant_family_name + " - Age: " + i.age + ((i.old)?" - OLD":" - NEW") + " - SEAT: " + i.hall_position + "\n";  });
				alert(msg);
				hall.reset_no_seats(form_data.gender);
			}
			
			//Before binding events for the first time, lets populate form controls (so far, only ncols) with the values comming from CALM (from a previous version.. If any)
			var ncols        = course_json.sitting[form_data.gender].number_of_columns || form_data.ncols;  //TODO remove "|| form_data" when number_of_colums is implemented by CALM (not yet 1 Oct 2017)
			$("#" + ncols + "col").attr('checked', true);
			bindEvents(layout);
			//If after a while, the AT reopens the map, init() wil be triggered. If ARRIVALS/DEPARTURES happened, find them:
			

}

/**
* SOLUCION TEMPORAL a la carencia de number_of_colums por parte de CALM:

//TODO: En cuanto CALM envie el campo number_of_columns (tanto para male como para female), este metodo dejara de tener sentido

* Recorrer todas las hall_position[gender] hasta encontrar la "A1" y extraer el numero de columnas (previamente guardado de la misma manera)
* El formato esperado es "A1:x" donde x es el number_of_columns. El campo será modificado a "A1" (i.e: Dhamma Sobhana no tiene es "A1". "A1" parece bastante seguro)
* y se creará el atributo. ESTE METODO PUEDE SER BORRADO en cuanto CALM envie el campo number_of_columns (tanto para male como para female)
* There is also a correlating setFakeNumberOfColumns() in layout.js !!
* @return 
*/
function getLastNumberOfColumns(j, gender){
	//MALE
	var v = j.sitting.male.old.concat(j.sitting.male.new);
	var foundA1 = false;
	var i = 0;
	while(!foundA1 && i < v.length){
		var a1 = v[i].hall_position;
		if (a1.substr(0,2) === "A1"){
			foundA1 = true;
			j.sitting.male.number_of_columns = a1.substr(3,1); //extract the number of columns
			//v[i].hall_position = "A1"; //put things back to 'normal'
		}
		i++;
	}
	
	//FEMALE
	 v = j.sitting.female.old.concat(j.sitting.female.new);
	foundA1 = false;
	 i = 0;
	while(!foundA1 && i < v.length){
		var a1 = v[i].hall_position;
		if (a1.substr(0,2) === "A1"){
			foundA1 = true;
			j.sitting.female.number_of_columns = a1.substr(3,1); //extract the number of columns
			//v[i].hall_position = "A1"; //put things back to 'normal'
		}
		i++;
	}
	return j.sitting[gender].number_of_columns;
}


/**
* clon de  getLastNumberOfColumns
*/
function getLastNumberOfRows(j, gender, ncols){
	//MALE
	var v = j.sitting.male.old.concat(j.sitting.male.new);
	var default_rows = Math.ceil(v.length / ncols);
	var foundA1 = false;
	var i = 0;
	while(!foundA1 && i < v.length){
		var a1 = v[i].hall_position;
		if (a1.substr(0,2) === "A1"){
			foundA1 = true;
			j.sitting.male.number_of_rows = Math.max(parseInt(a1.substr(5,1)), default_rows); //extract the number of rows
			v[i].hall_position = "A1"; //put things back to 'normal'
		}
		i++;
	}
	
	//FEMALE
	 v = j.sitting.female.old.concat(j.sitting.female.new);
	default_rows = Math.ceil(v.length / ncols);
	foundA1 = false;
	 i = 0;
	while(!foundA1 && i < v.length){
		var a1 = v[i].hall_position;
		if (a1.substr(0,2) === "A1"){
			foundA1 = true;
			j.sitting.female.number_of_rows = Math.max(parseInt(a1.substr(5,1)), default_rows); //extract the number of rows
			v[i].hall_position = "A1"; //put things back to 'normal'
		}
		i++;
	}
	return j.sitting[gender].number_of_rows;
}

/** Dinamically assign HTML events to radio buttons (will help when migrating the code to Chrome-Extension)
* and also populate form_data for the first time (Later on the population will happen on the respective callback functions)
*/
function bindEvents(layout){
	
	//update form_data with new values and call init() to repaint the map
	$("input:radio[name=gender]").click(function(e){
		var gender = e.currentTarget.value;
		layout.setGender(gender);
		//form_data.gender = e.currentTarget.value; 
		//if going, for example, from male to female map, then update the ncol radio-button to the respective "female" ncol value
		$("#" + layout.getNumberOfColumns(gender) + "col").prop('checked', true);
		$("#course_gender").html( layout.gender.charAt(0).toUpperCase() + layout.gender.slice(1));
		
	});
	$("input:radio[name=ncol]").click(function(e){ VIEW_block(); layout.setNumberOfColumns(parseInt(e.currentTarget.value), VIEW_unblock);	});
	$("input:radio[name=drop_option]").click(function(e){ layout.drop_option = e.currentTarget.value; redips.init() }); 
	$("#button_save").on("click", function(e) { save_map() } );  
	$("#button_reset").on("click",function(e){ layout.reset_all_positions(); } );  
	$("#button_print").on("click", view.buttonPrint);  
	$("#button_find_updates").on("click", function() { save_map(); ajax_get(url_download_json, update_course_changes, "FIND_UPDATES"); } ); 
	$("#button_find_id").on("click", function(){ var r = layout.findStudentById(1238); } ); 
}

function save_map(){ 
	VIEW_block();
	layout.save_to_CALM( VIEW_unblock); 
}

function VIEW_block() {   screenBlock.style.display = "block"; }

function VIEW_unblock() { screenBlock.style.display = "none";  }


function getFormData(){
	var gender = $("input:radio[name=gender]:checked").val();
// ya no hace falta. CALM envia valores por default desde la primera vez
//	var ncols = parseInt($("input:radio[name=ncol]:checked").val());
	var drop_option = $("input:radio[name=drop_option]:checked").val();
	return {"gender": gender, "drop_option": drop_option}; 
}

function renderById(hall){
	$("#course_venue").html( hall.venue_name);
	$("#course_date_start").html( hall.start_date );
	$("#course_date_end").html( hall.end_date);
	$("#course_gender").html( gender.charAt(0).toUpperCase() + gender.slice(1));
}


// -------------------------------------------------

//Fade screen when user clicks button
var screenBlock = document.createElement('div');
//screenBlock.setAttribute("id", "locker");
//screenBlock.setAttribute("class", "locker");
screenBlock.style.position = "fixed";
screenBlock.style.top = 0;
screenBlock.style.left = 0;
screenBlock.style.width = "100%"
screenBlock.style.height = "100%";
screenBlock.style.background = "rgba(200,200,200,0.8)";
screenBlock.style.zIndex = "999";
screenBlock.style.alignItems = "center";
screenBlock.style.justifyContent = "center";
screenBlock.style.display = "-webkit-flexbox";
screenBlock.style.display = "-ms-flexbox";
screenBlock.style.display = "-webkit-flex";
screenBlock.style.display = "flex";
screenBlock.style.fontSize = "40px";
screenBlock.style.color = "rgba(140, 210, 0, 0.8)";
 
var img = "<img src='" + chrome.extension.getURL("img/circular.gif") + "'>";
screenBlock.innerHTML = "<p>Connecting with CALM4..</p><br/>" + img;

//document.body.appendChild(screenBlock);  //DESACTIVAR

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


chrome.runtime.getBackgroundPage(function(backgroundPage) {
	calm_tabId = backgroundPage.calm_tabId;
	url_download_json = backgroundPage.url_download_json;//Download students JSON from CALM
	url_POST_seat_map = backgroundPage.url_POST_seat_map; //Upload seating map to CALM
	url_course        = backgroundPage.url_course; //Upload seating map to CALM
	//console.log("getStudentsJSON: " + url_POST_seat_map);
	
	ajax_get(url_download_json, init, "INIT");  //sort of init
});



