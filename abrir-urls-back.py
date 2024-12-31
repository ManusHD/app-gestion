import webbrowser

# URLs de las páginas a abrir
url1 = "http://localhost:8091/productos"
url2 = "http://localhost:8092/entradas"
url3 = "http://localhost:8093/salidas"

# Abrir las páginas en pestañas separadas
webbrowser.open_new_tab(url1)
webbrowser.open_new_tab(url2)
webbrowser.open_new_tab(url3)