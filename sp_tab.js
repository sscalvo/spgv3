//SP_TAB.JS
//All SPG code starts here

//MODEL
var hall = null;
var layout = null;
var form_data = {}; // control panel values (gender, ncols, etc) are stored here
var view = { 
				//METHODS
				//Show Chrome PRINT window
				"buttonPrint": function () { window.print(); },
				// function called on "button_find_updates" click
				"buttonFindUpdates": function () { 	autoUpdater(); },
				// function called on "button_add_row" click
				"buttonAddRow": function () {
					extra_rows[form_data.gender]++;
					console.log("Add_row clicked with extra_rows." + form_data.gender + " = " + extra_rows[form_data.gender]);
					init(sp, form_data, ADD_ROW);
				},
				// buttton Save
				"buttonSave": function(){ alert("boton Save!!");}
};

//layout.js will inject different tables on sp_tab.html using this id's (of course, should also exist on sp_tab.html)
var entry_points = { 
						"table_arrivals": "arrivals",
						"table_students": "students", 
						"table_letters":  "letters",
						"table_numbers":  "numbers"
}

//DDBS endpoints for download and upload
var url_download_json   = "";
var url_POST_seat_map   = "";
var calm_tabId = 0;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



/** Downloads the sutdents-JSON object or this course and stores it on the global "sp" object. Asynchronous.
* This method is invoked on the first creation of the SPG-tab or on "F5", but not by the auto-updater 
* @param url_download_json  url for this course
* TODO: deferred objects https://stackoverflow.com/questions/14754619/jquery-ajax-success-callback-function-definition
*/
function getStudentsJSON(url_download_json){
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
			//HERE default gender will be always 'male' (unless CALM tracks the real gender assigned to the AT. Beware a male AT can conduct only female, only male or both. Same for female AT)
			form_data = getFormData(); //get defaut values from html form
			
			hall = new Hall(course_json, form_data);
			layout = new Layout(hall, form_data.gender, "studentsTable", entry_points); //"studentsTable" must correlate name in sitPlan.css
			layout.render();
			
			bindEvents(layout);
			
/*			var current_branch = init(sp, form_data, WINDOW_LOAD); //WARNING: Init modifies sp object (because of sort() )
			if(current_branch.md5 != previous_md5[form_data.gender]){ //TODO: Es temporal. Habra que hacer un update_online_changes desde la primera visita del usuario
				previous_md5[form_data.gender] = current_branch.md5;
				previous_json[form_data.gender] = current_branch.json;  
			}
	*/		/*The very FIRST time this course is being laid out, all students will have generated_hall_position="". If cancellations happened 
			and auto-updater triggered, the map would change positions. By saving current map to calm right now, we avoid this frontier-cases*/ 
			//save_to_CALM(); 
			screenBlock.style.display = "none";  //SPGv2: unblock screen after AJAX in sp_tab.js
		}
	});
}


/** Dinamically assign HTML events to radio buttons (will help when migrating the code to Chrome-Extension)
* and also populate form_data for the first time (Later on the population will happen on the respective callback functions)
*/
function bindEvents(layout){
	
	//update form_data with new values and call init() to repaint the map
	$("input:radio[name=gender]").click(function(e){		
		layout.setGender(e.currentTarget.value);
		//form_data.gender = e.currentTarget.value; 
		$("#course_gender").html( layout.gender.charAt(0).toUpperCase() + layout.gender.slice(1));
		
	});
	$("input:radio[name=ncol]").click(function(e){ 	layout.setNumberOfColumns(parseInt(e.currentTarget.value));	});
	$("input:radio[name=drop_option]").click(function(e){ layout.drop_option = e.currentTarget.value; redips.init() }); 
	$("#button_save").on("click",view.buttonSave);  
	$("#button_print").on("click", view.buttonPrint);  
	$("#button_find_updates").on("click",view.buttonFindUpdates);  
	$("#button_add_row").on("click",view.buttonAddRow); 
}

function getFormData(){
	var gender = $("input:radio[name=gender]:checked").val();
	var ncols = parseInt($("input:radio[name=ncol]:checked").val());
	var drop_option = $("input:radio[name=drop_option]:checked").val();
	return {"gender": gender, "ncols":ncols, "drop_option": drop_option}; 
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

document.body.appendChild(screenBlock);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


chrome.runtime.getBackgroundPage(function(backgroundPage) {
	calm_tabId = backgroundPage.calm_tabId;
	url_download_json = backgroundPage.url_download_json;//Download students JSON from CALM
	url_POST_seat_map = backgroundPage.url_POST_seat_map; //Upload seating map to CALM
	//console.log("getStudentsJSON: " + url_POST_seat_map);
	getStudentsJSON(url_download_json);  //sort of init
	
});



