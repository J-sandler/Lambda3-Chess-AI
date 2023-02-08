//globals
var draggedRef = null;
const moves=[];
let winner="black";
var gameEnd=false;
var tempEval=0;
var moveNum=1;
var mve=0;
var update=false;
const tolerance=1.5;

//event listeners
// document.addEventListener("dragstart", event => {
//     draggedRef = event.target;
// });

// document.addEventListener("dragover", event => {
//   event.preventDefault();
// });

// document.addEventListener("drop", event => {
//   if(gameEnd) {alert(winner + " has won the game!");return;}
//   const move=document.getElementById("move");

//   if(event.target.id[0]!=draggedRef.id[0]) {
//     if(move.className[0]!=draggedRef.id[0]||!isvalid(
//     draggedRef.parentNode.id.slice(1),
//     event.target.id.slice(1),draggedRef.id.slice(1),
//     event.target.id[0]!='e',
//     event
//     )) {return;}

//     event.preventDefault();
//     movePiece(event);
//   } 
// });

//ugly functions that have to be here because js sucks.
let p1Cpu=false;
let p2Cpu=false;
function removeHighlights() {
  const highlights = document.querySelectorAll(".highlight");
  highlights.forEach(highlight=>
    {
      highlight.classList.remove("highlight");
    })
}

function isvalid(from, to, piece, is_capture, event) {
  let color=draggedRef.id[0];
  //fix to if necessary
  if (is_capture) {to=event.target.parentNode.id.slice(1);}
  let x=moves_update(color,is_capture,piece,from,to,"return");
  let movesText=(document
  .getElementById(
    'legal-moves'
  )
  .innerText)
  .split(",");

  for (let m in movesText) {
    let z=movesText[m];
    if (z==x) break;
    if (m==movesText.length) return false;
  }

  moves_update(color,is_capture,piece,from,to);
  update_board_internals(from,to,piece,color);

  return true;

  // //establish x and y movement 
  // let y=parseInt(to[1])-parseInt(from[1]);let x=parseInt(to[0],18)-parseInt(from[0],18);
  // x=Math.abs(x);
  // y=(piece!="pawn")?Math.abs(y):y;
  
  // //save initial values to avoid mutation
  // const iy=parseInt(to[1])-parseInt(from[1]);
  // const ix=parseInt(to[0],18)-parseInt(from[0],18);
  
  // //evaluate x and y movement given the piece moving
  // if (piece=="pawn") {
  //   let starting_rank=parseInt(from[1]);
  //   if (!is_capture) {
  //     if (x) {
  //       //unless is enpassant
  //       return false;
  //     }
  //   } 

  //   if (color=="b") {y=-y;}

  //   if(is_capture) {
  //     if (x>1||y!=1||x==0) {
  //       return false;
  //     }
  //   }

  //   if(y==2) {
  //     if(starting_rank!=7&&starting_rank!=2) {
  //       return false;
  //     }
  //   }

  //   if(y<0||y>2) {
  //     return false;
  //   }

  // } else if (piece=="bish") {
  //   if(y!=x) {
  //     return false;
  //   }
  // } else if (piece=="knight") {
  //   let val=((y==2&&x==1)||(x==2&&y==1));
  //   if (!val) {
  //     return false;
  //   } 
  // } else if (piece=="king") {
  //   if(x>1||y>1) {
  //     //unless castle is valid [temp]
  //     return false;
  //   }
  // } else if (piece=="queen") {
  //   let val=(y==0||x==0||y==x);
  //   if(!val) {
  //     return false;
  //   }
  // } else if (piece=="rook") {
  //   if(y!=0&&x!=0) {
  //     return false;
  //   }
  // } else {
  //   alert("You broke the game!, How??");
  // }

  // //update eval [temporary]:
  // if (is_capture) {
  //   if (color=="w") {
  //     tempEval+=piece_val(event.target.id.slice(1));
  //   } else {
  //     tempEval-=piece_val(event.target.id.slice(1));
  //   }
  // }

  // if (!is_clear_path(from,ix,iy,piece)) return false;

  // if (is_capture) {
  //   if(event.target.id.slice(1)=="king") {
  //     if (color=="w") {winner="white";}
  //     alert(winner + " has won the game!");
  //     gameEnd=true;
  //     return false;
  //   } 
  // }
}

//helper method for move notation
function filt(piece,is_capture,from) {
  var r=(piece=="knight")?"N":piece[0].toUpperCase();
  r=(piece=="pawn"&&is_capture)?from[0]:r;
  r=(piece=="pawn"&&!is_capture)?"":r;
  return r;
}

function piece_val(piece) {
  if (piece=="pawn") {
    return 1;
  } 
  if (piece=="knight"||piece=="bish") {
    return 3;
  } 
  if(piece=="rook") {
    return 5;
  }
  return (piece=="queen")?9:9999;
}

//eval mechanics:
async function get_eval() {
  let a=lzero_predict();
  return (Math.abs(a)>12)?((a<0)?-12:12):a;
}

//update eval bar
async function eval_update(e) {
  var r=document.querySelector(":root");
  var s=(329.75-(dp(e,3)*20))+"px";
  r.style.setProperty('--h',s);
}

//updates moves column
function moves_update(color,is_capture,piece,from,to,type="update") {
  if(moves.length>=60&&type=="update")return;

  var txs=(is_capture)?"x":"";
  var mv=filt(piece,is_capture,from)+txs+to;
  if (type=="update") moves.push(mv);
  else return mv;

  var el=document.getElementById("played-moves");
  var txt=(color=="w")?moveNum+ ": "+moves[moves.length-1]:" "+moves[moves.length-1]+"<br>";

  txt=(is_check())?txt+"+":txt;
  
  if (type=="update") {
    el.innerHTML+=txt;
    moveNum=(color=="b")?moveNum+1:moveNum;
  }
}

//evaluates check
function is_check() {
  //[temp implementation]:
  return false;
}

//moves piece once move is determined to be valid
async function movePiece(event,piece) {
  removeHighlights();

  const pc=event.target.className=="piece";
  const p=(pc)?event.target.parentNode:event.target;

  p.innerHtml="";
  if (pc) p.removeChild(event.target);
  p.classList.add("highlight");
  draggedRef.parentNode.classList.add("highlight");
  p.id=(draggedRef.id[0]+p.id[1]+p.id[2]);
  draggedRef.parentNode.id="e"+draggedRef.parentNode.id[1]+draggedRef.parentNode.id[2];
  draggedRef.parentNode.removeChild(draggedRef);
  p.appendChild(draggedRef);

  //update move:
  if (move.className=="w") {
    move.classList.remove("w");
    move.classList.add("b");
    } else {
    move.classList.remove("b");
    move.classList.add("w");
  }

  //update eval:
  // mve=(mve==0)?1:0;
  // var el=document.getElementById("eval-box");
  // let e=await get_eval();

  // var s="eval: "+dp(e,3);
  // el.innerText=s;
  // fn("update");
}

//prevents pieces from jumping over other pieces
function is_clear_path(from,ix,iy,piece) {
  ind(from);
  if (piece=="knight") return true;
  //evaluate straight moves:
  if (!ix) {
    if(iy<0) {
      for (let i=-1;i>iy;i--) {
        const sqr=(from[0]+((parseInt(from[1]))+i).toString());
        const inds=ind(sqr);
        if (!document.getElementById(getSquare[inds[0]][inds[1]])) return false;
      }
    } else {
      for (let i=1;i<iy;i++) {
        const sqr=(from[0]+((parseInt(from[1]))+i).toString());
        const inds=ind(sqr);
        if (!document.getElementById(getSquare[inds[0]][inds[1]])) return false;
      }
    }
    return true;
  }

  if (!iy) {
    if(ix<0) {
      for (let i=-1;i>ix;i--) {
        const inds=[];
        inds.push(8-parseInt(from[1]));
        inds.push((parseInt(from[0],18)-10)+i);
        if (!document.getElementById(getSquare[inds[0]][inds[1]])) return false;
      }
    } else {
      for (let i=1;i<ix;i++) {
        const inds=[];
        inds.push((8-parseInt(from[1])));
        inds.push((parseInt(from[0],18)-10)+i);
        if (!document.getElementById(getSquare[inds[0]][inds[1]])) return false;
      }
    }
    return true;
  }
  //evaluate diagonal moves:
  if (iy<0) {
    if (ix<0) {
      for(let i=-1;i>iy;i--) {
        const inds=[];
        inds.push((8-parseInt(from[1]))-i);
        inds.push((parseInt(from[0],18)-10)+i);
        if (!document.getElementById(getSquare[inds[0]][inds[1]])) return false;
      }
    } else {
      for(let i=-1;i>iy;i--) {
        const inds=[];
        inds.push((8-parseInt(from[1]))-i);
        inds.push((parseInt(from[0],18)-10)-i);
        if (!document.getElementById(getSquare[inds[0]][inds[1]])) return false;
      }  
    }
  } else {
    if (ix<0) {
      for(let i=1;i<iy;i++) {
        const inds=[];
        inds.push((8-parseInt(from[1]))-i);
        inds.push((parseInt(from[0],18)-10)-i);
        if (!document.getElementById(getSquare[inds[0]][inds[1]])) return false;
      }
    } else {
      for(let i=1;i<iy;i++) {
        const inds=[];
        inds.push((8-parseInt(from[1]))-i);
        inds.push((parseInt(from[0],18)-10)+i);
        if (!document.getElementById(getSquare[inds[0]][inds[1]])) return false;
      }  
    }
  }
  return true;
}

function ind(from) {
  const out=[];
  out.push(8-parseInt(from[1]));
  out.push((parseInt(from[0],18)-10));
  return out;
}

//helper map:
const getSquare=[
  ["ea8","eb8","ec8","ed8","ee8","ef8","eg8","eh8"],
  ["ea7","eb7","ec7","ed7","ee7","ef7","eg7","eh7"],
  ["ea6","eb6","ec6","ed6","ee6","ef6","eg6","eh6"],
  ["ea5","eb5","ec5","ed5","ee5","ef5","eg5","eh5"],
  ["ea4","eb4","ec4","ed4","ee4","ef4","eg4","eh4"],
  ["ea3","eb3","ec3","ed3","ee3","ef3","eg3","eh3"],
  ["ea2","eb2","ec2","ed2","ee2","ef2","eg2","eh2"],
  ["ea1","eb1","ec1","ed1","ee1","ef1","eg1","eh1"]
];

function reset() {
  location.reload();
}

function cpuToggle(n) {
  p1Cpu=(n==1)?true:p1Cpu;
  p2Cpu=(n==2)?true:p2Cpu;
}

function update_board_internals(from,to,piece,clr) {
  let fr=ind(from);
  let t=ind(to);
  boardinternals[fr[0]][fr[1]]=0;
  boardinternals[t[0]][t[1]]=key(piece)*((clr=="b")?-1:1);
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

  if (piece=="pawn") {
    return 1;
  } 
  if (piece=="knight") {
    return 3;
  } 
  if (piece=="bish") {
    return 3.5;
  }
  if (piece=="rook") {
    return 5;
  }
  if (piece=="queen") {
    return 9;
  }
  if (piece=="king") {
    return 1000;
  }
  return 0;
}


function serialize(board,clr="w") {
  const out=[]; let d=clr=="w"?1:-1;
  for(let r=0;r<8;r++) {
    for (let j=0;j<8;j++) {
      out.push(board[r][j]*d);
    }
  }
  return out;
}

function dp(n,b) {
  let x=Math.pow(10,b);
  return Math.round(n*x)/x;
}

//converts fen notation to board internals notation:
let testFen="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
function fen2bi(fen,m) {
  let d=(m=="w")?-1:1;
  let arr=fen.split("/");
  let out=[];
  for (i in arr) {
    let row=[];
    for (let a=0;a<8;a++) {row.push(0);}
    let c=0,a=0;
    while(a<arr[i].length) {
      let char=arr[i][a];
      if(parseInt(char)) {
        let z=parseInt(char);
        c+=(z);
        a++;
      } else {
        row[c]=key(char)*d;
        c++;
        a++;
      }
    }
    out.push(row);
  }
  return out;
}

function I(clr) {
  return (clr=="w")?1:-1;
}

const sigmoid = (x) => {
  return (Math.exp(x) / (Math.exp(x) + 1))-0.5;
};

function sum(board) {
  let s=0;
  if(board.length<64) {
    for (let i in board) {
      for (let r in board[i]) {
        s+=board[i][r];
      }
    }
    return parseInt(s);
  }

  for (let z=0;z<board.length;z++) {
    s+=board[z];
  }
  return parseInt(s);
}

async function lzero_predict() {
  return 0;
  return (getmve()==0) ? 
    ((await lzeroC.predict(
      tf.tensor(
        [
          boardinternals
        ],[1,13,8,8]
      )
    )).array()):
    ((await lzeroD.predict(
      tf.tensor(
        [
          boardinternals
        ],[1,13,8,8]
      )
    )).array());
}

function getmve() {
  return mve;
}

//reads and processes training file:
function helper(input) {
  let file=input.files[0];
  let reader=new FileReader();
  
  reader.readAsText(file);
  reader.onload=function() {
    let lines=reader.result.split("\n");
    let i=0, j=0;
	  for (let l in lines) {
      // let line=lines[l].split(",")
      // let fen=((line.split(","))[0]);
      // console.log(fen)

      // let clr=line[1];let eval=parseInt(line[6]);

      // // account for bad format:
      // eval=(isNaN(eval))?
      // parseInt((lines[l].split(","))[1]):
      // eval;
      if ((lines[l].split(","))[0]==="FEN") continue;
      
      let line=lines[l].split(",");
      let fen=line[0];
      let eval=parseInt(line[1]);
      let clr=(fen.split(" "))[1];
      //account for checkmate:
      eval=(isNaN(eval))?(
        clr=="b"?
        Infinity:
        -Infinity
      ):(
        eval
      );
      
      
      // cap the eval at +/-tolerance [temporary]
      eval=(eval<-tolerance)?-tolerance:eval;
      eval=(eval>tolerance)?tolerance:eval;
      
      // separate white and black,
      // if (clr=="w"&&!isNaN(eval)&&i<train_size) {
      //   wpos[i]=fen_encode(fen);
      //   wevals[i]=eval;
      //   i++;
      // } else if (clr=="b"&&!isNaN(eval)&&j<train_size) {
      //   bpos[j]=fen_encode(fen);
      //   bevals[j]=eval;
      //   j++;
      // }

      if (!isNaN(eval)&&i<train_size) {
        wpos[i]=fen_encode(fen);
        wevals[i]=eval;
        i++;
      }

      if (i>=train_size) {
        console.log(i, 'Inputs proccessed');
        train();
        return 0;
      }

      // if (i+j>=(2*train_size)) {
      //   console.log(i+j, 'Inputs proccessed');
      //   train();
      //   return 0;
      // }
    }
  }
}

function fen_sum(fen) {
  let fenSum = 0;

  for (let i in fen) {
    let char = fen[i];
    fenSum += key(char);
  }

  return fenSum;
}

function fen_encode(fen) {
  fen = fen.split(" ");
  let board_string = fen[0].split("/");
  let out=compile_frames();

  // add pieces
  for (let r in board_string) {
    for (let c=0;c<8;c++) {
      let ind=p_ind[board_string[r][c]];

      // skip invalIds
      if (!ind) continue;

      // place piece
      out[ind][r][c]=1; 
    }
  }
  // add meta data
  let rest=fen.slice(1,fen.length);

  for (let i in rest) {
    if (rest[i]=="b") {
      out[12][0][0]=1;
    }
    else if (rest[i][0]=="K"||rest[i][0]=="Q"||rest[i][0]=="k") {
      for (let a=0;a<rest[i].length;a++) {
        let ind=rest[i][a]=="K"?1:(
          rest[i][a]=="Q"?2:(
            rest[i][a]=='k'?3:4
          )
        );
        out[12][0][ind]=1;
      }
    }
    else if (is_square(rest[i])) {
      // give square a key
      let key=(parseInt(rest[i][0],18)*10)+parseInt(rest[i][1]);
      out[12][0][5]=key;
    }
  }

  for (let i=0;i<7;i++) out[12].push(out[12][0]);

  return out;
}

function compile_frames() {
  const out=[];
  for (let i=0;i<12;i++) {
    let board=[];
    
    for (let a=0;a<8;a++) {
      let row=[];
      for (let b=0;b<8;b++) row.push(0);

      board.push(row);
    }
    out.push(board);
  }

  let meta=[]; for (let b=0;b<8;b++) meta.push(0);
  out.push([meta]);

  return out;
}

function is_square(str) {
  return (
    !isNaN(parseInt(str[0],18))
    &&!isNaN(parseInt(str[1]))
    &&str.length==2);
}

const p_ind={
  "Q":0,"q":1,
  "K":2,"k":3,
  "R":4,"r":5,
  "B":6,"b":7,
  "N":8,"n":9,
  "P":10,"p":11
}

// fen_encode("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e4 0 1");
//console.log(compile_frames());
window.getmve=getmve;
window.sigmoid=sigmoid;

