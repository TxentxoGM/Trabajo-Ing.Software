# Trabajo-Ing.Software
Repositorio del segundo trabajo de Ingeniería de Software 


# Usuario con permisos de administrador

**Correo:** admin@gmail.com   
**Contraseña:** 12345678 

# Base de datos

BBDD creada usado SQLite. Comandos específicos usados para crear:

```
create table users(
	id integer not null primary key autoincrement,
	name text not null,
	email text not null unique,
	password text not null,
	role text DEFAULT 'USER'
);


create table categories(
	id integer not null primary key autoincrement,
	name text not null unique
);

create table videos (
	id integer not null primary key autoincrement,
	id_category integer not null, 
	name text not null,
	url text not null unique,
	FOREIGN KEY (id_category) REFERENCES categories(id)
	
);


insert into users(name, email, password, role) values ('Admin', 'admin@gmail.com', '12345678', 'ADMIN');
```