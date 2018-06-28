var width = 30;
var height = 30;

var lambda = 50;

var mainCanvas = document.getElementById('mainCanvas');
var shadowCanvas = document.getElementById('shadowCanvas');
var resultCanvas = document.getElementById('resultCanvas');

var mainCtx = mainCanvas.getContext('2d');
var shadowCtx = shadowCanvas.getContext('2d');
var resultCanvasCtx = resultCanvas.getContext('2d');

var imageObj = new Image();
var $message = document.getElementById('message');

var $histBack = document.getElementById('histBack');
var $histFore = document.getElementById('histFore');

// controle
const l = 10; // lado do quadrado de de inclusão
var ativaMarcaRegiao = 0;
var marcarBackground = 1;
var marcarForeground = 0;

// imageObj.src = './darth-vader.jpg';
imageObj.src = './teste2.png';
imageObj.onload = function() {
  mainCtx.drawImage(imageObj, 0, 0);
  shadowCtx.drawImage(imageObj, 0, 0);
  resultCanvasCtx.drawImage(imageObj, 0, 0);
};

// events
window.addEventListener("load", function() {
    updateMessage();
});

mainCanvas.addEventListener('mousemove', function(evt) {
    marcaregiao(mainCanvas, mainCtx, evt);
}, false);

mainCanvas.addEventListener('click', function() {
  ativaMarcaRegiao = !ativaMarcaRegiao;
  if(!ativaMarcaRegiao) {
    let before = (new Date()).getTime();
    execCut();
    let after = (new Date()).getTime();
    console.log('decorrido:', (after - before) / 1000)
  }
});

document.addEventListener('keyup', function(e) {
    var c = e.which;
    if(c == 66) { // b
        marcarBackground = 1;
        marcarForeground = 0;
    } else if(c == 70) { // f
        marcarForeground = 1;
        marcarBackground = 0;
    }
    updateMessage();
});

lambdaDOM = document.getElementById('lambda');
lambdaDOM.addEventListener('change', function() {
  lambda = lambdaDOM.value;
  console.log('lambda', lambda);
  let before = (new Date()).getTime();
  execCut();
  let after = (new Date()).getTime();
  console.log('decorrido:', (after - before) / 1000)
})


function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}
  
// Desenha retângulo e adiciona pontos
function marcaregiao(canvas, ctx, evt) {
  var mousePos = getMousePos(canvas, evt);
  var x = parseInt(mousePos.x);
  var y = parseInt(mousePos.y);

  if(ativaMarcaRegiao) {

    drawCircle(x, y, ctx);

    if(marcarBackground) {
      addRectToBackground(x, y);
    } else if(marcarForeground) {
      addRectToForeground(x, y);
    }

  }
}

function drawCircle(x, y, ctx) {
  ctx.beginPath();
  ctx.rect(x-l/4, y-l/4, l/2, l/2);
  if(marcarBackground) {
    ctx.fillStyle = "blue";
  } else if(marcarForeground) {
    ctx.fillStyle = "red";
  }
  ctx.fill();
}

function updateMessage() {
  if(marcarForeground) {
    $message.innerHTML = 'Seleção FOREGROUND';
    $message.style.background = 'red';  
  } else if(marcarBackground) {
    $message.innerHTML = 'Seleção BACKGROUND';
    $message.style.background = 'blue'; 
  } else {
    $message.innerHTML = '';
  } 
}

// armazenamento de pontos selecionados

// Matrix. Pontos adicionas sõa marcados com 1.
// get() retorna 0 para pontos não adicionados
// ou removidos
var M = (function() {

  var not_set_value = 0;

  function M() {
      this._m = [];
  }

  M.prototype.addPixel = function(x, y, w) {
      if(this._m[x] == undefined) this._m[x] = [];
      this._m[x][y] = w;
  }

  M.prototype.getPixel = function(x, y) {
      if(this._m[x] === undefined 
          || this._m[x][y] === undefined) {
          return not_set_value;
      }
      return this._m[x][y];
  }

  M.prototype.getMatrix = function() {
    return this._m;
  }

  return M;

})();

var MB = new M(); // Matrix com background
var MF = new M(); // Matrix com foreground

function addRectToBackground(x, y) {
    addRect(x, y, false);
}

function addRectToForeground(x, y) {
    addRect(x, y, true);
}

function addRect(x, y, isObj) {
  var xi = parseInt(x - l/4);
  var xf = parseInt(x + l/2);
  var yi = parseInt(y - l/4);
  var yf = parseInt(y + l/2);

  var fnAdd = isObj ? MF : MB;

  // TODO: respeitar limites da imagem
  for(i = xi; i < xf; i++) {
    for(j = yi; j < yf; j++) {
      fnAdd.addPixel(i, j, 1);
    }
  }
}

// Acesso imagem | TODO: não pegar pixel da imagem do canvas...
function getColor(x, y, ctx) {
  var pixel = ctx.getImageData(x, y, 1, 1);
  var data = pixel.data;
  // Considera imagem grey scale
  // return [data[0], data[1], data[2], (data[3] / 255)]
  return data[0];
}
// setTimeout(function() {
//   execCut();
// }, 100);
// Segmentação...
function execCut() {
    
  //// Geração histogramas...
  histBack = [];
  histFore = [];
  for(i = 0; i < width; i++) {
    for(j = 0; j < height; j++) {
      var c = getColor(i, j, shadowCtx);
      if(MB.getPixel(i, j)) {
        if(histBack[c] === undefined) histBack[c] = 0;
        histBack[c] += 1;
      }
      if(MF.getPixel(i, j)) {
        if(histFore[c] === undefined) histFore[c] = 0;
        histFore[c] += 1; 
      }
    }
  }
  // add zeros para frequencia nao existentes
  for(i = 0; i < 256; i++) {
    if(histBack[i] === undefined) histBack[i] = 0;
    if(histFore[i] === undefined) histFore[i] = 0;
  }
  
  // atualiza view de histograma  
  $histBack.innerHTML = histBack.join(',');
  $histFore.innerHTML = histFore.join(',');
  updateHist();

  // soma (qtd amostras)
  somaBack = histBack.reduce((a,b)=>a+b, 0);
  somaFore = histFore.reduce((a,b)=>a+b, 0);
      
  // R("obj") - penalties para obj
  function RFore(v) {
    let a = 1 - Math.exp( -1 * (histFore[v] / somaFore) );
    // TODO: remover isNan inicializar histrograma
    return isNaN(a) ? 0.1 : a;
  }

  // R("bkg") - penalties para "bkg"
  function RBack(v) {
    let a = 1 - Math.exp( -1 * (histBack[v] / somaBack) );
    // TODO: remover isNan inicializar histrograma
    return isNaN(a) ? 0.1 : a;
  }
  // Bpq - boundary penalty
  function B(vp, vq) {
    // Penalização linear independente do par de pixel
    // deveria: penalizar mais por descontinuidade em 
    // pixel semelhantes (ruído) e penalizar menos por
    // descontinuidades em pixel diferentes
    return Math.exp( -1 * Math.abs(vp-vq)/255 );
  }

  //// Arestas
  // Qtd.. width*height*6 + width*height*4 - (2*(width+height)-1)

  // S e T adicionados no final
  let S = width*height;
  let T = width*height + 1;

  let K = 1.1; // maior B possível é 1

  var N = new M();
  for(i = 0; i < width; i++) {
    for(j = 0; j < height; j++) {

      let from = i * width + j;

      // cor/intensidade do pixel
      let pValue = getColor(i, j, shadowCtx); 

      /* Pares {p, q} 8-neighborhood */
      // Conexão abaixo
      if(i < width-1) {
        var qValue = getColor(i+1, j, shadowCtx);
        var value = B(pValue, qValue);
        let to = (i+1)*width + j;
        N.addPixel(from, to, value);
        N.addPixel(to, from, value);
      }
      // Conexão a direita
      if(j < height-1) { 
        var qValue = getColor(i, j+1, shadowCtx);
        var value = B(pValue, qValue);
        let to = i*width + j+1;
        N.addPixel(from, to, value);
        N.addPixel(to, from, value);
      }
      // Conexão diagonal direita-baixo
      if(i < width-1 && j < height-1) {
        var qValue = getColor(i+1, j+1, shadowCtx);
        var value = B(pValue, qValue);
        let to = (i+1)*width + j+1;
        N.addPixel(from, to, value);
        N.addPixel(to, from, value);
      }
      // Conexão diagonal direita-superior
      if(i > 0 && j < height-1) {
        var qValue = getColor(i-1, j+1, shadowCtx);
        var value = B(pValue, qValue);
        let to = (i-1)*width + j+1;
        N.addPixel(from, to, value);
        N.addPixel(to, from, value);
      }

      // conexão com S e T
      let pesoS; let pesoT;

      if(MF.getPixel(i, j)) { 
        // p se encontra em O
        pesoS = K; 
        pesoT = 0;
      } else if(MB.getPixel(i, j)) { 
        // p se encontra em B
        pesoS = 0;
        pesoT = K;
      } else {
        var pixelValue = getColor(i, j, shadowCtx);
        pesoS = lambda * RBack(pixelValue);
        pesoT = lambda * RFore(pixelValue);
      }

      // conexão com S
      N.addPixel(S, from, pesoS);

      // conexão com T
      N.addPixel(from, T, pesoT);
      N.addPixel(T, from, 0); // para ter linhas completas

    }
  }

  // let graph = N.getMatrix();
  console.log('S', S, 'T', T);
  let nodes = minCut(N, S, T);

  let sourceNodes = nodes[0];
  let sinkNodes = nodes[1];
  let cut = nodes[2];

  console.log('nodesSource', nodes);

  resultCanvasCtx.drawImage(imageObj, 0, 0);

  // desenha resultado no canvas

  // pontos ligados a S
  for(let i = 0; i < sinkNodes.length; i++) {
    let from = sinkNodes[i];
    if(from < width*height) {
      let x = parseInt(from / width);
      let y = from - (x * width);
      drawPixel(resultCanvasCtx, x, y, "rgba(0,255,0,1)");
    }
  }
  // pontos ligados a T
  for(let i = 0; i < sourceNodes.length; i++) {
    let from = sourceNodes[i];
    if(from < width*height) {
      let x = parseInt(from / width);
      let y = from - (x * width);
      drawPixel(resultCanvasCtx, x, y, "rgba(255,255,0,1)");
    }
  }
  // pontos marcados como background
  for(let i in MB._m) {
    for(let j in MB._m[i]) {
      drawPixel(resultCanvasCtx, i, j, "rgba(255,255,0,1)");
      // console.log(i, j, MB._m[i][j]);
    }
  }
  // pontos marcados como foreground
  for(let i in MF._m) {
    for(let j in MF._m[i]) {
      drawPixel(resultCanvasCtx, i, j, "rgba(0,255,0,1)");
      // console.log(i, j, MB._m[i][j]);
    }
  }
  console.log(MB._m);


  // // DESENHO região de corte
  // for(let i = 0; i < cut.length; i++) {
  //   let from = cut[i][0];
  //   let to = cut[i][1];
  //   if(from < width*height && to < width*height) {
  //     let x = parseInt(from / width);
  //     let y = from - (x * width);
  //     drawPixel(resultCanvasCtx, x, y, "#FF0000");

  //     x = parseInt(to / width);
  //     y = to - (x * width);
  //     drawPixel(resultCanvasCtx, x, y, "#000000");

  //     // console.log(from, to);
  //   }
  //   // drawPixel(resultCanvasCtx,cut[i][0],cut[i][1]);
  // }


}

function drawPixel (ctx, x, y, cor) {
  ctx.fillStyle = cor;
  ctx.fillRect(x, y,1,1);
}

// JQUERY CHARTs
function updateHist() {
  $(".bar").peity("bar", {
    height: "100px",
    width: "400px",
    fill: function(_, i, all) {
      var g = parseInt((i / all.length) * 255)
      return "rgb("+g+","+g+", "+g+")"
    }
  })
}