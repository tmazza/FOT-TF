let graph = [[0, 16, 13,  0,  0,  0],
  [0,  0, 10, 12,  0,  0],
  [0,  4,  0,  0, 14,  0],
  [0,  0,  9,  0,  0, 20],
  [0,  0,  0,  7,  0,  4],
  [0,  0,  0,  0,  0,  0]];

let source = 0; 
let sink = 5
minCut(graph, source, sink)


function minCut(graph, source, sink) {
  rows = graph.length;
  cols = graph[0].length;

  // console.log('rows: ', rows, 'cols:', cols);

  original = [];
  for(let i = 0; i < rows; i++) {
    original[i] = graph[i].slice();
  }
  // console.log('graph', graph);
  // console.log('original', originall);

  let max_flow = 0;
  
  // usado pela busca em largura mantem cada 
  // um dos caminhos avaliados
  let parent = [];
  for(let i = 0; i < rows; i++) {
    parent[i] = -1;
  }

  // aumenta fluxo enquanto houver caminho entre S e T
  while (hasPath(source, sink, parent)) {

    // seleciona fluxo máximo possível através do caminho
    // encontrado que é o caminho de menor capacidade
    let path_flow = Number.POSITIVE_INFINITY;
    let s = sink;
    while(s != source) {
      path_flow = Math.min(path_flow, graph[parent[s]][s])
      // console.log(s, path_flow, parent[s]);
      s = parent[s]
    }

    // adiciona fluxo do caminho ao fluxo total
    max_flow += path_flow;

    // atualiza capacidade das aresta do caminho
    let v = sink;
    while(v != source) {
      let u = parent[v];
      // reduz fluxo disponível ( aresta de-para -> )
      graph[u][v] -= path_flow;
      // incrementa fluxo em uso (aresta para-de <-)
      graph[v][u] += path_flow; 
      v = parent[v];
    }   

    console.log('parent', parent);
    console.log('graph', graph);

  }

  // aresta que inicialmente tinham peso, mas 
  // agora tem peso zero
  for(let i = 0; i < rows; i++) {
    for(let j = 0; j < rows; j++) {
      if (graph[i][j] == 0 && original[i][j] > 0) {
        console.log(i + " - " + j);
      }
    }
  }

  console.log('nodos conectados a source');
  for(let j = 0; j < rows; j++) {
    if (graph[source][j]) {
      console.log(j);
    }
  }

  console.log('nodos conectados a source');
  for(let j = 0; j < rows; j++) {
    if (graph[sink][j]) {
      console.log(j);
    }
  }

  console.log('final', graph);

  // busca em largura verificando se há caminho entre
  // origem e destino
  function hasPath(s, t, parent) {
    
    // marca todos vértices como não visitados
    let visited = [];
    for(let i = 0; i < rows; i++) {
      visited[i] = false;
    }

    // fila para busca em largura
    let queue = [];

    // marcar origem como visitada
    queue.push(s);
    visited[s] = true;

    // busca em largura
    while (queue.length > 0) {
      
      // pega um vértice da fila
      u = queue.shift();
      // adiciona cada nodo adjacente a u, que ainda não
      // tenha sido marcado, a fila.
      for(let j = 0; j < cols; j++) {
        let arestas = graph[u];

        // não visitado e há conexão
        if(visited[j] == false && arestas[j] > 0) {
          queue.push(j);
          visited[j] = true;
          parent[j] = u; // GRAVA CAMINHO
        }

      }
    }

    // se atingou ou não T (sink)
    return visited[t];
  }

}