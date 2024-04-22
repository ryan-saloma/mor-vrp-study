const numParagraphs = 4;

// null -> {}
function getELPData() {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ELP');
  let array = sheet.getDataRange().getValues();
  return constructMap(array);
}

// cell range -> paragraph string
function getParagraph(range = SpreadsheetApp.getActiveSheet().getActiveCell()) {
  return String(range.getValue().trim());
}

// cell string -> [string]
function getParagraphs(setName) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(setName);
  let startRow = 2;
  let paragraphCol = getColumn(setName, 'Paragraph');
  let data = [];
  for(let i = 0; i < numParagraphs; i++) {
    data.push(getParagraph(sheet.getRange(startRow + i, paragraphCol)))
  }
  return data;
}