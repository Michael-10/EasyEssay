function onInstall(e) {
    onOpen(e);
}

function onOpen(e) {
    DocumentApp.getUi() // Or DocumentApp or FormApp.
        .createMenu('Custom Menu')
        .addItem('Show sidebar', 'showSidebar')
        .addToUi();
}

function showSidebar() {
    var html = HtmlService.createHtmlOutputFromFile('main')
        .setTitle('My custom sidebar')
        .setWidth(300);
    html.setSandboxMode(HtmlService.SandboxMode.IFRAME).setTitle("Form");
    DocumentApp.getUi() // Or DocumentApp or FormApp.
        .showSidebar(html);
}

function main() {
    // main code here

    var keywords = ['trees', 'green'];
    queryNature(keywords);
    // callNLP();
}

function callNLP() {
    var doc = DocumentApp.getActiveDocument();
    var data = doc.getBody().getText();
    Logger.log(data)
    const API_KEY = 'AIzaSyC-M5H7FShrOU0zpEO31P8ZxIX4y3QuoYk';
    //  var text = "Google, headquartered in Mountain View, unveiled the new Android phone at the Consumer Electronic Show.  Sundar Pichai said in his keynote that users love their new Android phones.";
    //  var text = "I went and saw Kevin Hart and Will Ferrel";
    //  var text = "Rivers running down the mountain. The water is at a height of 2000 meters above sea level. The animals drink the water up there because it's the cleanest";
    //  var text = "The quick brown fox jumped over the lazy dog. There were many dogs running around the fox aftewards. The dogs decided to attack the fox.";

    //  analyzeSyntax(text);

    var records = [];

    var entities = analyzeEntities(data);
    Logger.log(entities);
    var categories = classifyText(data);
    Logger.log(categories);
    for (var i = 0; i < entities["entities"].length && i < 5; i++) {
        var keywords = [];
        var entity = entities["entities"][i];
        keywords.push(entity["name"]);
        Logger.log(entity["name"])
        for (var j = 0; j < entity["mentions"].length; j++) {
            var content = entity["mentions"][j]["text"]["content"];
            if (content === entity["name"]) {
                continue;
            }
            if (keywords.indexOf(content) < 0) {
                keywords.push(content);
            }
        }

        // loop over categories array
        // grab name only if confidence is above 0.5
        for (var j = 0; j < categories["categories"].length; j++) {
            if (categories["categories"][j]["confidence"] > 0.5) {
                var categoryName = categories["categories"][j]["name"];
                categoryName = categoryName.replace("/", " ");
                categoryName = categoryName.replace("&", " ");
                var categoryNames = categoryName.split(" ");
                categoryNames = categoryNames.filter(function(x) {
                    return (x !== (undefined || null || ''));
                });
                keywords = keywords.concat(categoryNames);
            }
        }
        records = records.concat(queryNature(keywords));
        const DEBUG = true;
        if (DEBUG === true) {
            debugLogs(keywords);
        }
    }
    if (DEBUG === true) {
        debugLogs(records);
    }
    // return [{"title": "Animals", "url": "www.animals.com", "description": "Animals are cool"}];
    return queryNature(keywords);
}

function analyzeEntities(text) {
    var requestUrl = [
        'https://language.googleapis.com//v1/documents:analyzeEntities?key=',
        "AIzaSyC-M5H7FShrOU0zpEO31P8ZxIX4y3QuoYk"
    ].join("");

    // Use documents:analyzeEntities API endpoint for analyzing entities
    // Use documents:analyzeSyntax API endpoint for synctactic (linguistic) analysis

    var data = {
        "document": {
            "language": "en-us",
            "type": "PLAIN_TEXT",
            "content": text
        },
        "encodingType": "UTF8"
    };

    var options = {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(data)
    };

    var response = UrlFetchApp.fetch(requestUrl, options);

    var data = JSON.parse(response);

    const DEBUG = true;
    if (DEBUG === true) {
        //    debugLogs(data);
    }

    return data;
}

function classifyText(text) {
    var requestUrl = [
        'https://language.googleapis.com//v1/documents:classifyText?key=',
        "AIzaSyC-M5H7FShrOU0zpEO31P8ZxIX4y3QuoYk"
    ].join("");

    // Use documents:analyzeEntities API endpoint for analyzing entities
    // Use documents:analyzeSyntax API endpoint for synctactic (linguistic) analysis

    var data = {
        "document": {
            "language": "en-us",
            "type": "PLAIN_TEXT",
            "content": text
        },
        //    "encodingType": "UTF8"
    };

    var options = {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(data)
    };

    var response = UrlFetchApp.fetch(requestUrl, options);

    var data = JSON.parse(response);

    const DEBUG = true;
    if (DEBUG === true) {
        //    debugLogs(data);
    }

    return data;
}

function queryNature(keywords) {
    var keywordString = '';
    for (var i = 0; i < keywords.length; i++) {
        keywordString = keywordString + keywords[i] + '+';
    }
    var formattedKeywords = keywordString.slice(0, keywordString.length - 1);

    Logger.log(formattedKeywords);

    const BASE_URL = 'http://nature.com/opensearch/request?queryType=searchTerms&query=';
    const RESULT_TYPE = '&httpAccept=application/json';
    const SORTING = '&sortKeys=,pam,0';
    const MAX_RECORDS = '&maximumRecords=5';
    var requestUrl = BASE_URL + formattedKeywords + RESULT_TYPE + SORTING + MAX_RECORDS;
    https: //www.nature.com/opensearch/request?queryType=searchTerms&query=cleane&httpAccept=application/json&sortKeys=,pam,0&maximumRecords=5
        // var requestUrl = 'http://www.nature.com/opensearch/request?queryType=searchTerms&query=darwin&httpAccept=application/json&maximumRecords=5';
        // var requestUrl = 'http://api.nature.com/content/opensearch/request?queryType=cql&query=cql.keywords+any+darwin+OR+cql.keywords+any+lamarck&httpAccept=application/json';
        Logger.log(requestUrl);

    var response = UrlFetchApp.fetch(requestUrl);
    return parseNatureResults(response);
}
// Parse to results from searching Nature.com
function parseNatureResults(response) {
    const DEBUG = true;
    var queryResults = JSON.parse(response);

    if (DEBUG === true) {
        debugLogs(queryResults);
    }

    var parsedResults = [];
    Logger.log(queryResults["feed"]);
    var feedEntry = queryResults['feed']['entry'];
    Logger.log(feedEntry);

    for (var i = 0; i < feedEntry.length; i++) {
        var source = {
            title: feedEntry[i]['title'],
            url: feedEntry[i]['link'],
            description: feedEntry[i]['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:description'],
        };
        parsedResults.push(source);
    }

    return parsedResults;
}

// Function for logging output from queries
function debugLogs(queryResults) {
    var jsonString = JSON.stringify(queryResults, null, 2);
    var doc = DocumentApp.openById('1WxDREjXmlgpAp8HwaSCePj_upZeS2tDJaXcxdYvqof0');
    // doc.getBody().clear();
    //  var array = [];
    //  for (var i = 0; i < queryResults['feed']['entry'].length; i++) {
    //    var object = {
    //      title: queryResults['feed']['entry'][i]['title'],
    //      url: queryResults['feed']['entry'][i]['link'],
    //      description: queryResults['feed']['entry'][i]['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:description']
    //    };
    //    doc.getBody().appendParagraph('Title is: ' + queryResults['feed']['entry'][i]['title']);
    //    doc.getBody().appendParagraph('URL is: ' + queryResults['feed']['entry'][i]['link']);
    //    doc.getBody().appendParagraph('Description is ' + queryResults['feed']['entry'][i]['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:description']);
    //    doc.getBody().appendParagraph('==================');
    //    array.push(object);
    //  } 
    doc.getBody().appendParagraph(jsonString);
    //  doc.getBody().appendParagraph(JSON.stringify(array, null, 2));
}