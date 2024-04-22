var ELP_DATA;


function updateAll() {
  ['MOR', 'VRP'].forEach(setName => updateSet(setName));
}

function updateSet(setName) {
  let paragraphs = getParagraphs(setName);
  let row = 2;
  for(let i = row; i < row + numParagraphs; i++) {
    updateAllFields(paragraphs[i], setName, row);
  }
}

function updateSelected(sheet = SpreadsheetApp.getActiveSheet()) {
  let sheetName = sheet.getName();
  if(!(sheetName == 'MOR' || sheetName == 'VRP')) {
    throw new Error('This function must be called from VRP or MOR sheet.')
  }

  let paragraph = getParagraph();
  let row = sheet.getActiveRange().getRow();
  updateAllFields(paragraph, sheetName, row);
}

function updateAllFields(paragraph, setName, row) {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(setName);
    let functionArray = [
    {fun: countSentences, colName: 'SentenceCount'}, 
    {fun: countWords, colName: 'WordCount'}, 
    {fun: calculateFreqAvg, colName: 'LgSUBTL_Avg'}, 
    {fun: countSyllables, colName: 'NSyll'}, 
    {fun: countPhonemes, colName: 'NPhon'}, 
    {fun: countCharacters, colName: 'Length'}, 
    {fun: countPOS, colName: 'POSFromNLP'}, 
    {fun: calculateParagraphComplexity, colName: 'ArticulatoryComplexity'}
  ];

  for(let {fun, colName} of functionArray) {
    let result = fun(paragraph);
    let col = getColumn(setName, colName);
    addStat(result, sheet.getRange(row,col));
  }

}

function addStat(stat, cell) {
  cell.setValue(stat);
}

function summarize(array, summaryFunction) {
    if (array.length === 0) {
        return null;
    }  
    return summaryFunction(array);
}


function getELPStat(paragraph, colName, summaryFunction) {
  
  if(!ELP_DATA) {
    ELP_DATA = getELPData();
  }
  
  let col = getColumn('ELP', colName) - 1; // this needs to be fixed  
  let words = extractWords(paragraph);
  let values = words.map(word => {

      if(ELP_DATA.has(word)) {
        return ELP_DATA.get(word)[col];
      }

      if(ELP_DATA.has(word.toUpperCase())) {
        return ELP_DATA.get(word.toUpperCase())[col];
      }
 
      return null;
  })

  return summarize(values, summaryFunction);
}


function calculateFreqAvg(paragraph) {
  return getELPStat(paragraph, 'LgSUBTLWF', (frequencies) => {
        const total = frequencies.reduce((acc, val) => acc + val, 0);
        return total / frequencies.length;
    });
}

function countSyllables(paragraph) {
  return getELPStat(paragraph, 'NSyll', (values) => {
        return values.reduce((acc, val) => acc + val, 0);
  });
}

function countPhonemes(paragraph) {
  return getELPStat(paragraph, 'NPhon', (values) => {
      return values.reduce((acc, val) => acc + val, 0);
  });
}

function countCharacters(paragraph) {
  return getELPStat(paragraph, 'Length', (values) => {
    return values.reduce((acc, val) => acc + val, 0);
  });
}

function countSentences(paragraph) {

  const periods = paragraph.match(/(?<!Mr|Mrs|Ms)\./g);
  return periods ? periods.length : 0;

}

function countWords(paragraph) {
  return paragraph.split(' ').length;
}

function countPOS(paragraph) {
  let arrayOfTags = getPOS(paragraph);
  let map = {};
  for(let {_, tag}  of arrayOfTags) {
    map[tag] = map[tag] + 1 || 1;
  }

  return JSON.stringify(sortObjectByKey(map));
}

function calculateParagraphComplexity(paragraph) {
  if(!ELP_DATA) {
    ELP_DATA = getELPData();
  }
  let words = extractWords(paragraph);
  let ipaCol = getColumn('ELP', 'Pron');
  let wordCol = getColumn('ELP', 'Word');
  let syllCol = getColumn('ELP', 'NSyll');
  let totalComplexity = 0;
  let wordObjects = words.map(word => {
      let array;
      if(ELP_DATA.has(word)) {
        array = ELP_DATA.get(word);
      } else if(ELP_DATA.has(toProperCase(word))) {
        array = ELP_DATA.get(toProperCase(word));
      } else if(ELP_DATA.has(word.toUpperCase())) {
        array = ELP_DATA.get(word.toUpperCase());
      }

      if(array) {
        return {
          word: String(array[wordCol - 1]),
          ipa: String(array[ipaCol - 1]),
          nsyllables: Number(array[syllCol - 1])
        }
      }
 
      return null;
  });

  for(let obj of wordObjects) {
    Logger.log(obj.word);
    totalComplexity += calculateWordComplexity(obj);
  }

  return totalComplexity;
}

function calculateWordComplexity({ipa, word, nsyllables}) {

  if(!word) {
    return null;
  }

  let complexity = 0;
  // let ipa = wordObject.ipa;
  // let word = wordObject.word;
  // let nsyllables = wordObject.nsyllables;

  complexity += countClusters(word);

  if(endsWithConsonant(word)) {
    complexity++;
  }

  if(nsyllables > 2) {
    complexity++;
  }

  if(!stressAtBeginning(ipa)) {
    complexity++;
  }

  complexity += countVelars(ipa) + 
  countLiquids(ipa) + countRhotics(ipa) + countFricitivesAndAffricates(ipa);

  return complexity;

}

function countIPASymbol(word, regex) {
  let matches = word.match(regex);
  return matches ? matches.length : 0;
}

function countVelars(ipa) {
  return countIPASymbol(ipa, /[kgN]/g);
}
  
function countLiquids(ipa) {
  return countIPASymbol(ipa, /[l]/g);
}

function countRhotics(ipa) {
  return countIPASymbol(ipa, /[r]/g);
}

function countFricitivesAndAffricates(ipa) {
  return countIPASymbol(ipa, /[fvszT]|(?:dZ|tS)/g);
}

function countClusters(word) {
  let matches = word.match(/[^aeiouAEIOU]{2,}/g);
  return matches ? matches.length : 0;
}

function endsWithConsonant(word) {
  return /[^aeiouAEIOU]$/i.test(word);
}

function stressAtBeginning(ipa) {
  return /^"/.test(ipa);
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
  let col = getColumn(sheetName, 'NoForbiddenWords');
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
  let col = getColumn(sheetName, 'AllTargetWords');
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








