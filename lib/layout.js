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
function Layout(_hall, _form, _idTable, _ep, _url_course){ 
			//TEMP calculations
			//If 'number_of_columns' exist in course_json (from a previous session), use it instead of form_data.ncols
			var male_ncols        = _hall.json.sitting.male.number_of_columns || _form.ncols; 
			var female_ncols      = _hall.json.sitting.female.number_of_columns  || _form.ncols; 
			
			var male_nrows   = Math.ceil(_hall["male"].num_std / male_ncols); //Number of rows based on current number of students. Thus, (numStd <= nrows*ncols) will be true always
			var female_nrows = Math.ceil(_hall["female"].num_std / female_ncols); 


	this.hall          = _hall;
	this.idTable       = _idTable;
	this.entry_points  = _ep;
	this.url_course    = _url_course;
	this.gender        = _form.gender;  //Default "male" (until CALM is able to send the gender associated to an AT (which is not really clear when only one AT conducting both genders, so.. we will always need a default gender :( 
	//ncols and nrows depend on gender: For whatever reason an AT can click ncols radio-button for male and then go to female, work there with different ncol and come back to male
	this.male          = { 
							"ncols": male_ncols,
							"nrows": male_nrows
						  };
	
    this.female         = { 
							"ncols": female_ncols,
							"nrows": female_nrows
						  };

	this.drop_option   = "switch"; 
	this.pageSize      = getPageSize();
	
	//Populate male students
	//​The default sort order ignores the age of the new students. If you define ​​seniority  = 100*nCourses + Age    then ranking all students should give the correct default order. (nCourses could include 10day and sati courses, both sat and served, plus weighted long courses).
	this.populateStudents("male");
	this.populateStudents("female");
	
	_hall.updateMd5();

}

/**
* If all students have no 'generated_hall_position' this method will give them a 'generated_hall_position'. Otherwise, split them in two arrays, letting
* user d&d those ones that didnt have 'generated_hall_position' (probably living on a ARRIVALS table) inside the main table.
* If nobody has a seat assigned (all_no_seat(v) == true), students will be seated (given a 'generated_hall_position') one after the other,
* using the default order of 'v' (This ONLY should happen the 1st time SPG is run on a course, because all the 'generated_hall_position' are empty)
* Otherwise, only students with 'generated_hall_position' will be seated, using the default order of 'v' and the rest will be placed on 
* the 'no_seat' arrays (probaly rendered on the ARRIVALS table)

* @param v Array of students. Whatever order criteria we want for the students (number of courses, age, etc) has to be set before calling this method
*/
Layout.prototype.populateStudents = function(gender){ // v is array of Student objects ( @see students.json, student.js)
	
	//DEFAULT SORTING ALGORITHM is HERE
	var vOld = this.hall.json.sitting[gender].old.sort(function(a, b) { return b.courses_sat - a.courses_sat; });
	var vNew = this.hall.json.sitting[gender].new;
	var v = vOld.concat(vNew);
	
   	var hallLabels = this.getHallLabels(gender);
	if( this.hall.all_no_seat(v)){ //all need a position
		for(var i in v){ 
			var student = new Student(v[i], gender, this);
			student.generated_hall_position = hallLabels[gender][i]; //by definition hallLabels.length <= v.length
			this.hall[gender][student.old?"old":"new"].push(student);
		}
	}else{
		for(var i in v){ 
			var student = new Student(v[i], gender, this);
			if(student.generated_hall_position === ""){ 
				this.hall[gender]["no_seat"][student.old?"old":"new"].push(student);
			}else{
				this.hall[gender][student.old?"old":"new"].push(student);
			}
		}
	}
}


/** Generates all the different seat labels for both genders. Mind that different genders may have different layouts (due to phisical
* constrains of the Hall, different number of students, etc)
* Example: When ncols=4 and nrows=2 will return ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2"] 
* https://jsfiddle.net/ssc/j8njnth4/1/
*/
Layout.prototype.getHallLabels = function(){
	
	var male_labels = [];
	for(var r=65; r<(this.male.nrows+65); r++){
		for(var c=1; c <= this.male.ncols;c++){ 
			male_labels.push(String.fromCharCode(r) + c);
		}
	}

	var female_labels = [];
	for(var r=65; r<(this.female.nrows+65); r++){
		for(var c=1; c <= this.female.ncols;c++){ 
			female_labels.push(String.fromCharCode(r) + c);
		}
	}
	//Females need to be Mirror flip!
	female_labels = reverse_array_in_chunks(female_labels, this.female.ncols);
	
	return {"male": male_labels, "female": female_labels};
}

/**Given an array, it split it in chunks, reverse the chunks and put them back together
*/
function reverse_array_in_chunks(v, chunk_size){
	var i,j,temparray;
	var result = [];
	for (i=0,j=v.length; i<j; i+=chunk_size) {
		temparray = v.slice(i,i+chunk_size);
		temparray.reverse();
		result = result.concat(temparray);
	}
	return result;
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
	
	this[this.gender].ncols = _ncols;
	this[this.gender].nrows = Math.ceil(this.hall[this.gender].num_std / _ncols); 
	//RESET POSITIONS!!: Default behaviour whenever the number of columns is changed: RESET to "" all the generated_hall_position
	//Otherwise when going, for example, from 6 rows (A,B,C,D,E,F,G,H,I,J,K,L-solo 2-) to 8 rows (A,B,C,D,E,F,G,H,I)
	//REDIPS complains that people in J,K,L -that is 6+6+2 alert("complaiiin") !!- since those rows do not exist anymore. 
	//So its neccesary to reallocate all the students (no auto-save) 
	var v = this.hall.getStudents(this.gender);
	for(var i=0; i < v.length; i++){ 
		v[i].generated_hall_position = "";
	} 
	//And then reallocate them all to their new hall dimensions
	this.populateStudents(this.gender);
	this.render();
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
	var nc = this[this.gender].ncols; //For legibility porpouses
	var nr = this[this.gender].nrows;
	
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
	console.log("estudents table: " + table);
	return table;
}

/** TABLE OF LETTERS: Creates 1-column table with as many rows as the main students table, each one containing a letter [A..N] 
*/
Layout.prototype.getLettersTable = function(cellHeight){
	var nr = this[this.gender].nrows;  //For legibility porpouses

	var many_rows = "";
	for(var tmp = 64 + nr, i = 0; tmp>= 65; tmp--, i++){ //String.fromCharCode(65) --> 'A'
		many_rows += "<tr style=\"height:" + cellHeight + "px;\">\n" + "<td class=\"letters\">" + String.fromCharCode(tmp) + "</td></tr>\n";
	}
	//Generate as many rows (of type 'row_of_td') as indicated by 'rows', whith the help of Array class. Seen on stackoverflow
	many_rows = "<tbody>\n" + many_rows + "</tbody>\n";

	var table = "<table id=\"lettersTable\" border=\"0\">\n<colgroup>\n<col width=\"20\"/>\n</colgroup>\n" + many_rows  + "</table>\n";
	console.log("letras table: " + table);
	return table;
}

/** TABLE OF NUMBERS: Creates 2-row table: 1st row contains as many columns as the main students table, each one containing a number [1..N] 
* and 2nd row contains the Dhamma Seat (male: aligned to left, female:aligned to right)
*/
Layout.prototype.getNumbersTable = function(){
	var nc = this[this.gender].ncols; //For legibility porpouses
	var nr = this[this.gender].nrows;  //For legibility porpouses

	var colWidth = parseInt(this.pageSize.width * 0.94 / nc);	
	var colHeight = parseInt(this.pageSize.height / nr);	

	//---------------------Generate COLUMN NUMBERS table:------------------------------------
	//Generate "<col width="70"/>" 'cols' times and wrap it around "<colgroup>"
	var columns = Array.apply(null, Array(nc)).map(function(){return "<col width=\"" + colWidth +"\"/>\n"}).join(''); 
	columns = "<colgroup>\n" + columns + "</colgroup>\n";
	//Generate "<td></td>" 'cols' times  and wrap it around  "<tr>"
	var i = 1; //Start from A1 ... to AN
	var row_of_numbers = Array.apply(null, Array(nc)).map(function(){return "<td class=\"numbers\" >" + i++ + "</td>"}); //mind the Array(COLS)
	if(this.gender === "female") row_of_numbers.reverse();
	
    row_of_numbers = "<tr >\n" + row_of_numbers.join('') + "</tr>\n";
	
	var dhamma_seat_row = new Array(nc).join("<td></td>"); //mind! Originally (cols + 1), but one col is added manually
	if(this.gender === "male") 
		dhamma_seat_row = "<td class='dhamma_seat'>Dhamma Seat</td>" + dhamma_seat_row; //On the left
	else
		dhamma_seat_row += "<td class='dhamma_seat'>Dhamma Seat</td>"; //On the right
	dhamma_seat_row = "<tr>" + dhamma_seat_row + "</tr>\n";

	var dhamma_seat_table = row_of_numbers = "<table id=\"dhammaSeatTable\" border=\"0\" >\n" + columns + "<tbody>\n" + row_of_numbers + dhamma_seat_row + "</tbody>\n</table>\n";
	console.log("numeros table: " + dhamma_seat_table);
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
	var nc = this[this.gender].ncols; //For legibility porpouses
	var nr = this[this.gender].nrows; //For legibility porpouses

	var content = [];
	var vWithSeats = [];
	var vNoSeats = [];
	var logWS = "vWithSeats: "; //With Seat
	var logOB = "@@out of Bounds @@: "; //Out of Bounds
	var logNS = "vNoSeats: ";   //No seat
	
	
	var all_labels = this.getHallLabels(); // male and female
	var labels = all_labels[this.gender];
	var v = this.hall.getStudents(this.gender);

	//Split students in 2 groups: WITH and WITHOUT seats
	for(var i=0; i < v.length; i++){ 
		var label = v[i].generated_hall_position; //get students hall coordinate (if any)
		if (label === ""){ //if the student has NO previously asigned seat
			logNS += v[i].id + " " + v[i].applicant_given_name + " " + v[i].courses_sat + " --- "
			vNoSeats.push(v[i]); //move him to a side place
		}
		else{  //if the student already had a generated_hall_position..
			var pos = labels.indexOf(label); //lets check if that coordinate is within the rXc hallLabels set
			if (pos != -1) {//The student already has a label within the boundaries of the current Hall size..
				logWS += v[i].id + " " + v[i].applicant_given_name + " " + v[i].courses_sat + " --- ";
				labels.splice(pos, 1); //remove that coordinate from the hallLabels array
				var row = nr - 1 - (label.charCodeAt(0) - 65); // 'A' is 65, 'B' is 66, ..  Vertical offset -1
				var col = label[1] - 1;  //Horizontal offset -1
				content.push([v[i].id, row, col,  (v[i].old?"std old_":"std new_") + this.gender, this.cellContent(v[i])]); //and add student to the group of people with seats
			}
			else{ //this student has a previously assigned seat, but it seems to be out of current bounds rXc. So treat him as no-seat
				//and deal with him later
				logOB += v[i].id + "(" + v[i].generated_hall_position + ") 	" + v[i].applicant_given_name + " --- ";
				vNoSeats.push(v[i]);
			}
		}
	}
	
	console.log("sp_tab->assingSeats() " + logWS);
	console.log("sp_tab->assingSeats() " + logOB);
	console.log("sp_tab->assingSeats() " + logNS);
	console.log("sp_tab->assingSeats(): hallLabels (not used labels): " + labels);
	
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
Layout.prototype.cellContent = function(std){
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
	cc += "<div id=\"ft\"> <div id=\"footer\"><a target=\"_blank\" href=\"" + this.url_course + "/" + std.id +"/edit\">" +  std.display_id + "</a></div> </div> </div>";
	return cc;
}

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

