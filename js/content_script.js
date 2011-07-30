chrome.extension.sendRequest(
  {
    action: "storeLocation"
  },
  function(response) {
    console.log(response.message);
  }
);
