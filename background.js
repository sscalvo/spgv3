//https://developer.chrome.com/extensions/event_pages  BEST PRACTICES FOR background.js
//GLOBAL
var url_CALM_course=""; //content.js will use it for ajax-quering calm server 

////////////////////////////////////Enable extension only on valid URL's (the CALM4 courses)
//chrome.browserAction.setIcon({path: {"19": "icons/enable_19.png", "38": "icons/enable_38.png"}});
/* function disableBrowserAction(){
    chrome.browserAction.setIcon({path:"disabled.png"});
    chrome.browserAction.setTitle({title:"Select a CALM4 webpage to ACTIVATE"});
	chrome.browserAction.setPopup({popup: "popup_disabled.html"});
    //chrome.tabs.executeScript(null, {file: "togglecontentscript.js"})
}

function enableBrowserAction(){
    chrome.browserAction.setIcon({path:"enabled.png"});
    chrome.browserAction.setTitle({title:"Seating Plan Generator"});
	chrome.browserAction.setPopup({popup: "popup_enabled.html"});
    //chrome.tabs.executeScript(null, {file: "contentscript.js"});
} */

function updateState(url){
	var regExCALM_produccion = /https:\/\/calm\.dhamma\.org\/(\w|-)+\/courses\/\d+\/course_applications*/; //All CALM4 languages
	var regExCALM_test = /https:\/\/test\.calm\.dhamma\.org\/(\w|-)+\/courses\/\d+\/course_applications*/; //SPGv2
	//var regExCALM_desarrollo = /http:\/\/localhost*/;
	var enabled =  regExCALM_test.test(url) || regExCALM_produccion.test(url); //regExCALM_desarrollo.test(url) ||
	if(enabled){ //URL of a CALM course!
		//Consider this *valid* url: https://test.calm.dhamma.org/en/courses/119/course_applications/8/edit#day-0 
		var app = "applications"; //lets trim the "/8/edit#day-0" (added by CAL when user navigates through CALM inner tabs) 
		url_CALM_course = url.substr(0,url.search(app) + app.length);;  //update the url
		console.log("background.js: VALID URL: " + url_CALM_course);
//		enableBrowserAction(); //Active icon
	}else{
//		disableBrowserAction();  //Disable icon
	}
}


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
	updateState(tab.url);
	console.log("BACKGROUND 1: " + tab.url);
});

chrome.tabs.onActivated.addListener(function(evt){ 
	chrome.tabs.get(evt.tabId, function(tab){ 
		console.log("BACKGROUND 2: " + tab.url);
		updateState(tab.url);
    });
});
////////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

/** Background listens for messages:
	a) content.js will request the creation of new tabs with message "newTab"
**/
  chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	  //console.log("Message received: " + request.command);
    if (request.command == "newTab"){  //mensage from content.js
		chrome.tabs.create({ url: request.url}, function(tab){
					//console.log("Created a tab");
					//sendResponse({farewell: "Created a tab"});

		});
	}
	return true;
  });

