chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'processVideo') {
      fetch(`https://vercel.com/asraygs-projects/edu/process?url=${encodeURIComponent(message.url)}`)
        .then(response => response.json())
        .then(data => {
          chrome.tabs.create({url: data.slidesUrl});
        })
        .catch(error => {
          console.error('Error processing video:', error);
          sendResponse({error: 'Failed to process video'});
        });
      return true;  // Will respond asynchronously
    }
  });
  