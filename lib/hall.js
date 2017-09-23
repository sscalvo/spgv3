//TODO implement 'user_can_assign_hall_position'

/**
CONSTRUCTOR Hall Creates a hall object from json parameter
@param  course_json json object containing all the data for the new hall. Not modified
@return Student object with all the properties included in json_std. This implemetation absorves future updates/changes in json_std structure
*/
function Hall(course_json){
	this.json           = course_json;
	this.course_id      = course_json.course_id;
	this.venue_name     = course_json.venue_name;
	this.start_date     = course_json.start_date;
	this.end_date       = course_json.end_date;
	this.number_of_cols = course_json.number_of_columns; 
	this.number_of_rows = course_json.number_of_rows; 
    this.male           = { "old": [],
							"new": [],
							"no_seat": { "old": [],
											 "new": []
									   },
							"all_no_seats": true		 
						  };

    this.female         = { "old":[],
							"new":[],
							"no_seat": { "old": [],
										 "new": []
									   },
							"all_no_seats": true
						  };
						  
	this.md5            = { "male": {
					       		"shallow_md5": "",
					       		"deep_md5": ""
					       	},
					       	"female": {
					       		"shallow_md5": "",
					       		"deep_md5": ""
					       	}
					       };

	this.populateStudents(course_json.sitting.male.old, "male");
	this.populateStudents(course_json.sitting.male.new, "male");
	this.populateStudents(course_json.sitting.female.old, "female");
	this.populateStudents(course_json.sitting.female.new, "female");
	
	this.updateMd5();
	
}

/**
* Given a gender, populateStudents will separate students in "old", "new" and "no_seat" and store this on the global objects this.male and 
* this.female. Also will flag the attribute 'all_no_seats' to true if ALL of them have no assigned seat (from a previous session)
* @param v Array of students, as json information
*/
Hall.prototype.populateStudents = function(v, gender){ // v is array of Student objects ( @see students.json, student.js)
	for(var i in v){ 
		var student = new Student(v[i], gender, this);
		if(student.generated_hall_position === ""){
			this[gender]["no_seat"][student.old?"old":"new"].push(student);
		}else{
			this[gender][student.old?"old":"new"].push(student);
			this[gender].all_no_seats = false;
		}
	}
	
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
	
	var vm = [].concat.apply([], [this.male.old, this.male.new, this.male.no_seat.old, this.male.no_seat.new])
	for(var student in vm){
		male_shallow += student.shallowMd5();
		male_deep += student.deepMd5();
	}
	this.md5.male.shallow = md5(male_shallow); //Calculate md5 of individual concatenations of md5
	this.md5.male.deep = md5(male_deep);
	
	var vf = [].concat.apply([], [this.female.old, this.female.new, this.female.no_seat.old, this.female.no_seat.new])
	for(var student in vf){
		female_shallow += student.shallowMd5();
		female_deep += student.deepMd5();
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
Hall.prototype.compare(_hall){
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
