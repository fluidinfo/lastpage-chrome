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
      sendResponse({message: "Error, password not found",
                    failure: true});
      return;
    }

    if (request.action == "validate") {
      fi.api.get({path: ["users", username],
                  onSuccess: function(response) {
                    sendResponse({success: true});
                  },
                  onError: function(response) {
                    sendResponse({failure:true});
                  }
                 });
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

    var clear = function(onSuccess) {
      fi.delete({where: "has " + tag_name,
                 tags: [tag_name],
                 onSuccess: onSuccess,
                 onError: function(response) {
                   // a 404 in this case probably means the tag
                   // doesn't exist so we should just create it
                   if (response.status == 404 && onSuccess != null)
                     onSuccess(response);
                   console.log(response);
                 }
                });
    };

    var save = function(url, redirect) {
      // js gives timestamp in ms, we want seconds
      var unix_time = Math.round(Date.now() / 1000);
      fi.api.put({path: ["about", url, tag_name],
                  data: unix_time,
                  onSuccess: function(response) {
                    console.log(response);
                    notify(redirect);
                    copy(redirect);
                  },
                  onError: function(response) {
                    console.log(response);
                  }
                 });
    };

    if (request.action == "saveLocation") {
      var redirect = "http://lastpage.me/" + username;
      if (request.suffix)
        redirect += "/" + suffix;
      chrome.tabs.getSelected(null, function(tab) {
        // delete the old location
        clear(function(response) {
          console.log(response);
          // save the new location
          save(tab.url, redirect);
        });
      });
      sendResponse({message: "Saved new url"});
    } else if (request.action == "clearLocation") {
      clear(function(response) { console.log(response); });
      sendResponse({message: "Cleared old url"});
    } else {
      sendResponse({message: "No action.."});
    }
  }
);

function notify(redirect) {
  // only want to do this once...
  if (!localStorage.notified) {
    var notification = webkitNotifications.createNotification(
      '../icon-48px.png',
      'Congratulations!',
      "We've recorded your current web location. To bring a friend " +
        "to this page, tell them to visit "+ redirect + ". " +
        "To make it easier to pass along, we've also " +
        "copied " + redirect + " to your clipboard."
    )
    notification.show();
    localStorage.notified = true;
  }
}

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
