//CONTENT.JS
//Here only the code to wire the original CALM webpage with our SPG-extension (adding the green button).
//No extension functionality here but in sp_tab.js
var inject_button_in = {"CALM":"course-applications-datatable_filter", "VRAY":"some_html_id"};


/**GLIPHICON BUTTON to OPEN NEW TAB
* Inject a button into the CALM webpages. Final html output should look like this:
    <div id="div_spg_button">
		<label for="mySubmit" class="btn" onclick="...."><i class="glyphicon glyphicon-equalizer" ></i> Hall </label>
		<input id="spg_button" type="button" value="Go" class="hidden" />
	</div>
	On the 'onclick' event of this button is where happens the begining of SPG
*/
	var span_button = document.createElement('span'); //<div ..>
	span_button.id = "div_spg_button";
	
	var label_btn = document.createElement('label');  //<label..>
	label_btn.setAttribute("for", "spg_button");
    label_btn.className ="btn";
	label_btn.innerHTML ="<span style='background-color: yellow;'>&nbsp;<i class='glyphicon glyphicon-equalizer'></i> Hall map&nbsp;</span>"; //No need for label.createElement("i")
	label_btn.onclick = function(){ //Here BEGINS the creation of the SPG tab
		try{
			var path = chrome.extension.getURL("css/sitPlan.css"); //When CALM session has expired, this line will throw an error
		}
		catch(err){
			console.log(err);
			window.location.reload();
		}

		//Ask background.js to open a new tab for us..
		chrome.runtime.sendMessage({url : chrome.extension.getURL("./html/sp_tab.html"), command: "newTab"}, function(response) {
			console.log("Content.js ");
		});
	}
	//var i_label = document.createElement("i");  //<i.. >
	//i_label.className = "glyphicon glyphicon-equalizer";
	
	var button_SPG = document.createElement('input'); //<input..>
	button_SPG.type  = 'button';
	button_SPG.value = "Generate Seating Plan";
	button_SPG.style = "background-color: LimeGreen";
	button_SPG.style.marginRight =  "15px";
	button_SPG.id = "spg_button";
	button_SPG.className += "hidden";

	span_button.appendChild(label_btn);
	span_button.appendChild(button_SPG);
//END    GLIPHICON BUTTON to OPEN NEW TAB

//Add button to CALM-course-page and wait for the user to click it!
document.getElementById(inject_button_in.CALM).appendChild(span_button);
//TODO: Confirm with Ryan about the existence of "course-applications-datatable_filter" -> Find a new place for the button?