function constructMap(array) {
  const map = new Map();
  
  // Iterate through each subarray
  array.forEach(subarray => {
    // Ensure subarray has at least one element
    if (subarray.length > 0) {
      // Use the first element of the subarray as the key
      const key = subarray[0];
      
      // Add the entire subarray as the value for the key
      map.set(key, subarray);
    }
  });
  
  return map;
}

function getColumn(sheetName, colName) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  let lastCol = sheet.getLastColumn() + 1;
  return sheet.getRange(1, 1, 1, lastCol).getValues().flat(1).indexOf(colName);
}


function removePunctuation(paragraph) {
  return paragraph.replace(/[^\w\s]|_/g, "");
}

function getSheet(sheetName) {
  if(!sheetName) {
    sheet = SpreadsheetApp.getActiveSheet();
  } else {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  }
  return sheet;
}

function getSet(setName) {
  let range = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Words').getDataRange();
  return filterFirstColumn(range.getValues(), setName);
}

function filterFirstColumn(array, filterValue) {
    return array.filter(row => row[1] === filterValue).map(row => row[0]);
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

function sortObjectByKey(obj) {

    // Get the keys of the object
    const keys = Object.keys(obj);
    
    // Sort the keys alphabetically
    keys.sort();
    
    // Create a new object with sorted keys
    const sortedObject = {};
    keys.forEach(key => {
        sortedObject[key] = obj[key];
    });
    
    return sortedObject;
}
