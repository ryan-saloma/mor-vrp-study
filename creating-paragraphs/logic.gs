// every function update function should be named getX
// addStat should be renamed updateStat
// paragraphs should be fetched outside getX and passed in one at a time

const data = getELPData();

function updateAll() {
  ['MOR', 'VRP'].forEach(setName => updateSet(setName, data, null));
}

function updateSelected() {
  let range = SpreadsheetApp.getActiveRange();
  let setName = SpreadsheetApp.getActiveSheet().getName();
  updateSet(setName, data, range);
}

function updateSet(setName, data, range) {

  if(!data) {
    data = getELPData();
  }

  let functionArray = [
    {fun: countSentences, colName: 'SentenceCount'}, 
    {fun: countWords, colName: 'WordCount'}, 
    {fun: calculateFreqAvg, colName: 'LgSUBTL_Avg'}, 
    {fun: countSyllables, colName: 'NSyll'}, 
    {fun: countPhonemes, colName: 'NPhon'}, 
    {fun: countCharacters, colName: 'Length'}, 
    {fun: countPOS, colName: 'POSFromNLP'}
  ];
  
  for(let {fun, colName} of functionArray) {
    let result = fun(setName, data, range);
    addStats(result, setName, colName, range);
  }

}

function addStats(stats, sheetName, colName, range) {
  let row;
  if(!range) {
    row = 2; // this should probably change
  } else {
    row = range.getLastRow();
  }

  let col = getColumn(sheetName, colName);
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  sheet.getRange(row, col + 1, stats.length, 1).setValues(stats.map(stat => [stat]));
} 

function getELPData() {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ELP');
  let array = sheet.getDataRange().getValues();
  return constructMap(array);
}

function summarize(array, summaryFunction) {
    if (array.length === 0) {
        return null;
    }  
    return summaryFunction(array);
}

function updateStat(sheetName, data, colName, range, summaryFunction) {
  
  let sheet;
  if(!sheetName) {
    sheet = SpreadsheetApp.getActiveSheet();
  } else {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  }

  if(!range) {
    range = sheet.getRange(2, 1, 4, 1);
  }

  let paragraphs = range.getValues().flat(1);
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

function calculateFreqAvg(sheetName, data, range) {
  return updateStat(sheetName, data, 'LgSUBTLWF', range, (frequencies) => {
        const total = frequencies.reduce((acc, val) => acc + val, 0);
        return total / frequencies.length;
    });
}


function countSyllables(sheetName, data, range) {
  return updateStat(sheetName, data, 'NSyll', range, (values) => {
        return values.reduce((acc, val) => acc + val, 0);
  });
}

function countPhonemes(sheetName, data, range) {
  return updateStat(sheetName, data, 'NPhon', range, (values) => {
      return values.reduce((acc, val) => acc + val, 0);
  });
}

function countCharacters(sheetName, data, range) {
  return updateStat(sheetName, data, 'Length', range, (values) => {
    return values.reduce((acc, val) => acc + val, 0);
  });
}

function countSentences(sheetName, data, range) {
  let sheet = getSheet(sheetName);

  if(!data) {
    data = getELPData();
  }

  if(!range) {
    range = sheet.getRange(2, 1, 4, 1);
  }

  let paragraphs = range.getValues().flat(1);
  let counts = [];
  let i = 0;

  for(let paragraph of paragraphs) {
    const periods = paragraph.match(/\./g);
    counts[i] = periods ? periods.length : 0;
    i++;
  }

  return counts;
}

function countWords(sheetName, data, range) {
  let sheet = getSheet(sheetName);

  if(!data) {
    data = getELPData();
  }

  if(!range) {
    range = sheet.getRange(2, 1, 4, 1);
  }

  let paragraphs = range.getValues().flat(1);
  let counts = [];
  let i = 0;

  for(let paragraph of paragraphs) {
    const count = paragraph.split(' ').length;
    counts[i] = count;
    i++;
  }
  return counts;
}

// this needs fixing, data doesn't do anything
function countPOS(sheetName, data, range) {
  let sheet = getSheet(sheetName);

  if(!range) {
    range = sheet.getRange(2, 1, 4, 1);
  }

  let paragraphs = range.getValues().flat(1);
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
    return JSON.stringify(sortObjectByKey(map));
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
  // formatPhrasesInText(range, words, 'black', false);
  formatPhrasesInText(range, forbiddenWords, 'red');

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
  // resetFormat(range);
  formatPhrasesInText(range, targetWords, 'green');

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







