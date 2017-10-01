//BACKGROUND.JS - SPG v3
//Basic stuff related with tabs events, actionButton events and Chrome omnibox URLS
//content.js will read the GLOBAL vars
//https://developer.chrome.com/extensions/event_pages  BEST PRACTICES FOR background.js
//TODO Parametrization for support any DDBS is not finished!!

//GLOBAL
var url_DDBS_course=""; //content.js will use it for ajax-quering the Dhammic DataBase Server (normally CALM - 06/2017) 
var regex_CALM_production = /https:\/\/calm\.dhamma\.org\/(\w|-)+\/courses\/\d+\/course_applications*/; //All CALM4 languages
var regex_CALM_test = /https:\/\/test\.calm\.dhamma\.org\/(\w|-)+\/courses\/\d+\/course_applications*/; //SPGv2
//add other DDBS
//var regex_VRAY_production = "........."; 
//var regex_VRAY_test = ".........."; 

//Common for any DDBS (CALM, VRAY, DHAMMAREG, ..)
var url_download_json = "";
var url_POST_seat_map = "";
var url_course    = ""; 
var calm_tabId = 0;

////////////////////////////////////Enable extension only on valid URL's (the CALM4 courses)
//chrome.browserAction.setIcon({path: {"19": "icons/enable_19.png", "38": "icons/enable_38.png"}});
function disableBrowserAction(){
    chrome.browserAction.setIcon({path:"./icons/disabled.png"});
    chrome.browserAction.setTitle({title:"Select a CALM4 webpage to ACTIVATE"});
	chrome.browserAction.setPopup({popup: "popup_disabled.html"});
    //chrome.tabs.executeScript(null, {file: "togglecontentscript.js"})
}

function enableBrowserAction(){
    chrome.browserAction.setIcon({path:"./icons/enabled.png"});
    chrome.browserAction.setTitle({title:"Seating Plan Generator"});
	chrome.browserAction.setPopup({popup: "popup_enabled.html"});
    //chrome.tabs.executeScript(null, {file: "contentscript.js"});
}

function updateState(tab){
	var url = tab.url;
	var enabled =  regex_CALM_test.test(url) || regex_CALM_production.test(url); //regExCALM_desarrollo.test(url) ||
	if(enabled){ //URL of a CALM course!
		//Consider this *valid* url: https://test.calm.dhamma.org/en/courses/119/course_applications/8/edit#day-0 
		var app = "applications"; //lets trim the "/8/edit#day-0" (added by CAL when user navigates through CALM inner tabs) 
		url_DDBS_course = url.substr(0,url.search(app) + app.length);;  //update the url
		url_download_json = url_DDBS_course + ".json?place_reserved=true"; //Download students JSON from CALM
		url_POST_seat_map = url_DDBS_course + "/assign_generated_hall_positions"; //Upload seating map to CALM
		url_course        = url_DDBS_course + "/"; //sp_tab will have to add "147518/edit" where 147518 is std.id 
		console.log("background.js: %cVALID URL:  " + url_DDBS_course, "color: green; ");
		calm_tabId = tab.id;
		enableBrowserAction(); //Active icon
	}else{
		console.log("background.js: %cINVALID URL: " + url,"color: red; ");
		disableBrowserAction();  //Disable icon
	}
}


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
	if(changeInfo.status === "complete"){  //not 'loading', nor 'undefined'
		//console.log("BG tabs.onUpdated: " + tabId + " " + changeInfo.status);
		updateState(tab);
	}
});

chrome.tabs.onActivated.addListener(function(evt){ 
	chrome.tabs.get(evt.tabId, function(tab){
		//console.log("BG tabs.get: " + " tabId: " +  tab.id + " " + tab.url );	
		updateState(tab);
    });
});
////////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

/** Background listens for messages:
	a) content.js will request the creation of new tabs with message "newTab"
**/
  chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	  console.log("BG: Messaje received:");
    if (request.command == "newTab"){  //mensage from content.js
		chrome.tabs.create({ url: request.url}, function(tab){
					//sendResponse({farewell: "Created a tab"});

		});
	}
	return true;
  });

