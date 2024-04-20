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
