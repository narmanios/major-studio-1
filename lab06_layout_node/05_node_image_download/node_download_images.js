// load a default library that lets us read/write to the file system
const fs = require('fs');
// if you are running this locally, you will need to npm install request
// load a default library that lets us make HTTP requests (like calls to an API)
const request = require('request');

// the folder we will write into, make sure the folder is in your directory
let folder = "downloads";

// download the image by url, name the file by filename
function downloadImage(uri, filename, callback, retryCount = 0){
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds
  
  try {
    request.head(uri, function(err, res, body){
      if (err) {
        if (retryCount < maxRetries) {
          console.log(`Retrying ${filename} (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => {
            downloadImage(uri, filename, callback, retryCount + 1);
          }, retryDelay);
          return;
        }
        console.error(`HEAD request failed for ${filename}:`, err.message);
        callback(err);
        return;
      }
      
      request(uri)
        .on('error', function(err) {
          if (retryCount < maxRetries) {
            console.log(`Download failed for ${filename}, retrying (${retryCount + 1}/${maxRetries})...`);
            setTimeout(() => {
              downloadImage(uri, filename, callback, retryCount + 1);
            }, retryDelay);
            return;
          }
          console.error(`Download failed for ${filename}:`, err.message);
          callback(err);
        })
        .pipe(fs.createWriteStream(folder + "/" + filename))
        .on('close', callback)
        .on('error', function(err) {
          console.error(`Write failed for ${filename}:`, err.message);
          callback(err);
        });
    });
  } catch (err) {
    console.error(`Exception for ${filename}:`, err.message);
    callback(err);
  }
};

// go through the json we created before
function downloadData() {
  fs.readFile("./data.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    try {
      const items = JSON.parse(data);
      let currentIndex = 0;
      const concurrencyLimit = 2; // Download max 2 images at once to avoid overwhelming the server
      let activeDownloads = 0;
      let successCount = 0;
      let errorCount = 0;
      
      function downloadNext() {
        // Start new downloads while we're under the limit and have more items
        while (activeDownloads < concurrencyLimit && currentIndex < items.length) {
          const e = items[currentIndex];
          currentIndex++;
          activeDownloads++;
          
          console.log(`[${currentIndex}/${items.length}] Downloading ${e.filename}...`);
          
          downloadImage(e.primaryImage, e.filename, function(err){
            activeDownloads--;
            
            if (err) {
              errorCount++;
              console.log(`❌ Error: ${e.filename} (${errorCount} errors so far)`);
            } else {
              successCount++;
              console.log(`✓ Success: ${e.filename} (${successCount}/${items.length})`);
            }
            
            // Continue with next download
            downloadNext();
            
            // If all downloads are complete, show summary
            if (currentIndex >= items.length && activeDownloads === 0) {
              console.log('\n=== Download Complete ===');
              console.log(`Success: ${successCount}`);
              console.log(`Errors: ${errorCount}`);
              console.log(`Total: ${items.length}`);
            }
          });
          
          // Add a small delay between starting downloads
          if (currentIndex < items.length) {
            setTimeout(() => {}, 100);
          }
        }
      }
      
      downloadNext(); // Start the download process
    } catch (err) {
      console.error('Error parsing data.json:', err.message);
    }
  });
}

downloadData();
