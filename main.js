// init
var width = 438;
var height = 300;

var mainCanvas = document.getElementById('mainCanvas');
var mainCtx = mainCanvas.getContext('2d');
var shadowCanvas = document.getElementById('shadowCanvas');
var shadowCtx = shadowCanvas.getContext('2d');

var imageObj = new Image();
var $message = document.getElementById('message');

var $histBack = document.getElementById('histBack');
var $histFore = document.getElementById('histFore');


// controle
const l = 30; // lado do quadrado de de inclusão
var ativaMarcaRegiao = 0;
var marcarBackground = 1;
var marcarForeground = 0;

imageObj.src = './darth-vader.jpg';
imageObj.onload = function() {
    mainCtx.drawImage(imageObj, 0, 0);
    shadowCtx.drawImage(imageObj, 0, 0);
};

// events
window.addEventListener("load", function() {
    updateMessage();
});

mainCanvas.addEventListener('mousemove', function(evt) {
    marcaregiao(mainCanvas, mainCtx, evt);

 //    // Teste selação de pixel de shadow e de posição do mouse de maincanvas
    // var mousePos = getMousePos(mainCanvas, evt);
 //    var x = parseInt(mousePos.x);
 //    var y = parseInt(mousePos.y);
    // var c = getColor(x, y, shadowCtx);
    // document.body.style.background = 'rgba('+c[0]+','+c[1]+','+c[2]+',1)';

}, false);

mainCanvas.addEventListener('click', function() {
   ativaMarcaRegiao = !ativaMarcaRegiao;

    if(!ativaMarcaRegiao) {
        execCut();
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
///

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
        if(this._m[x] == undefined) this._m[x] = {};
        this._m[x][y] = w;
    }

    // M.prototype.remPixel = function(x, y) {
    //     if(this._m[x][y] !== undefined) this._m[x][y] = 0;
    // }

    M.prototype.getPixel = function(x, y) {
        if(this._m[x] === undefined 
            || this._m[x][y] === undefined) {
            return not_set_value;
        }
        return this._m[x][y];
    }

    return M;

})();

// Matrix 4-d
var M4 = (function() {

    var not_set_value = 0;

    function M4() {
        this._m4 = [];
    }

    M4.prototype.addPair = function(xa, ya, xb, yb, w) {
        if(this._m4[xa] == undefined) this._m4[xa] = {};
        if(this._m4[xa][ya] == undefined) this._m4[xa][ya] = new M();
        this._m4[xa][ya].addPixel(xb, yb, w);
    }

    M4.prototype.getPair = function(xa, ya, xb, yb) {
        if(this._m4[xa] === undefined 
            || this._m4[xa][ya] === undefined) {
            return not_set_value;
        }
        return this._m4[xa][ya].getPixel(xb, yb);
    }

    return M4;

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

// Segmentação...
  // TESTES...
  // Bpq - boundary penalty
  function B(vp, vq) {
    // Penalização linear independente do par de pixel
    // deveria: penalizar mais por descontinuidade em 
    // pixel semelhantes (ruído) e penalizar menos por
    // descontinuidades em pixel diferentes
    return Math.exp( -1 * Math.abs(vp-vq)/255 );
  }
  // R("obj") - penalties para obj
  function RFore(v) {
    return 1 - Math.exp( -1 * (histFore[v] / somaFore) );
  }

  // R("bkg") - penalties para "bkg"
  function RBack(v) {
    return 1 - Math.exp( -1 * (histBack[v] / somaBack) );
  }
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
    return 1 - Math.exp( -1 * (histFore[v] / somaFore) );
  }

  // R("bkg") - penalties para "bkg"
  function RBack(v) {
    return 1 - Math.exp( -1 * (histBack[v] / somaBack) );
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
  let iS = width + 1; let jS = height + 1;
  let iT = width + 2; let jT = height + 2;

  let lambda = 1; 
  let K = 2; // maior B possível é 1

  var N = new M4();
  for(i = 0; i < width; i++) {
    for(j = 0; j < height; j++) {

      //// Pares {p, q} 8-neighborhood
      let pValue = getColor(i, j, shadowCtx); // cor/intensidade do pixel

      if(i < width-1) {
          // Conexão abaixo
          var qValue = getColor(i+1, j, shadowCtx);
          var value = B(pValue, qValue);
          N.addPair(i, j, i+1, j, value);
          N.addPair(i+1, j, i, j, value);
      }
      if(j < height-1) { 
          // Conexão a direita
          var qValue = getColor(i, j+1, shadowCtx);
          var value = B(pValue, qValue);
          N.addPair(i, j, i, j+1, value);
          N.addPair(i, j+1, i, j, value);
      }
      if(i < width-1 && j < height-1) {
          // Conexão diagonal direita-baixo
          var qValue = getColor(i+1, j+1, shadowCtx);
          var value = B(pValue, qValue);
          N.addPair(i, j, i+1, j+1, value);
          N.addPair(i+1, j+1, i, j, value);
      }

      // Conexões com S e T
      let pesoS; let pesoT;

      if(MF.getPixel(i, j)) { // p se encontra em O
        pesoS = K;
        pesoT = 0;
      } else if(MB.getPixel(i, j)) { // p se encontra em B
        pesoS = 0;
        pesoT = K;
      } else {
        var pixelValue = getColor(i, j, shadowCtx);
        pesoS = lambda * RBack(pixelValue);
        pesoT = lambda * RFore(pixelValue);
      }

      // Conexões com S
      N.addPair(iS, jS, i, j, pesoS);
      N.addPair(i, j, iS, jS, pesoS);

      // Conexões com T
      N.addPair(iT, jT, i, j, pesoT);
      N.addPair(i, j, iT, jT, pesoT);

    }
  }
  console.log('ok...');
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