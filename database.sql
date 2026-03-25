--
-- PostgreSQL database dump
--

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-03-25 03:23:41

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5012 (class 1262 OID 16388)
-- Name: LaFabrica_Players; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "LaFabrica_Players" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';


ALTER DATABASE "LaFabrica_Players" OWNER TO postgres;

\connect "LaFabrica_Players"


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 24734)
-- Name: players; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.players (
    id integer NOT NULL,
    "firstName" character varying(255),
    "lastName" character varying(255),
    "dateofBirth" date,
    nationality character varying(255),
    "position" character varying(5),
    "currentTeam" character varying(255),
    "Height" integer,
    "preferredFoot" character varying,
    goals integer,
    assists integer,
    "minutesPlayed" integer
);


ALTER TABLE public.players OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 24733)
-- Name: players_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.players ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.players_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 5006 (class 0 OID 24734)
-- Dependencies: 220
-- Data for Name: players; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (8, 'Melvin', 'Eraze', '2007-04-20', 'Spain', 'RB', 'U-19', NULL, NULL, 0, 1, 382);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (11, 'Joel', 'Estor', '2007-12-03', 'Spain', 'CB', 'U-19', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (10, 'Ariel', 'Ncara', '2008-03-15', 'Spain', 'CB', 'U-19', 184, 'Left', 0, 0, 671);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (32, 'Mario', 'Rivas', '2007-03-16', 'Spain', 'CB', 'Castilla', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (12, 'Ferran', 'Fons', '2007-06-29', 'Spain', 'CB', 'U-19', NULL, NULL, 0, 0, 259);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (13, 'Liberto', 'Vicente', '2007-03-15', 'Spain', 'LB', 'U-19', 181, 'Left', 1, 1, 1704);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (43, 'Pol', 'Fortuny', '2005-03-11', 'Spain', 'CAM', 'Castilla', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (4, 'Francisco', 'Álvarez', '2008-02-19', 'Spain', 'RB', 'U-19', 0, 'right', 0, 0, 346);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (5, 'Paulo', 'Hernández', '2007-02-16', 'Spain', 'CB', 'U-19', NULL, NULL, 0, 0, 35);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (6, 'Álvaro', 'Muñoz', '2008-03-02', 'Spain', 'CB', 'U-19', NULL, NULL, 0, 1, 1454);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (14, 'Carlos', 'Pagonessa', '2007-05-17', 'Spain', 'CM', 'U-19', 180, 'Right', 1, 3, 581);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (15, 'Pol', 'Sarmiento', '2008-03-08', 'Spain', 'CM', 'U-19', NULL, 'Right', 0, 1, 378);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (17, 'Ignacio', 'Beobide', '2007-03-11', 'Spain', 'CDM', 'U-19', NULL, NULL, 0, 0, 151);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (47, 'Rachad', 'Dhimi', '2005-01-16', 'Spain', 'ST', 'Castilla', 184, 'Left', 1, 1, 115);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (46, 'Lorenzo', 'Zúñiga', '2003-01-18', 'Spain', 'ST', 'Castilla', 183, 'Both', 6, 1, 1584);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (45, 'Daniel', 'Yáñez', '2007-03-28', 'Spain', 'RW', 'Castilla', 177, 'Left', 6, 6, 2191);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (44, 'Hugo', 'de Llanos', '2005-03-18', 'Spain', 'CAM', 'Castilla', 175, 'Right', 14, 5, 2945);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (19, 'Thiago', 'Pitarch', '2007-08-03', 'Spain', 'CM', 'U-19', 179, 'Right', 2, 2, 1683);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (42, 'Jorge', 'Cestero', '2006-03-24', 'Spain', 'CM', 'Castilla', 178, 'Right', 2, 1, 2335);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (41, 'Bruno', 'Iglesias', '2003-05-01', 'Spain', 'CAM', 'Castilla', 181, 'Right', 1, 0, 715);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (40, 'César', 'Palacios', '2004-10-11', 'Spain', 'CM', 'Castilla', 182, 'Right', 11, 3, 2036);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (20, 'Rubén', 'Sánchez', '2007-04-28', 'Spain', 'RM', 'U-19', NULL, 'Right', 0, 0, 0);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (39, 'Manuel', 'Ángel', '2004-03-14', 'Spain', 'CM', 'Castilla', 170, 'Right', 1, 0, 2271);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (38, 'Cristian', 'David', '2005-08-17', 'Spain', 'CDM', 'Castilla', 175, 'Right', 0, 0, 1160);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (37, 'Lamini', 'Fati', '2006-04-21', 'Spain', 'CB', 'Castilla', 180, 'left', 0, 1, 1355);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (36, 'Diego', 'Aguado', '2007-02-07', 'Spain', 'CB', 'Castilla', 184, 'left', 1, 4, 2199);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (35, 'Jesús', 'Fortea', '2007-03-26', 'Spain', 'RB', 'Castilla', 179, 'right', 0, 2, 1274);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (21, 'Adrián', 'Muñoz', '2008-03-07', 'Spain', 'LM', 'U-19', 176, 'Left', 2, 0, 174);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (29, 'Sergio', 'Mestre', '2005-02-13', 'Spain', 'GK', 'Castilla', 193, 'right', 0, 0, 540);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (28, 'Guillermo', 'Súnico', '2004-01-09', 'Spain', 'GK', 'Castilla', 186, 'right', 0, 0, 0);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (27, 'Fran', 'González', '2005-06-24', 'Spain', 'GK', 'Castilla', 199, 'right', 0, 0, 2070);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (33, 'Manuel', 'Serrano', '2004-03-20', 'Spain', 'LB', 'Castilla', 175, 'right', 0, 1, 1003);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (1, 'Javier', 'Navarro', '2007-01-24', 'Spain', 'GK', 'U-19', NULL, 'Right', 0, 0, 630);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (2, 'Illia', 'Voloshyn', '2007-01-15', 'Ukraine', 'GK', 'U-19', NULL, NULL, 0, 0, 0);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (3, 'Aarón', 'Villar', '2007-09-13', 'Spain', 'GK', 'U-19', NULL, NULL, 0, 0, 0);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (7, 'Javier', 'Cabero', '2008-04-20', 'Spain', 'RB', 'U-19', NULL, NULL, 0, 0, 11);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (22, 'Gabriel', 'Carretero', '2007-08-03', 'Spain', 'CAM', 'U-19', NULL, NULL, 0, 1, 407);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (16, 'Bruno', 'Galassi', '2008-02-07', 'Spain', 'CM', 'U-19', NULL, NULL, 1, 0, 537);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (18, 'Diego', 'Pérez', '2007-04-07', 'Spain', 'CM', 'U-19', NULL, NULL, 2, 1, 1505);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (23, 'Marcos', 'Vadillo', '2007-01-12', 'Spain', 'CM', 'U-19', NULL, NULL, 0, 0, 29);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (24, 'Jaime', 'Porteros', '2007-09-23', 'Spain', 'ST', 'U-19', NULL, 'Left', 8, 0, 1089);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (25, 'José', 'López', '2007-10-15', 'Spain', 'LW', 'U-19', 170, 'Right', 0, 0, 77);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (26, 'Alfonso', 'Sanz', '2008-05-28', 'Spain', 'CF', 'U-19', NULL, NULL, 0, 0, 45);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (30, 'David', 'Jiménez', '2004-03-14', 'Spain', 'RB', 'Castilla', 170, 'Right', 1, 5, 2058);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (31, 'Víctor', 'Valdepeñas', '2006-10-20', 'Spain', 'CB', 'Castilla', 188, 'Left', 2, 1, 1870);
INSERT INTO public.players OVERRIDING SYSTEM VALUE VALUES (34, 'Joan', 'Martínez', '2007-08-20', 'Spain', 'CB', 'Castilla', 192, 'Right', 1, 0, 1902);


--
-- TOC entry 5013 (class 0 OID 0)
-- Dependencies: 219
-- Name: players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.players_id_seq', 47, true);


--
-- TOC entry 4857 (class 2606 OID 24741)
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


-- Completed on 2026-03-25 03:23:41

--
-- PostgreSQL database dump complete
--

\unrestrict fJ8tfi00zGyeOOCbS8fPiSqQM6CB91sNnl5IdT7lrd9lYc0zvEAF1mzc8BfjcxZ

