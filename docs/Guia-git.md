# Guía rápida de Git (operaciones básicas)
> Copia y pega lo que necesites. Todos los ejemplos usan el remoto por defecto `origin`.
---

## 0) Clonar un repo

```bash
git clone <URL-del-repo>
cd <carpeta-del-repo>
```

---
### Concepto
Recordar que existen ramas locales y remotas: Las ramas remotas son las que estan en github(nube) y las ramas locales son las que estan en nuestro computador, estas no necesariamente pueden tener el mismo nombre pero si pueden estar enlazadas, lo ideal es que siempre ambas tengan el mismo nombre para que sepamos a cual estan enlazadas o a cual hace referencia la local con la que esta en remoto o github


![alt text](https://docs.nesi.org.nz/assets/images/Git-Reference_Sheet.svg)

- El working directory es cuando estamos editando un archivo y si lo vemos en `git status` estará en rojo, para que estos cambios una vez hechos pasen al staging area y sean parte de un proximo commit, los agregaremos con `git add [nombre del archivo]`, como comodin podemos usar `git add .` para agregar todos los archivos editados detectados al staging area, si queremos ver que archivos estan en el staging area y seran parte de un proximo commit, lo podemos ver con `git status` y estos se veran en verde.
- Cuando hacemos un commit, se tomaran todos los cambios de los archivos que fueron pasados al staging area y se empaquetaran como eso, un commit, el cual al hacer push, enviaremos a la version remota(github) de la rama en la cual estamos trabajando

## 1) Traer y ver ramas remotas

```bash
# Actualiza referencias remotas (ramas/tags) sin tocar tu working copy
git fetch --all --prune

# Ver solo ramas remotas
git branch -r
```

> `--prune` borra referencias a ramas remotas eliminadas en el servidor.

---

## 2) Crear / rastrear ramas locales

```bash
# Crear una rama local desde la rama actual
git switch -c nombre-rama

# Crear una rama local "desarrollo" basada en la remota origin/desarrollo, en este caso seria en base a la rama desarrollo que esta en github.
git switch -c desarrollo --track origin/desarrollo
# puede ser con switch o checkout, es lo mismo, pero es mas semantico con git switch
git checkout -b desarrollo origin/desarrollo
```

---

## 3) Saber en que rama estoy
```bash
git branch
```
### Nos retornara algo como esto:
donde estara marcado con un * cual es la rama en la que estamos trabajando
```bash
* main
  desarrollo
```

## 4) Cambiar de rama

```bash
git switch nombre-rama-destino
#Ejemplo:
git switch main
git switch desarrollo
```
---

## 5) Sincronizar tu rama local con el remoto

```bash
# Traer últimos cambios del servidor(github)
git fetch origin

# Estando en tu rama local
git switch desarrollo

# Actualizar tu rama desde su version en remoto (opción recomendada: rebase)
git pull  
```
> La version normal hace un merge, osea una fusion, de lo que tienes en local + lo que viene desde remoto, si por alguna razon hay un conflicto(por ej que en la misma linea haya contenidos diferentes) tendras la opcion de elegir como resolveras esos conflictos si lo revisas desde el vscode.

```bash
git pull --rebase #Rebase hace que se traiga todos los cambios y sobreescriba lo que tienes actualmente
```
---

## 6) Añadir cambios y crear commits

```bash
# Ver estado del work
git status

# Añadir cambios
git add .          # o selectivo: git add <archivo>
# Confirmar
git commit -m "Descripción breve y clara"
```

---

## 7) Publicar/push de tu rama

```bash
# Primera vez (configura upstream)
git push -u origin desarrollo
# en caso de que no hayamos enlazado nuestra rama local con la remota, al indicar origin, haremos que la rama en la cual estamos, se enlace con la que definamos luego de la palabra origin en nuestro comando en este caso seria la rama remota desarrollo

git push
```
---

## 8) Fusionar ramas (merge)

```bash
# Estar en la rama que RECIBIRÁ los cambios
git switch desarrollo

# Traer cambios de main a desarrollo
git merge main
# Aqui definimos estando en la rama desarrollo, que se hara un merge o fusion con la rama main, por ende traeremos todas las novedades que hayan en la rama main a la rama desarrollo, este proceso tambien puede ser al reves, desde desarrollo podemos hacer merge a main para poder actualizarlo, esto levantara una pull request en el repositorio, que es que en github, alguien tendra que ver que cambios se hicieron merge a la rama main y debera aprobar estos cambios despues de hacer la revision, esto solo pasa con la rama main cuando es destino a menos que lo configuremos para otras ramas.
```
---

## 9) Actualizar una rama con el contenido de otra  
### Ejemplo: **actualizar `desarrollo` desde `main`** con los cambios más recientes

**Merge (seguro, no reescribe historial)**
```bash

# Actualiza local/main
git switch main
git pull --ff-only

# Mezcla main en desarrollo
git switch desarrollo
git merge main

# Resuelve conflictos si aparecen, luego:
git push origin desarrollo
```
> ✅ Recomendado cuando varias personas trabajan en `desarrollo`.

---

## 10) Integrar cambios locales al remoto (Pull Request / Merge)

1. Asegúrate de que tu rama esté actualizada (ver #4).
2. Haz push de tu rama (ver #6).
3. Crea un PR/MR en la plataforma (GitHub/GitLab/Bitbucket) y fusiona.

---

## 11) Operaciones útiles de limpieza

```bash
# Borrar rama local
git branch -d nombre-rama       # -D si no está mergeada

# Borrar rama remota
git push origin --delete nombre-rama-remota

# Ver ramas locales y su upstream
git branch -vv

# Eliminar referencias remotas obsoletas(enlaces entre rama local y remota)
git fetch --prune
```
---

## Resumen rápido (comandos clave)

```bash
# Traer todo del remoto
git fetch --all --prune

# Ver ramas remotas
git branch -r

# Cambiar/crear rama
git switch <rama>
git switch -c <nueva-rama>        # desde HEAD
git switch -c <local> --track origin/<remota>

# Sincronizar tu rama
git pull --rebase                  # o: git pull

# Publicar
git push -u origin <rama>          # primera vez
git push

# Commit
git add .
git commit -m "mensaje"

# Fusionar
git switch <destino>
git merge <origen>

# Actualizar desarrollo desde main (merge, recomendado)
git fetch origin
git switch main && git pull --ff-only
git switch desarrollo && git merge main && git push
```