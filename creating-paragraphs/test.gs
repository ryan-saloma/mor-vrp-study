function testAddStats() {
  sheetName = 'MOR';
  colName = 'LgSUBTL_Avg';
  stats = [1, 2, 3, 4];
}

function testGetPOS() {
    paragraph = `Before we left for the large country house, we often heard people say that it was haunted, but our curiosity made us ignore the warnings. Despite these rumors, we went on the trip in the hope of learning the truth. Inside the estate, we found four children playing in the garden. It was so quiet there that when Beth spoke she could hear her voice echo against the walls.`;
    Logger.log(getPOS(paragraph));
}