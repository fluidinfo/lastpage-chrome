// creating the listener for fluidinfo calls.
// this is the only file that can do cross-domain requests.
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    var username = localStorage.username;
    var password = localStorage.password;

    if (username && password) {
      fi = fluidinfo({ username: username,
                       password: password,
                       instance: "main"
                     });
    } else {
      sendResponse({message: "Error, password not found"});
      return;
    }

    if (request.suffix) {
      var suffix = request.suffix;
      if (suffix.match(/^[\w\d\.\-\:\/]+$/))
        var tag_name = username + "/lastpage-" + suffix.replace(/\//g, "-");
      else
        alert(suffix + " is an invalid tag. Please only use letters, digits, " +
              "periods, hyphens, and slashes.");
    } else {
      var tag_name = username + "/lastpage";
    }

    var clear = function() {
      var params = $.param({query: "has " + tag_name,
                            tag: tag_name})
      fi.api.delete({url: "values?" + params,
                     success: function(json) {
                       console.log(json);
                     },
                     async: false
                    });
    };

    var save = function(url) {
      var time = new Date();
      fi.api.put({url: ["about", url, tag_name],
                  data: '"' + time.toISOString() + '"',
                  success: function(json) {
                    console.log(json);
                  },
                  async: false
                 });
    };

    if (request.action == "saveLocation") {
      chrome.browserAction.setBadgeText({text: "busy"});
      // delete the old location
      clear(fi);
      // save the new location
      chrome.tabs.getSelected(null, function(tab) {
        save(tab.url);
      });
      var url = "http://lastpage.me/" + username;
      if (request.suffix)
        url += "/" + suffix;
      copy(url);
      setTimeout(function() {
        chrome.browserAction.setBadgeText({text: ""});
      }, 2000);
      sendResponse({message: "Saved new url"});
    } else if (request.action == "clearLocation") {
      chrome.browserAction.setBadgeText({text: "busy"});
      clear(fi);
      setTimeout(function() {
        chrome.browserAction.setBadgeText({text: ""});
      }, 2000);
      sendResponse({message: "Cleared old url"});
    } else {
      sendResponse({message: "No action.."});
    }
  }
);

function copy(text) {
  input = document.getElementById("copy");
  input.value = text;
  input.focus();
  input.select();
  document.execCommand("Copy");
}

// initialize the popup or browser action depending on settings
chrome.browserAction.onClicked.addListener(
  function(tab) {
    chrome.tabs.executeScript(tab.id,
                              {code: 
                               'chrome.extension.sendRequest(' +
                               '{action: "saveLocation"},' +
                               'function(response) {' +
                               'console.log(response);' +
                               '});'}
                             );
  }
);

if (localStorage.advanced === "true"
    || !(localStorage.username && localStorage.password)) {
  // show the popup if user is not logged in or has chosen advanced
  // mode
  chrome.browserAction.setPopup({popup: "popup.html"});
}
