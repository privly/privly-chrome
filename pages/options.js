/**
 * Saves options to localStorage.
 */
function save_options() {
  
  var user_whitelist_input = document.getElementById("user_whitelist_csv");
  var whitelist_unformatted = user_whitelist_input.value;
  var whitelist_escaped = whitelist_unformatted.replace(".", "\\.");
  var domains = whitelist_escaped.split(",");
  var domain_regexp = "";
  for (var i = 0; i < domains.length; i++){
    domain_regexp += "|" + domains[i] + "\\/";
  }
  
  localStorage["user_whitelist_csv"] = whitelist_unformatted;
  localStorage["user_whitelist_regexp"] = domain_regexp;
  
  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}

/**
 * Restores select box state to saved value from localStorage.
 */
function restore_options() {
  var user_whitelist_csv = localStorage["user_whitelist_csv"];
  if (!user_whitelist_csv) {
    return;
  }
  var input = document.getElementById("user_whitelist_csv");
  input.value = user_whitelist_csv;
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);

/**
 * Restores the current content server setting
 */
function restore_server(){
	
	var content_server_csv = localStorage["content_server_csv"];

	//check for local storage content
	if (!content_server_csv) {
		return;
  
	} else {

		/*check conten type and restore*/
		switch(content_server_csv){

		case "https://privlyalpha.org":

			/*diplay the on menu*/
			var alpha_input = document.getElementById("server_form");
		  alpha_input.style.display = "block";
			var alpha = document.getElementById("alpha");
			alpha.checked = true;

			break;

		case "https://dev.privly.org":

			/*diplay the on menu*/
			var dev_input = document.getElementById("server_form");
		  dev_input.style.display = "block";
			var dev = document.getElementById("dev");
			dev.checked = true;

			break;

		case "http://localhost:3000":

			/*diplay the on menu*/
			var local_input = document.getElementById("server_form");
		  local_input.style.display = "block";
			var local = document.getElementById("local");
			local.checked = true;

			break;

		/*user defined data*/
		default:
			/*diplay the on menu*/
			var other_input = document.getElementById("server_form");
		  other_input.style.display = "block";
			
			/*diplay the other sub menu*/
			var user_input = document.getElementById("user");
		  user_input.style.display = "block";
			var other = document.getElementById("other");
			other.checked = true;

			/*populate the text box*/
			var other_content_server = document.getElementById("other_content_server");	
			other_content_server.value = 	content_server_csv;

			var button = document.getElementById("save_server"); 
			button.style.display = "block";

		}
	
	}
	
}

/**
 * save the current content server setting
 */
function save_server(event){
	
	//fired event object
	var target = event.target;

	//reset status
	var status = document.getElementById("server_status");
	status.innerHTML = "";

	/*hide sub menu text box if not selected*/
	if(target.id != "save_server"){
		var other = document.getElementById("user");
		other.style.display = "none";
		var button = document.getElementById("save_server"); 
		button.style.display = "none";		
	}

	/*determin event*/	
	switch(target.id){

	case "on":
		/*diplay the on menu*/
		var on_input = document.getElementById("server_form");
		on_input.style.display = "block";
		break;

	case "alpha":
		localStorage["content_server_csv"] = "https://privlyalpha.org";
		break;

	case "dev":
		localStorage["content_server_csv"] = "https://dev.privly.org";
		break;

	case "local":
		localStorage["content_server_csv"] = "http://localhost:3000";
		break;

	//open sub menu
	case "other":
		var button = document.getElementById("save_server"); 
		button.style.display = "block";		
		var other = document.getElementById("user");
		other.style.display = "block";
		break;

	//save user entered content server
	case "save_server":
		var other_content_server = document.getElementById("other_content_server");
		var input = other_content_server.value;
			
		//validate user entered content server and 
		if(validate_content_server(input)){
			localStorage["content_server_csv"] = input;
				
			// Update server status to let user know options were saved.
			status.innerHTML = "Content Server Saved.";
			setTimeout(function() {
				status.innerHTML = "";
			}, 750);

			} else {
				alert("Content Server not saved. please check input format.");

			}

		break;

	//default case is that the content server is set to the off position
	default:
		/*hide menus*/
		var menu = document.getElementById("server_form");
		menu.style.display = "none";
		var sub_menu = document.getElementById("user");
		sub_menu.style.display = "none";
		var button = document.getElementById("save_server"); 
		button.style.display = "none";
		/*remove the local storage*/
		localStorage.removeItem("content_server_csv");

	}

}

/**
 * validation of user defined input for content server
 */
function validate_content_server(url){

	//default http success value
	var request_success = 200;

	//update status of content server
	var status = document.getElementById("server_status");

	//check for internet connection
	var connection_check = navigator.onLine;
	if(connection_check){
		try{
			//create http object and request server
			var request = new XMLHttpRequest();
			request.open("GET", url, false);
			request.send(null);
	
			if(request.status === request_success){
				return true;

			}	else {
				status.innerHTML = "Verification Failed.";
				return false;
			}

		//catch http request exception 101 for network error
		} catch(e){
			status.innerHTML = "Verification Failed.";
			return false;
		
		}

	//if no connection is present then verification can not be made 
	}else{
		alert("No Connection: Please connect to the internet if you wish to enable"
						+ " user entered content server");
	}

}

/*restore saved settings on page load*/
document.addEventListener('DOMContentLoaded', restore_server);

/*content server listeners*/
document.querySelector('#on').addEventListener('click', save_server);
document.querySelector('#off').addEventListener('click', save_server);

/*content server sub menu listerners*/
document.querySelector('#alpha').addEventListener('click', save_server);
document.querySelector('#dev').addEventListener('click', save_server);
document.querySelector('#local').addEventListener('click', save_server);
document.querySelector('#other').addEventListener('click', save_server);
document.querySelector('#save_server').addEventListener('click', save_server);

