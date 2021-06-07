const url   = "https://www.cdc.gov.tw/Category/NewsPage/EmXemht4IT-IRAPrAnyG9A"
const DEBUG = 0;
const date  = `${new Date().getFullYear()}/${new Date().getMonth()+1}/${new Date().getDate()}`
const cache = CacheService.getScriptCache()
function setup() {
  ScriptApp.newTrigger('runner')
      .timeBased()
      .inTimezone("Asia/Taipei")
      .atHour(14)
      .everyMinutes(1)
      .create();
}

function runner(){
  if((
      cache.get(date)         == "ok" || 
      new Date().getHours()   != 2    || 
      new Date().getMinutes() >= 15
     ) && 
      !DEBUG
  ){
    Logger.log('Not the date')
    return;
  }else{
    const html = UrlFetchApp.fetch(url).getContentText();
    const $ = Cheerio.load(html);
    let table = $(".JQtabNew > tbody ").children()
    var output = `Today: ${date}
    <br><br>`;
    if(date.indexOf(table.find('tr:nth-child(1) > td:nth-child(2)').text()) > -1){
      Logger.log("Found!")
      cache.put(date,"ok")
      for(var i = 1;i <= table.length ; i++){
        let elem     = table.find(`tr:nth-child(${i}) > td:nth-child(1) > a`)
        //Logger.log(elem.html())
        let elemDate = table.find(`tr:nth-child(${i}) > td:nth-child(2)`).text()
        Logger.log(elemDate)
        if(date.indexOf(elemDate) == -1){
          break;
        }else{
          output += `<h1>${elem.text()} (https://www.cdc.gov.tw/${elem.attr('href')})</h1>
          <br>`
          let content = UrlFetchApp.fetch(`https://www.cdc.gov.tw/${elem.attr('href')}`).getContentText();
          let _$ = Cheerio.load(content);
          output += _$(".con-word").html().replace(/新增/g,"<b>新增</b>")+"<br><hr><br>"
        }
      }
      Logger.log(output)
      MailApp.sendEmail({
        to: Session.getActiveUser().getEmail(),
        subject:"衛福部新聞稿",
        htmlBody: output
      })
    }
    
    //Logger.log(new Date().getMonth()+1 + "/" + new Date().getDate())
    return HtmlService.createHtmlOutput(output);
  }
}
