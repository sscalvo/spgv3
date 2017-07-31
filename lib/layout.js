//TODO implement 'user_can_assign_hall_position'


// create redips container
var redips = {};

/**
* CONSTRUCTOR Hall Creates a hall object from json parameter
* @param  json_sp json object containing all the data for the new hall. Not modified
* @return Student object with all the properties included in json_std. This implemetation absorves future updates/changes in json_std structure
*/
function Layout(_hall, _form){
	this.hall        = _hall;
	this.ncols       = _hall.number_of_cols; //CONSTRUCTOR: Dont use '_form.ncols'. Use _hall.number_of_cols instead (since comes from previously persisted CALM values)
	this.nrows       = _hall.number_of_rows;
	this.gender      = _form.gender; 
	this.drop_option = _form.drop_option;
	this.pageSize    = updatePageSize();
	
	if (this.gender == "male"){
		this.os = this.hall.mos;
		this.ns = this.hall.mns;
	}else{
		this.os = this.hall.fos;
		this.ns = this.hall.fns;
	}

}

Layout.prototype.setFormData = function(_form){
	this.gender      = _form.gender;
	this.ncols       = _form.ncols;  //SETTER: Use '_form.ncols' (since comes from user input)
	this.drop_option = _form.drop_option;

	if (_gender == "male"){
		this.os = this.hall.mos;
		this.ns = this.hall.mns;
	}else{
		this.os = this.hall.fos;
		this.ns = this.hall.fns;
	}
}

//Returns the biggest possible dimension (width, height) <!-- that matches A4 proportions -->
//http://stackoverflow.com/questions/3437786/get-the-size-of-the-screen-current-web-page-and-browser-window
function updatePageSize(){
	var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	w = w - 20; //style.css --> div#redips-drag table { ... 	margin: 10px;
	var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	//landscape A4 = 297 × 210 mm -> 1024 x 724  RATIO: 1.4143
/* 	var ratioA4 = 1.4143;
	var msg = "";
	var r2 = w / h;
	if (r2 <=  1.414) { h = parseInt(w / ratioA4); msg = " A4: width: " + w + " height chopped " + h;} //h is way too high to match A4 proportions. Lets chop it
	else { w = parseInt(h * ratioA4); msg = " A4: width chopped " + w + " height: " + h;} //w is too long to match A4 (h is ok). Lets assign the maximun value to w. 
	if(print_debug)  $("#debug").text( msg + " ");   */
	return { "width": w, "heigth": h};
	}

/** 
*/
Layout.prototype.getEmptyTable = function(idTable){ 
	var colWidth = parseInt(this.pageSize.width / this.ncols);	
	//var colHeight = parseInt(pageSize.height / rows);

	//Generate "<col width="70"/>" 'cols' times and wrap it around "<colgroup>"
	var columns = Array.apply(null, Array(this.ncols)).map(function(){return "<col width=\"" + colWidth +"\"/>\n"}).join(''); 
	columns = "<colgroup>\n" + columns + "</colgroup>\n";
	
	//Generate "<td></td>" 'cols' times  and wrap it around  "<tr>"
	var row_of_td = Array.apply(null, Array(this.ncols)).map(function(){return "<td ></td>"}).join(''); //mind the Array(COLS)
	row_of_td = "<tr>\n" + row_of_td + "</tr>\n";
	
 	
	
	//Generate as many rows (of type 'row_of_td') as indicated by 'rows', whith the help of Array class. Seen on stackoverflow
	var many_rows = Array.apply(null, Array(this.nrows)).map(function(){return row_of_td }).join(''); //mind the Array(ROWS)
	many_rows = "<tbody>\n" + many_rows + "</tbody>\n";

	var table = "<table border=\"1\" id=\"" + idTable + "\" width=\"" + this.pageSize.width + "\">\n" + columns + many_rows  + "</table>\n";
	return table;


}

/** Injects new empty table into <span> with id 'idDestination'
* @param cols Number of rows for the new table
* @param rows Number of cols for the new table
* @param idTable html-id for the new table
* @param idDestination id of the <span> tag where to inject the table
* @param gender
*/
Layout.prototype.injectEmptyTable = function(html_table, id_destination){
	
	var colWidth = parseInt(this.pageSize.width / this.ncols);	

	//Generate "<col width="70"/>" 'cols' times and wrap it around "<colgroup>"
	var columns = Array.apply(null, Array(this.cols)).map(function(){return "<col width=\"" + colWidth +"\"/>\n"}).join(''); 
	columns = "<colgroup>\n" + columns + "</colgroup>\n";
	//Generate "<td></td>" 'cols' times  and wrap it around  "<tr>"
	var i = 1; //Start from A1 ... to AN
	var row_of_numbers = Array.apply(null, Array(this.cols)).map(function(){return "<td class=\"\" >" + i++ + "</td>"}).join(''); //mind the Array(COLS)

	
	var dhamma_seat_row = new Array(this.cols).join("<td></td>"); //mind! Originally (cols + 1), but one col is added manually
	if(this.gender === "male") 
		dhamma_seat_row = "<td class='dhamma_seat'>Dhamma Seat</td>" + dhamma_seat_row; //On the left
	else
		dhamma_seat_row += "<td class='dhamma_seat'>Dhamma Seat</td>"; //On the right

	var dhamma_seat_table = row_of_numbers = "<table>" + columns + "<tr>\n" + row_of_numbers + "</tr><tr>" + dhamma_seat_row + "</tr></table>\n";


	$('#' + id_destination ).text(''); //Clean previous table
	$('#' + id_destination ).html(html_table + dhamma_seat_table ); //Inject table into html label: <span id="entry_point"/> 
	
	/*  	$('#redips-drag').width(pageSize.width); //http://www.redips.net/javascript/redips-drag-documentation-appendix-a/#redips_drag
		$('#redips-drag').height(pageSize.height); 
		$('#' + idTable).width(pageSize.width); //Resize also the table
		$('#' + idTable).height(pageSize.height);  */
	//$('#redips-drag').height($('#' + idTable ).height()); //http://www.redips.net/javascript/redips-drag-documentation-appendix-a/#redips_drag
	//console.log(document.getElementsByTagName('body')[0].innerHTML) ;
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

