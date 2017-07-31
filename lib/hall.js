//TODO implement 'user_can_assign_hall_position'
/**
CONSTRUCTOR Hall Creates a hall object from json parameter
@param  course_json json object containing all the data for the new hall. Not modified
@return Student object with all the properties included in json_std. This implemetation absorves future updates/changes in json_std structure
*/
function Hall(course_json){
	this.course_id      = course_json.course_id;
	this.venue_name     = course_json.venue_name;
	this.start_date     = course_json.start_date;
	this.end_date       = course_json.end_date;
	this.number_of_cols = course_json.number_of_columns; 
	this.number_of_rows = course_json.number_of_rows; 
	this.mos            = this.populateStudents(course_json.sitting.male.old);
	this.mns            = this.populateStudents(course_json.sitting.male.new);
	this.fos            = this.populateStudents(course_json.sitting.female.old);
	this.fns            = this.populateStudents(course_json.sitting.female.new);
	this.num_male       = this.mos.length + this.mns.length;
	this.num_female     = this.fos.length + this.fns.length;
	this.md5            = { "male": {
					       		"shallow_md5": "",
					       		"deep_md5": ""
					       	},
					       	"female": {
					       		"shallow_md5": "",
					       		"deep_md5": ""
					       	}
					       };
	
}

/**
* @param v Array of students, as json information
* @return array of Student objects
*/
Hall.prototype.populateStudents = function(v){ // v is array of Student objects ( @see students.json, student.js)
	var arr_students = [];
	
	for(var i in v){ 
		var student = new Student(v[i], this);
		arr_students.push(student);
	}
	return arr_students;
}

//toString
Hall.prototype.to_string = function(){
    var begin = "@object Hall: {";
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

/**shallow_md5
* @return md5 value of the Hall only using the 'md5' and 'shallow_md5' of all the students, by gender 
*/
Hall.prototype.updateMd5 = function(_gender){
	var male_shallow = "";
	var male_deep    = "";
	var female_shallow = "";
	var female_deep    = "";
	
	var vm = this.mos.concat(this.mns);
	for(var student in vm){
		male_shallow += student.shallowMd5();
		male_deep += student.deepMd5();
	}
	this.md5.male.shallow_md5 = md5(male_shallow); //Calculate md5 of individual concatenations of md5
	this.md5.male.md5 = md5(male_deep);
	
	var vf = this.fos.concat(this.fns);
	for(var student in vf){
		female_shallow += student.shallowMd5();
		female_deep += student.deepMd5();
	}
	this.female_shallow_md5 = md5(female_shallow); 
	this.female_md5 = md5(female_deep);
}

	
//md5 (@see student) 
Hall.prototype.getMd5 = function(_gender){
	return this.md5;
}
