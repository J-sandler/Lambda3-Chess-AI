import {Chess} from './Chess.mjs';
var chess=new Chess();
const search_depth=3;
const depth_limit=6;
var memo=new Map();
var caches=new Map();
var c=0,cm=0,prunes=0,supers=0,mx_s=0;
const max_caches=Infinity;

async function fn(type="generate") {
  let move=moves[moves.length-1];
  chess.move(move);
  const el=document.getElementById("legal-moves");
  const legalMoves=chess.moves();
  el.innerText=legalMoves;
  boardinternals=fen2bi(chess.fen().split(" ")[0]);
  
  let ps=0;
  window.ps=ps;

  if (type=="update") return;
  memo=new Map();
  console.log("[Generating move at depth", search_depth,"]");
  mini_max(-Infinity,Infinity,await sort(chess.moves()),1,getmve(),chess.fen());
  //generateMove(legalMoves,1,getmve(),chess.fen(),"",-Infinity,Infinity);
}

async function load_caches(blob) {
  var reader = new FileReader();
  reader.readAsText(blob.files[0]);
  console.log("Caching Fens...");
  let f=0;
  reader.onload = async function() {
    const fens=await reader.result.split("\n");
    for (let i in fens) {
      // get evaluation
      let e=parseInt(fens[i].split(" ")[6]);
      // account for bad formatting
      e=(isNaN(e))?parseInt(fens[i].split(",")[1]):e;
      // skip if still bad
      if (isNaN(e)) continue;

      caches.set(await fens[i]
        .split(" ")
        .slice(0,2)
        .join(" "),
        e);
      f++;
    }
  };
  console.log("Caching Complete! (Loaded "+f+" keys)");
  return 0;
}

async function generateMove(legalMoves,depth=1,m,fen,bestMove="",alpha,beta) {
  var opp_clr=(m==0)?"b":"w";
  if (m==0) {
    for (let t in legalMoves) {
      ps++;
      var pot; //potential evaluation
      var tempChess=new Chess(fen);
      await tempChess.move(legalMoves[t]);
      if (caches.has(fen.split(" ")[0]+" "+opp_clr)) {
        pot=parseInt(await caches.get(fen.split(" ")[0]+" "+opp_clr));
        c++;
        //console.log(caches.get(fen.split(" ").slice(0,2).join(" ")));
      } else if (memo.has(tempChess.fen())) {
        pot=await memo.get(tempChess.fen());
        cm++;
        //pot=sum(tempChess.fen());
      } else {
      pot=(depth==search_depth)?await evaluate(tempChess.fen(),m):
      await generateMove(
        tempChess.moves(),
        depth+1,
        flip(m),
        tempChess.fen(),
        "",
        alpha,
        beta
      );

      if (tempChess.in_check()) pot+=0.1;
      memo.set(tempChess.fen(),pot);
      }
      //if (depth>1)  //memo.set(tempChess.fen(),pot);
      //console.log(pot);
      if (pot>alpha) {
        alpha=pot;
        bestMove=legalMoves[t];
      }

      if (beta<=alpha) {
        break;
        //prune branch
      }
    }
  } else {
    for (let t in legalMoves) {
      ps++;
      var tempChess=new Chess(fen);
      tempChess.move(legalMoves[t]);
      var pot;
      if (caches.has(fen.split(" ")[0]+" "+opp_clr)) {
        c++;
        pot=parseInt(await caches.get(fen.split(" ")[0]+" "+opp_clr));
      } else if (memo.has(tempChess.fen())) {
        pot=memo.get(tempChess.fen());
        cm++;
      } else {
      pot=(depth==search_depth)?await evaluate(tempChess.fen(),flip(m)):
      await generateMove(
        tempChess.moves(),
        depth+1,
        m,
        tempChess.fen(),
        "",
        alpha,
        beta
      );
      if (tempChess.in_check()) pot-=-0.1;
      memo.set(tempChess.fen(),pot);
      }

      if (pot<beta) {
        beta=pot;
        bestMove=legalMoves[t];
      }

      if (beta<=alpha) {
        break;
      }
    }
  }

  if (depth==1) {
    console.log((m==0)?"Lambda Zero-A's":"Lambda Zero-B's", " recommended move is : ", bestMove);
    console.log("Searched ", ps, " positions. Cached ", c, "times. Memoized ", cm, " times.");
    c=0;cm=0;ps=0;
  }

  let e=(m==0)?alpha:beta;

  if (depth==1) {
    update_eval(e);
    console.log("Evaluation: ",e);
  }

  if (m==0&&e>1||m==1&&e<-1) {
    console.log(e, bestMove);
  }
  return e;
}

function flip(m) {
  return (m==0)?1:0;
}

function sum(fen) {
  let fenSum = 0;

  fen = (fen.split(" "))[0];

  for (let i in fen) {
    let char = fen[i];
    fenSum += key(char);
  }

  return fenSum;
}

function key(piece) {
  let i=(piece.toUpperCase()==piece)?1:-1;
  piece=piece.toLowerCase();
  if (piece=="p") {
  return i;
  } 
  if (piece=="n") {
    return 3*i;
  } 
  if (piece=="b") {
    return 3.5*i;
  }
  if(piece=="r") {
    return 5*i;
  }
  if (piece=="q") {
    return 9*i;
  }
  if(piece=="k") {
    return 1000*i;
  }

  return 0;
}

async function evaluate(fen,m,moves) {
  let r=0,a=0,o=0,s=sum(fen);

  // take into account who is attacking
  a=(m==0)?capture_cnt(moves)/moves.length:-capture_cnt(moves)/moves.length;

  // account for number of legal moves
  o=(m==0)?moves.length/200:-moves.length/200;

  // use nn as a tie breaker
  if (a+o+s==0) {
     r=((
        lzeroC.predict(
          tf.tensor(
            [
                fen_encode(
                  fen
                  .split(" ")
                  .slice(0,6)
                  .join(" ")
                )
            ]
            ,
            [1,13,8,8]
          )
        )
      ));
    r=await r.array();
    r=r[0][0];
  }

  return s+r+(a/2)+o;
}

function update_eval(e) {
  var r=document.querySelector(":root");
  var s=(329.75-(dp(e,3)*20))+"px";
  r.style.setProperty('--h',s);
}

// returns the position evaluation and logs the 
// best move given the search_depth
async function mini_max(alpha,beta,legal_moves,depth,move,fen) {

  let evl=(move==0)?-Infinity:Infinity;
  let best_move;

  for (let i in legal_moves) {
    ps++;
    const pre_vl=evl;
    let candidate=legal_moves[i];

    let local_chess=new Chess(fen);
    local_chess.move(candidate);

    let key_fen=local_chess.fen().split(" ").slice(0,2).join(" ");

    // update eval if cache exists
    if (caches.has(key_fen)) {
      c++;
      evl=(move==0)?(
        (caches.get(key_fen)>evl)?
        caches.get(key_fen):
        evl
      ):(
        (caches.get(key_fen)<evl)?
        caches.get(key_fen):
        evl
      );
    }

    // update eval if it has been memoized
    else if (memo.has(local_chess.fen())) {
      cm++;
      evl=(move==0)?(
        (memo.get(local_chess.fen())>evl)?
        memo.get(local_chess.fen()):
        evl
      ):(
        (memo.get(local_chess.fen())<evl)?
        memo.get(local_chess.fen()):
        evl
      );
    }

    // update eval if leafnode [&&candidate[candidate.length-1]!='+']
    else if (depth==depth_limit||(depth>=search_depth&&candidate[2]!='x'&&candidate[1]!='x'&&candidate[candidate.length-1]!='+')) {
      let nn_evl=await evaluate(key_fen,flip(move),local_chess.moves());
      evl=(move==0)?(
        nn_evl>evl?nn_evl:evl
      ):(
        nn_evl<evl?nn_evl:evl
      );
    }

    // assume move and recurse to greater depth
    else {
      let recurse_result=await mini_max(
        alpha,beta,await sort(local_chess.moves()),
        depth+1,flip(move),
        local_chess.fen()
      );

      evl=(move==0)?(
        evl>recurse_result?
        evl:
        recurse_result
      ):(
        evl<recurse_result?
        evl:
        recurse_result
      );
    }
    // track best move
    best_move=(pre_vl==evl)?best_move:candidate;

    // track super searches
    supers=(depth>search_depth)?supers+1:supers;
    mx_s=(depth>mx_s)?depth:mx_s;
    
    // alpha beta prune:
    alpha=(move==0)?(
      evl>alpha?
      evl:
      alpha
    ):alpha;
    beta=(move==1)?(
      evl<beta?
      evl:
      beta
    ):beta;

    if (beta<=alpha) {
      prunes+=Math.pow(legal_moves.length-i,search_depth-depth);
      break;
    }
  }

  // if done, output best move and eval
  if (depth==1) {
    console.log("-------");
    console.log("Best Move: ", best_move, "[", evl,"]");
    console.log("Total Postions Searched: ", ps);
    console.log("Positions Cached ",c);
    console.log("Positions memoized: ", cm);
    console.log("Approximate positions pruned: ", parseInt(prunes));
    console.log("Super Searches: ", supers);
    console.log("Max depth hit: ", mx_s);
    ps=0;c=0;cm=0;prunes=0;supers=0,mx_s=0;

    make_move(best_move);
    eval_update(evl);

    if (chess.moves().length==0) alert("Game Over!")
  }

  // memoize
  let local_chess=new Chess(fen);
  local_chess.move(best_move);
  memo.set(local_chess.fen(),evl);
  
  return evl;
}

// prioritizes more forcing moves
async function sort(moves) {
  let capts=[];
  let els=[];
  for (let m in moves) {
    let move=moves[m];
    if (move[1]=='x'||move[move.length-1]=='+') {
      capts.push(move);
    } 
    else {
      els.push(move);
    }
  }

  let out=[];
  for (let i in capts) out.push(capts[i]);
  for (let i in els) out.push(els[i]);

  return out;
}

// count forcing moves
function capture_cnt(moves) {
  let cnt=0;
  for (let i in moves) {
    let move=moves[i];
    cnt=(move[1]=='x'||
    move[move.length-1]=='+'
    )?cnt+1:cnt;
  }
  return cnt; 
}

function update_ascii_board() {
  //let b=document.getElementById('ascii-board');
  let ascii=trim(chess.ascii());
  
  let t=0;
  for (let r=0;r<8;r++) {
    for (let c=0;c<8;c++) {
      let d=document
      .getElementById(id_ify(r,c));

      let char=emojify(ascii[t]);
      t++;
      if (char=='\n') {
        c--;
        continue;
      }
      d.innerText=char;
    }
  }
  
  //b.innerText=out.slice(0,out.length-5);
}

function id_ify(r,c) {
  let rank=8-r;
  let file=ind_to_rank[c];

  let s=file+rank.toString();
  return s;
}

let ind_to_rank={
  0:'a',
  1:'b',
  2:'c',
  3:'d',
  4:'e',
  5:'f',
  6:'g',
  7:'h'
}

function trim(ascii) {
  let out='',o=0,bs=0;
  for (let i=0;i<ascii.length;i++) {
    switch (ascii[i]) {
      case '-': continue;
      case '_': continue;
      case '+': continue;
      case '|': continue;
      case ' ': continue;
      case 'b': bs++;
    }

    if (!isNaN(parseInt(ascii[i]))) continue;
    
    if (ascii[i]=='b'&&bs==3) break;
    else if (ascii[i]=='.') out+=' ';
    else out+=ascii[i];

    o++;
  }
  return out;
}
function make_move(move,type='generated') {
  if (type=='input') move=move.value;
  
  if (!(chess.moves().includes(move))) return 0;

  chess.move(move);

  document.getElementById('played-moves').innerHTML+=move+'<br>';
  update_ascii_board();

  return 0;
}

function is_lower(char) {
  if (!char) return false;
  return (char.toUpperCase()!=char);
}

function eval_update(e) {
  var r=document.querySelector(":root");
  var s=(329.75-(dp(e,3)*20))+"px";
  r.style.setProperty('--h',s);
  document.getElementById('eval-box').innerText='Eval: '+dp(e,3);
}


function dp(n,b) {
  let x=Math.pow(10,b);
  return Math.round(n*x)/x;
}

function emojify(char) {
  if (!isNaN(parseInt(char))) 
    return '';

  switch(char) {
    case 'r': return '♜';
    case 'n': return '♞';
    case 'b': return '♝';
    case 'q': return '♛';
    case 'k': return '♚';
    case 'p': return '♟';

    case 'R': return '♖';
    case 'N': return '♘';
    case 'B': return '♗';
    case 'Q': return '♕';
    case 'K': return '♔';
    case 'P': return '♙';

    case '.': return '';
    case '-': return '-';
    case '+': return '.+.';
    
    case 'a': return '';
    case 'c': return '';
    case 'd': return '';
    case 'e': return '';
    case 'f': return '';
    case 'g': return '';
    case 'h': return '';
  }

  return char;
}
fn("update");
//update_ascii_board();
window.fn=fn;
window.load_caches=load_caches;
window.update_ascii_board=update_ascii_board;
window.make_move=make_move;
 