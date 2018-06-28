function minCut(original, source, sink) {

  rows = original.length;

  // cópia do original, mantém informações do fluxo consumido
  let Graph = new Matrix2D();
  for(let i in original) { 
    for(let j in original[i]) {
      Graph.addPixel(i, j, original[i][j]);
    }
  }
  graph = Graph._m;
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

  }

  // aresta que inicialmente tinham peso, mas 
  // agora tem peso zero
  let cut = [];
  for(let i in original) {
    for(let j in original[i]) {
      if (graph[i][j] == 0 && original[i][j] > 0) {
        // console.log(i + " - " + j);
        cut.push([i, j]);
      }
    }
  }

  let sourceNodes = [];
  for(let i in original) {
    if (graph[source][i] > 0) {
      sourceNodes.push(i);
    }
  }

  let sinkNodes = [];
  for(let i in original) {
    if (graph[i][sink] > 0) {
      sinkNodes.push(i);
    }
  }

  return [sourceNodes, sinkNodes, cut];

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
      // console.log('graph', graph);

      for(let j in graph[u]) {
        let arestas = graph[u];
        // console.log('arestas', arestas);
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