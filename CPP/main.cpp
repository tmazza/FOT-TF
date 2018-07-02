#include "common.h"
#include <vector>
#include <GLFW/glfw3.h>
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "ho_gl.h"
#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

#include "shader.cpp"

struct Graph {
	union {
		float neighbors[8];
		struct {
			float l, r, t, b, tl, tr, bl, br;
		};
	};
	float source, sink;
	bool  visited;
};
static Graph* graph;

enum Selection{
	SELECTION_NONE = 0,
	SELECTION_BACKGROUND,
	SELECTION_FOREGROUND,
};
static Selection selection = SELECTION_BACKGROUND;

static float lambda = 50.0f;
static Selection* background;

#include "graph.cpp"
static Histogram hist_background;
static Histogram hist_foreground;

struct Texture {
	u8*    original;
	u8*    data;
	GLuint id;
	int    width;
	int    height;
	int    channels;
};
static Texture texture;

static void cut_image() {
	int w = texture.width;
	int h = texture.height;
	int c = texture.channels;
	calculate_histogram(texture.original, background, w, h, c, &hist_background, &hist_foreground);

	for(int y = 0; y < h; ++y) {
		for(int x = 0; x < w; ++x) {
			u8 pixel_value = texture.original[(y * c) * w + (x * c)];

			if(y > 0) {
				// bottom
				u8 bot = texture.original[((y - 1) * c) * w + (x * c)];
				graph[y * w + x].b = B(pixel_value, bot);

				if(x > 0) {
					// bottom left
					u8 botleft = texture.original[((y - 1) * c) * w + ((x - 1) * c)];
					graph[y * w + x].bl = B(pixel_value, botleft);
				}
				if(x < w - 1) {
					// bottom right
					u8 botright = texture.original[((y - 1) * c) * w + ((x + 1) * c)];
					graph[y * w + x].br = B(pixel_value, botright);
				}
			}
			if(y < h - 1) {
				// top
				u8 top = texture.original[((y + 1) * c) * w + (x * c)];
				graph[y * w + x].t = B(pixel_value, top);
				if(x > 0) {
					// top left
					u8 topleft = texture.original[((y + 1) * c) * w + ((x - 1) * c)];
					graph[y * w + x].tl = B(pixel_value, topleft);
				}
				if(x < w - 1) {
					// top right
					u8 topright = texture.original[((y + 1) * c) * w + ((x + 1) * c)];
					graph[y * w + x].tr = B(pixel_value, topright);
				}
			}
			if(x > 0) {
				// left
				u8 left = texture.original[(y * c) * w + ((x - 1) * c)];
				graph[y * w + x].l = B(pixel_value, left);
			}
			if(x < w - 1) {
				// right
				u8 right = texture.original[(y * c) * w + ((x + 1) * c)];
				graph[y * w + x].r = B(pixel_value, right);
			}

			float K = 1.1;

			if(background[y * w + x] == SELECTION_FOREGROUND){
				graph[y * w + x].source = K;
				graph[y * w + x].sink = 0;
			} else if(background[y * w + x] == SELECTION_BACKGROUND){
				graph[y * w + x].source = 0;
				graph[y * w + x].sink = K;
			} else {
				graph[y * w + x].source = lambda * R(pixel_value, hist_background);
				graph[y * w + x].sink = lambda * R(pixel_value, hist_foreground);
			}
		}
	}
	min_cut(graph, w, h);
}

static bool lmouse_button_down = false;
static void window_size_callback(GLFWwindow* window, int width, int height) {}

static void key_callback(GLFWwindow* window, int key, int scancode, int action, int mods)
{
	if(action == GLFW_PRESS){
		switch(key){
			case 'B':
				selection = SELECTION_BACKGROUND;
				break;
			case 'F':
				selection = SELECTION_FOREGROUND;
				break;
			case 'C':
				cut_image();
				print_histogram(hist_background);
				print_histogram(hist_foreground);
				break;
		}
	}
}

static void cursor_position_callback(GLFWwindow* window, double xpos, double ypos)
{
	int width, height;
	glfwGetFramebufferSize(window, &width, &height);

	float mousex = xpos / (float)width;
	float mousey = ypos / (float)height;

	u8 r = (selection == SELECTION_BACKGROUND) ? 255 : 0;
	u8 b = (selection == SELECTION_FOREGROUND) ? 255 : 0;

	if(lmouse_button_down){
		for(int i = 0; i < texture.height; ++i) {
			for(int j = 0; j < texture.width; ++j) {
				int index = (i * 4) * texture.width + (j * 4);

				float x = (float)j / (float)texture.width;
				float y = (float)i / (float)texture.height;

				float diffx = fabs(x - mousex);
				float diffy = fabs(y - mousey);

				if(sqrtf(diffx * diffx + diffy * diffy) <= 0.02f){
					background[i * texture.width + j] = selection;
					texture.data[index + 0] = r;
					texture.data[index + 1] = 0;
					texture.data[index + 2] = b;
					texture.data[index + 3] = 255;
				}
			}
		}
		glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, texture.width, texture.height, GL_RGBA, GL_UNSIGNED_BYTE, texture.data);
	}
}

static void mouse_button_callback(GLFWwindow* window, int button, int action, int mods)
{
    if (button == GLFW_MOUSE_BUTTON_LEFT && action == GLFW_PRESS)
        lmouse_button_down = true;
	if (button == GLFW_MOUSE_BUTTON_LEFT && action == GLFW_RELEASE)
		lmouse_button_down = false;

	fflush(stdout);
}

static void framebuffer_size_callback(GLFWwindow* window, int width, int height)
{
	printf("frame: %d %d\n", width, height);
    glViewport(0, 0, width, height);
}

struct Vertex3D {
	float x, y, z;
	float u, v;
};

int main(void)
{
	GLFWwindow *window;

	/* Initialize the library */
	if (!glfwInit())
		return -1;

	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	/* Create a windowed mode window and its OpenGL context */
	window = glfwCreateWindow(640, 480, "Graph Cuts", NULL, NULL);
	if (!window)
	{
		glfwTerminate();
		return -1;
	}

	/* Make the window's context current */
	glfwMakeContextCurrent(window);

	glfwSwapInterval(1);
	glfwSetKeyCallback(window, key_callback);
	glfwSetCursorPosCallback(window, cursor_position_callback);
	glfwSetMouseButtonCallback(window, mouse_button_callback);
	glfwSetWindowSizeCallback(window, window_size_callback);
	glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

	if(hogl_init_gl_extensions() == -1) {
		printf("Failed to load OpenGL extensions\n");
		return -1;
	}

	GLuint shader = shader_load(quad_vshader, quad_fshader, sizeof(quad_vshader) - 1, sizeof(quad_fshader) - 1);

	int w, h, c;
	u8* image_data = stbi_load("../images/teste.png", &w, &h, &c, 0);

	texture.width = w;
	texture.height = h;
	texture.channels = c;
	texture.original = image_data;
	texture.data = (u8*)calloc(1, w * h * c);
	memcpy(texture.data, texture.original, w * h * c);

	printf("Image: width %d, height %d, channels %d\n", w, h, c);

	background = (Selection*)calloc(1, w * h * sizeof(Selection));

	hist_background.hist = (int*)calloc(1, 256 * sizeof(int));
	hist_foreground.hist = (int*)calloc(1, 256 * sizeof(int));
	
	graph = (Graph*)calloc(1, w * h * sizeof(Graph));

	GLuint texture_id;
	glGenTextures(1, &texture_id);
	glActiveTexture(GL_TEXTURE0);
	glBindTexture(GL_TEXTURE_2D, texture_id);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, texture.width, texture.height, 0, GL_RGBA, GL_UNSIGNED_BYTE, texture.data);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

	GLuint vao;
	glGenVertexArrays(1, &vao);
	glBindVertexArray(vao);

	float size = 0.5f;
	Vertex3D triangle[] = {
		{-1.0f, -1.0f, 0.0f, 0.0f, 1.0f},
		{1.0f, -1.0f, 0.0f, 1.0f, 1.0f},
		{-1.0f, 1.0f, 0.0f, 0.0f, 0.0f},
		{1.0f, 1.0f, 0.0f, 1.0f, 0.0f},
	};

	GLuint vbo;
	glGenBuffers(1, &vbo);
	glBindBuffer(GL_ARRAY_BUFFER, vbo);
	glBufferData(GL_ARRAY_BUFFER, sizeof(triangle), triangle, GL_STATIC_DRAW);
	glEnableVertexAttribArray(0);
	glEnableVertexAttribArray(1);
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex3D), 0);
	glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex3D), &((Vertex3D*)0)->u);

	GLushort indices[] = {
		0,1,2,2,1,3,
	};
	GLuint ebo;
	glGenBuffers(1, &ebo);
	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
	glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

	/* Loop until the user closes the window */
	while (!glfwWindowShouldClose(window))
	{
		/* Render here */
		glClear(GL_COLOR_BUFFER_BIT);

		glUseProgram(shader);
		glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
		glBindBuffer(GL_ARRAY_BUFFER, vbo);

		glBindTexture(GL_TEXTURE_2D, texture_id);
		glUniform1i(glGetUniformLocation(shader, "text"), 0);

		glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_SHORT, 0);

		/* Swap front and back buffers */
		glfwSwapBuffers(window);

		/* Poll for and process events */
		glfwPollEvents();
	}

	glfwTerminate();
	return 0;
}
