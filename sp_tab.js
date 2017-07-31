//SP_TAB.JS
//All SPG code starts here

//MODEL
var hall = null;
var layout = null;
var view = {};

var table_id = "myTable";
var id_destination = "entryPoint";


//DDBS endpoints for download and upload
var url_download_json   = "";
var url_POST_seat_map   = "";
var calm_tabId = 0;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// SAVE button: 
//view.buttonSave = save_to_CALM;
	
// PRINT button: 
view.buttonPrint = function () { window.print() };
	
// function called on "button_find_updates" click
view.buttonFindUpdates = function () {
	autoUpdater();
}

// function called on "button_add_row" click
view.buttonAddRow = function () {
	extra_rows[form_data.gender]++;
	console.log("Add_row clicked with extra_rows." + form_data.gender + " = " + extra_rows[form_data.gender]);
	init(sp, form_data, ADD_ROW);
}


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
			alert("Your CALM session has expired (timed-out)\n Please login again into CALM and then come back to SPG\n. " + calm_tabId);
			screenBlock.style.display = "none";  //SPGv2: unblock screen after AJAX in sp_tab.js
			//chrome.tabs.update(calm_tabId, {active: true});
		},
		complete: function (data_response) {// data_response includes ALL the info
		},
		success: function(course_json,status,xhr){ //json is the JSON object
			form_data = getFormData(); 
			{ 	//REMOVE THIS BLOCK as soon as CALM provides 'number_of_columns' and 'number_of_rows' (not yet in July 2017)
				var numStd = course_json.sitting[form_data.gender].old.length + course_json.sitting[form_data.gender].new.length;
				course_json.number_of_columns = course_json.number_of_columns || 6; //FUTURE REMOVE! : 6 by default. course_json doesn't provide 'number_of_columns' property yet. Remove this line when CALM complies with  'number_of_columns' ( not yet 26/07) 
				var nrows = Math.ceil(numStd / course_json.number_of_columns); //Number of rows. Thus, (numStd <= nrows*ncols) will be true always
				course_json.number_of_rows = course_json.number_of_rows || nrows; //6 by default. course_json doesn't provide 'number_of_columns' property yet. Remove this line when CALM sends number_of_columns ( not yet 26/07) 
			}
			hall = new Hall(course_json);
			layout = new Layout(hall, form_data);
			var table = layout.getEmptyTable(table_id);
			layout.injectEmptyTable(table, id_destination);
			
			
			//console.log(table);
			REDIPS.drag.loadContent(table_id, "[[\"d16\", 0, 1, \"\", \"C1\"], [\"d17\", 0, 3, \"\", \"C2\"]]");

			redips.init();
			
			
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
function bindEvents(){
	pageSize = getPageSize();
	//update form_data with new values and call init() to repaint the map
	$("input:radio[name=gender]").click(function(e){		
		form_data.gender = e.currentTarget.value; 
		$("#course_gender").html( form_data.gender.charAt(0).toUpperCase() + form_data.gender.slice(1));
		init(sp, form_data, WINDOW_LOAD);   
	});
	$("input:radio[name=ncol]").click(function(e){ 	form_data.ncols = parseInt(e.currentTarget.value); init(sp, form_data, ADD_COL); 	});
	$("input:radio[name=drop_option]").click(function(e){ form_data.drop_option = e.currentTarget.value; redips.init() }); 
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



