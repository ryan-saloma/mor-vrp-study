// TO-DO: make something that highlights low-frequency words


function updateAll() {
  let data = getELPData();
  updateSet('MOR', data);
  updateSet('VRP', data);
}

function updateSet(setName, data) {

  if(!data) {
    data = getELPData();
  }

  let avgs = calculateFreqAvg(setName, data);
  addStats(avgs, setName, 'LgSUBTL_Avg');
  let nsyll = countSyllables(setName, data);
  addStats(nsyll, setName, 'NSyll');
  let nphon = countPhonemes(setName, data);
  addStats(nphon, setName, 'NPhon');
  let nchar= countCharacters(setName, data);
  addStats(nchar, setName, 'Length');
  let nsentences = countSentences(setName, data);
  addStats(nsentences, setName, 'SentenceCount');
  let nwords = countWords(setName, data);
  addStats(nwords, setName, 'WordCount');
  let pos = countPOS(setName);
  addStats(pos, setName, 'POSFromNLP');
}

function addStats(stats, sheetName, colName) {
  let col = getColumn(sheetName, colName);
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  sheet.getRange(2, col + 1, stats.length, 1).setValues(stats.map(stat => [stat]));
} 

function getELPData() {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ELP');
  let array = sheet.getDataRange().getValues();
  let data = constructMap(array);
  return data;
}

function summarize(array, summaryFunction) {
    if (array.length === 0) {
        return null;
    }  
    return summaryFunction(array);
}

function updateStat(sheetName, data, colName, summaryFunction) {
  
  let sheet;
  if(!sheetName) {
    sheet = SpreadsheetApp.getActiveSheet();
  } else {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  }

  let paragraphs = sheet.getRange(2, 1, 4, 1).getValues().flat(1);
  let col = getColumn('ELP', colName);
  let stats = [];
  let i = 0;
  
  for(let paragraph of paragraphs) {

    let words = paragraph.split(' ').map(word => {
      return removePunctuation(word.toLowerCase())
    });

    if(!words) break;

    let values = words.map(word => {

      if(data.has(word)) {
        return data.get(word)[col];
      }

      if(data.has(word.toUpperCase())) {
        return data.get(word.toUpperCase())[col];
      }
 
      return null;
    })

    stats[i] = summarize(values, summaryFunction)
    i++;
  }
  return stats;
}

function calculateFreqAvg(sheetName, data) {
  return updateStat(sheetName, data, 'LgSUBTLWF', (frequencies) => {
        const total = frequencies.reduce((acc, val) => acc + val, 0);
        return total / frequencies.length;
    });
}


function countSyllables(sheetName, data) {
  return updateStat(sheetName, data, 'NSyll', (values) => {
        return values.reduce((acc, val) => acc + val, 0);
  });
}

function countPhonemes(sheetName, data) {
  return updateStat(sheetName, data, 'NPhon', (values) => {
      return values.reduce((acc, val) => acc + val, 0);
  });
}

function countCharacters(sheetName, data) {
  return updateStat(sheetName, data, 'Length', (values) => {
    return values.reduce((acc, val) => acc + val, 0);
  });
}

function countSentences(sheetName, data) {
  let sheet = getSheet(sheetName);

  if(!data) {
    data = getELPData();
  }

  let paragraphs = sheet.getRange(2, 1, 4, 1).getValues().flat(1);
  let counts = [];
  let i = 0;

  for(let paragraph of paragraphs) {
    const periods = paragraph.match(/\./g);
    counts[i] = periods ? periods.length : 0;
    i++;
  }

  return counts;
}

function countWords(sheetName, data) {
  let sheet = getSheet(sheetName);

  if(!data) {
    data = getELPData();
  }

  let paragraphs = sheet.getRange(2, 1, 4, 1).getValues().flat(1);
  let counts = [];
  let i = 0;

  for(let paragraph of paragraphs) {
    const count = paragraph.split(' ').length;
    counts[i] = count;
    i++;
  }
  return counts;
}

function countPOS(sheetName) {
  let sheet = getSheet(sheetName);

  let paragraphs = sheet.getRange(2, 1, 4, 1).getValues().flat(1);
  let pos = [];
  let i = 0;

  for(let paragraph of paragraphs) {
    pos[i] = getPOS(removePunctuation(paragraph.toLowerCase()));
    i++;
  }
  
  let tmp = pos.map((array) => {
    let map = {};
    for(let {text, tag}  of array) {
      map[tag] = map[tag] + 1 || 1;
    }
    return JSON.stringify(map);
  })

  return tmp;

}

// checks paragraph for forbidden words
function checkForForbidden(range = SpreadsheetApp.getActiveRange(), 
sheetName = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName()) {
  let sheet = getSheet(sheetName);
  let forbiddenSet;
  if(sheet.getName() == 'VRP') {
    forbiddenSet = 'MOR';
  } else {
    forbiddenSet = 'VRP';
  }

  let forbiddenWords = getSet(forbiddenSet);
  let paragraph = range.getValue();
  let words = removePunctuation(paragraph.toLowerCase()).split(' ');
  formatPhrasesInText(range, words, 'black', false);
  formatPhrasesInText(range, forbiddenWords, 'red', true);

  // check if all allowed words are present, no repeats
  let col = getColumn(sheetName, 'NoForbiddenWords') + 1;
  let currentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  let includedWords = forbiddenWords.filter(item => words.includes(item));
  let msg = '';

  if(includedWords.length > 0) {
    msg = `No: ${includedWords}.`;
  } else {
    msg = 'Yes';
  }

  currentSheet.getRange(range.getRow(), col, 1, 1).setValue(msg);

}

// checks paragraph for forbidden words
function checkForAllowed(range = SpreadsheetApp.getActiveRange(), 
sheetName = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName()) {

  // highlight allowed words
  let targetWords = getSet(sheetName);
  let paragraph = range.getValue();
  let words = removePunctuation(paragraph.toLowerCase()).split(' ');
  formatPhrasesInText(range, words, 'black', false);
  formatPhrasesInText(range, targetWords, 'green', true);

  // check if all allowed words are present, no repeats
  let col = getColumn(sheetName, 'AllTargetWords') + 1;
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  let isSub = isSubset(targetWords, words);
  let isMulti = isMultiset(targetWords, words)
  let msg = '';

  if(isSub && !isMulti) {
    msg = 'Yes';
  } 
  
  if(isMulti){
    let repeatedWords = getRepeatedValues(words.filter(item => targetWords.includes(item)));
    msg = msg + `Repeated Words: ${repeatedWords}.`;
  } else if(!isSub) {
    let missingWords = targetWords.filter(item => !words.includes(item));
    msg = msg + ` Missing Words: ${missingWords}.`;
  }

  sheet.getRange(range.getRow(), col, 1, 1).setValue(msg);

}

function isSubset(a, b) {
    return a.every(item => b.includes(item));
}

function isMultiset(a, b) {
    // Check if at least one member is repeated
    const repeatedValues = getRepeatedValues(b);
    
    return a.some(item => repeatedValues.includes(item));
}


function getRepeatedValues(array) {
    const seen = new Set();
    const repeated = new Set();
    
    // Filter out repeated values
    array.forEach(item => {
        if (seen.has(item)) {
            repeated.add(item);
        } else {
            seen.add(item);
        }
    });
    
    // Convert the Set to an array and return
    return Array.from(repeated);
}






