 #include <math.h>
#include <string.h>
#define DYNAMIC_ARRAY_IMPLEMENT
#include <dynamic_array.h>
#define E_32 2.71828182846f

Graph* min_cut(Graph* graph, int width, int height);
void print_graph(Graph* graph, int width, int height);

float B(int vp, int vq) {
    return powf(E_32, -1.0f * fabs(vp - vq) / 255.0f);
}

struct Histogram {
    s64  sum;
    int* hist;
};

float R(int v, Histogram hist) {
    return 1.0f - pow(E_32, -1.0f * ((float)hist.hist[v] / (float)hist.sum));
}

void calculate_histogram(u8* original, Selection* sel, int width, int height, int channels, Histogram* hist_background, Histogram* hist_foreground) {
    for(int y = 0; y < height; ++y) {
        for(int x = 0; x < height; ++x) {
            if(sel[y * width + x] == SELECTION_BACKGROUND) {
                hist_background->sum += 1;
                hist_background->hist[original[(y * channels) * width + (x * channels)]] += 1;
            }
            if(sel[y * width + x] == SELECTION_FOREGROUND) {
                hist_foreground->sum += 1;
                hist_foreground->hist[original[(y * channels) * width + (x * channels)]] += 1;
            }
        }
    }
}

void print_histogram(Histogram h) {
    printf("sum: %lld\n", h.sum);
    for(int i = 0; i < 256; ++i) {
        printf("%d: %d\n", i, h.hist[i]);
    }
    printf("\n");
}

enum ConnectionTo {
	CONN_SINK,
	CONN_SOURCE,
	CONN_T,
	CONN_B,
	CONN_L,
	CONN_R,
	CONN_TL,
	CONN_TR,
	CONN_BL,
	CONN_BR,
};
struct ivec2 {
	int x;
	int y;
	float connection;
	ConnectionTo to;

	ivec2(int x, int y, float connection, ConnectionTo to) : x(x), y(y), connection(connection), to(to) {}
};

bool find_path(Graph* graph, int width, int height, int i, int j, ivec2* path) {
	graph[i * width + j].visited = true;
	// top
	if (i < height - 1 && graph[(i + 1) * width + j].visited == false && graph[i * width + j].t > 0.0f) {

		ivec2 v = ivec2(j, i, graph[i * width + j].t, CONN_T);
		array_push(path, &v);
		if (graph[(i + 1) * width + j].sink > 0.0f) {
			ivec2 v = ivec2(j, i + 1, graph[(i + 1) * width + j].sink, CONN_SINK);
			array_push(path, &v);
			return true;
		}
		graph[(i + 1) * width + j].visited = true;
		if (find_path(graph, width, height, i + 1, j, path)) {
			return true;
		}
		array_pop(path);
	}
	// bottom
	if (i > 0 && graph[(i - 1) * width + j].visited == false && graph[i * width + j].b > 0.0f) {
		ivec2 v = ivec2(j, i, graph[i * width + j].b, CONN_B);
		array_push(path, &v);
		if (graph[(i - 1) * width + j].sink > 0.0f) {
			ivec2 v = ivec2(j, i - 1, graph[(i - 1) * width + j].sink, CONN_SINK);
			array_push(path, &v);
			return true;
		}
		graph[(i - 1) * width + j].visited = true;
		if (find_path(graph, width, height, i - 1, j, path)) {
			return true;
		}
		array_pop(path);
	}
	// left
	if (j > 0 && graph[i * width + (j - 1)].visited == false && graph[i * width + j].l > 0.0f) {
		ivec2 v = ivec2(j, i, graph[i * width + j].l, CONN_L);
		array_push(path, &v);
		if (graph[i * width + (j - 1)].sink > 0.0f) {
			ivec2 v = ivec2(j, i - 1, graph[i * width + (j - 1)].sink, CONN_SINK);
			array_push(path, &v);
			return true;
		}
		graph[i * width + (j - 1)].visited = true;
		if (find_path(graph, width, height, i, j - 1, path)) {
			return true;
		}
		array_pop(path);
	}
	// right
	if (j < width - 1 && graph[i * width + (j + 1)].visited == false && graph[i * width + j].r > 0.0f) {
		ivec2 v = ivec2(j, i, graph[i * width + j].r, CONN_R);
		array_push(path, &v);
		if (graph[i * width + (j + 1)].sink > 0.0f) {
			ivec2 v = ivec2(j + 1, i, graph[i * width + (j + 1)].sink, CONN_SINK);
			array_push(path, &v);
			return true;
		}
		graph[i * width + (j + 1)].visited = true;
		if (find_path(graph, width, height, i, j + 1, path)) {
			return true;
		}
		array_pop(path);
	}

	// top left
	if (i < height - 1 && j > 0 && graph[(i + 1) * width + (j - 1)].visited == false && graph[i * width + j].tl > 0.0f) {
		ivec2 v = ivec2(j, i, graph[i * width + j].tl, CONN_TL);
		array_push(path, &v);
		if (graph[(i + 1) * width + (j - 1)].sink > 0.0f) {
			ivec2 v = ivec2(j - 1, i + 1, graph[(i + 1) * width + (j - 1)].sink, CONN_SINK);
			array_push(path, &v);
			return true;
		}
		graph[(i + 1) * width + (j - 1)].visited = true;
		if (find_path(graph, width, height, i + 1, j - 1, path)) {
			return true;
		}
		array_pop(path);
	}
	// bottom left
	if (i > 0 && j > 0 && graph[(i - 1) * width + (j - 1)].visited == false && graph[i * width + j].bl > 0.0f) {
		ivec2 v = ivec2(j, i, graph[i * width + j].bl, CONN_BL);
		array_push(path, &v);
		if (graph[(i - 1) * width + (j - 1)].sink > 0.0f) {
			ivec2 v = ivec2(j - 1, i - 1, graph[(i - 1) * width + (j - 1)].sink, CONN_SINK);
			array_push(path, &v);
			return true;
		}
		graph[(i - 1) * width + (j - 1)].visited = true;
		if (find_path(graph, width, height, i - 1, j - 1, path)) {
			return true;
		}
		array_pop(path);
	}
	// top right
	if (j > 0 && i < height - 1 && graph[(i + 1) * width + (j + 1)].visited == false && graph[i * width + j].tr > 0.0f) {
		ivec2 v = ivec2(j, i, graph[i * width + j].tr, CONN_TR);
		array_push(path, &v);
		if (graph[(i + 1) * width + (j + 1)].sink > 0.0f) {
			ivec2 v = ivec2(j + 1, i + 1, graph[(i + 1) * width + (j + 1)].sink, CONN_SINK);
			array_push(path, &v);
			return true;
		}
		graph[(i + 1) * width + (j + 1)].visited = true;
		if (find_path(graph, width, height, i + 1, j + 1, path)) {
			return true;
		}
		array_pop(path);
	}
	// bottom right
	if (j < width - 1 && i > 0 && graph[(i - 1) * width + (j + 1)].visited == false && graph[i * width + j].br > 0.0f) {
		ivec2 v = ivec2(j, i, graph[i * width + j].br, CONN_BR);
		array_push(path, &v);
		if (graph[(i - 1) * width + (j + 1)].sink > 0.0f) {
			ivec2 v = ivec2(j + 1, i - 1, graph[(i - 1) * width + (j + 1)].sink, CONN_SINK);
			array_push(path, &v);
			return true;
		}
		graph[(i - 1) * width + (j - 1)].visited = true;
		if (find_path(graph, width, height, i - 1, j - 1, path)) {
			return true;
		}
		array_pop(path);
	}
	array_clear(path);
	return false;
}

bool has_path(Graph* graph, int width, int height, ivec2* path) {
	// reset visited
	for (int i = 0; i < height; ++i) {
		for (int j = 0; j < width; ++j) {
			graph[i * width + j].visited = false;
		}
	}

	for (int i = 0; i < height; ++i) {
		for (int j = 0; j < width; ++j) {
#if 1
			if (graph[i * width + j].source <= 0.0f) {
				continue;
			}

			if(graph[i * width + j].sink > 0.0f) {
				graph[i * width + j].visited = true;
				ivec2 v = ivec2(j, i, graph[i * width + j].sink, CONN_SINK);
				array_push(path, &v);
				return true;
			}

			if (find_path(graph, width, height, i, j, path)) {
				return true;
			}
		}
#endif
	}

	return false;
}

Graph* min_cut(Graph* graph, int width, int height) {
	Graph* copy = (Graph*)calloc(1, width * height * sizeof(Graph));
	memcpy(copy, graph, width * height * sizeof(Graph));

	ivec2* path = array_create(ivec2, 1024);
	while (has_path(copy, width, height, path)) {
		float path_flow = 99999.0f;
		size_t len = array_get_length(path);
		for (int i = 0; i < len; ++i) {
			if (path[i].connection < path_flow) {
				path_flow = path[i].connection;
			}
		}

		for (int i = 0; i < array_get_length(path); ++i) {
			switch (path[i].to) {
			case CONN_SINK:
				copy[path[i].y * width + path[i].x].sink -= path_flow;
				break;
			case CONN_T:
				copy[path[i].y * width + path[i].x].t -= path_flow;
				break;
			case CONN_B:
				copy[path[i].y * width + path[i].x].b -= path_flow;
				break;
			case CONN_L:
				copy[path[i].y * width + path[i].x].l -= path_flow;
				break;
			case CONN_R:
				copy[path[i].y * width + path[i].x].r -= path_flow;
				break;
			case CONN_TL:
				copy[path[i].y * width + path[i].x].tl -= path_flow;
				break;
			case CONN_TR:
				copy[path[i].y * width + path[i].x].tr -= path_flow;
				break;
			case CONN_BL:
				copy[path[i].y * width + path[i].x].bl -= path_flow;
				break;
			case CONN_BR:
				copy[path[i].y * width + path[i].x].br -= path_flow;
				break;
			default: assert("error");
			}
		}
		array_clear(path);
		//print_graph(copy, width, height);
	}
	array_release(path);
	return copy; 
}

void print_graph(Graph* graph, int width, int height) {
	printf("%d, %d\n", width, height);
	for(int y = 0; y < height; ++y) {
		for(int x = 0; x < width; ++x) {
			printf("%5.2f,%5.2f,%5.2f | ", graph[y * width + x].tl, graph[y * width + x].t, graph[y * width + x].tr);
		}
		printf("\n");
		for(int x = 0; x < width; ++x) {
			printf("%5.2f,%5.2f,%5.2f | ", graph[y * width + x].l, graph[y * width + x].sink, graph[y * width + x].r);
		}
		printf("\n");
		for(int x = 0; x < width; ++x) {
			printf("%5.2f,%5.2f,%5.2f | ", graph[y * width + x].bl, graph[y * width + x].b, graph[y * width + x].br);
		}
		printf("\n--------------------------------------------------------------------------------------------------------------------------------------------------------------------------\n");
	}
}