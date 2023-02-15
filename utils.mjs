import {Chess} from './Chess.mjs';
var chess=new Chess();

//---- SETTINGS ---- //
const tree_width=3;
const depth_limit=6;


var memo=new Map();var caches=new Map();
var c=0,cm=0,prunes=0,supers=0,mx_s=0;

const max_caches=Infinity;

const num_games=1000;
let game_thoughts=[];

const end_condition=2;
const heuristics=true;
const prune=true;
const nn=true;
const gen_net=true;
const load=true;
const log=false;

const scores=[0,0,0];

let net;

const hyper_epochs=10;

const evolve_rate=0.01;
const breed_rate=0.005;

const gen_net_size=15;

let generational_net_a;
let generational_net_b;


//---- FUNCTIONS ---- //

// save and load helpers:
async function save_gen_net(net) {
  net = await net;
  for (let i in net[0]) {
    net[0][i]=await net[0][i];
    localStorage.setItem('gen-net-processing-'+JSON.stringify(i),JSON.stringify(net[0][i]));
  }

  net[1]=await net[1];
  localStorage.setItem('gen-net-hidden',
  JSON.stringify(net[1])
  );
}

async function load_gen_net() {
  let out=[];

  for (let i=0;i<13;i++) {
    let str='gen-net-processing-'+JSON.stringify(JSON.stringify(i));
    let x=(JSON.parse(localStorage.getItem(str)));
    out.push(x)
  }
  return [out,(JSON.parse(localStorage.getItem('gen-net-hidden')))];
}

// mega net helpers:
async function compile_mega_net(hidden_layers) {

  let processing_layer=[];
  for (let i=0;i<13;i++) {
    processing_layer.push(
      new NeuralNetwork([64,1])
    );
  }

  let schema=[13];
  for (let i=0;i<hidden_layers;i++) {
    schema.push(96);
  }
  schema.push(1);
  let hidden_body=new NeuralNetwork(schema);
  
  return [processing_layer,hidden_body];
}

async function feed_mega_net(inputs,net) {
  await net;
  let processing_outputs=[];
  for (let i in inputs) {
    let matrix=inputs[i];
    let sub_network_inputs=[];
    for (let r in matrix) {
      for (let c in matrix[r]) {
        sub_network_inputs.push(matrix[r][c]);
      }
    }
    let sub_net_output=await NeuralNetwork.feedForward(sub_network_inputs,net[0][i]);
    processing_outputs.push(sub_net_output);
  }
  let x=parseFloat(await NeuralNetwork.feedForward(processing_outputs,net[1]));

  return x;
}

async function birth_mega_net(net,disimilarity=1) {
  await net;
  let ps=[];
  for (let processor in net[0]) {
    ps.push(NeuralNetwork.birth(net[0][processor],disimilarity));
  }
  return [ps,NeuralNetwork.birth(net[1],disimilarity)];
}

function get_net(move) {
  return move==0?generational_net_a:generational_net_b
}

// main:
async function fn(type="generate") {
  // let move=moves[moves.length-1];
  // chess.move(move);

  const el=document.getElementById("legal-moves");

  const legalMoves=chess.moves();

  el.innerText=legalMoves;

  boardinternals=fen2bi(chess.fen().split(" ")[0]);
  
  let ps=0;
  window.ps=ps;

  if (type=="update") return;
  memo=new Map();
  if (log) console.log("[Generating move at depth", tree_width,"]");


  await mini_max(-Infinity,Infinity,await sort(chess.moves()),1,await get_move(chess),chess.fen(),get_net(await get_move(chess)));
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


// old
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
    await update_eval(e);
    console.log("Evaluation: ",e);
  }

  if (m==0&&e>1||m==1&&e<-1) {
    console.log(e, bestMove);
  }
  return e;
}

async function flip(m) {
  return (m==0)?1:0;
}

async function sum(fen) {
  await fen;
  let fenSum = 0;

  fen = (await fen.split(" "))[0];

  for (let i in fen) {
    let char = fen[i];
    fenSum += await key(char);
  }

  return fenSum;
}

async function key(piece) {
  let i=(piece.toUpperCase()==piece)?1:-1;
  piece=piece.toLowerCase();
  if (piece=="p") {
  return i;
  } 
  if (piece=="n") {
    return 3*i;
  } 
  if (piece=="b") {
    return 3*i;
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

async function evaluate(fen,m,moves,local_chess,net,depth) {
  

  fen=await fen;m=await m;
  net=await net;
  moves=await moves;

  if (await local_chess.in_checkmate()) return (m==1)?-99999.9:99999.9;
  if (await local_chess.in_draw()) return 0;

  let r=0,a=0,o=0,s=0;
  if (nn) {
     r=((
        await lzeroC.predict(
          tf.tensor(
            [
                await fen_encode(
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
    r=(r[0][0]);
  } 

  if (gen_net) {

    for (let n in net[0]) {
      net[0][n]=await net[0][n];
    }

    r=await feed_mega_net(
                await fen_encode(
                  await fen.split(" ")
                  .slice(0,6)
                  .join(" ")),await net);
  }

  if (heuristics) {
    s=await sum(fen);

    // take into account who is attacking
    a=(m==0)?await capture_cnt(moves)/moves.length:(await capture_cnt(moves)*-1)/moves.length;

    // account for piece activity
    o=(m==0)?await activity(moves):await activity(moves)*-1;
  }

  return (s+o+a+r);
}

async function activity(moves) {
  let act=new Map();
  for (let m in moves) {
    if (moves[m].length>2) {
      if (moves[m][moves[m].length-1]=='+'||
      moves[m][moves[m].length-1]=='#') {
        act.set(moves[m].slice(
          moves[m].length-3,
          moves[m].length-1),1);
      } else {
        act.set(moves[m].slice(
          moves[m].length-2,
          moves[m].length),1);
      }
    }
  }

  //console.log(act.size);
  return act.size/64;
}

async function update_eval(e) {
  await e;
  var r=document.querySelector(":root");
  var s=(329.75-(await dp(e,3)*20))+"px";

  s=(s<0)?0:s;s=(s>329.75)?329.75:s;

  await r.style.setProperty('--h',s);
}

// returns the position evaluation and logs the 
// best move given the search_depth
async function mini_max(alpha,beta,legal_moves,depth,move,fen,net) {
  let b_eval,best_move;

  if (Chess(fen).game_over()) {
    b_eval=(move==0)?-99999:99999;
    b_eval=(Chess(fen).in_draw())?0:b_eval;
    memo.set(fen,b_eval);
    return b_eval;
  }

  move=await move;
  // keeps evaluation consistent:
  let search_depth=(move==0)?tree_width:tree_width;

  let best_moves=new Map();

  for (let i in legal_moves) {
    let evl=(move==0)?-99999:99999;

    let candidate=legal_moves[i];

    let local_chess=new Chess(fen);
    local_chess.move(candidate);

    if (local_chess.game_over()) {
      evl=(move==0)?99999.9:-99999.9;

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

      b_eval=(move==0)?99999:-99999;
      b_eval=(Chess(fen).in_draw())?0:b_eval;
      memo.set(fen,b_eval);

      continue;
    } 


    if (await local_chess.in_checkmate()) {
      
    }


    ps++;

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
      best_moves.set(candidate,evl);
      break;
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
    else if (depth>=depth_limit||(depth>=search_depth&&candidate[2]!='x'&&candidate[1]!='x'&&candidate[candidate.length-1]!='+'&&candidate[candidate.length-1]!='#')) {
      let nn_evl=await evaluate(local_chess.fen(),await flip(move),sort(local_chess.moves()),local_chess,net,depth);
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
        depth+1,await flip(move),
        local_chess.fen(),net
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

      // if (local_chess.fen()=='rnbqkbnr/pppp1ppp/8/8/5p2/8/PPPPPPPP/RNBQKB1R w KQkq - 0 3') {
      //   //console.log(await evaluate(key_fen,await flip(move),sort(local_chess.moves()),local_chess,net,depth));
      //   console.log(evl);
      // }
    }

    // track super searches
    supers=(depth>search_depth)?supers+1:supers;
    mx_s=(depth>mx_s)?depth:mx_s;
    

    if (await local_chess.in_draw()) evl=0;

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

    
    // track best move
    best_moves.set(candidate,evl);
   
    // if (candidate=='exf4'||candidate=='Nf4') {
    //   console.log(candidate,evl);
    // }

    if (prune) {
      if (beta<=alpha) {
        prunes+=Math.pow(legal_moves.length-i,search_depth-depth);
        break;
      }
    }
  }

  [best_move,b_eval]=await best(best_moves,move);

  // if done, output best move and eval
  if (depth==1) {
    if (log) {
      console.log(best_moves);
      // let best_move=await best_moves[0];

      console.log("-------");
      console.log("Best Move: ", best_move, "[", b_eval,"]");
      console.log("Total Postions Searched: ", ps);
      console.log("Positions Cached ",c);
      console.log("Positions memoized: ", cm);
      console.log("Approximate positions pruned: ", parseInt(prunes));
      console.log("Super Searches: ", supers);
      console.log("Max depth hit: ", mx_s);
    }

    ps=0;c=0;cm=0;prunes=0;supers=0,mx_s=0;

    game_thoughts.push([chess.fen(),b_eval]);

    await make_move(best_move);
    await eval_update(b_eval);
   
    if (chess.moves().length==0) game_thoughts=[];
  }

  // memoize
  let local_chess=new Chess(fen);
  local_chess.move(best_move);
  memo.set(local_chess.fen(),b_eval);
  
  return b_eval;
}

async function best(best_moves,move) {
  let best_move=""; let b_eval=(move==0)?-Infinity:Infinity;

  for (let [key,value] of best_moves) {
    if (move==0) {
      best_move=(value>b_eval)?key:best_move;
      b_eval=(value>b_eval)?value:b_eval;
    } 
    else {
      best_move=(value<b_eval)?key:best_move;
      b_eval=(value<b_eval)?value:b_eval;
    }
  }
  return [best_move,b_eval];
}

// prioritizes more forcing moves
async function sort(moves) {
  let mts=[];
  let capts=[];
  let els=[];
  for (let m in moves) {
    let move=moves[m];
    if (move[1]=='x'||move[2]=='x'||move[move.length-1]=='+'||move=='O-O'||move=='O-O-O') {
      capts.push(move);
    } 
    else if (move[move.length-1]=='#') {
      mts.push(move);
    }
    else {
      els.push(move);
    }
  }

  let out=[];
  for (let i in mts) out.push(mts[i]);
  for (let i in capts) out.push(capts[i]);
  for (let i in els) out.push(els[i]);

  return out;
}

// count forcing moves
async function capture_cnt(moves) {
  await moves;
  let cnt=0;
  for (let i in moves) {
    let move=moves[i];
    cnt=(move[1]=='x'||
    move[move.length-1]=='+'||
    move[2]=='x'
    )?cnt+1:cnt;
  }
  return cnt; 
}

async function update_ascii_board() {
  //let b=document.getElementById('ascii-board');
  let ascii=await trim(await chess.ascii());
  
  let t=0;
  for (let r=0;r<8;r++) {
    for (let c=0;c<8;c++) {
      let d=document
      .getElementById(await id_ify(r,c));

      let char=await emojify(ascii[t]);
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

async function id_ify(r,c) {
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

async function trim(ascii) {
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
async function make_move(move,type='generated') {
  await move;
  if (type=='input') 
    move=move.value;
  
  // if is fen
  if (move.length>15) {
      chess=new Chess(move);

      if (type!='self-play')
        document.getElementById('played-moves').innerHTML="";

      await update_ascii_board();
      return 0;
  }

  // check legality
  if (!(chess.moves().includes(move))) return 0;

  chess.move(move);

  //console.log(engine.MultiPV(1))

  //document.getElementById('played-moves').innerHTML+=move+'<br>';
  await update_ascii_board();

  return 0;
}

async function is_lower(char) {
  if (!char) return false;
  return (char.toUpperCase()!=char);
}

async function eval_update(e) {
  await e;
  var r=document.querySelector(":root");
  let d=await dp(e,3)*20;
  d=d<0?0:d;d<329.75?329.75:d;d>329.75?329.75:d;

  var s=(329.75-(d))+"px";
  await r.style.setProperty('--h',s);
  document.getElementById('eval-box').innerText='Eval: '+await dp(e,3);
}


async function dp(n,b) {
  let x=Math.pow(10,b);
  return Math.round(n*x)/x;
}

async function emojify(char) {
  if (!isNaN(parseInt(char,10))) 
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

async function get_move(chess) {
  return (chess.fen().split(" ")[1]=='w')?0:1;
}

async function self_play(games) {
  if (gen_net) {
    if (load==true) {
      generational_net_a=await load_gen_net();
      console.log(load_gen_net());
      generational_net_b=await birth_mega_net(generational_net_a,breed_rate);
    }
    else {
      generational_net_a=await compile_mega_net(gen_net_size);
      generational_net_b=await compile_mega_net(gen_net_size);
    }
  } else if (load==true) {
    forge_c(true);
  }

  while (games<num_games) {
    await fn();
    //await update_ascii_board();
    // await $('#reload-me').load(' #reload-me');
    // await $('#reload-me-2').load(' #reload-me-2');

    let x=chess.game_over();
    let s=await sum(await chess.fen());
    x=x||s>=end_condition||s<=-end_condition;

    if (x) {
      let score=0;
      // establish score:
      if (chess.in_checkmate()) {
        score=await get_move(chess)==0?-1:1;
      } 

      await update_net(score,game_thoughts,chess);
      game_thoughts=[];

      chess=new Chess();
      // await update_ascii_board();
      // update_ascii_board();
      // await update_eval(0);
      // update_eval();
      games++;
    }  
  }

  console.log('play completed');
  alert(JSON.stringify(scores));

  //await lzeroC.save('localstorage://lzeroC');
  await save_gen_net(generational_net_a);

  return 0;
}


async function update_net(score,game_thoughts,chess) {
  let poses=[],evals=[];

  score=await sum(chess.fen())<-end_condition?-1:score;
  score=await sum(chess.fen())>end_condition?1:score;

  let parent;

  scores[score+1]++;
  console.log(scores);

  if (gen_net) {
    if (score==0) {
      generational_net_a=await birth_mega_net(generational_net_a,evolve_rate);
      generational_net_b=await birth_mega_net(generational_net_b,evolve_rate);
      return;
    }


    else if (score==1) {
      parent=generational_net_a;
      generational_net_b=await birth_mega_net(parent,breed_rate);
    } else {
      parent=generational_net_b;
      generational_net_a=await birth_mega_net(parent,breed_rate);
    }
  } else {

    for (let p=0;p<game_thoughts.length;p++) {
      let pair=game_thoughts[p];
      let key=score==0?(await lerp(pair[1],(Math.random()*60)-30,evolve_rate)):
      await lerp(pair[1],((Math.random()*60)-30),breed_rate);
      
      let clr=(score==1)?"w":"b";
      
      if (score==0) {
        poses.push(await fen_encode(pair[0]));
        evals.push(key);
      }
      else if (await pair[0].split(" ")[1]==clr&&clr=="b") {
        evals.push(key);
        evals.push(key);
        poses.push(await fen_encode(pair[0]));
      } else if (await pair[0].split(" ")[1]==clr&&clr=="w") {
        if (p>0) {
          evals.push(key);
          evals.push(key);
          poses.push(await fen_encode(pair[0]));
        } else {
          poses.push(await fen_encode(pair[0]));
          evals.push(key);
        }
      } else {
        poses.push(await fen_encode(pair[0]));
      }
      

      // let t=Array(game_thoughts.length).fill(score);
      // let target=await tf.tensor((t),[t.length,1]);

      // let loss = await optimizer.computeGradients(lzeroC, target, tf.tensor([[score]], [1, 1]));
      // console.log(loss);

      // optimizer.applyGradients(await loss.grads);
      }
      let r=await lzeroC.fit(
      tf.tensor(poses,[poses.length,13,8,8]),
      tf.tensor(evals,[evals.length,1]),
      {
        epochs:hyper_epochs,
        kernel_size:3,
        shuffle:true,
        batch_size:poses.length,
        num_workers:1,
      });
      console.log("Loss: ", Math.sqrt(r.history.loss), "Acc: ", r.history.acc);
    
    //await lzeroC.save('localstorage://lzeroC');

    return;
  }

  await save_gen_net(generational_net_a);
}



fn("update");
//update_ascii_board();
window.fn=fn;
window.load_caches=load_caches;
window.update_ascii_board=update_ascii_board;
window.make_move=make_move;
window.mve=mve;
window.self_play=self_play;

//localStorage.clear();
