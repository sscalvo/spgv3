"use strict";
//TODO implement 'user_can_assign_hall_position'

//LAYOUT Wraps the REDIPS library and translates its functionality in terms of Dhamma Hall methods
// create redips container
//There is one layout for MALE and one layout for FEMALE
var redips = {};

/**
* CONSTRUCTOR Layout Creates a layout object
* @param _hall Hall object populated with all the students
* @param _gender The gender we are working with
* @param _idTable For REDIPS to activate D&D
* @param _ep entryPoints id's to injecting data on the html page
*/
function Layout(_hall, _gender, _idTable, _ep, _url_course){ 
			
	this.hall          = _hall;
	this.idTable       = _idTable;
	this.entry_points  = _ep;
	this.url_course    = _url_course;
	this.gender        = _gender;  //Default "male" (until CALM is able to send the gender associated to an AT (which is not really clear when only one AT conducting both genders, so.. we will always need a default gender :( 

	this.drop_option   = "switch"; 
	this.pageSize      = getPageSize();
		
}

/** If gender changes, ncols[_gender] and nrows[_gender] will read the correct values. So no change needed
*/
Layout.prototype.setGender = function(_gender){
	this.gender = _gender;
	//If there are many more males than females (or viceversa) the numbre of rows will differ. So update
	this.render();
}

/** If number of columns changes (for a given gender), update it, and also update nrows for that gender
*/
Layout.prototype.setNumberOfColumns = function(_ncols){
	this.hall.setNumberOfColumns(_ncols, this.gender);
	this.render();
}

/** If number of columns changes (for a given gender), update it, and also update nrows for that gender
*/
Layout.prototype.getNumberOfColumns = function(gender){
	return this.hall.getNumberOfColumns(gender);
}

Layout.prototype.setDropOption = function(_drop_option){
	this.drop_option = _drop_option;
	//TODO Avisar a REDIPS del cambio de drop_option
}

//Returns the biggest possible dimension (width, height) <!-- that matches A4 proportions -->
//http://stackoverflow.com/questions/3437786/get-the-size-of-the-screen-current-web-page-and-browser-window
function getPageSize(){
	var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	//landscape A4 = 297 × 210 mm -> 1024 x 724  RATIO: 1.4143
/* 	var ratioA4 = 1.4143;
	var msg = "";
	var r2 = w / h;
	if (r2 <=  1.414) { h = parseInt(w / ratioA4); msg = " A4: width: " + w + " height chopped " + h;} //h is way too high to match A4 proportions. Lets chop it
	else { w = parseInt(h * ratioA4); msg = " A4: width chopped " + w + " height: " + h;} //w is too long to match A4 (h is ok). Lets assign the maximun value to w. 
	if(print_debug)  $("#debug").text( msg + " ");   */
	return { "width": w, "height": h};
}

/** Generates an empty table with the proper dimensions to allocate all the students
* @see "..\doc\html_table__template.png"
*/
Layout.prototype.getStudentsEmptyTable = function(idTable){ 
	var coef = 0.94; //Dont use all the available screen
	var nc = parseInt(this.hall[this.gender].ncols); //For legibility porpouses
	var nr = parseInt(this.hall[this.gender].nrows);
	
	var colWidth = parseInt((this.pageSize.width * coef)/ nc);	
	var colHeight = parseInt((this.pageSize.height * coef)/ nr);	

	//var colHeight = parseInt(pageSize.height / rows);

	//Generate "<col width="70"/>" 'cols' times and wrap it around "<colgroup>"
	var columns = Array.apply(null, Array(nc)).map(function(){return "<col width=\"" + colWidth +"\"/>\n"}).join(''); 
	columns = "<colgroup>\n" +  columns + "</colgroup>\n";
	
	//Generate "<td></td>" 'cols' times  and wrap it around  "<tr>"
	var row_of_td = Array.apply(null, Array(nc)).map(function(){return "<td class=\"normal\"></td>"}).join(''); //mind the Array(COLS)
	row_of_td = "<tr style=\"height:" + colHeight + "px;\">\n" + row_of_td + "</tr>\n";
	
	//Generate as many rows (of type 'row_of_td') as indicated by 'rows', whith the help of Array class. Seen on stackoverflow
	var many_rows = Array.apply(null, Array(nr)).map(function(){return row_of_td }).join(''); //mind the Array(ROWS)
	
	many_rows = "<tbody>\n" + many_rows + "</tbody>\n";

	var table = "<table border=\"0\" id=\"" + idTable + "\" style=\"table-layout:fixed; width:" + this.pageSize.width*coef + "px\">\n" + columns + many_rows  + "</table>\n";
	return table;
}

/** TABLE OF LETTERS: Creates 1-column table with as many rows as the main students table, each one containing a letter [A..N] 
*/
Layout.prototype.getLettersTable = function(cellHeight){
	var nr = parseInt(this.hall[this.gender].nrows);  //For legibility porpouses

	var many_rows = "";
	for(var tmp = 64 + nr, i = 0; tmp>= 65; tmp--, i++){ //String.fromCharCode(65) --> 'A'
		many_rows += "<tr style=\"height:" + cellHeight + "px;\">\n" + "<td class=\"letters\">" + String.fromCharCode(tmp) + "</td></tr>\n";
	}
	//Generate as many rows (of type 'row_of_td') as indicated by 'rows', whith the help of Array class. Seen on stackoverflow
	many_rows = "<tbody>\n" + many_rows + "</tbody>\n";

	var table = "<table class=\"lettersTable_" + this.gender + "\" id=\"lettersTable\" border=\"0\">\n<colgroup>\n<col width=\"20\"/>\n</colgroup>\n" + many_rows  + "</table>\n";
	return table;
}

/** TABLE OF NUMBERS: Creates 2-row table: 1st row contains as many columns as the main students table, each one containing a number [1..N] 
* and 2nd row contains the Dhamma Seat (male: aligned to left, female:aligned to right)
*/
Layout.prototype.getNumbersTable = function(){
	var nc = parseInt(this.hall[this.gender].ncols); //For legibility porpouses
	var nr = parseInt(this.hall[this.gender].nrows);  //For legibility porpouses

	var colWidth = parseInt(this.pageSize.width * 0.94 / nc);	
	var colHeight = parseInt(this.pageSize.height / nr);	

	//---------------------Generate COLUMN NUMBERS table:------------------------------------
	//Generate "<col width="70"/>" 'cols' times and wrap it around "<colgroup>"
	var columns = Array.apply(null, Array(nc)).map(function(){return "<col width=\"" + colWidth +"\"/>\n"}).join(''); 
	columns = "<colgroup>\n" + columns + "</colgroup>\n";
	//Generate "<td></td>" 'cols' times  and wrap it around  "<tr>"
	var i = 1; //Start from A1 ... to AN
	var local_gender = this.gender; //daba error en la siguiente linea, creo que por tema closures
	var row_of_numbers = Array.apply(null, Array(nc)).map(function(){return "<td class=\"numbers_" + local_gender + "\" >" + i++ + "</td>"}); //mind the Array(COLS)
	if(this.gender === "female") row_of_numbers.reverse();
	
    row_of_numbers = "<tr >\n" + row_of_numbers.join('') + "</tr>\n";
	
	var dhamma_seat_row = new Array(nc).join("<td></td>"); //mind! Originally (cols + 1), but one col is added manually
	if(this.gender === "male") 
		dhamma_seat_row = "<td class='dhamma_seat'>Dhamma Seat</td>" + dhamma_seat_row; //On the left
	else
		dhamma_seat_row += "<td class='dhamma_seat'>Dhamma Seat</td>"; //On the right
	dhamma_seat_row = "<tr>" + dhamma_seat_row + "</tr>\n";

	var dhamma_seat_table = row_of_numbers = "<table id=\"dhammaSeatTable\" border=\"0\" >\n" + columns + "<tbody>\n" + row_of_numbers + dhamma_seat_row + "</tbody>\n</table>\n";
	return dhamma_seat_table;

}

/**
* @see "..\doc\html_table__template.png"
*/
Layout.prototype.render =  function(){
	var ep = this.entry_points;
	$('#' + ep.table_students).text(''); //Clean previous table
	$('#' + ep.table_letters).text(''); //Clean previous table
	$('#' + ep.table_numbers).text(''); //Clean previous table

	//Generate scaffold of the students table
	var studentsEmptyTable = this.getStudentsEmptyTable(this.idTable);
	//Inject table on the DOM tree
	$('#' + ep.table_students ).html(studentsEmptyTable); //Inject table into html label: <span id="xxxxx"/> 

	//Generate the contents (html-format students data)
	var content = this.getContent();
	content = JSON.stringify(content);
	
	//and fill up the table with the data
	REDIPS.drag.loadContent(this.idTable, content);
//	REDIPS.drag.loadContent(id_table_students, "[[\"d16\", 0, 1, \"\", \"C1\"], [\"d17\", 0, 3, \"\", \"C2\"]]");
	redips.init();

	//To properly render lettersTable, we need to find the maximum rendered height of every row idTable and set it to each row of lettersTable
	//var rowHeights = getRowHeights(this.idTable);
	var dimen = getCellDimensions(this.idTable);
	var lettersTable = this.getLettersTable(dimen.height+1);
	var numbersTable = this.getNumbersTable();
	$('#' + ep.table_letters ).html(lettersTable); 
	$('#' + ep.table_numbers ).html(numbersTable); 
	//Course information
	/**
	$('#' + this.entry_points.venue_name).text( this.hall.venue_name); 
	var locale = window.navigator.userLanguage || window.navigator.language || "en-us" ;
	var start_date = new Date(this.hall.start_date);
	var start_month = start_date.toLocaleString(locale, { month: "long" });
	var end_date = new Date(this.hall.end_date);
	var end_month = end_date.toLocaleString(locale, { month: "long" });
	
	
	$('#' + this.entry_points.start_date).text( start_date.getDate() + " " + start_month + " " +start_date.getFullYear()); 
	$('#' + this.entry_points.end_date).text( end_date.getDate() + " " + end_month + " " + end_date.getFullYear()); 

	
	$('#' + this.entry_points.gender).text( this.gender); 
	$('#' + this.entry_points.num_total).text(this.hall[this.gender].num_std); 
	$('#' + this.entry_points.num_new).text(this.hall[this.gender].new.length); 
	$('#' + this.entry_points.num_old).text(this.hall[this.gender].old.length); 
	*/
	//Adjust dimensions of all the <div> created by REDIPS.loadContent
	$('div.std').css( { "border": "1px solid","height": (dimen.height -1) + "px", "width": (dimen.width - 4	) + "px" });
	//When there is only 1 student left on the last row and you move it, the row height shrinks down.. 
	$('#' + this.idTable + ' tr').css( { "height": (dimen.height+ 3) + "px" }); //.. +3 to avoid shrink down 

}

/**
* @param the id of the table to analyze
* @returns Array with height of the each row on the given table
*/
function getCellDimensions(idTable){
	var rows = document.getElementById(idTable).rows;
	var cell = rows[0].cells[0]; //first cell
	
	return { "width": cell.offsetWidth , "height": cell.offsetHeight}; 
}


/**
* @param the id of the table to analyze
* @returns Array with height of the each row on the given table
*/
function getRowHeights(idTable){
	var rows = document.getElementById(idTable).rows;
	var heights = [];
	for(var i = 0; i< rows.length; i++){
		heights[i] = rows[i].offsetHeight -2; //-2 because of the borders (it may need further tunning)
	}
	return heights; 
}

/** Reads the this.hall object and generates the appropiate json content for REDIPS.drag.loadContent to load it on the table
*  
* According to http://www.redips.net/javascript/redips-drag-documentation/comment-page-8/#comment-24880 the method loadContent
* expects this:
*    Pattern:        [DIV id, row index, cell index, class names and DIV innerText]
* 	 Example:   	 [["d2",2,2,"orange","A2"], ["d1",1,5,"green","A1"], ...]
* So getContent() assembles all this information in that way (where x is an instance of student ):
* 	 DIV id        --->   x.display_id
*    row index     --->   x.generated_hall_position[0] (after properly transforming letter into number )
*    cell index    --->   x.generated_hall_position[1] (after properly shifting the number -1)
*    class names   --->   REFINAR--> "joined" for students newly incorporated into an existing map, "" for others
*    DIV innerText --->   cellContent(x) method will take care of generating this text
* @param vOld Array of old student objects (of selected gender)
* @param vNew Array of new student objects (of selected gender)
* @param nrows Number of rows in Dhamma Hall
* @param ncol Number of columns in Dhamma Hall
* @return Content-array as String.
* APROX: https://jsfiddle.net/z8c9L215/
*/
/** 
* Recorre el array de estudiantes. Primero se sientan todos los estudiantes que tengan una coordenada (generated_hall_position) pre-asignada
* que caiga dentro de los limites del Hall actual (recordemos que en cualquier momento el tamaño del Hall puede ser cambiado por el AT)
* Una vez terminado esto, aquellos cuya "generated_hall_position" está vacía o tiene un valor que se sale del tamaño del Hall (no se le 
* modificará su valor), se les asignan cronologicamente las plazas libres que hayan quedado libres, para intentar conseguir un Hall compacto.
* The female generatedHallLabels uses reverse_array_in_chunks, but this ordering the labels is only used at Constructor level (and only if all
* the females have generated_hall_position==""). So in this method, we just use .getHallLabels() as a bag of labels. Order does not matter.
* Whenever a student is dragged to another position, his/her student object will be updated and when time to persist them back in CALM, the only thing
*that matters is their 'generated_hall_position' value, not their phisical arrangement on the screen.
*/
Layout.prototype.getContent = function(){ 
	var nc = this.hall[this.gender].ncols; //For legibility porpouses
	var nr = this.hall[this.gender].nrows; //For legibility porpouses

	var content = [];
	var vWithSeats = [];
	var vNoSeats = [];
	var logWS = "vWithSeats: "; //With Seat
	var logOB = "@@out of Bounds @@: "; //Out of Bounds
	var logNS = "vNoSeats: ";   //No seat
	
	
	var v = this.hall.getStudents(this.gender); //TODO usar ORDER_BY

	//Split students in 2 groups: WITH and WITHOUT seats
	for(var i=0; i < v.length; i++){ 
		var label = v[i].generated_hall_position; //get students hall coordinate (if any)
		if (label === ""){ //if the student has NO previously asigned seat
			logNS += v[i].id + " " + v[i].applicant_given_name + " " + v[i].courses_sat + " --- "
			vNoSeats.push(v[i]); //move him to a side place
		}
		else{  //if the student already had a generated_hall_position..
				logWS += v[i].id + " " + v[i].applicant_given_name + " " + v[i].courses_sat + " --- ";
				var row = nr - 1 - (label.charCodeAt(0) - 65); // 'A' is 65, 'B' is 66, ..  Vertical offset -1
				var col = label[1] - 1;  //Horizontal offset -1
				content.push([v[i].id, row, col,  (v[i].old?"std old_":"std new_") + this.gender, this.cellContent(v[i])]); //and add student to the group of people with seats
		}
	}
	
	console.log("sp_tab->assingSeats() " + logWS);
	console.log("sp_tab->assingSeats() " + logOB);
	console.log("sp_tab->assingSeats() " + logNS);
	
	return content;
}

/** Generates the actual content that is shown on each table cell 
*
* 	std = {"id": 2, "display_id" : "OM0001", "applicant_given_name" : "Jose",   "applicant_family_name" : "Sanz",
*		   "age" : 50, "sitting" : true, "old" : true, "conversation_locale": "English", "language_native" : "English", 
*		   "ad_hoc" : "", "pregnant" : false,"courses_sat": 8, "courses_served" : 1, "room" : "12"}
*				
* @param std Student data
* @return string containing all the data
*/
Layout.prototype.cellContent2 = function(std){
	var dimen = getCellDimensions(this.idTable);
	$('#std_grid').css( { "width": dimen.width } );
	var who = std.old?"old_":"new_" + this.gender;
	$('#std_grid').addClass(who);
	
	var icons = "icons here";
	var cc= "<div id=\"doc\" class=\"yui-t7\"> <div id=\"yui-main\"> <div class=\"yui-b\"> <div class=\"yui-gc\"> <div class=\"yui-u first\">";
	cc += "<div class=\"name\">" + std.applicant_given_name + "</div>  </div>  <div class=\"yui-u\">";
	cc += "<div class=\"age_" + (std.old?"old":"new") + "\">" + std.age;
	cc +=  (std.old?("<br>" + std.courses_sat + "/" + std.courses_served):"") + "</div></div> </div> </div> </div>";
	cc += "<div id=\"bd\"> <div id=\"hd\"><div id=\"surname\">"+ std.applicant_family_name + "</div> </div>";
	cc += "<div class=\"yui-b\"><div id=\"secondary\"><a href=\"fdsf\"" +  std.display_id + "fdsf</a></div> </div> </div>";
	cc += "<div id=\"ft\"> <div id=\"footer\"><a target=\"_blank\" href=\"" + this.url_course + std.id +"/edit\" title=\"Open " + std.applicant_given_name + "\'s page\">" +  std.display_id + "</a>";
	cc += (std.pregnant?"<img src=\"../img/pregnant.png\" width=\"20\" title=\"" + std.applicant_given_name + " is pregnant\" />":"");
	cc += (std.pregnant?"<img src=\"../img/chair.png\" width=\"20\" title=\"" + std.applicant_given_name + " needs chair\" />":"");
	cc += "</div> </div> </div>";
	return cc;
}


Layout.prototype.cellContent = function(std){
	var dimen = getCellDimensions(this.idTable);
	/*$('#std_grid').css( { "width": dimen.width } );
	var who = std.old?"old_":"new_" + this.gender;
	$('#std_grid').addClass(who);
	*/

	
	var cc  = "";
		cc += "<div class=\"caption_" + (std.old?"old_":"new_") + std.gender + "\" >";
		cc += "  <div style=\"float:left; width:80%	;  \" class=\"name\" title=\"" + std.applicant_given_name + "\">" + std.applicant_given_name + "</div>";
		cc += "  <div style=\"float: right; width: 20%; border:0px;\" class=\"age\">" + std.age + "<br/>" + (std.old?(std.courses_sat + "/" + std.courses_served):"") + "</div>";
		cc += "</div>"; 
		cc += "<section style=\"display: table;\">";
		cc += "  <div style=\"display: table-row;\">";
		cc += "    <div style=\"display: table-cell; \" id=\"surname\" title=\"" + std.applicant_family_name + "\">" + std.applicant_family_name + "</div>";
		cc += "    <div style=\"display: table-cell;\">" + (std.pregnant?"<img src=\"../img/pregnant.png\" width=\"20\" title=\"" + std.applicant_given_name + " is pregnant\" />":"") + "</div>";
		cc += "    <div style=\"display: table-cell;\">" + (std.old?"<img src=\"../img/pregnant.png\" width=\"20\" title=\"" + std.applicant_given_name + " needs chair (CALM-->CHAIR!)\" />":"") + "</div>";
		cc += "  </div>";
		cc += "  <div style=\"display: table-row;\">";
		cc += "    <div style=\"display: table-cell;\">" + "<a target=\"_blank\" href=\"" + this.url_course + std.id +"/edit\" title=\"Open " + std.applicant_given_name + "\'s page\">" +  std.display_id + "</a>" + "</div>";
		cc += "  </div>";
		cc += "  </section>";
	return cc;
}

/**
* SOLUCION TEMPORAL a la carencia de number_of_colums por parte de CALM:
* Recorrer todas las generated_hall_position[gender] hasta encontrar la "B2" e introducir el numero de columnas en la posicion A1
* El formato acordado es "B2:x" donde x es el number_of_columns. 
* ESTE METODO PUEDE SER BORRADO en cuanto CALM envie el campo number_of_columns (tanto para male como para female)
* There is also a correlating getFakeNumberOfColumns() in sp_tab.js !!
*/
function setFakeNumberOfColumns(p, ncols){
	for (var key in p) {  //TODO optimizar con un while para salir al encontrar B2
      if (p.hasOwnProperty(key) && p[key] === "B2")  { p[key] = "B2:" + ncols; /**console.log(key);*/ } 
    }
}

/** For TESTING porpouses. Sets all 'generated_hall_position'  to ""
*/
Layout.prototype.reset_all_positions = function(){
	var v = this.hall[this.gender].old.concat(this.hall[this.gender].new);
	var json = { "hall_positions" : {} };
	for(var i = 0; i < v.length; i++){
		json.hall_positions[v[i].id] = "";
	}
	this.save_to_CALM(json);

}
/** Sends all the students id & generated_hall_position to CALM
* sent data should look like:
				{ "hall_positions" : {"234" : "A1", "128": "A2" , "561" : "F4", "104" : "F5" },
				   "male": {"number_of_rows": 9, "number_ol_columns": 5},
				   "female": {"number_of_rows": 6, "number_ol_columns": 6}
				}
* @param alternative_content Used bt reset_all_positions method
*/
Layout.prototype.save_to_CALM = function(alternative_content) {
	//var savedContent = REDIPS.drag.saveContent(idTable, "json");
	var savedContent = alternative_content|| saveContent(this.idTable, "json");
			//TODO: Preparar el json para parecer que CALM si que nos esta enviando el numero de columnas.
			//BORRAR en cuanto CALM envie el campo number_of_columns (tanto para male como para female)
			setFakeNumberOfColumns(savedContent.hall_positions, this[this.gender].ncols);
	
	//TODO Descomentar esta linea cuando CALM confirme que aceptan recibir una estructura como la documentada arriba (en los comentarios del metodo)
	//y de paso probar que funciona si solo le enviamos parte de la estructura (un solo genero) y no toda (deberia)
	//savedContent[this.gender].number_of_columns = this.gender.ncols;
			
	//Endpoint url is NOT this: "https://test.calm.dhamma.org/es/courses/119/course_applications/assign_generated_hall_positions"
	//but this "https://test.calm.dhamma.org/es/course/119/course_applications/assign_generated_hall_positions", so lets remove the 's' from 'courses'
	var course_url = url_POST_seat_map.replace(/courses/g, 'course'); //Hey.. Thats how CALM&Ruby publish this endpoint 
	console.log(course_url + "\n" + JSON.stringify(savedContent));
	$.ajax({
			type: "POST",
            url:  course_url,
            data: savedContent,
			error: function(request, status, err) {
				// timeout (or anything else) -> reload the page and try again
				console.log("SPG->sp_tab.js->AJAX error: " + request + status + err);
			},
			success: function(data)
			{
				//inform_user(MSG_SAVE,"Saved");
				console.log("SPG->sp_tab.js->save_to_CALM-> success: "  + data.updated); // show response from the php script.
				alert("Saved!");
			}/* ,
			complete: function (data_response) {
				var jsn = "";
			    try {
					jsn = JSON.parse(data_response.responseText);
				} catch (e) {  //Probably session expired
					window.location.reload();
				}
				console.log("SPG->sp_tab.js->AJAX complete: " + jsn.updated); 
			} */
	});

	console.log("SENT DATA to " + course_url + " is: \n" + JSON.stringify(savedContent));
	//$('#savedContent' ).html(savedContent); //Inject table into html label: <span id="entry_point"/> 
	//inform_user(MSG_SAVE, "Saved");
}


/** SPG: Adapted version of REDIPS.drag.saveContent to meet Hall requirements: Bottom <TABLE> row is 'A', first left column is 1 
 * Only saves id and coordinates in format "A0", "C5"..
 * Method scans table content and prepares query string or JSON format for submitting to the server script.
 * Input parameters are id / table reference and optional output format.
 * @param {String|HTMLElement} tbl Id or reference of table that will be scanned.
 * @param {String} [type] Type defines output format. If set to "json" then output will be JSON format otherwise output will be query string.
 * @return {String} Returns table content as query string or in JSON format.
 * @example
 * Query string:
 * 'p[]='+id+'_'+r+'_'+c+'&p[]='+id+'_'+r+'_'+c...
 *  
 * JSON:
 * [["id", "Rc"],["id","Rc"], ...]
 *  
 * id - element id
 * R  - row index, as a CAPITAL letter. Bottom <TABLE> row is 'A'
 * c  - cell index. First left column is 1 
 *  
 * Query string example:
 * p[]=d1_A1&p[]=d2_A2&p[]=d3_F4&p[]=d4_F5
 *  
 * JSON output example:
 * { "hall_positions" : {"d1" : "A1", "d2": "A2" , "d3" : "F4", "d4" : "F5" } }
 * @see <a href="#saveParamName">saveParamName</a>
 * @public
 * @function
 * @name REDIPS.drag#saveContent
 */
 
function saveContent(tbl, type) {
	var query = '',		// define query parameter
		tbl_rows,		// number of table rows
		cells,			// number of cells in the current row
		tbl_cell,		// reference to the table cell
		cn,				// reference to the child node
		r, c, d,		// variables used in for loops
		JSONobj = {},   // prepare JSON object
		count = 0,	        // for calculating JSONobj length (number of properties)
		pname = 'p',    //REDIPS.drag.saveParamName;	// set parameter name (default is 'p')
		rowLetters = ['A', 'B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R'];

	// if input parameter is string, then set reference to the table
	if (typeof(tbl) === 'string') {
		tbl = document.getElementById(tbl);
	}
	// tbl should be reference to the TABLE object
	if (tbl !== undefined && typeof(tbl) === 'object' && tbl.nodeName === 'TABLE') {
		// define number of table rows
		tbl_rows = tbl.rows.length;
		// iterate through each table row
		for (r = 0; r < tbl_rows; r++) {
			// set the number of cells in the current row
			cells = tbl.rows[r].cells.length;
			// iterate through each table cell
			for (c = 0; c < cells; c++) {
				// set reference to the table cell
				tbl_cell = tbl.rows[r].cells[c];
				// if cells isn't empty (no matter is it allowed or denied table cell) 
				if (tbl_cell.childNodes.length > 0) {
					// cell can contain many DIV elements
					for (d = 0; d < tbl_cell.childNodes.length; d++) {
						// set reference to the child node
						cn = tbl_cell.childNodes[d];
						// childNode should be DIV with containing "redips-*" class name
						if (cn.nodeName === 'DIV' && cn.className.indexOf('redips-drag') > -1) { // and yes, it should be uppercase
							// prepare query string
							// push values for DIV element as Array to the Array
							//In the Hall: First row is 'A', first column is 1 
							//(tbl_rows - r - 1) Reverse standard HTML-rows order
							//(c+1) to right-shift all columns
							var seatLabel =  rowLetters[(tbl_rows - r - 1 )] + (c+1);
							//JSONobj.push([cn.id, seatLabel]);  //MODIFIED: Before we used this array'ish format [["d1","A1"],["d2","A2"],["d3","F4"],["d4","F5"]]
							count++;
							JSONobj[cn.id] = seatLabel;   
							query += pname + '[]=' + cn.id + '_' + seatLabel  + '&'; //MODIFICADO
						}
					}
				}
			}
		}
		// prepare query string in JSON format (only if array isn't empty)
		if (type === 'json' && count > 0) {
			query = { "hall_positions" : JSONobj };
		}
		else {
			// cut last '&' from query string
			query = query.substring(0, query.length - 1);
		}
	}
	// return prepared parameters (if tables are empty, returned value could be empty too) 
	return query;
};

// redips initialization
redips.init = function () {
	// reference to the REDIPS.drag library
	var	rd = REDIPS.drag;
	rd.animation.pause = 10;			// set animation loop pause
	//rd.dropMode = 'switch';
	rd.dropMode = form_data.drop_option;
	// initialization
	rd.init();
	// error handler called if error occured during loading table content
	rd.error.loadContent = function (obj) {
	
		// display error message (non blocking alert)
		setTimeout(function () {
			alert(obj.message + ' [error type ' + obj.type + ']');
		}, 10);
		// on first error, return false to stop further processing
		//return false;
	};

//      dbunic: if you want to track the way of dragged element then your event listeners are event.clicked and event.dropped

			
	rd.event.changed = function (currentCell){
		console.log("rd.event.changed: " + currentCell);
		draggedElement = currentCell;
		draggedElementPosition = rd.getPosition(currentCell.getElementsByTagName("div")[0].id);
		console.log("rd.event.changed: " + rd.obj.id + " (cell " + rd.getPosition(rd.obj.id) + ") is flying on top of " + currentCell.getElementsByTagName("div")[0].id + " (cell " + rd.getPosition(currentCell.getElementsByTagName("div")[0].id) + "). Updated GLOBAL vars: draggedElement=" + draggedElement.getElementsByTagName("div")[0].id + ", draggedElementPosition=" +draggedElementPosition ); 
	};

/* 	UNDER CONSTRUCTION. Este es el camino a seguir si no quieres hacer un full reload cuando update_course_changes() detecta cambios en BBDD
y quisieramos hacer animaciones dinamicas con la papelera etc

rd.event.deleted = function (cloned){
		console.log("rd.event.deleted: " + rd.obj.id + " (cell " + rd.getPosition(rd.obj.id) + ")\n" + "draggedElementPosition: " + initialElementPosition  ); 
		var coord = rd.getPosition(rd.obj.id)
		var col = coord[2] + 1; //+1 shift
	var row = (min_dimensions.max_row + extra_rows[form_data.gender]) - ( coord[1] + 1); //.., D, C, B, A  (goes downwards)
		//rd.obj.id_needs_to_be_removed_from_sp();
	}; */
/* 	
	rd.event.droppedBefore = function (targetCell){
		//http://www.redips.net/javascript/redips-drag-documentation/#dropMode
		var idNew = draggedElement.getElementsByTagName("div")[0].id;
		// rd.obj is a reference to the current element
		
		console.log("rd.event.droppedBefore: " + rd.obj.id + " (cell " + rd.getPosition(rd.obj.id) + ") is about to be dropped on top of " + draggedElement.getElementsByTagName("div")[0].id + " (cell " + rd.getPosition(draggedElement.getElementsByTagName("div")[0].id) + "). So " + draggedElement.getElementsByTagName("div")[0].id + " should be animated-moved to (cell " + rd.getPosition(rd.obj.id) + ")"); 
		
		
		if (idNew != rd.obj.id) { 
			inform_user(MSG_SAVE, "Not saved");
			
			//update client-side state, at the level of SPG
			var id_1 = rd.obj.id; 
			var id_2 = draggedElement.getElementsByTagName("div")[0].id;
			var coord_1 = rd.getPosition(id_1);
			var coord_2 = rd.getPosition(id_2);
			redips_update_position_in_spg(id_1, coord_2); //spread changes in redips to SPG structure
			redips_update_position_in_spg(id_2, coord_1); //spread changes in redips to SPG structure
		}
			
		rd.enableDrag(false, rd.obj);
		
		rd.moveObject({ //https://jsfiddle.net/ju9vg6gr/6/
			id: idNew,
			target: rd.getPosition(rd.obj.id),
			callback: function () {
				inform_user(MSG_SAVE,"Saving..");
				save_to_CALM();
				rd.enableDrag(true, rd.obj);
			}
		});

	};
	
	rd.event.clicked = function (currentCell){
		draggedElement = currentCell;
		initialElementPosition = rd.getPosition(rd.obj.id); //Not necessary since rd.getPosition(rd.obj.id) will provide us the initial position. Used for TRASH porpouses
		draggedElementPosition = rd.getPosition(rd.obj.id);
		console.log("rd.event.clicked: " + currentCell.getElementsByTagName("div")[0].id + " (cell " + rd.getPosition(currentCell.getElementsByTagName("div")[0].id) + ") has been clicked. Updated GLOBAL vars: draggedElement=" + draggedElement.getElementsByTagName("div")[0].id + ", draggedElementPosition=" +draggedElementPosition ); 
	};
			
	rd.event.switched = function (targetCell){
		console.log("rd.event.switched: targetCell= " + targetCell); 
	 };
	
 */	// set reference to the target table
	//redips.targetTable = document.getElementById(_table_id);
};

