const char quad_vshader[] = R"(
	#version 330 core
	layout(location = 0) in vec3 vertex;
	layout(location = 1) in vec2 tcoords;

	out vec2 texcoords;

	//uniform mat4 projection = mat4(1.0);
	//uniform mat4 position;

	void main(){
		gl_Position = vec4(vertex.xy, 0.0, 1.0);
		texcoords = tcoords;
	}
	)";

const char quad_fshader[] = R"(
	#version 330 core
	in vec2 texcoords;
	out vec4 color;

	uniform sampler2D text;

	void main(){
		color = texture(text, texcoords);
		//color = vec4(1.0, 1.0, 1.0, 1.0);
	}
	)";

GLuint shader_load(const char* vert_shader, const char* frag_shader, GLint vert_length, GLint frag_length) {

		GLuint vs_id = glCreateShader(GL_VERTEX_SHADER);
		GLuint fs_id = glCreateShader(GL_FRAGMENT_SHADER);

		GLint compile_status;

		const GLchar* p_v[1] = { vert_shader };
		glShaderSource(vs_id, 1, p_v, &vert_length);

		const GLchar* p_f[1] = { frag_shader };
		glShaderSource(fs_id, 1, p_f, &frag_length);

		glCompileShader(vs_id);
		glGetShaderiv(vs_id, GL_COMPILE_STATUS, &compile_status);
		if (!compile_status) {
			char error_buffer[512] = { 0 };
			glGetShaderInfoLog(vs_id, sizeof(error_buffer), NULL, error_buffer);
			printf("%s", error_buffer);
			return -1;
		}

		glCompileShader(fs_id);
		glGetShaderiv(fs_id, GL_COMPILE_STATUS, &compile_status);
		if (!compile_status) {
			char error_buffer[512] = { 0 };
			glGetShaderInfoLog(fs_id, sizeof(error_buffer) - 1, NULL, error_buffer);
			printf("%s", error_buffer);
			return -1;
		}

		GLuint shader_id = glCreateProgram();
		glAttachShader(shader_id, vs_id);
		glAttachShader(shader_id, fs_id);
		glDeleteShader(vs_id);
		glDeleteShader(fs_id);
		glLinkProgram(shader_id);

		glGetProgramiv(shader_id, GL_LINK_STATUS, &compile_status);
		if (compile_status == 0) {
			GLchar error_buffer[512] = { 0 };
			glGetProgramInfoLog(shader_id, sizeof(error_buffer) - 1, NULL, error_buffer);
			printf("%s", error_buffer);
			return -1;
		}

		glValidateProgram(shader_id);
		return shader_id;
	}