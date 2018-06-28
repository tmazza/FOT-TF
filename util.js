var Canvas = (function() {

  // lado do quadrado de desenho do background e do foreground
  var l = 10;
  
  function Canvas(id, width, height) {
    this.node = document.getElementById(id);
    this.context = this.node.getContext('2d');
    this.node.style.width = width + 'px';
    this.node.style.height = height + 'px';
    this.context.canvas.width = width;
    this.context.canvas.height = height;
  }

  Canvas.prototype.drawPixel = function(x, y, cor) {
    this.context.fillStyle = cor;
    this.context.fillRect(x, y, 1, 1);
  }

  Canvas.prototype.drawRect = function(x, y, color) {
    this.context.beginPath();
    this.context.rect(x-l/4, y-l/4, l/2, l/2);
    this.context.fillStyle = color ? color : "blue";
    this.context.fill();
  }

  Canvas.prototype.getColor = function(x, y) {
    var pixel = this.context.getImageData(x, y, 1, 1);
    var data = pixel.data;
    return data[0]; // data = rgba
  }

  Canvas.prototype.getMousePos = function(evt) {
    var rect = this.node.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  Canvas.prototype.getRectSize = function(x, y) {
    var xi = parseInt(x - l/4);
    var xf = parseInt(x + l/2);
    var yi = parseInt(y - l/4);
    var yf = parseInt(y + l/2);
    return [xi, yi, xf, yf];  
  }

  return Canvas;

})();

var Matrix2D = (function() {

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

  M.prototype.addRect = function(xi, yi, xf, yf) {
    // TODO: respeitar limites da imagem
    for(i = xi; i < xf; i++) {
      for(j = yi; j < yf; j++) {
        this.addPixel(i, j, 1);
      }
    }
  }

  return M;
})();
