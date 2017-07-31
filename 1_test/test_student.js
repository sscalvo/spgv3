
var json_sp = {
	"course_id": 131,
	"venue_name": "Dhamma Bhumi",
	"start_date": "2017-03-22",
	"end_date": "2017-04-02",
	"sitting": {
		"male": {
			"old": [{
				"id": 2,
				"display_id": "OM0001",
				"applicant_given_name": "Jose",
				"applicant_family_name": "Sanz",
				"age": 50,
				"sitting": true,
				"old": true,
				"conversation_locale": "English",
				"language_native": "English",
				"ad_hoc": "",
				"pregnant": false,
				"courses_sat": 8,
				"courses_served": 1,
				"room": "12",
				"generated_hall_position": "A1",
				"hall_position": "near window"
			}],
			"new": [{
				"id": 9,
				"display_id": "NM0001",
				"applicant_given_name": "JNMse",
				"applicant_family_name": "SaXz",
				"age": 50,
				"sitting": true,
				"old": false,
				"conversation_locale": "English",
				"language_native": "Spanish",
				"ad_hoc": "",
				"pregnant": false,
				"courses_sat": 0,
				"courses_served": 0,
				"room": "3",
				"generated_hall_position": "B3",
				"hall_position": "near aisle"
			}]
		},
		"female": {
			"old": [{
				"id": 17,
				"display_id": "OF0001",
				"applicant_given_name": "Ana",
				"applicant_family_name": "Blanca",
				"age": 31,
				"sitting": true,
				"old": true,
				"conversation_locale": "English",
				"language_native": "Spanish",
				"ad_hoc": "",
				"pregnant": false,
				"courses_sat": 6,
				"courses_served": 2,
				"room": "7",
				"generated_hall_position": "A1",
				"hall_position": "back wall"
			}],
			"new": [{
				"id": 24,
				"display_id": "NF0001",
				"applicant_given_name": "ANFa",
				"applicant_family_name": "BlaNFnca",
				"age": 31,
				"sitting": true,
				"old": false,
				"conversation_locale": "English",
				"language_native": "Spanish",
				"ad_hoc": "",
				"pregnant": false,
				"courses_sat": 0,
				"courses_served": 0,
				"room": "8",
				"generated_hall_position": "B4",
				"hall_position": ""
			}]
		}
	},
	"serving": {
		"male": [{
			"id": 31,
			"display_id": "SV0003",
			"applicant_given_name": "Max",
			"applicant_family_name": "Min",
			"age": 44,
			"sitting": false,
			"old": true,
			"conversation_locale": "English",
			"language_native": "Spanish",
			"ad_hoc": "",
			"pregnant": false,
			"courses_sat": 4,
			"courses_served": 3,
			"room": "23",
			"generated_hall_position": "",
			"hall_position": ""
		}],
		"female": [{
			"id": 33,
			"display_id": "SV3001",
			"applicant_given_name": "Maria",
			"applicant_family_name": "Urruti",
			"age": 31,
			"sitting": false,
			"old": true,
			"conversation_locale": "English",
			"language_native": "Spanish",
			"ad_hoc": "",
			"pregnant": false,
			"courses_sat": 6,
			"courses_served": 2,
			"room": "7",
			"generated_hall_position": "",
			"hall_position": ""
		}]
	}
};
var form_data = {"gender": "male", "ncols": 6, "rows": 5};

var h =  new Hall(json_sp, form_data); 

