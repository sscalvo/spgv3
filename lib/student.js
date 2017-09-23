/**
CONSTRUCTOR Student Creates a student object from json parameter
* @param student JS object containing all the data for the new student. Not modified
* @param hall A reference to the Hall js-object where this student is confined
* @return Student object with all the properties included in json_std. This implemetation absorves future updates/changes in json_std structure
*/
function Student(student, gender, hall){
	for(var prop in student) {  //TODO: clone with Object.assign?
		this[prop] = student[prop];
    }
	this.gender = gender; //Gender is not property provided explicitily by students.json (students are packaged by gender, but they themselves dont hold this value, so we add it here) 
	this.hall = hall; //Keep a reference to his/her hall 
}

//toString
Student.prototype.to_string = function(){
    var begin = "@object Student: {";
	var end = "";
	
	for(var prop in this) {
		 if (this.hasOwnProperty(prop)) {
			end += "\"" + prop + "\": " + this[prop] + ",";
		}
    }
	
	if(end.length != 0)
		end = end.substring(0, end.length - 1);

    var result = begin + end + "}";
	return result;
}

/**
* toHTML
* @see sitPlan.css
*/
Student.prototype.to_HTML = function(){
    var html = "<span class=\"" + this.old?"old_std":"new_std" + ">";
	var html = "<span class='family_name'><span class='given_name'>" + this.applicant_given_name + " </span>";
		html += " " + this.applicant_family_name + "</span>";
		html += "<span class='age'>"+ this.age + "</span><br>";
		//html += std.display_id + "\n";
		//html += " id: " + std.id + "\n";
		if(this.old){
			html += "<span class='big_sitserved'><div class='sitserved'>" + this.courses_sat + "/" + this.courses_served + "</span></span>";
		}
	return html;
}


/**shallowMd5
* @return the md5 value of the current Student, without taking in account the "generated_hall_position" property, so when the 
* student changes his/her seat in the Hall, the md5(Hall) will remain the same (and thus, no need to inform users about changes in 
* the course (arrivals or lefts)
*  
*/
Student.prototype.shallowMd5 = function(){
	return md5(this.display_id); //basic implementation will serve the porpouse since display_id is unique: Will let us know if new students
	//arrived or left the Hall
}

/** deepMd5 - It is a not so deep implementation :-)
* @return 
*/ 
Student.prototype.deepMd5 = function(){
	var acu = "";
	for(var prop in this) {
		 if (this.hasOwnProperty(prop)) {
			acu += this[prop];
		}
    }
	return md5(acu); //Basic implemantation will serve the porpouse: Will let us know if the Hall layout changed
}
