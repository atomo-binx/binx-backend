import os, zipfile

ignorar_diretorios = ["node_modules", "release"]
ignorar_arquivos = ["release.py", ".env"]

print("\nIniciando empacotamente de release para o Beanstalk\n")

diretorio_raiz = os.path.relpath(os.getcwd())
print("Diretório raiz:", diretorio_raiz + "\n")


diretorio_final = diretorio_raiz + "/release/"
print("Diretorio final:", diretorio_final + "\n")

zf = zipfile.ZipFile("./release/api_release.zip", "w")
for dirname, subdirs, files in os.walk(diretorio_raiz):

    ignorar = False

    for i in ignorar_diretorios:
        if i in dirname:
            ignorar = True

    if(not ignorar):
        if dirname != ".":
            print("Empacotando:", dirname)
            zf.write(dirname)
        for filename in files:
            if not filename in ignorar_arquivos:
             zf.write(os.path.join(dirname, filename), 
                os.path.relpath(os.path.join(dirname, filename)))
zf.close()

print("\nEmpacotamento de release finalizado\n")