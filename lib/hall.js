//TODO implement 'user_can_assign_hall_position'

"use strict";
/**
* CONSTRUCTOR Hall Creates a hall object from json parameter
* @param  course_json json object containing all the data for the new hall. Not modified
* @return Student object with all the properties included in json_std. This implemetation absorves future updates/changes in json_std structure
*/
function Hall(course_json){
	
			//TEMP calculations
			var male_num_std      = course_json.sitting.male.old.length + course_json.sitting.male.new.length; //TODO: Si mueves este codigo fuera del constructor, entonces agrega los no_seat a la suma
			var female_num_std    = course_json.sitting.female.old.length + course_json.sitting.female.new.length; 
	
	this.json           = course_json;
	this.course_id      = course_json.course_id;
	this.venue_name     = course_json.venue_name;
	this.start_date     = course_json.start_date;
	this.end_date       = course_json.end_date;
	
    this.male           = { "num_std": male_num_std, //TODO: Si mueves este codigo fuera del constructor, entonces agrega los no_seat a la suma
							"ncols": course_json.sitting.male.number_of_columns, 
							"nrows": Math.ceil(male_num_std / course_json.sitting.male.number_of_columns)
						  };
	var std = this.createStudents("male");
	this.male.old = std.old;
	this.male.new = std.new;
	this.male.no_seat = std.no_seat;
	
    this.female         = { "num_std": female_num_std, //TODO: Si mueves este codigo fuera del constructor, entonces agrega los no_seat a la suma
							"ncols": course_json.sitting.female.number_of_columns, 
							"nrows": Math.ceil(female_num_std / course_json.sitting.female.number_of_columns)
						  };
	std = this.createStudents("female");
	this.female.old = std.old;
	this.female.new = std.new;
	this.female.no_seat = std.no_seat;
						  
	this.md5            = { "male": {
					       		"shallow": "",
					       		"deep": ""
					       	},
					       	"female": {
					       		"shallow": "",
					       		"deep": ""
					       	}
					       };
	
	this.updateMd5();
	
}

/**
*@returns a copy of the union of 'old' and 'new' without modifying them

Hall.prototype.getStudents = function(gender){
	var vo = [];
	vo.push.apply(vo, this.json.sitting.male.old);
	vo.push.apply(vo, this.json.sitting.male.new);
	return vo;
}
*/

/**
* Reads the json and creates Student objects, separating them into 3 arrays (old, new, no_seats).
* Only ff ALL students have no 'generated_hall_position' this method will assign them all a 'generated_hall_position'. (This ONLY should happen 
* the 1st time SPG is run on a course, because all the 'generated_hall_position' are empty)
* At the end of this classification, the method will sort the students according to the method 'sortBy_Sit_Serve'
*
* @param gender The gender we are dealing with
* @return Object containing 3 arrays. */

/**
*/
Hall.prototype.createStudents = function(gender){ // v is array of Student objects ( @see students.json, student.js)
	var vNoSeat = [];
	var vold = [];
	var vnew = [];

	var v = []; //Work with a temp array pointing to real students
	v.push.apply(v, this.json.sitting[gender].new);
	v.push.apply(v, this.json.sitting[gender].old);
	
	//DEFAULT SORTING ALGORITHM is HERE. Lets order them before assigning seat labels
	v.sort(sortBy_Sit_Serve);
	
   	var hallLabels = this.getHallLabels(gender);
		//Females need to be Mirror flip!
	if(gender === "female")
		hallLabels = reverse_array_in_chunks(hallLabels, this.female.ncols);

	if( this.all_no_seat(v)){ //all the students of this gender need a position
		for(var i in v){ 
			var student = new Student(v[i], gender, this);
			student.generated_hall_position = hallLabels[i]; //by definition hallLabels.length <= v.length
			if(student.old){
				vold.push(student);
			}
			else{
				vnew.push(student);
		}		
	}
	}else{ //For unkown reasons, only part of the students have an empty 'generated_hall_position'. DO NOT give seat labels to ANPY student, and let the AT do it
		for(var i in v){ 
			var student = new Student(v[i], gender, this);
			if(student.generated_hall_position === ""){ 
				vNoSeat.push(student);
			}else{
				if(v[i].old){
					vold.push(student);
				}
				else{
					vnew.push(student);
				}
			}
		}
	}
	

	return { "old": vold, "new": vnew, "no_seat": vNoSeat};
}

/**Order by first courses_sat then by courses_served */
function sortBy_Sit_Serve(a, b){
	// || 0 because new students
	var asat = parseInt(a.courses_sat) || 0;
	var aser = parseInt(a.courses_served) || 0;
	var bsat = parseInt(b.courses_sat) || 0;
	var bser = parseInt(b.courses_served) || 0;
	
    if (asat === bsat){
        return (bser - aser);
    } else if(asat < bsat){
        return 1;
    } else if(asat > bsat){
        return -1;
    }
}


/** Generates all the different seat labels for both genders. Mind that different genders may have different layouts (due to phisical
* constrains of the Hall, different number of students, etc)
* Example: When ncols=4 and nrows=2 will return ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2"] 
* https://jsfiddle.net/ssc/j8njnth4/1/
*/
Hall.prototype.getHallLabels = function(gender){
	
	var labels = [];
	for(var r=65; r<(this[gender].nrows+65); r++){
		for(var c=1; c <= this[gender].ncols;c++){ 
			labels.push(String.fromCharCode(r) + c);
		}
	}

	return labels;
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


/**
*@returns a copy of the union of 'old' and 'new' without modifying them
*/
Hall.prototype.getStudents = function(gender){
	var vo = [];
	vo.push.apply(vo, this[gender].old);
	vo.push.apply(vo, this[gender].new);
	return vo;
}



/**
*/
Hall.prototype.setNumberOfColumns = function(_ncols, _gender){
	this[_gender].ncols = _ncols;
	this[_gender].nrows = Math.ceil(this[_gender].num_std / _ncols);
	//RESET POSITIONS!!: Default behaviour whenever the number of columns is changed: RESET to "" all the generated_hall_position
	//Otherwise when going, for example, from 6 rows (A,B,C,D,E,F,G,H,I,J,K,L-solo 2-) to 8 rows (A,B,C,D,E,F,G,H,I)
	//REDIPS complains (via alert()) that people in J,K,L -that is 6+6+2- since those rows do not exist anymore. 
	//So its neccesary to reallocate all the students (no auto-save) 

	var vold = this[_gender].old;
	var vnew = this[_gender].new;
	//We need to sort, because females have previously been  arranged according to 'reverse_array_in_chunks'
	vold.sort(sortBy_Sit_Serve);
	
	var v = []; //concat old and new 
	v.push.apply(v, vold);
	v.push.apply(v, vnew);
	
	var hallLabels = this.getHallLabels(_gender); //Calculate the new positions (based on NEW hall dimensions (ncols X nrows). Temember that we are on 'setNumberOfColumns' method
	
	if(_gender === "female"){ // mirror-flip ladies
		//var vold = this["male"].old;
		hallLabels = reverse_array_in_chunks(hallLabels, this.female.ncols);
	}
	
	for(var i in v){ //and re-assign positions
			v[i].generated_hall_position = hallLabels[i]; //by definition hallLabels.length <= v.length
	}
	
	//Sepparate new from old to properly populate 'this' properties
	this.updateMd5();
}

/**
*@returns the number of columns for the given gender
*/
Hall.prototype.getNumberOfColumns = function(gender){
	return this[gender].ncols;
}


/** Finds if ALL the students in the array have generated_hall_position=="" 
* @param array of students to evaluate
* @return 'true' if all the students have no assigned seat (generated_hall_position==""), otherwise returns 'false'.
*/
Hall.prototype.all_no_seat = function(v){
	var ans = true;
	for(var i in v){
		ans = ans && (v[i].generated_hall_position === "");
	}
	return ans;
}

//toString
Hall.prototype.to_string = function(){
    var result = "@object Hall: {\n";
	result += "\t\"male\": {" ;
	result += "\t\t\"old:\": " + this.male.old.length ;
	result += "\t\t\"new:\": " + this.male.new.length ;
	result += "\t\t\"no_seat.old:\": " + this.male.no_seat.old.length ;
	result += "\t\t\"no_seat.old:\": " + this.male.no_seat.new.length ;
	result += "\t}" ;

	result += "\t\"female\": {" ;
	result += "\t\t\"old:\": " + this.female.old.length ;
	result += "\t\t\"new:\": " + this.female.new.length ;
	result += "\t\t\"no_seat.old:\": " + this.female.no_seat.old.length ;
	result += "\t\t\"no_seat.old:\": " + this.female.no_seat.new.length ;
	result += "\t}" ;
	result += "}" ;
	return result;
}

/** Calculates both the shallow and deep MD5 of all the males and all the females
* storing the result on the respective properties
*/
Hall.prototype.updateMd5 = function(){
	var male_shallow = "";
	var male_deep    = "";
	var female_shallow = "";
	var female_deep    = "";
	
	var vm = [].concat.apply([], [this.male.old, this.male.new, this.male.no_seat])
	for(var i in vm){
		male_shallow += vm[i].shallowMd5();
		male_deep += vm[i].deepMd5();
	}
	this.md5.male.shallow = md5(male_shallow); //Calculate md5 of individual concatenations of md5
	this.md5.male.deep = md5(male_deep);
	
	var vf = [].concat.apply([], [this.female.old, this.female.new, this.female.no_seat])
	for(var i in vf){
		female_shallow += vf[i].shallowMd5();
		female_deep += vf[i].deepMd5();
	}
	this.md5.female.shallow = md5(female_shallow); 
	this.md5.female.deep = md5(female_deep);
}
	
//md5 (@see student) 
Hall.prototype.getMd5 = function(_gender){
	return this.md5;
}

/** Compares two instances of Hall objects
* @param the Hall object to compare with this
* @return An oobject containing 3 arrays of Student: Arrivals, Remains, Departures
*/
Hall.prototype.compare =  function(_hall){
	var _md5 = _hall.getMd5();
	
}


/**
* This function is ment to be periodically called (setTimer) in order to detect changes on the database.
* It compares two arrays of students ("before" -aka current- and "after" -aka new-) comming from the same CALM course 
* (at different moments in time) in order to find differences. This differences will be the returned value
* @param before Array of students (as defined by course_applications.json) from a previous query
* @param after Array of students from a new query. THIS PARAM WONT BE MODIFIED!!
* @return js object with properties:
*    "left":  Students that for whatever reason are not there anymore
*    "remained": Students that are still there -no changes-
*    "arrived": Students that joined the course 
*	 "debug": Debug info
* Note that "before" and "after" will be modified (and will be part of the returned value)
* Complexity varies from best case (no differences: O(n)) to worst case (all students changed: O(n^2))
* USE: 
	var bN = [
			{"id":602,"display_id":"a83f16","applicant_given_name":"Ryan","applicant_family_name":"Applicationreferencecode","age":33,"sitting":true,"old":false,"conversation_locale":"English","language_native":"English","ad_hoc":"","pregnant":false,"courses_sat":null,"courses_served":null,"room":"","generated_hall_position":"A5","hall_position":"A5","confirmation_state_name":"RequestedReconfirm"},
			{"id":601,"display_id":"a6e50c","applicant_given_name":"Jose","applicant_family_name":"Ryan","age":12,"sitting":true,"old":false,"conversation_locale":"English","language_native":"English","ad_hoc":"","pregnant":false,"courses_sat":null,"courses_served":null,"room":"","generated_hall_position":"A4","hall_position":"A4","confirmation_state_name":"NewPendingForConfirmation"}
			];
	var aN = [
			{"id":601,"display_id":"a6e50c","applicant_given_name":"Jose","applicant_family_name":"Ryan","age":12,"sitting":true,"old":false,"conversation_locale":"English","language_native":"English","ad_hoc":"","pregnant":false,"courses_sat":null,"courses_served":null,"room":"","generated_hall_position":"A4","hall_position":"A4","confirmation_state_name":"NewPendingForConfirmation"},
			{"id":603,"display_id":"386130","applicant_given_name":"Luis","applicant_family_name":"Applicationreferencecode","age":33,"sitting":true,"old":false,"conversation_locale":"Italian","language_native":"English","ad_hoc":"","pregnant":false,"courses_sat":null,"courses_served":null,"room":"","generated_hall_position":"A2","hall_position":"A3","confirmation_state_name":"Confirmed"}
			];

	var triad = find_course_changes(bN, aN); //where bN, aN are student arrays (old and new together)
	triad.left.printStd("LEFT");
	triad.remain.printStd("REMAINED");
	triad.arrived.printStd("ARRIVED");
	console.log(triad.debug);
*
*/
Hall.prototype.find_course_changes = function(_json_now, _gender){
	
	var before = this.course_json.sitting[_gender]; //see students.json structure
	var after  = _json_now.splice(); //This method guaranties to not to modify the "_json_now" @param, so lets make a copy   
	var cp_after = after.sitting[_gender]; //This method guaranties to not to modify the "after" @param, so lets make a copy   
	
	var found = false,
		remain = [],
		debug = "",
		i = 0,
		j = 0,
		consol = "",
		any_left = false,
		any_arrived = false;

	//"before" will end up containing the students that LEFT
	//"remain" will end up containing the students that REIMAINED
	//"cp_after"	will end up containing the students that ARRIVED
	for(i = 0; i < before.length; i++){
		debug += "i:" + i + " (" + before[i].id + ")\n";
		for(j = 0; j < cp_after.length && !found; j++){ 
			debug += "\t j:" + j + " (" + cp_after[j].id + ") ";
			if(before[i].id == cp_after[j].id){ //found: No-add, no-remove
				debug += "<-- found\n";
				found = true;
				var aux = before.splice(i,1); //splice removes and left-shifts everything else 1 postion
				i--; //fix splice shifting
				aux = cp_after.splice(j,1); //no need to fix splice shifting here because of "found=true"
				remain.push(aux[0]); // [0]: splice returns an array
			}else{
				debug += "\n";
			}
		}
		found = false;
	}
	any_left = before.length != 0;
	any_arrived = cp_after.length != 0;
	return {"left": before, "remain": remain, "arrived": cp_after, "any_left": any_left, "any_arrived": any_arrived, "debug": debug};
}
