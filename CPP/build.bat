@echo off

call cl /nologo /EHsc /Zi /MD /Iinclude main.cpp /link opengl32.lib glfw3.lib user32.lib gdi32.lib ole32.lib shell32.lib 


