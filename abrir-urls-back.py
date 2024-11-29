import webbrowser

# URLs de las páginas a abrir
url1 = "http://localhost:8091/productos"
url2 = "http://localhost:8092/entradas"

# Abrir las páginas en pestañas separadas
webbrowser.open_new_tab(url1)
webbrowser.open_new_tab(url2)