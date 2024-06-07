const search = {
  "ccuser" : GET("ccuser").toLowerCase(),
  "tcontrol" : GET("tcontrol").split(','),
  "tclass" : GET("tclass"),
  "eopponent" : Number(GET("eopponent")),
  "sdate" : new Date(GET("sdate")),
  "edate" : new Date(GET("edate")),
  "dtype" : GET("dtype"),
  "cstreaks" : Number(GET("cstreaks"))
};

let finalJSON = {games:[]};

const paper = document.querySelector('.paper');
const api_log = document.querySelector('#api-log');

const S = {
  Types : ['win', 'unbeaten', 'kramnik'],
  TControls : ['bullet', 'blitz', 'rapid', 'daily'],
  Minimum : {},
  Table : {},
  Count : {},
  Store : {},
  Curr : {},
  init : function(){
    S.Types.forEach(st => {
      S.Table[st] = document.querySelector(`.${st}-streak-tbody`);
      S.Count[st] = document.querySelector(`.${st}-count`);
      S.Store[st] = [];
      S.Minimum[st] = search.cstreaks;
      S.Curr[st] = {};
      
      S.TControls.forEach(tc => {
        S.Curr[st][tc] = {
          start_date : null,
          end_date : null,
          games : 0,
          draws : 0,
          player_rating : 0,
          opponent_rating : 0
        }
      });
    });
  },
  Increase : function(s, g, draw=false){
    s.games++;
    s.player_rating += g.player_rating;
    s.opponent_rating += g.opponent_rating;
    S.Date(s, g.date_endtime);
    if(draw){
      s.draws += 0.5;
    }
  },
  Date : function(s, d){
    if(s.games==1){
      s.start_date = d;
      return;
    }
    s.end_date = d; 
  },
  win : function(g){
    S.Types.forEach(st => {
      S.Increase(S.Curr[st][g.time_class], g);
    });
  },
  draw : function(g){
    S.Types.forEach(st => {
      const s = S.Curr[st][g.time_class];
      switch(st){
        case "win":
          S.Bank(st, g.time_class);
          break;
        case "unbeaten":
          S.Increase(s, g, true);
          break;
        case "kramnik":
          if(s.games >= 25 || s.games <= 5 || s.draws > 0){
            S.Bank(st, g.time_class);
            break;
          }
          S.Increase(s, g, true);
      }
    });
  },
  loss : function(g){
    S.Types.forEach(st => {
      S.Bank(st, g.time_class);
    });
  },
  Bank : function(st, tc){
    const s = S.Curr[st][tc];
    if(s.games >= S.Minimum[st] && st!='kramnik' || 
        st == 'kramnik' && (s.games - s.draws) >= S.Minimum[st]
    ){
      const score = s.games - s.draws;
      const avplayer = parseInt(s.player_rating / s.games);
      const avopponent = parseInt(s.opponent_rating / s.games);
      const ratingdiff = avplayer - avopponent;

      S.Store[st].push({
        games : s.games,
        score : score,
        tclass : tc,
        avplayer : avplayer,
        avopponent : avopponent,
        ratingdiff : ratingdiff,
        sdate : s.start_date,
        edate : s.end_date 
      });
      S.Count[st].innerText = S.Store[st].length;
    }
    s.games = s.draws = s.player_rating = s.opponent_rating = 0;
  },
  Print : function(index, table, data=[]){
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.setAttribute('scope','row');
    th.innerText = index;
    tr.append(th);

    data.forEach(d => {
      const td = document.createElement('td');
      td.innerText = d;
      tr.append(td);
    });

    table.append(tr);
  },
  Finale : function(){
    S.Types.forEach(st => {
      S.TControls.forEach(tc => {
        S.Bank(st, tc);
      });
      if(S.Store[st].length == 0){
        const p = document.createElement('p');
        p.classList.add('text-center', 'pb-3');
        p.innerText = `No ${ st } streaks were found in this dataset`;
        S.Table[st].closest('table').after(p);
        return;
      }
      S.Store[st].sort((a, b) => { return a.score-b.score; }).reverse();

      console.log(S.Store[st]);
      S.Store[st].forEach((s,i) => {
        let scoreStr = s.score;
        if(st != 'win'){
          scoreStr = `${ s.score }/${ s.games }`;
        }
        S.Print(i+1, S.Table[st], [
            scoreStr,
            s.tclass,
            s.avplayer,
            s.avopponent,
            s.ratingdiff,
            s.sdate,
            s.edate
          ]
        );
      })
    });
  }
}
S.init();

const api_urls = [];

function convertToCSV(arr) {
  const array = [Object.keys(arr[0])].concat(arr)
  return array.map(it => {
    return Object.values(it).toString()
  }).join('\n')
}

const IntlOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: false
}

function GET(param) {
  const params = location.search.substring(1).split("&");
  for(const p of params){
    let pair = p.split("=");
    if(pair[0]!==param){continue;}
    return decodeURIComponent(pair[1]);
  }
  return null;
}

function listParams(){
  const params = document.querySelector('#params');
  let exclusions = 'none';
  if(search.eopponent > 0){
    exclusions = `Below ${ search.eopponent }`;
  }
  let tcontrols = search.tclass;
  if(tcontrols=='none'){
    tcontrols=search.tcontrol;
  }
  const drange = `
  ${ (search.sdate.getMonth()+1).toString().padStart(2, "0") }/${ search.sdate.getFullYear() } to 
  ${ (search.edate.getMonth()+1).toString().padStart(2, "0") }/${ search.edate.getFullYear() }`

  params.innerHTML = `
    <p>User: <span class='float-end fw-bold'>${ search.ccuser }</span></p>
    <p>Rating Exclusions: <span class='float-end fw-bold'>${ exclusions }</span></p>
    <p>Time Controls: <span class='float-end fw-bold'>${ tcontrols }</span></p>
    <p>Date Range: <span class='float-end fw-bold'>${ drange }</span></p>
    <p>Auto Download Format: <span class='float-end fw-bold'>${ search.dtype }</span></p>
  `;

  if(search.cstreaks != 0){
    params.innerHTML += `<p>Minimum Streak: <span class='float-end fw-bold'>${ search.cstreaks }</span></p>`
  }
}
listParams();

function filenameDate(date){
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}`;
}

function downloadObject(exportName){
  const csvDownload = document.querySelector('.csv-download');
  csvDownload.setAttribute("href", 
    "data:text/plain;charset=utf-8," + encodeURIComponent(convertToCSV(finalJSON.games))
  );
  csvDownload.setAttribute("download", exportName + '.csv');
  csvDownload.classList.remove("disabled");

  const jsonDownload = document.querySelector('.json-download');
  jsonDownload.setAttribute("href", 
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalJSON))
  );
  jsonDownload.setAttribute("download", exportName + '.json');
  jsonDownload.classList.remove("disabled");

  if(search.dtype == 'csv'){ csvDownload.click(); }
  if(search.dtype == 'json'){ jsonDownload.click(); }
}

async function grabGames(urls) {
  for (const u of urls){
    const p = document.createElement('p');
    p.innerText = u;
    api_log.prepend(p);
    try {
      await fetch(u)
      .then(r => {
        return r.json();
      })
      .then(r => {
        processGames(r);
        p.classList.add('success');
      });
    } catch (error) {
      p.classList.add('error');
      paper.innerText = "Request Failed. Did you input the correct username?"
      console.log(error.message);
      break;
    }
  }
  finalProcessing();
}

function finalProcessing(){
  if(finalJSON.games.length === 0){
    paper.innerText = "No games matched your specifications.";
    return;
  }

  const tcontrolStr = search.tclass == "none" ? search.tcontrol.toString().replaceAll(',', '-') : search.tclass;
  downloadObject(`${search.ccuser}_${tcontrolStr}_${filenameDate(search.sdate)}_${filenameDate(search.edate)}`);

  if(search.cstreaks){
    S.Finale();
  }

  paper.innerText = "All data has been processed.";
  console.log(`End time: ${new Date().toLocaleString()}`);
}

function processGames(games) {
  games.games.forEach(game => {
    const parsedGame = processGame(game);
    if(!parsedGame){return;}
    finalJSON.games.push(parsedGame);
  });
  document.querySelector('.game-count').innerText = finalJSON.games.length;
}

function processGame(game){
  if(
    search.tclass == "none" &&
    !search.tcontrol.includes(game.time_control) ||
    !["none", "all"].includes(search.tclass) &&
    search.tclass != game.time_class ||
    !game.rated || game.rules != "chess"
  ){return 0;}

  const g = {
    "date_endtime" : new Intl.DateTimeFormat(undefined, IntlOptions).format(new Date(game.end_time*1000)).replace(',',''),
    "time_class" : game.time_class,
    "time_control" : game.time_control,
    "player_rating" : 0,
    "opponent_rating" : 0,
    "rating_diff" : 0,
    "result" : "win",
    "color" : "white",
    "unix_endtime" : game.end_time
  };
  let player = null;
  let opponent = null;
  if(game.black.username.toLowerCase()==search.ccuser){
    g.color = "black";
    player = game.black;
    opponent = game.white;
  } else {
    player = game.white;
    opponent = game.black;
  }
  if(search.eopponent > opponent.rating){return 0;}

  g.player_rating = player.rating;
  g.opponent_rating = opponent.rating;
  g.rating_diff = player.rating - opponent.rating;

  if(player.result != 'win' && ['timeout', 'resigned', 'checkmated', 'abandoned'].includes(player.result)){
    g.result = 'loss';
  }
  else if(player.result != 'win' && ['timevsinsufficient', 'agreed', 'stalemate', 'repetition', 'insufficient', '50move'].includes(player.result)){
    g.result = 'draw';
  }

  if(search.cstreaks){
    S[g.result](g);
  }
  return g;
}
function init(){
  if(window.innerWidth >= 576){
    new bootstrap.Collapse('#api-log', {
      toggle: true
    });
    new bootstrap.Collapse('#params', {
      toggle: true
    });
  }
  // init s here?
  if(search.cstreaks == 0){
    document.querySelectorAll('.streak').forEach(el => {
      el.remove();
    });
  }
  let iDate = new Date(search.sdate.getFullYear(), search.sdate.getMonth(), 1);
  while(iDate <= search.edate){
    api_urls.push(`https://api.chess.com/pub/player/${ search.ccuser }/games/${ iDate.getFullYear() }/${ (iDate.getMonth()+1).toString().padStart(2, "0") }`);
    iDate.setMonth(iDate.getMonth()+1);
  }
  grabGames(api_urls);
  console.log(`Start time: ${new Date().toLocaleString()}`);
}

init();