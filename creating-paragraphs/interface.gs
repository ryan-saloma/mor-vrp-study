function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Update')
    .addSubMenu(ui.createMenu('Update Stats')
      .addItem('Update All Stats', 'updateAll')
      .addItem('Update Frequency', 'calculateFreqAvg')
      .addItem('Update Number of Syllables', 'countSyllables')
      .addItem('Update Number of Phonemes', 'countPhonemes')
      .addItem('Update Number of Characters', 'countCharacters')
    )
    .addItem('Check For Forbidden Words (All)', 'checkAllParagraphs')
    .addItem('Check For Allowed Words (All)', 'checkAllParagraphs')
    .addItem('Check For Forbidden Words (Selected)', 'checkForForbidden')
    .addItem('Check For Allowed Words (Selected)', 'checkForAllowed')
    .addToUi();
}