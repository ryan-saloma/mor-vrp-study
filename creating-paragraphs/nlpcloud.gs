// this should probably be an async function
function getPOS(paragraph) {

  let token = `Token ${PropertiesService.getScriptProperties().getProperty('API_KEY')}`;
  let options = {
    method: 'post',
    headers: {
      "Authorization": token, 
      "Content-Type": "application/json"
    }, 
    "payload": JSON.stringify({text: paragraph}), 
    "contentType": "application/json"
  }
  var response = UrlFetchApp.fetch(`https://api.nlpcloud.io/v1/en_core_web_lg/sentence-dependencies`, options);
  return extractPOS(response.getContentText());
}

// string -> [{text: word, tag: pos}, {text: word2, tag: pos}]
function extractPOS(string) {
  let obj = JSON.parse(string);
  return obj.sentence_dependencies[0].dependencies.words;
}

// probably want something that check that word is being as intended (e.g. program.tag == 'NN')