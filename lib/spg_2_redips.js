//spg_2_redips
/**
* Wraps and hides REDIPS, providing high level funcionality for SPG
* Consider this 6 cols X 5 rows Hall

   6 * * * * * *
   5 * * * * * *
   4 * * * * * *
   3 * * * * * *
   2 * * * * * *
   1 * * * * * *
     A B C D E F    
	 
where A, B, C, D, E are columns and 1, 2, 3, 4 are rows


*/

/** Returns the column number (starting from 0) of a given student, based on his/her 'generated_hall_position' property
* ie:  "D1", "B6", "C13", "A1", etc   ---would return--->    3, 1, 2, 0, etc
* @param std The student 
* @return The numeric corresponding column value from his/her 'generated_hall_position' property 
*/
function redips_column(std){
	var nrows = std.hall.nrows;
	return nrows - 1 - (std.generated_hall_position.charCodeAt(0) - 65); // 'A' is 65, 'B' is 66, ..  Vertical offset -1
}


/** Returns the row number (starting from 0) of a given 'generated_hall_position' (ghp)
* @param ghp The value of the generated_hall_position property of an students (i.e: "D1", "B6", "C13", "A1", etc)
* @return The numeric corresponding value (ie: 0, 5, 12, 0, etc) 
*/
function redips_row(std){
	return std.generated_hall_position.substring(1) - 1;//Horizontal offset -1
}