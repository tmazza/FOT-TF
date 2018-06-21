// init
var mainCanvas = document.getElementById('mainCanvas');
var mainCtx = mainCanvas.getContext('2d');
var shadowCanvas = document.getElementById('shadowCanvas');
var shadowCtx = shadowCanvas.getContext('2d');

var imageObj = new Image();
var $message = document.getElementById('message');

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

    // Teste selação de pixel de shadow e de posição do mouse de maincanvas
	var mousePos = getMousePos(mainCanvas, evt);
    var x = parseInt(mousePos.x);
    var y = parseInt(mousePos.y);

	var c = getColor(x, y, shadowCtx);
	document.body.style.background = 'rgba('+c[0]+','+c[1]+','+c[2]+',1)';

}, false);

mainCanvas.addEventListener('click', function() {
   ativaMarcaRegiao = !ativaMarcaRegiao; 
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
    	ctx.fillStyle = "red";
    } else if(marcarForeground) {
    	ctx.fillStyle = "green";
    }
    ctx.fill();
}

function updateMessage() {
	if(marcarForeground) {
		$message.innerHTML = 'Seleção FOREGROUND';
		$message.style.background = 'green';	
	} else if(marcarBackground) {
		$message.innerHTML = 'Seleção BACKGROUND';
		$message.style.background = 'red';	
	} else {
		$message.innerHTML = '';
	} 
}

// armazenamento de pontos selecionados

// Matrix. Pontos adicionas sõa marcados com 1.
// get() retorna 0 para pontos não adicionados
// ou removidos
var M = (function() {

	function M() {
		this._m = [];
	}

	M.prototype.addPixel = function(x, y) {
	    if(this._m[x] == undefined) this._m[x] = {};
		this._m[x][y] = 1;
	}

	M.prototype.remPixel = function(x, y) {
	    if(this._m[x][y] !== undefined) this._m[x][y] = 0;
	}

	M.prototype.getPixel = function(x, y) {
		if(this._m[x] === undefined 
			|| this._m[x][y] === undefined) {
			return 0;
		}
		return this._m[x][y];
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
            fnAdd.addPixel(i, j);
        }
    }
}

// Acesso imagem | TODO: não pegar pixel da imagem do canvas...
function getColor(x, y, ctx) {
  var pixel = ctx.getImageData(x, y, 1, 1);
  var data = pixel.data;
  return [data[0], data[1], data[2], (data[3] / 255)]
}