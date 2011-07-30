// creating the listener for fluidinfo calls.
// this is the only file that can do cross-domain requests.
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    var username = localStorage.username;
    var password = localStorage.password;
    
    if (request.action == "storeLocation") {
      if (username && password) {
        fi = fluidinfo({ username: username,
                         password: password,
                         instance: "main"
                       });
        // delete the old location
        fi.api.delete({url: ["tags", username, "im-at"],
                       success: function(json) {
                         console.log(json);
                       },
                       async: false
                      });
        // save the new location
        var url = sender.tab.url;
        fi.api.put({url: ["about", url, username, "im-at"],
                    data: "null",
                    success: function(json) {
                      console.log(json);
                    },
                    async: false
                   });
        sendResponse({message: "Success!"});
      } else {
        sendResponse({message: "Error, password not found"});
      }
    } else {
      sendResponse({message: "No action.."});
    }
  }
);
