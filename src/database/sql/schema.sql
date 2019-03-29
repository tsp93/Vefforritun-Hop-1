CREATE TABLE categories (
  id serial primary key,
  title varchar(100) unique not null
);

CREATE TABLE products (
  id serial primary key,
  title varchar(100) unique not null,
  description text not null,
  image varchar(255),
  created timestamp with time zone not null default current_timestamp,
  categoryid int not null references categories(id)
);

CREATE TABLE users (
  id serial primary key,
  username varchar(32) unique not null,
  email varchar(64) unique not null,
  password varchar(255) not null,
  admin boolean default false
);

CREATE TABLE ordercart (
  id serial primary key,
  userid int not null references users(id),
  isorder boolean,
  name varchar(100),
  address varchar(100),
  created timestamp with time zone not null default current_timestamp
);

CREATE TABLE ordercartproducts (
  id serial primary key,
  ordercart int not null references ordercart(id),
  product int not null references products(id),
  amount int constraint positive_amount check (amount>0)
);