/**
* Applies rich text formats to currently selected cells.
* Text that matches regex is formatted using the methods listed.
* For a regex overview, see:
* https://www.regular-expressions.info/quickstart.html
* For available formatting methods and their parameters, see:
* https://developers.google.com/apps-script/reference/spreadsheet/text-style-builder
*/
function formatPhrasesInText(range = SpreadsheetApp.getActiveRange(), wordsToHighlight, color, bold) {
  let specs = [];
  let rgx;
  
  for(let word of wordsToHighlight) {
  if(bold) {
    rgx = new RegExp(`\\b${word}\\b`, 'gi')
  } else {
    rgx = new RegExp(word);
  }
    specs.push({
      regex: rgx, 
      format: {setForegroundColor:color, setBold:true}
    })
  }
  formatText_(range, specs);
}

/**
* Applies rich text formats to text in a range.
* Formats substrings that match a regex, each substring separately.
* Handles multiple occurrences of each phrase in each cell.
* Skips formula cells. Mutates specs. Retains existing formats.
*
* @param {SpreadsheetApp.Range} range The range to format.
* @param {Object[]} specs An array of objects { {RegExp} regex, [{SpreadsheetApp.TextStyleBuilder['methodName']: parameter}] }
* @return {SpreadsheetApp.Range} The same range, for chaining.
*/
function formatText_(range, specs) {
  // version 1.6, written by --Hyde, 12 February 2024
  //  - see https://webapps.stackexchange.com/a/167300/269219
  const richTextValues = range.getRichTextValues();
  const values = range.getValues();
  const formulas = range.getFormulas();
  const result = richTextValues.map((row, r) => row.map((value, c) => {
    if (!value || typeof values[r][c] !== 'string' || formulas[r][c]) return;
    const text = value.getText();
    const richText = value.copy();
    let match;
    specs.forEach(spec => {
      while (match = spec.regex.exec(text)) {
        if (!spec.textStyle) {
          const textStyle = SpreadsheetApp.newTextStyle();
          for (const [method, parameter] of Object.entries(spec.format)) textStyle[method](parameter);
          spec.textStyle = textStyle.build();
        }
        richText.setTextStyle(match.index, match.index + match[0].length, spec.textStyle);
      }
    });
    return richText.build();
  }));
  return range.setRichTextValues(result);
}