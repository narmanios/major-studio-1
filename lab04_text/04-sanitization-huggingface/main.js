const baseUrl = 'https://datasets-server.huggingface.co/';

function cleanUpText(text) {
  if (!text) return '';

  return (
    text
      // Historical / OCR quirks
      .replace(/ſ/g, 's') // long s
      .replace(/\bvv/g, 'w') // vv → w
      .replace(/[|]/g, 'I') // | → I

      // Replace digits that look like letters when they are next to letters
      .replace(/(?<=[A-Za-z])1|1(?=[A-Za-z])/g, 'I')
      .replace(/(?<=[A-Za-z])0|0(?=[A-Za-z])/g, 'O')
      .replace(/(?<=[A-Za-z])5|5(?=[A-Za-z])/g, 'S')
      .replace(/(?<=[A-Za-z])8|8(?=[A-Za-z])/g, 'B')

      // Contraction fixes
      .replace(/'\s+([dst])\b/g, "'$1")

      // Hyphenation across line breaks
      .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')

      // Paragraph/spacing cleanup
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/([.!?])\s*\n+\s*([A-Z])/g, '$1\n\n$2')

      // Punctuation spacing
      .replace(/\s+([,.!?;:])/g, '$1')
      .replace(/([,.!?;:])\s*/g, '$1 ')

      .trim()
  );
}

async function fetchAndCleanHuggingFaceDataset(dataset) {
  const url = `${baseUrl}first-rows?dataset=${dataset}&config=default&split=train`;
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      // notice how we are doing data.rows.slice(0, 2) to keep our console clean
      console.log('raw data', JSON.stringify(data.rows.slice(0, 2), null, 2));
      const cleanedRows = data.rows
        .filter((item) => item.row.description) // ensure description exists
        .map((item) => cleanUpText(item.row.description)); // clean the description
      console.log(
        'sanitized descriptions:',
        JSON.stringify(cleanedRows.slice(0, 2), null, 2)
      );

      return cleanedRows;
    })
    .catch((error) => {
      console.log(error);
    });
}

// Examples
fetchAndCleanHuggingFaceDataset('sh0416/ag_news');

const badOCR = 'TH|S I5 A TEST 0F OCR W1TH P1PES AND NUM8ERS 1998';
console.log('Raw OCR text:', badOCR);
console.log('Cleaned OCR text:', cleanUpText(badOCR));
