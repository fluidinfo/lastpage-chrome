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
    
    var clear = function() {
      var tag_name = username + "lastpage"
      var params = $.param({query: "has " + tag_name,
                            tag: tag_name})
      fi.api.delete({url: "values?" + params,
                     success: function(json) {
                       console.log(json);
                     },
                     async: false
                    });
    }

    var save = function(url) {
      var time = new Date();
      fi.api.put({url: ["about", url, username, "lastpage"],
                  data: '"' + time.toISOString() + '"',
                  success: function(json) {
                    console.log(json);
                  },
                  async: false
                 });
    }

    if (request.action == "saveLocation") {
      // delete the old location
      clear(fi);
      // save the new location
      chrome.tabs.getSelected(null, function(tab) {
        save(tab.url);
      });
      sendResponse({message: "Saved new url"});
    } else if (request.action == "clearLocation") {
      clear(fi);
      sendResponse({message: "Cleared old url"});
    } else {
      sendResponse({message: "No action.."});
    }
  }
);
