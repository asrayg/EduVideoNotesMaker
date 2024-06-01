document.getElementById('convertButton').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const activeTab = tabs[0];
      chrome.scripting.executeScript({
        target: {tabId: activeTab.id},
        function: convertVideo
      });
    });
  });
  
  function convertVideo() {
    const videoUrl = window.location.href;
    // Send the URL to your backend or process it here
    console.log(`Converting video: ${videoUrl}`);
    // Implement the conversion logic
  }
  