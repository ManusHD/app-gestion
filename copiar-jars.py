import os
import shutil

# Ruta donde están los microservicios
microservicios_dir = "D:\\Uni\\TFG\\app-gestion\\backend"  # Modifica esta ruta según corresponda
# Ruta de destino
destino_dir = "C:\\Users\\Manu\\Desktop\\jars"

# Crear la carpeta de destino si no existe
os.makedirs(destino_dir, exist_ok=True)

# Recorrer los subdirectorios en busca de archivos .jar
for root, _, files in os.walk(microservicios_dir):
    for file in files:
        if file.endswith(".jar"):
            jar_path = os.path.join(root, file)
            destino_path = os.path.join(destino_dir, file)
            
            # Copiar el archivo
            shutil.copy2(jar_path, destino_path)
            print(f"Copiado: {jar_path} -> {destino_path}")

print("Proceso completado.")
