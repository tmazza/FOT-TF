// configuração
var width = 30;
var height = 30;
var lambda = 50;

let imageSrc = './teste2.png';

var Ctrl = (function(imageSrc) {

  // Matrix com background
  var MB = new Matrix2D(); 
  // Matrix com foreground
  var MF = new Matrix2D(); 

  // interface
  var canvasMain = new Canvas('mainCanvas', width, height);
  var canvasShadow = new Canvas('shadowCanvas', width, height);
  var canvasResult = new Canvas('resultCanvas', width, height);

  var $message = document.getElementById('message');

  // controle interface
  var ativaMarcaRegiao = 0;
  var marcarBackground = 1;
  var marcarForeground = 0;

  // carrega imagem no canvas
  var imageObj = new Image();
  imageObj.src = imageSrc;
  imageObj.onload = function() {
    canvasMain.context.drawImage(imageObj, 0, 0);
    canvasShadow.context.drawImage(imageObj, 0, 0);
    canvasResult.context.drawImage(imageObj, 0, 0);
  };

  // events
  canvasMain.node.addEventListener('mousemove', function(evt) {
    // Desenha retângulo e adiciona pontos
    var mousePos = canvasMain.getMousePos(evt);
    var x = parseInt(mousePos.x);
    var y = parseInt(mousePos.y);

    if(ativaMarcaRegiao) {

      canvasMain.drawRect(x, y, marcarBackground ? "blue" : "red");

      [xi,yi,xf,yf] = canvasMain.getRectSize(x, y);
      if(marcarBackground) {
        MB.addRect(xi, yi, xf, yf);
      } else if(marcarForeground) {
        MF.addRect(xi, yi, xf, yf);
      }

    }
  }, false);

  canvasMain.node.addEventListener('click', function() {
    ativaMarcaRegiao = !ativaMarcaRegiao;
    if(!ativaMarcaRegiao) {
      cutImage(getImage(), MB, MF);
      updateHist(MB, MF);
    }
  });

  return {
    updateMessage: updateMessage,
    imageObj: imageObj,
    canvasShadow: canvasShadow,
    canvasResult: canvasResult,
    toggleMarcarBackground: toggleMarcarBackground,
    updateHist: updateHist,
    getHistogramas: getHistogramas,
    drawResult: drawResult,
  }

  /// 

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

  function toggleMarcarBackground(e) {
    var c = e.which;
    if(c == 66) { // b
      marcarBackground = 1;
      marcarForeground = 0;
    } else if(c == 70) { // f
      marcarForeground = 1;
      marcarBackground = 0;
    }
  }

  function getHistogramas() {
    //// Geração histogramas...
    histBack = [];
    histFore = [];
    for(i = 0; i < width; i++) {
      for(j = 0; j < height; j++) {
        var c = canvasShadow.getColor(i, j);
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

    return [histBack, histFore];
  }

  function updateHist(background, foreground) {
    [histBack, histFore] = getHistogramas(background, foreground); 
    document.getElementById('histBack').innerHTML = histBack.join(',');
    document.getElementById('histFore').innerHTML = histFore.join(',');
    
    $(".bar").peity("bar", {
      height: "100px",
      width: "400px",
      fill: function(_, i, all) {
        var g = parseInt((i / all.length) * 255)
        return "rgb("+g+","+g+", "+g+")"
      }
    })
  }

  function drawResult(sourceNodes, sinkNodes, cuts) {
    canvasResult.context.drawImage(imageObj, 0, 0);

    // pontos ligados a S
    for(let i = 0; i < sinkNodes.length; i++) {
      let from = sinkNodes[i];
      if(from < width*height) {
        let x = parseInt(from / width);
        let y = from - (x * width);
        canvasResult.drawPixel(x, y, "rgba(0,255,0,1)");
      }
    }
    // pontos ligados a T
    for(let i = 0; i < sourceNodes.length; i++) {
      let from = sourceNodes[i];
      if(from < width*height) {
        let x = parseInt(from / width);
        let y = from - (x * width);
        canvasResult.drawPixel(x, y, "rgba(255,255,0,1)");
      }
    }
    // pontos marcados como background
    for(let i in MB._m) {
      for(let j in MB._m[i]) {
        canvasResult.drawPixel(i, j, "rgba(255,255,0,1)");
      }
    }
    // pontos marcados como foreground
    for(let i in MF._m) {
      for(let j in MF._m[i]) {
        canvasResult.drawPixel(i, j, "rgba(0,255,0,1)");
      }
    }

    // // DESENHO região de corte
    // for(let i = 0; i < cut.length; i++) {
    //   let from = cut[i][0];
    //   let to = cut[i][1];
    //   if(from < width*height && to < width*height) {
    //     let x = parseInt(from / width);
    //     let y = from - (x * width);
    //     canvasResult.drawPixel(x, y, "#FF0000");

    //     x = parseInt(to / width);
    //     y = to - (x * width);
    //     canvasResult.drawPixel(x, y, "#000000");

    //     // console.log(from, to);
    //   }
    //   // canvasResult.drawPixel(ut[i][0],cut[i][1]);
    // }

  }

  function getImage() {
    let image = [];
    for(let i = 0; i < width; i++) {
      image[i] = [];         
      for(let j = 0; j < height; j++) {
        image[i][j] = canvasShadow.getColor(i, j);        
      } 
    }
    console.log('image', image);
    return image;
  }

})(imageSrc);

// events
var $lambdaCtrl = document.getElementById('lambda');
$lambdaCtrl.addEventListener('change', function() {
  lambda = parseInt($lambdaCtrl.value);
})

window.addEventListener("load", function() {
  Ctrl.updateMessage();
});

document.addEventListener('keyup', function(e) {
  Ctrl.toggleMarcarBackground(e);
  Ctrl.updateMessage();
});

/* image: matrix 2D representando cada pixel da imagem
 * background: matrix (M) identificando se pixel 
 * foi selecionado ou não como background
 * foreground: matrix (M) identificando se pixel 
 * foi selecionado ou não como foreground */
function cutImage(image, background, foreground) {
  // marcar tempo
  let before = (new Date()).getTime();

  [histBack, histFore] = Ctrl.getHistogramas();

  // soma (qtd amostras)
  somaBack = histBack.reduce((a,b) => a+b, 0);
  somaFore = histFore.reduce((a,b) => a+b, 0);
      
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

  // S e T adicionados no final
  let S = width*height;
  let T = width*height + 1;

  let K = 1.1; // maior B possível é 1

  var N = new Matrix2D();
  for(i = 0; i < width; i++) {
    for(j = 0; j < height; j++) {

      let from = i * width + j;

      // cor/intensidade do pixel
      let pValue = image[i][j]; 

      /* Pares {p, q} 8-neighborhood */
      // Conexão abaixo
      if(i < width-1) {
        var qValue = image[i+1][j];
        var value = B(pValue, qValue);
        let to = (i+1)*width + j;
        N.addPixel(from, to, value);
        N.addPixel(to, from, value);
      }
      // Conexão a direita
      if(j < height-1) { 
        var qValue = image[i][j+1];
        var value = B(pValue, qValue);
        let to = i*width + j+1;
        N.addPixel(from, to, value);
        N.addPixel(to, from, value);
      }
      // Conexão diagonal direita-baixo
      if(i < width-1 && j < height-1) {
        var qValue = image[i+1][j+1];
        var value = B(pValue, qValue);
        let to = (i+1)*width + j+1;
        N.addPixel(from, to, value);
        N.addPixel(to, from, value);
      }
      // Conexão diagonal direita-superior
      if(i > 0 && j < height-1) {
        var qValue = image[i-1][j+1];
        var value = B(pValue, qValue);
        let to = (i-1)*width + j+1;
        N.addPixel(from, to, value);
        N.addPixel(to, from, value);
      }

      // conexão com S e T
      let pesoS; let pesoT;

      if(foreground.getPixel(i, j)) { 
        // p se encontra em O
        pesoS = K; 
        pesoT = 0;
      } else if(background.getPixel(i, j)) { 
        // p se encontra em B
        pesoS = 0;
        pesoT = K;
      } else {
        var pixelValue = image[i][j];
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

  [sourceNodes, sinkNodes, cuts] = minCut(N, S, T);
  Ctrl.drawResult(sourceNodes, sinkNodes, cuts);

  let after = (new Date()).getTime();
  console.log('decorrido:', (after - before) / 1000)
}
