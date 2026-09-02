-- Migration: 009_add_destiny_max
-- add destiny_max column to characters table

alter table characters
add column destiny_max integer not null default 0;

