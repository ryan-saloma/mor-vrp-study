function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Update')
    .addItem('Update All Stats (All)', 'updateAll')
    .addItem('Update All Stats (Selected)', 'updateSelected')
    .addItem('Check For Forbidden Words (All)', 'checkAllParagraphs')
    .addItem('Check For Allowed Words (All)', 'checkAllParagraphs')
    .addItem('Check For Forbidden Words (Selected)', 'checkForForbidden')
    .addItem('Check For Allowed Words (Selected)', 'checkForAllowed')
    .addItem('Compare Sets', 'transferStats')
    .addToUi();
}