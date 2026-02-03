--
-- PostgreSQL database dump
--

\restrict wSMi6Tzr4Lpl2iOI9cPuNEyDuxCdM5ndSSB4H4tLdpm1epDXwsFxezzN0ZBVtQm

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-02-03 18:52:32

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
-- TOC entry 271 (class 1255 OID 17398)
-- Name: auto_calculate_selling_price(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_calculate_selling_price() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Calculate selling price based on unit_price and markup_percentage
    NEW.selling_price = ROUND(NEW.unit_price * (1 + NEW.markup_percentage/100), 2);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_calculate_selling_price() OWNER TO postgres;

--
-- TOC entry 270 (class 1255 OID 17395)
-- Name: get_approval_history(character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_approval_history(p_document_type character varying, p_document_id integer) RETURNS TABLE(approval_id integer, action character varying, previous_status character varying, new_status character varying, performed_by_name character varying, performed_at timestamp without time zone, comments text, rejection_reason text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ah.approval_id,
        ah.action,
        ah.previous_status,
        ah.new_status,
        u.full_name as performed_by_name,
        ah.performed_at,
        ah.comments,
        ah.rejection_reason
    FROM approval_history ah
    LEFT JOIN users u ON ah.performed_by = u.user_id
    WHERE ah.document_type = p_document_type
      AND ah.document_id = p_document_id
    ORDER BY ah.performed_at DESC;
END;
$$;


ALTER FUNCTION public.get_approval_history(p_document_type character varying, p_document_id integer) OWNER TO postgres;

--
-- TOC entry 269 (class 1255 OID 17389)
-- Name: log_approval_action(character varying, integer, character varying, character varying, character varying, character varying, integer, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_approval_action(p_document_type character varying, p_document_id integer, p_document_number character varying, p_action character varying, p_previous_status character varying, p_new_status character varying, p_performed_by integer, p_comments text DEFAULT NULL::text, p_rejection_reason text DEFAULT NULL::text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_approval_id INTEGER;
BEGIN
    INSERT INTO approval_history (
        document_type,
        document_id,
        document_number,
        action,
        previous_status,
        new_status,
        performed_by,
        comments,
        rejection_reason
    ) VALUES (
        p_document_type,
        p_document_id,
        p_document_number,
        p_action,
        p_previous_status,
        p_new_status,
        p_performed_by,
        p_comments,
        p_rejection_reason
    ) RETURNING approval_id INTO v_approval_id;
    
    RETURN v_approval_id;
END;
$$;


ALTER FUNCTION public.log_approval_action(p_document_type character varying, p_document_id integer, p_document_number character varying, p_action character varying, p_previous_status character varying, p_new_status character varying, p_performed_by integer, p_comments text, p_rejection_reason text) OWNER TO postgres;

--
-- TOC entry 268 (class 1255 OID 17317)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 264 (class 1259 OID 17363)
-- Name: approval_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approval_history (
    approval_id integer NOT NULL,
    document_type character varying(20) NOT NULL,
    document_id integer NOT NULL,
    document_number character varying(50) NOT NULL,
    action character varying(20) NOT NULL,
    previous_status character varying(50),
    new_status character varying(50) NOT NULL,
    performed_by integer,
    performed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    comments text,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT approval_history_action_check CHECK (((action)::text = ANY ((ARRAY['Submitted'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Issued'::character varying, 'Cancelled'::character varying])::text[]))),
    CONSTRAINT approval_history_document_type_check CHECK (((document_type)::text = ANY ((ARRAY['MRQS'::character varying, 'PO'::character varying, 'Invoice'::character varying, 'GR'::character varying])::text[])))
);


ALTER TABLE public.approval_history OWNER TO postgres;

--
-- TOC entry 5426 (class 0 OID 0)
-- Dependencies: 264
-- Name: TABLE approval_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.approval_history IS 'Tracks all approval actions for documents';


--
-- TOC entry 5427 (class 0 OID 0)
-- Dependencies: 264
-- Name: COLUMN approval_history.document_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.approval_history.document_type IS 'Type: MRQS, PO, Invoice, GR';


--
-- TOC entry 5428 (class 0 OID 0)
-- Dependencies: 264
-- Name: COLUMN approval_history.action; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.approval_history.action IS 'Action taken: Submitted, Approved, Rejected, Cancelled';


--
-- TOC entry 263 (class 1259 OID 17362)
-- Name: approval_history_approval_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.approval_history_approval_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approval_history_approval_id_seq OWNER TO postgres;

--
-- TOC entry 5429 (class 0 OID 0)
-- Dependencies: 263
-- Name: approval_history_approval_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.approval_history_approval_id_seq OWNED BY public.approval_history.approval_id;


--
-- TOC entry 244 (class 1259 OID 17007)
-- Name: complaints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaints (
    complaint_id integer NOT NULL,
    complaint_number character varying(50) NOT NULL,
    customer_id integer,
    product_id integer,
    area_id integer,
    complaint_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    serial_number character varying(100),
    warranty_status character varying(20),
    purchase_date date,
    complaint_type character varying(50),
    complaint_description text,
    assigned_technician integer,
    priority character varying(20) DEFAULT 'Medium'::character varying,
    status character varying(20) DEFAULT 'Open'::character varying,
    service_tariff_id integer,
    selected_service_charge numeric(10,2),
    parts_amount numeric(10,2) DEFAULT 0,
    total_service_amount numeric(10,2) DEFAULT 0,
    scheduled_date date,
    completion_date date,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT complaints_priority_check CHECK (((priority)::text = ANY ((ARRAY['Low'::character varying, 'Medium'::character varying, 'High'::character varying, 'Critical'::character varying])::text[]))),
    CONSTRAINT complaints_status_check CHECK (((status)::text = ANY ((ARRAY['Open'::character varying, 'Assigned'::character varying, 'In Progress'::character varying, 'On Hold'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[]))),
    CONSTRAINT complaints_warranty_status_check CHECK (((warranty_status)::text = ANY ((ARRAY['In Warranty'::character varying, 'Out of Warranty'::character varying, 'Contract Warranty'::character varying, 'Contract Paid'::character varying])::text[])))
);


ALTER TABLE public.complaints OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 17006)
-- Name: complaints_complaint_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.complaints_complaint_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.complaints_complaint_id_seq OWNER TO postgres;

--
-- TOC entry 5430 (class 0 OID 0)
-- Dependencies: 243
-- Name: complaints_complaint_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.complaints_complaint_id_seq OWNED BY public.complaints.complaint_id;


--
-- TOC entry 222 (class 1259 OID 16789)
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    customer_id integer NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    alternate_phone character varying(20),
    address text,
    cnic character varying(20),
    email character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16788)
-- Name: customers_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_customer_id_seq OWNER TO postgres;

--
-- TOC entry 5431 (class 0 OID 0)
-- Dependencies: 221
-- Name: customers_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_customer_id_seq OWNED BY public.customers.customer_id;


--
-- TOC entry 254 (class 1259 OID 17159)
-- Name: delivery_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_orders (
    do_id integer NOT NULL,
    do_number character varying(50) NOT NULL,
    customer_name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    address text,
    cnic character varying(20),
    do_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    area_id integer,
    total_amount numeric(12,2),
    status character varying(20) DEFAULT 'Pending'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT delivery_orders_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Delivered'::character varying, 'Cancelled'::character varying])::text[])))
);


ALTER TABLE public.delivery_orders OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 17158)
-- Name: delivery_orders_do_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_orders_do_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_orders_do_id_seq OWNER TO postgres;

--
-- TOC entry 5432 (class 0 OID 0)
-- Dependencies: 253
-- Name: delivery_orders_do_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delivery_orders_do_id_seq OWNED BY public.delivery_orders.do_id;


--
-- TOC entry 256 (class 1259 OID 17188)
-- Name: do_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.do_items (
    do_item_id integer NOT NULL,
    do_id integer,
    item_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    gst_percentage numeric(5,2) DEFAULT 0,
    gst_amount numeric(10,2),
    line_total numeric(10,2)
);


ALTER TABLE public.do_items OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 17187)
-- Name: do_items_do_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.do_items_do_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.do_items_do_item_id_seq OWNER TO postgres;

--
-- TOC entry 5433 (class 0 OID 0)
-- Dependencies: 255
-- Name: do_items_do_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.do_items_do_item_id_seq OWNED BY public.do_items.do_item_id;


--
-- TOC entry 240 (class 1259 OID 16957)
-- Name: goods_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goods_receipts (
    gr_id integer NOT NULL,
    gr_number character varying(50) NOT NULL,
    po_id integer,
    gr_date date NOT NULL,
    area_id integer,
    received_by integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.goods_receipts OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16956)
-- Name: goods_receipts_gr_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goods_receipts_gr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_receipts_gr_id_seq OWNER TO postgres;

--
-- TOC entry 5434 (class 0 OID 0)
-- Dependencies: 239
-- Name: goods_receipts_gr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goods_receipts_gr_id_seq OWNED BY public.goods_receipts.gr_id;


--
-- TOC entry 242 (class 1259 OID 16987)
-- Name: gr_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gr_items (
    gr_item_id integer NOT NULL,
    gr_id integer,
    item_id integer,
    quantity_received integer NOT NULL,
    unit_price numeric(10,2) NOT NULL
);


ALTER TABLE public.gr_items OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 16986)
-- Name: gr_items_gr_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gr_items_gr_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gr_items_gr_item_id_seq OWNER TO postgres;

--
-- TOC entry 5435 (class 0 OID 0)
-- Dependencies: 241
-- Name: gr_items_gr_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gr_items_gr_item_id_seq OWNED BY public.gr_items.gr_item_id;


--
-- TOC entry 234 (class 1259 OID 16887)
-- Name: inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory (
    inventory_id integer NOT NULL,
    item_id integer,
    area_id integer,
    quantity_in_hand integer DEFAULT 0,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16886)
-- Name: inventory_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_inventory_id_seq OWNER TO postgres;

--
-- TOC entry 5436 (class 0 OID 0)
-- Dependencies: 233
-- Name: inventory_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_inventory_id_seq OWNED BY public.inventory.inventory_id;


--
-- TOC entry 262 (class 1259 OID 17280)
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_transactions (
    transaction_id integer NOT NULL,
    item_id integer,
    area_id integer,
    transaction_type character varying(30),
    reference_id integer,
    reference_number character varying(50),
    quantity_change integer NOT NULL,
    quantity_before integer,
    quantity_after integer,
    unit_price numeric(10,2),
    transaction_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    performed_by integer,
    notes text,
    CONSTRAINT inventory_transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['GR'::character varying, 'MRQS_ISSUE'::character varying, 'MRTS_RETURN'::character varying, 'DO_ISSUE'::character varying, 'ADJUSTMENT'::character varying])::text[])))
);


ALTER TABLE public.inventory_transactions OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 17279)
-- Name: inventory_transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_transactions_transaction_id_seq OWNER TO postgres;

--
-- TOC entry 5437 (class 0 OID 0)
-- Dependencies: 261
-- Name: inventory_transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_transactions_transaction_id_seq OWNED BY public.inventory_transactions.transaction_id;


--
-- TOC entry 260 (class 1259 OID 17256)
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_items (
    invoice_item_id integer NOT NULL,
    invoice_id integer,
    item_type character varying(20) NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    rate_per_unit numeric(10,2) NOT NULL,
    amount numeric(12,2),
    gst_percentage numeric(5,2) DEFAULT 0,
    gst_amount numeric(12,2),
    fst_percentage numeric(5,2) DEFAULT 0,
    fst_amount numeric(12,2),
    discount numeric(10,2) DEFAULT 0,
    net_amount numeric(12,2),
    waive_off numeric(12,2) DEFAULT 0,
    CONSTRAINT invoice_items_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['SER'::character varying, 'PRD'::character varying])::text[])))
);


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 17255)
-- Name: invoice_items_invoice_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_items_invoice_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_items_invoice_item_id_seq OWNER TO postgres;

--
-- TOC entry 5438 (class 0 OID 0)
-- Dependencies: 259
-- Name: invoice_items_invoice_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoice_items_invoice_item_id_seq OWNED BY public.invoice_items.invoice_item_id;


--
-- TOC entry 258 (class 1259 OID 17209)
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    invoice_id integer NOT NULL,
    invoice_number character varying(50) NOT NULL,
    invoice_type character varying(20) NOT NULL,
    complaint_id integer,
    do_id integer,
    customer_id integer,
    customer_name character varying(100),
    phone character varying(20),
    address text,
    cnic character varying(20),
    invoice_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    job_number character varying(50),
    sales_tax_reg character varying(50),
    customer_order_number character varying(50),
    customer_order_date date,
    area_id integer,
    subtotal numeric(12,2),
    gst_total numeric(12,2),
    fst_total numeric(12,2),
    discount numeric(12,2) DEFAULT 0,
    net_amount numeric(12,2),
    waive_off numeric(12,2) DEFAULT 0,
    payment_terms character varying(100),
    dispatch_mode character varying(50),
    status character varying(20) DEFAULT 'Draft'::character varying,
    is_co boolean DEFAULT false,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoices_invoice_type_check CHECK (((invoice_type)::text = ANY ((ARRAY['Counter Sale'::character varying, 'Complaint Service'::character varying])::text[]))),
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY ((ARRAY['Draft'::character varying, 'Issued'::character varying, 'Paid'::character varying, 'Cancelled'::character varying])::text[])))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 17208)
-- Name: invoices_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_invoice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_invoice_id_seq OWNER TO postgres;

--
-- TOC entry 5439 (class 0 OID 0)
-- Dependencies: 257
-- Name: invoices_invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_invoice_id_seq OWNED BY public.invoices.invoice_id;


--
-- TOC entry 232 (class 1259 OID 16870)
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    item_id integer NOT NULL,
    item_code character varying(50) NOT NULL,
    description text NOT NULL,
    category character varying(50),
    unit_price numeric(10,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    selling_price numeric(10,2) DEFAULT 0,
    markup_percentage numeric(5,2) DEFAULT 20.00
);


ALTER TABLE public.items OWNER TO postgres;

--
-- TOC entry 5440 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN items.unit_price; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.items.unit_price IS 'Purchase/cost price (what we pay to vendor)';


--
-- TOC entry 5441 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN items.selling_price; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.items.selling_price IS 'Customer selling price (calculated from unit_price + markup)';


--
-- TOC entry 5442 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN items.markup_percentage; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.items.markup_percentage IS 'Profit margin percentage (default 20%)';


--
-- TOC entry 231 (class 1259 OID 16869)
-- Name: items_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_item_id_seq OWNER TO postgres;

--
-- TOC entry 5443 (class 0 OID 0)
-- Dependencies: 231
-- Name: items_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_item_id_seq OWNED BY public.items.item_id;


--
-- TOC entry 246 (class 1259 OID 17060)
-- Name: material_requisitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_requisitions (
    mrqs_id integer NOT NULL,
    mrqs_number character varying(50) NOT NULL,
    complaint_id integer,
    technician_id integer,
    area_id integer,
    mrqs_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'Pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT material_requisitions_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Issued'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE public.material_requisitions OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 17059)
-- Name: material_requisitions_mrqs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.material_requisitions_mrqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.material_requisitions_mrqs_id_seq OWNER TO postgres;

--
-- TOC entry 5444 (class 0 OID 0)
-- Dependencies: 245
-- Name: material_requisitions_mrqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.material_requisitions_mrqs_id_seq OWNED BY public.material_requisitions.mrqs_id;


--
-- TOC entry 250 (class 1259 OID 17111)
-- Name: material_returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_returns (
    mrts_id integer NOT NULL,
    mrts_number character varying(50) NOT NULL,
    complaint_id integer,
    technician_id integer,
    area_id integer,
    mrts_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.material_returns OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 17110)
-- Name: material_returns_mrts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.material_returns_mrts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.material_returns_mrts_id_seq OWNER TO postgres;

--
-- TOC entry 5445 (class 0 OID 0)
-- Dependencies: 249
-- Name: material_returns_mrts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.material_returns_mrts_id_seq OWNED BY public.material_returns.mrts_id;


--
-- TOC entry 248 (class 1259 OID 17090)
-- Name: mrqs_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mrqs_items (
    mrqs_item_id integer NOT NULL,
    mrqs_id integer,
    item_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2),
    item_status character varying(20) DEFAULT 'UW'::character varying,
    amount numeric(10,2),
    CONSTRAINT mrqs_items_item_status_check CHECK (((item_status)::text = ANY ((ARRAY['UW'::character varying, 'OPB'::character varying, 'Con W'::character varying, 'Con P'::character varying])::text[])))
);


ALTER TABLE public.mrqs_items OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 17089)
-- Name: mrqs_items_mrqs_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mrqs_items_mrqs_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mrqs_items_mrqs_item_id_seq OWNER TO postgres;

--
-- TOC entry 5446 (class 0 OID 0)
-- Dependencies: 247
-- Name: mrqs_items_mrqs_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mrqs_items_mrqs_item_id_seq OWNED BY public.mrqs_items.mrqs_item_id;


--
-- TOC entry 252 (class 1259 OID 17139)
-- Name: mrts_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mrts_items (
    mrts_item_id integer NOT NULL,
    mrts_id integer,
    item_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2),
    item_status character varying(20),
    amount numeric(10,2),
    CONSTRAINT mrts_items_item_status_check CHECK (((item_status)::text = ANY ((ARRAY['UW'::character varying, 'OPB'::character varying, 'Con W'::character varying, 'Con P'::character varying])::text[])))
);


ALTER TABLE public.mrts_items OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 17138)
-- Name: mrts_items_mrts_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mrts_items_mrts_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mrts_items_mrts_item_id_seq OWNER TO postgres;

--
-- TOC entry 5447 (class 0 OID 0)
-- Dependencies: 251
-- Name: mrts_items_mrts_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mrts_items_mrts_item_id_seq OWNED BY public.mrts_items.mrts_item_id;


--
-- TOC entry 267 (class 1259 OID 17402)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer,
    type character varying(20) DEFAULT 'info'::character varying,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    reference_type character varying(50),
    reference_id integer,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['info'::character varying, 'success'::character varying, 'warning'::character varying, 'error'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 17401)
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_notification_id_seq OWNER TO postgres;

--
-- TOC entry 5448 (class 0 OID 0)
-- Dependencies: 266
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- TOC entry 226 (class 1259 OID 16820)
-- Name: operational_areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operational_areas (
    area_id integer NOT NULL,
    area_name character varying(100) NOT NULL,
    area_code character varying(20) NOT NULL,
    is_active boolean DEFAULT true
);


ALTER TABLE public.operational_areas OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16819)
-- Name: operational_areas_area_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operational_areas_area_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operational_areas_area_id_seq OWNER TO postgres;

--
-- TOC entry 5449 (class 0 OID 0)
-- Dependencies: 225
-- Name: operational_areas_area_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operational_areas_area_id_seq OWNED BY public.operational_areas.area_id;


--
-- TOC entry 236 (class 1259 OID 16909)
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    po_id integer NOT NULL,
    po_number character varying(50) NOT NULL,
    vendor_id integer,
    po_date date NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    total_amount numeric(12,2),
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT purchase_orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'received'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16770)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(20),
    role character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'technician'::character varying, 'receptionist'::character varying, 'manager'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16803)
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    vendor_id integer NOT NULL,
    vendor_code character varying(50) NOT NULL,
    vendor_name character varying(100) NOT NULL,
    vendor_type character varying(20),
    contact_person character varying(100),
    phone character varying(20),
    email character varying(100),
    address text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vendors_vendor_type_check CHECK (((vendor_type)::text = ANY ((ARRAY['LPR'::character varying, 'Vendor'::character varying])::text[])))
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 17390)
-- Name: pending_approvals_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.pending_approvals_summary AS
 SELECT 'MRQS'::text AS document_type,
    m.mrqs_id AS document_id,
    m.mrqs_number AS document_number,
    m.status,
    m.mrqs_date AS document_date,
    m.technician_id AS requested_by,
    tech.full_name AS requested_by_name,
    c.complaint_number AS reference,
    ( SELECT sum(mi.amount) AS sum
           FROM public.mrqs_items mi
          WHERE (mi.mrqs_id = m.mrqs_id)) AS total_amount,
    m.created_at
   FROM ((public.material_requisitions m
     JOIN public.users tech ON ((m.technician_id = tech.user_id)))
     JOIN public.complaints c ON ((m.complaint_id = c.complaint_id)))
  WHERE ((m.status)::text = 'Pending'::text)
UNION ALL
 SELECT 'PO'::text AS document_type,
    po.po_id AS document_id,
    po.po_number AS document_number,
    po.status,
    po.po_date AS document_date,
    po.created_by AS requested_by,
    u.full_name AS requested_by_name,
    v.vendor_name AS reference,
    po.total_amount,
    po.created_at
   FROM ((public.purchase_orders po
     JOIN public.users u ON ((po.created_by = u.user_id)))
     JOIN public.vendors v ON ((po.vendor_id = v.vendor_id)))
  WHERE ((po.status)::text = 'pending'::text);


ALTER VIEW public.pending_approvals_summary OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16934)
-- Name: po_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.po_items (
    po_item_id integer NOT NULL,
    po_id integer,
    item_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'Normal'::character varying,
    amount numeric(10,2) GENERATED ALWAYS AS (((quantity)::numeric * unit_price)) STORED,
    CONSTRAINT po_items_status_check CHECK (((status)::text = ANY ((ARRAY['FOC'::character varying, 'OPB'::character varying, 'Normal'::character varying])::text[])))
);


ALTER TABLE public.po_items OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16933)
-- Name: po_items_po_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.po_items_po_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.po_items_po_item_id_seq OWNER TO postgres;

--
-- TOC entry 5450 (class 0 OID 0)
-- Dependencies: 237
-- Name: po_items_po_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.po_items_po_item_id_seq OWNED BY public.po_items.po_item_id;


--
-- TOC entry 228 (class 1259 OID 16833)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    product_id integer NOT NULL,
    product_name character varying(100) NOT NULL,
    product_code character varying(50) NOT NULL,
    category character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16832)
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_product_id_seq OWNER TO postgres;

--
-- TOC entry 5451 (class 0 OID 0)
-- Dependencies: 227
-- Name: products_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_product_id_seq OWNED BY public.products.product_id;


--
-- TOC entry 235 (class 1259 OID 16908)
-- Name: purchase_orders_po_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_orders_po_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_orders_po_id_seq OWNER TO postgres;

--
-- TOC entry 5452 (class 0 OID 0)
-- Dependencies: 235
-- Name: purchase_orders_po_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_orders_po_id_seq OWNED BY public.purchase_orders.po_id;


--
-- TOC entry 230 (class 1259 OID 16847)
-- Name: service_tariffs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_tariffs (
    tariff_id integer NOT NULL,
    product_id integer,
    visit_charges_24h numeric(10,2) DEFAULT 0,
    visit_charges_48h numeric(10,2) DEFAULT 0,
    gas_charges numeric(10,2) DEFAULT 0,
    inspection_charges_csc numeric(10,2) DEFAULT 0,
    washing_charges numeric(10,2) DEFAULT 0,
    transport_charges_per_km numeric(10,2) DEFAULT 0,
    dismantling_charges numeric(10,2) DEFAULT 0,
    reinstallation_charges numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.service_tariffs OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16846)
-- Name: service_tariffs_tariff_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_tariffs_tariff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_tariffs_tariff_id_seq OWNER TO postgres;

--
-- TOC entry 5453 (class 0 OID 0)
-- Dependencies: 229
-- Name: service_tariffs_tariff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_tariffs_tariff_id_seq OWNED BY public.service_tariffs.tariff_id;


--
-- TOC entry 219 (class 1259 OID 16769)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5454 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 223 (class 1259 OID 16802)
-- Name: vendors_vendor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendors_vendor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendors_vendor_id_seq OWNER TO postgres;

--
-- TOC entry 5455 (class 0 OID 0)
-- Dependencies: 223
-- Name: vendors_vendor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendors_vendor_id_seq OWNED BY public.vendors.vendor_id;


--
-- TOC entry 5061 (class 2604 OID 17366)
-- Name: approval_history approval_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_history ALTER COLUMN approval_id SET DEFAULT nextval('public.approval_history_approval_id_seq'::regclass);


--
-- TOC entry 5023 (class 2604 OID 17010)
-- Name: complaints complaint_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints ALTER COLUMN complaint_id SET DEFAULT nextval('public.complaints_complaint_id_seq'::regclass);


--
-- TOC entry 4983 (class 2604 OID 16792)
-- Name: customers customer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN customer_id SET DEFAULT nextval('public.customers_customer_id_seq'::regclass);


--
-- TOC entry 5041 (class 2604 OID 17162)
-- Name: delivery_orders do_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_orders ALTER COLUMN do_id SET DEFAULT nextval('public.delivery_orders_do_id_seq'::regclass);


--
-- TOC entry 5045 (class 2604 OID 17191)
-- Name: do_items do_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.do_items ALTER COLUMN do_item_id SET DEFAULT nextval('public.do_items_do_item_id_seq'::regclass);


--
-- TOC entry 5020 (class 2604 OID 16960)
-- Name: goods_receipts gr_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipts ALTER COLUMN gr_id SET DEFAULT nextval('public.goods_receipts_gr_id_seq'::regclass);


--
-- TOC entry 5022 (class 2604 OID 16990)
-- Name: gr_items gr_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gr_items ALTER COLUMN gr_item_id SET DEFAULT nextval('public.gr_items_gr_item_id_seq'::regclass);


--
-- TOC entry 5011 (class 2604 OID 16890)
-- Name: inventory inventory_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory ALTER COLUMN inventory_id SET DEFAULT nextval('public.inventory_inventory_id_seq'::regclass);


--
-- TOC entry 5059 (class 2604 OID 17283)
-- Name: inventory_transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.inventory_transactions_transaction_id_seq'::regclass);


--
-- TOC entry 5054 (class 2604 OID 17259)
-- Name: invoice_items invoice_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN invoice_item_id SET DEFAULT nextval('public.invoice_items_invoice_item_id_seq'::regclass);


--
-- TOC entry 5047 (class 2604 OID 17212)
-- Name: invoices invoice_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN invoice_id SET DEFAULT nextval('public.invoices_invoice_id_seq'::regclass);


--
-- TOC entry 5005 (class 2604 OID 16873)
-- Name: items item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN item_id SET DEFAULT nextval('public.items_item_id_seq'::regclass);


--
-- TOC entry 5031 (class 2604 OID 17063)
-- Name: material_requisitions mrqs_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_requisitions ALTER COLUMN mrqs_id SET DEFAULT nextval('public.material_requisitions_mrqs_id_seq'::regclass);


--
-- TOC entry 5037 (class 2604 OID 17114)
-- Name: material_returns mrts_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns ALTER COLUMN mrts_id SET DEFAULT nextval('public.material_returns_mrts_id_seq'::regclass);


--
-- TOC entry 5035 (class 2604 OID 17093)
-- Name: mrqs_items mrqs_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mrqs_items ALTER COLUMN mrqs_item_id SET DEFAULT nextval('public.mrqs_items_mrqs_item_id_seq'::regclass);


--
-- TOC entry 5040 (class 2604 OID 17142)
-- Name: mrts_items mrts_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mrts_items ALTER COLUMN mrts_item_id SET DEFAULT nextval('public.mrts_items_mrts_item_id_seq'::regclass);


--
-- TOC entry 5064 (class 2604 OID 17405)
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- TOC entry 4989 (class 2604 OID 16823)
-- Name: operational_areas area_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operational_areas ALTER COLUMN area_id SET DEFAULT nextval('public.operational_areas_area_id_seq'::regclass);


--
-- TOC entry 5017 (class 2604 OID 16937)
-- Name: po_items po_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_items ALTER COLUMN po_item_id SET DEFAULT nextval('public.po_items_po_item_id_seq'::regclass);


--
-- TOC entry 4991 (class 2604 OID 16836)
-- Name: products product_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN product_id SET DEFAULT nextval('public.products_product_id_seq'::regclass);


--
-- TOC entry 5014 (class 2604 OID 16912)
-- Name: purchase_orders po_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN po_id SET DEFAULT nextval('public.purchase_orders_po_id_seq'::regclass);


--
-- TOC entry 4994 (class 2604 OID 16850)
-- Name: service_tariffs tariff_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_tariffs ALTER COLUMN tariff_id SET DEFAULT nextval('public.service_tariffs_tariff_id_seq'::regclass);


--
-- TOC entry 4979 (class 2604 OID 16773)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 4986 (class 2604 OID 16806)
-- Name: vendors vendor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors ALTER COLUMN vendor_id SET DEFAULT nextval('public.vendors_vendor_id_seq'::regclass);


--
-- TOC entry 5418 (class 0 OID 17363)
-- Dependencies: 264
-- Data for Name: approval_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.approval_history (approval_id, document_type, document_id, document_number, action, previous_status, new_status, performed_by, performed_at, comments, rejection_reason, created_at) FROM stdin;
1	MRQS	1	MRQS-2024-000001	Submitted	\N	Pending	1	2026-01-25 01:12:27.597344	Test submission	\N	2026-01-25 01:12:27.597344
2	MRQS	5	MRQS-2026-000005	Submitted	\N	Pending	5	2026-01-25 01:20:26.433834	MRQS created and submitted for approval	\N	2026-01-25 01:20:26.433834
3	MRQS	5	MRQS-2026-000005	Rejected	Pending	Rejected	5	2026-01-25 01:30:53.903875	\N	now d3rf	2026-01-25 01:30:53.903875
4	MRQS	4	MRQS-2026-000004	Approved	Approved	Issued	5	2026-01-25 01:33:44.346899	Materials issued and inventory updated	\N	2026-01-25 01:33:44.346899
5	PO	15	PO-2026-000015	Submitted	\N	pending	1	2026-01-25 01:44:54.660042	Purchase order created and submitted for approval	\N	2026-01-25 01:44:54.660042
6	PO	14	PO-2026-000014	Approved	pending	approved	1	2026-01-25 01:45:04.021278	Purchase order approved	\N	2026-01-25 01:45:04.021278
7	PO	15	PO-2026-000015	Approved	pending	approved	1	2026-01-25 01:45:09.781907	Purchase order approved	\N	2026-01-25 01:45:09.781907
8	PO	16	PO-2026-000016	Submitted	\N	pending	1	2026-01-25 01:57:35.19161	Purchase order created and submitted for approval	\N	2026-01-25 01:57:35.19161
9	PO	16	PO-2026-000016	Cancelled	pending	cancelled	1	2026-01-25 01:57:54.285529	\N	Purchase order cancelled by user	2026-01-25 01:57:54.285529
10	PO	17	PO-2026-000017	Submitted	\N	pending	1	2026-02-02 18:32:51.594037	Purchase order created and submitted for approval	\N	2026-02-02 18:32:51.594037
11	PO	17	PO-2026-000017	Approved	pending	approved	1	2026-02-02 18:33:05.148573	Purchase order approved	\N	2026-02-02 18:33:05.148573
12	MRQS	6	MRQS-2026-000006	Submitted	\N	Pending	1	2026-02-02 18:40:15.555385	MRQS created and submitted for approval	\N	2026-02-02 18:40:15.555385
13	MRQS	6	MRQS-2026-000006	Approved	Pending	Approved	1	2026-02-02 18:41:08.567154	MRQS approved	\N	2026-02-02 18:41:08.567154
14	MRQS	6	MRQS-2026-000006	Approved	Approved	Issued	1	2026-02-02 18:41:11.059925	Materials issued and inventory updated	\N	2026-02-02 18:41:11.059925
23	MRQS	14	MRQS-2026-000012	Approved	Pending	Approved	1	2026-02-02 21:40:13.445697		\N	2026-02-02 21:40:13.445697
24	MRQS	13	MRQS-2026-000011	Rejected	Pending	Rejected	1	2026-02-02 21:40:24.921148	\N	xv dfdsg s dfg	2026-02-02 21:40:24.921148
25	MRQS	15	MRQS-2026-000013	Rejected	Pending	Rejected	1	2026-02-02 22:10:10.239856	\N	v,.d;gner;g er	2026-02-02 22:10:10.239856
26	MRQS	16	MRQS-2026-000014	Approved	Pending	Approved	1	2026-02-02 22:25:19.783788	xcvzx	\N	2026-02-02 22:25:19.783788
27	MRQS	17	MRQS-2026-000015	Approved	Pending	Approved	1	2026-02-02 22:37:13.248359		\N	2026-02-02 22:37:13.248359
28	MRQS	18	MRQS-2026-000016	Approved	Pending	Approved	1	2026-02-02 22:49:09.491145	cvfxfvfdvg	\N	2026-02-02 22:49:09.491145
29	MRQS	19	MRQS-2026-000017	Approved	Pending	Approved	1	2026-02-02 22:51:50.872172		\N	2026-02-02 22:51:50.872172
30	MRQS	20	MRQS-2026-000018	Approved	Pending	Approved	1	2026-02-02 23:07:50.182657		\N	2026-02-02 23:07:50.182657
31	MRQS	21	MRQS-2026-000019	Approved	Pending	Approved	1	2026-02-02 23:29:54.530696		\N	2026-02-02 23:29:54.530696
32	MRQS	22	MRQS-2026-000020	Approved	Pending	Approved	1	2026-02-02 23:40:29.551346		\N	2026-02-02 23:40:29.551346
\.


--
-- TOC entry 5398 (class 0 OID 17007)
-- Dependencies: 244
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaints (complaint_id, complaint_number, customer_id, product_id, area_id, complaint_date, serial_number, warranty_status, purchase_date, complaint_type, complaint_description, assigned_technician, priority, status, service_tariff_id, selected_service_charge, parts_amount, total_service_amount, scheduled_date, completion_date, created_by, created_at, updated_at) FROM stdin;
8	RWP-2026-000008	9	17	1	2026-02-02 20:58:09.021825	werewrewr	In Warranty	2026-02-02	cxv cxv	vvx	2	Critical	Completed	21	\N	1800.00	1800.00	\N	2026-02-02	1	2026-02-02 20:58:09.021825	2026-02-02 22:37:15.066587
1	RWP-2026-000001	2	14	1	2026-01-22 14:46:03.492411	sfefew618789	In Warranty	2026-02-04	screen damage	pixel are blinking	2	Medium	Completed	18	\N	7200.00	7200.00	\N	2026-01-25	1	2026-01-22 14:46:03.492411	2026-01-25 14:01:48.442855
2	RWP-2026-000002	1	7	1	2026-01-23 01:16:08.096219	fsdfsf165896435	In Warranty	2026-07-10	ewfewfv	sdvdvdfv	3	Critical	Completed	9	\N	0.00	0.00	\N	2026-01-25	1	2026-01-23 01:16:08.096219	2026-01-25 14:02:00.16857
3	RWP-2026-000003	3	6	1	2026-01-23 17:39:28.606932		Out of Warranty	2025-09-18	Cooling not working.	Cooling not working.	2	High	Completed	7	\N	1200.00	1200.00	\N	2026-01-25	4	2026-01-23 17:39:28.606932	2026-01-25 14:10:09.958467
23	RWP-2026-000012	9	14	1	2026-02-03 18:06:41.736915	werewrtewt	Contract Warranty	2026-02-01	\N	treter	3	Medium	Assigned	\N	\N	0.00	0.00	\N	\N	1	2026-02-03 18:06:41.736915	2026-02-03 18:06:41.807587
9	RWP-2026-000009	2	19	1	2026-02-02 22:48:33.951617	asfesf	Out of Warranty	2026-02-02	xvdsdsfdsf	cvdxvdsv	2	Medium	Completed	22	\N	1800.00	1800.00	\N	2026-02-02	1	2026-02-02 22:48:33.951617	2026-02-02 22:49:30.280039
24	RWP-2026-000013	11	15	1	2026-02-03 18:23:32.281744	sdfdsfdsf	In Warranty	2026-02-02	\N	dsfds	8	Medium	Assigned	\N	\N	0.00	0.00	\N	\N	1	2026-02-03 18:23:32.281744	2026-02-03 18:23:32.372376
6	RWP-2026-000006	5	19	1	2026-01-25 15:05:23.686299	vxvcxv	In Warranty	2025-12-19	dvsd	dfds	3	Critical	Completed	22	\N	2160.00	2160.00	\N	2026-02-02	1	2026-01-25 15:05:23.686299	2026-02-02 22:52:29.257416
4	RWP-2026-000004	1	1	1	2026-01-25 14:10:44.846714	sfdsfs155565	In Warranty	2025-09-11	ddfd	dvdvdfsg	2	Critical	Completed	2	\N	12960.00	12960.00	\N	2026-02-02	1	2026-01-25 14:10:44.846714	2026-02-02 23:08:18.123922
7	RWP-2026-000007	1	19	1	2026-02-02 18:38:54.605466	ertertert	In Warranty	2026-02-02	rqrc	3534543	3	Critical	Completed	22	\N	1000.00	1000.00	\N	2026-02-02	1	2026-02-02 18:38:54.605466	2026-02-02 23:27:28.666899
25	RWP-2026-000014	12	5	1	2026-02-03 18:30:50.752746	sdfsd2312322	Out of Warranty	2025-11-13	\N	wewrewr	2	Critical	Completed	\N	\N	0.00	0.00	\N	2026-02-03	1	2026-02-03 18:30:50.752746	2026-02-03 18:31:28.921134
10	RWP-2026-000010	9	12	1	2026-02-02 23:29:07.920789	gdrgdrghdr	In Warranty	2026-02-02	gdg	dfgdfg	3	Critical	Completed	16	\N	3000.00	3000.00	\N	2026-02-02	1	2026-02-02 23:29:07.920789	2026-02-02 23:30:24.786676
5	RWP-2026-000005	6	12	1	2026-01-25 15:04:31.665594	sdfdsf555	Out of Warranty	2025-09-11	dsdfd	sdasd	2	Medium	Completed	16	\N	3000.00	3000.00	\N	2026-02-02	1	2026-01-25 15:04:31.665594	2026-02-02 23:40:44.900294
19	RWP-2026-000011	9	19	1	2026-02-03 11:28:42.320964	zxxczxczxcz	Out of Warranty	2025-10-15	zxcxzcz	cxzcxczc	2	Medium	Assigned	22	\N	0.00	0.00	\N	\N	1	2026-02-03 11:28:42.320964	2026-02-03 11:28:42.446766
\.


--
-- TOC entry 5376 (class 0 OID 16789)
-- Dependencies: 222
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (customer_id, name, phone, alternate_phone, address, cnic, email, created_at, updated_at) FROM stdin;
1	Muhammad Qasim Abbas	03001234567	\N	House #123, Street 5, Rawalpindi	\N	\N	2026-01-17 22:27:06.807782	2026-01-17 22:27:06.807782
2	Ali Hassan	03111234567	\N	Flat 4B, Green Plaza, Islamabad	\N	\N	2026-01-17 22:27:06.810461	2026-01-17 22:27:06.810461
3	Ayesha Malik	03221234567	\N	Villa 7, DHA Phase 2, Islamabad	\N	\N	2026-01-17 22:27:06.812446	2026-01-17 22:27:06.812446
4	Updated Test Customer	03009876543	03119876543	Test Address, Rawalpindi	1234567890123	updated@test.com	2026-01-20 01:01:33.589189	2026-01-20 01:01:33.631971
6	Beenish Ayub	03305266999	\N	CA-197/224 chistiabad satellite town	61101-3123213-2	\N	2026-01-25 15:04:28.516424	2026-01-25 15:04:28.516424
7	Muhammad Ahtisham	4-234423432423	\N	Chistiabad Satellite Town	62202-234324-3	\N	2026-01-25 15:07:57.177228	2026-01-25 15:07:57.177228
5	Muhammad Shami	03305266999	\N	Chistiabad Satellite Town	61101-47399507	\N	2026-01-25 14:50:03.292851	2026-01-25 15:17:45.21323
8	usman ghani	43434rwerewr	\N	satellite town Rawalpindi		\N	2026-02-02 18:59:40.035706	2026-02-02 18:59:40.035706
9	anhar	034234342	\N			\N	2026-02-02 20:57:53.669814	2026-02-02 20:57:53.669814
10	Muhammad Ahtisham	sd4324324	\N	rawalpindi		\N	2026-02-02 23:04:41.672333	2026-02-02 23:04:41.672333
11	Muhammad Ahtisham	03305266999	\N	CA-197/224 satellite town Rawalpindi		shamimuhammad77@gmail.com	2026-02-03 18:23:15.545086	2026-02-03 18:23:15.545086
12	anhar	23232424	\N			i222481@nu.edu.pk	2026-02-03 18:30:17.485213	2026-02-03 18:30:17.485213
\.


--
-- TOC entry 5408 (class 0 OID 17159)
-- Dependencies: 254
-- Data for Name: delivery_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_orders (do_id, do_number, customer_name, phone, address, cnic, do_date, area_id, total_amount, status, created_by, created_at) FROM stdin;
1	DO-2026-000001	Ali Hassan	03001234567	House 123, Street 5, Rawalpindi	1234567890123	2026-01-18 00:19:32.883343	1	60180.00	Delivered	1	2026-01-18 00:19:32.883343
3	DO-2026-000003	Ali Hassan	03001234567	House 123, Street 5, Rawalpindi	1234567890123	2026-01-19 00:31:52.453838	1	60180.00	Delivered	1	2026-01-19 00:31:52.453838
5	DO-2026-000005	Ali Hassan	03001234567	House 123, Street 5, Rawalpindi	1234567890123	2026-01-19 00:33:44.652842	1	60180.00	Delivered	1	2026-01-19 00:33:44.652842
7	DO-2026-000007	Ali Hassan	03001234567	House 123, Street 5, Rawalpindi	1234567890123	2026-01-19 00:35:12.908744	1	60180.00	Delivered	1	2026-01-19 00:35:12.908744
8	DO-2026-000008	Test Customer	03009999999	\N	\N	2026-01-19 00:35:13.926551	1	17700.00	Cancelled	1	2026-01-19 00:35:13.926551
6	DO-2026-000006	Test Customer	03009999999	\N	\N	2026-01-19 00:33:45.387317	1	17700.00	Delivered	1	2026-01-19 00:33:45.387317
9	DO-2026-000009	Muhammad Ahtisham	030024324324	rawalpindi	\N	2026-01-23 16:55:22.873422	1	1416.00	Delivered	1	2026-01-23 16:55:22.873422
4	DO-2026-000004	Test Customer	03009999999	\N	\N	2026-01-19 00:31:53.381358	1	17700.00	Cancelled	1	2026-01-19 00:31:53.381358
2	DO-2026-000002	Test Customer	03009999999	\N	\N	2026-01-18 00:19:33.67309	1	17700.00	Cancelled	1	2026-01-18 00:19:33.67309
10	DO-2026-000010	Beenish Ayub	03305266999	CA-197/224 chistiabad satellite town	\N	2026-01-23 18:05:12.789959	1	2950.00	Delivered	4	2026-01-23 18:05:12.789959
11	DO-2026-000011	Muhammad Shami	03305266999	Chistiabad Satellite Town	61101-4739950-7	2026-01-25 14:44:23.682531	1	2950.00	Delivered	1	2026-01-25 14:44:23.682531
12	DO-2026-000012	Muhammad Ahtisham	03305266999	Satellite Town	61101-4739950-7	2026-01-25 14:50:03.308412	1	4130.00	Delivered	1	2026-01-25 14:50:03.308412
13	DO-2026-000013	Muhammad Ahtisham	4-234423432423	Chistiabad Satellite Town	62202-234324-3	2026-01-25 15:07:57.191239	1	4130.00	Delivered	1	2026-01-25 15:07:57.191239
14	DO-2026-000014	Muhammad Shami	03305266999	Chistiabad Satellite Town	61101-47399507	2026-01-25 15:17:45.245612	1	4130.00	Delivered	1	2026-01-25 15:17:45.245612
15	DO-2026-000015	usman ghani	43434rwerewr	satellite town Rawalpindi		2026-02-02 18:59:40.048245	1	1416.00	Delivered	1	2026-02-02 18:59:40.048245
16	DO-2026-000016	Muhammad Ahtisham	sd4324324	rawalpindi		2026-02-02 23:04:41.685303	1	25488.00	Delivered	1	2026-02-02 23:04:41.685303
\.


--
-- TOC entry 5410 (class 0 OID 17188)
-- Dependencies: 256
-- Data for Name: do_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.do_items (do_item_id, do_id, item_id, quantity, unit_price, gst_percentage, gst_amount, line_total) FROM stdin;
1	1	1	1	15000.00	18.00	2700.00	17700.00
2	1	2	2	18000.00	18.00	6480.00	42480.00
3	2	1	1	15000.00	18.00	2700.00	17700.00
4	3	1	1	15000.00	18.00	2700.00	17700.00
5	3	2	2	18000.00	18.00	6480.00	42480.00
6	4	1	1	15000.00	18.00	2700.00	17700.00
7	5	1	1	15000.00	18.00	2700.00	17700.00
8	5	2	2	18000.00	18.00	6480.00	42480.00
9	6	1	1	15000.00	18.00	2700.00	17700.00
10	7	1	1	15000.00	18.00	2700.00	17700.00
11	7	2	2	18000.00	18.00	6480.00	42480.00
12	8	1	1	15000.00	18.00	2700.00	17700.00
13	9	5	1	1200.00	18.00	216.00	1416.00
14	10	3	1	2500.00	18.00	450.00	2950.00
15	11	3	1	2500.00	18.00	450.00	2950.00
16	12	4	1	3500.00	18.00	630.00	4130.00
17	13	4	1	3500.00	18.00	630.00	4130.00
18	14	4	1	3500.00	18.00	630.00	4130.00
19	15	13	1	1200.00	18.00	216.00	1416.00
20	16	5	12	1800.00	18.00	3888.00	25488.00
\.


--
-- TOC entry 5394 (class 0 OID 16957)
-- Dependencies: 240
-- Data for Name: goods_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goods_receipts (gr_id, gr_number, po_id, gr_date, area_id, received_by, notes, created_at) FROM stdin;
1	GR-2026-000001	2	2026-01-18	1	1	All items received in good condition	2026-01-19 01:25:00.954895
2	GR-2026-000002	3	2026-01-19	1	1	All items received in good condition	2026-01-19 23:42:25.754352
3	GR-2026-000003	4	2026-01-19	1	1	All items received in good condition	2026-01-20 00:35:49.722138
4	GR-2026-000004	6	2026-01-23	1	1	\N	2026-01-23 16:29:56.303079
5	GR-2026-000005	7	2026-01-23	1	1	\N	2026-01-23 16:34:57.46233
6	GR-2026-000006	8	2026-01-23	1	1	\N	2026-01-23 16:59:06.813994
7	GR-2026-000007	8	2026-01-23	1	1	\N	2026-01-23 17:00:15.681677
8	GR-2026-000008	9	2026-01-23	1	1	\N	2026-01-23 17:30:34.037747
9	GR-2026-000009	9	2026-01-23	2	1	\N	2026-01-23 17:31:14.43939
10	GR-2026-000010	17	2026-02-02	2	1	\N	2026-02-02 18:33:35.417404
11	GR-2026-000011	17	2026-02-02	1	1	\N	2026-02-02 18:33:47.814047
12	GR-2026-000012	10	2026-02-03	1	1	\N	2026-02-03 10:34:59.853749
13	GR-2026-000013	15	2026-02-03	1	1	\N	2026-02-03 10:35:13.287294
14	GR-2026-000014	14	2026-02-03	1	1	\N	2026-02-03 10:35:42.531239
15	GR-2026-000015	13	2026-02-03	1	1	\N	2026-02-03 10:35:55.716095
16	GR-2026-000016	11	2026-02-03	1	1	\N	2026-02-03 10:36:12.418607
17	GR-2026-000017	12	2026-02-03	1	1	\N	2026-02-03 10:36:34.784558
18	GR-2026-000018	1	2026-02-03	1	1	\N	2026-02-03 10:37:09.620075
19	GR-2026-000019	5	2026-02-03	1	1	\N	2026-02-03 10:37:27.888067
\.


--
-- TOC entry 5396 (class 0 OID 16987)
-- Dependencies: 242
-- Data for Name: gr_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gr_items (gr_item_id, gr_id, item_id, quantity_received, unit_price) FROM stdin;
1	1	1	10	15000.00
2	1	2	5	18000.00
3	1	3	8	1800.00
4	2	1	10	15000.00
5	2	2	5	18000.00
6	2	3	8	1800.00
7	3	1	10	15000.00
8	3	2	5	18000.00
9	3	3	8	1800.00
10	4	5	1	1200.00
11	5	4	41	3500.00
12	6	5	89	1200.00
13	7	5	86	1200.00
14	8	3	84	2500.00
15	9	3	16	2500.00
16	10	13	20	1000.00
17	11	13	10	1000.00
18	12	1	10	15000.00
19	13	8	10	1800.00
20	14	8	10	1800.00
21	15	1	3	15000.00
22	16	1	10	15000.00
23	17	1	6	15000.00
24	18	1	10	15000.00
25	18	2	5	18000.00
26	18	3	8	1800.00
27	19	2	1	18000.00
\.


--
-- TOC entry 5388 (class 0 OID 16887)
-- Dependencies: 234
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory (inventory_id, item_id, area_id, quantity_in_hand, last_updated) FROM stdin;
2	1	2	10	2026-01-17 22:27:06.763476
3	1	3	10	2026-01-17 22:27:06.763476
5	2	2	10	2026-01-17 22:27:06.773384
6	2	3	10	2026-01-17 22:27:06.773384
9	3	3	10	2026-01-17 22:27:06.7788
11	4	2	10	2026-01-17 22:27:06.781851
12	4	3	10	2026-01-17 22:27:06.781851
14	5	2	10	2026-01-17 22:27:06.784654
15	5	3	10	2026-01-17 22:27:06.784654
16	6	1	10	2026-01-17 22:27:06.788044
17	6	2	10	2026-01-17 22:27:06.788044
18	6	3	10	2026-01-17 22:27:06.788044
19	7	1	10	2026-01-17 22:27:06.793296
20	7	2	10	2026-01-17 22:27:06.793296
21	7	3	10	2026-01-17 22:27:06.793296
23	8	2	10	2026-01-17 22:27:06.796884
24	8	3	10	2026-01-17 22:27:06.796884
25	9	1	10	2026-01-17 22:27:06.801065
26	9	2	10	2026-01-17 22:27:06.801065
27	9	3	10	2026-01-17 22:27:06.801065
28	10	1	10	2026-01-17 22:27:06.805228
29	10	2	10	2026-01-17 22:27:06.805228
30	10	3	10	2026-01-17 22:27:06.805228
8	3	2	26	2026-01-23 17:31:14.464315
31	13	2	20	2026-02-02 18:33:35.435532
10	4	1	46	2026-02-02 22:18:12.267739
32	13	1	7	2026-02-02 22:31:01.758519
13	5	1	167	2026-02-02 23:04:46.053601
22	8	1	23	2026-02-03 10:35:42.543581
1	1	1	73	2026-02-03 10:37:09.63371
7	3	1	121	2026-02-03 10:37:09.63371
4	2	1	22	2026-02-03 10:37:27.899833
\.


--
-- TOC entry 5416 (class 0 OID 17280)
-- Dependencies: 262
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_transactions (transaction_id, item_id, area_id, transaction_type, reference_id, reference_number, quantity_change, quantity_before, quantity_after, unit_price, transaction_date, performed_by, notes) FROM stdin;
1	1	1	MRQS_ISSUE	1	MRQS-2026-000001	-2	10	8	15000.00	2026-01-17 23:34:30.811472	5	Parts issued via MRQS MRQS-2026-000001
2	2	1	MRQS_ISSUE	1	MRQS-2026-000001	-1	10	9	18000.00	2026-01-17 23:34:30.811472	5	Parts issued via MRQS MRQS-2026-000001
3	1	1	MRTS_RETURN	1	MRTS-2026-000001	1	8	9	15000.00	2026-01-17 23:34:31.398843	2	Parts returned via MRTS MRTS-2026-000001
4	1	1	DO_ISSUE	1	DO-2026-000001	-1	9	8	15000.00	2026-01-18 00:19:32.953736	5	Counter sale via DO DO-2026-000001
5	2	1	DO_ISSUE	1	DO-2026-000001	-2	9	7	18000.00	2026-01-18 00:19:32.953736	5	Counter sale via DO DO-2026-000001
6	1	1	DO_ISSUE	3	DO-2026-000003	-1	8	7	15000.00	2026-01-19 00:31:52.514981	5	Counter sale via DO DO-2026-000003
7	2	1	DO_ISSUE	3	DO-2026-000003	-2	7	5	18000.00	2026-01-19 00:31:52.514981	5	Counter sale via DO DO-2026-000003
8	1	1	DO_ISSUE	5	DO-2026-000005	-1	7	6	15000.00	2026-01-19 00:33:44.715834	5	Counter sale via DO DO-2026-000005
9	2	1	DO_ISSUE	5	DO-2026-000005	-2	5	3	18000.00	2026-01-19 00:33:44.715834	5	Counter sale via DO DO-2026-000005
10	1	1	DO_ISSUE	7	DO-2026-000007	-1	6	5	15000.00	2026-01-19 00:35:12.998378	5	Counter sale via DO DO-2026-000007
11	2	1	DO_ISSUE	7	DO-2026-000007	-2	3	1	18000.00	2026-01-19 00:35:12.998378	5	Counter sale via DO DO-2026-000007
12	1	1	GR	1	GR-2026-000001	10	5	15	15000.00	2026-01-19 01:25:00.959966	1	Goods receipt from GR GR-2026-000001
13	2	1	GR	1	GR-2026-000001	5	1	6	18000.00	2026-01-19 01:25:00.959966	1	Goods receipt from GR GR-2026-000001
14	3	1	GR	1	GR-2026-000001	8	10	18	1800.00	2026-01-19 01:25:00.959966	1	Goods receipt from GR GR-2026-000001
15	1	1	GR	2	GR-2026-000002	10	15	25	15000.00	2026-01-19 23:42:25.783273	1	Goods receipt from GR GR-2026-000002
16	2	1	GR	2	GR-2026-000002	5	6	11	18000.00	2026-01-19 23:42:25.783273	1	Goods receipt from GR GR-2026-000002
17	3	1	GR	2	GR-2026-000002	8	18	26	1800.00	2026-01-19 23:42:25.783273	1	Goods receipt from GR GR-2026-000002
18	1	1	GR	3	GR-2026-000003	10	25	35	15000.00	2026-01-20 00:35:49.735518	1	Goods receipt from GR GR-2026-000003
19	2	1	GR	3	GR-2026-000003	5	11	16	18000.00	2026-01-20 00:35:49.735518	1	Goods receipt from GR GR-2026-000003
20	3	1	GR	3	GR-2026-000003	8	26	34	1800.00	2026-01-20 00:35:49.735518	1	Goods receipt from GR GR-2026-000003
21	1	1	DO_ISSUE	6	DO-2026-000006	-1	35	34	15000.00	2026-01-23 00:12:36.756483	5	Counter sale via DO DO-2026-000006
22	5	1	MRQS_ISSUE	1	MRQS-2026-000001	-1	10	9	1200.00	2026-01-23 01:39:34.098929	1	Parts issued via MRQS MRQS-2026-000001
23	4	1	MRQS_ISSUE	2	MRQS-2026-000002	-1	10	9	3500.00	2026-01-23 01:41:04.585755	1	Parts issued via MRQS MRQS-2026-000002
24	5	1	GR	4	GR-2026-000004	1	9	10	1200.00	2026-01-23 16:29:56.332818	1	Goods receipt from GR GR-2026-000004
25	4	1	GR	5	GR-2026-000005	41	9	50	3500.00	2026-01-23 16:34:57.485285	1	Goods receipt from GR GR-2026-000005
26	5	1	DO_ISSUE	9	DO-2026-000009	-1	10	9	1200.00	2026-01-23 16:57:00.937019	1	Counter sale via DO DO-2026-000009
27	5	1	GR	6	GR-2026-000006	89	9	98	1200.00	2026-01-23 16:59:06.832085	1	Goods receipt from GR GR-2026-000006
28	5	1	GR	7	GR-2026-000007	86	98	184	1200.00	2026-01-23 17:00:15.7127	1	Goods receipt from GR GR-2026-000007
29	3	1	GR	8	GR-2026-000008	84	34	118	2500.00	2026-01-23 17:30:34.060428	1	Goods receipt from GR GR-2026-000008
30	3	2	GR	9	GR-2026-000009	16	10	26	2500.00	2026-01-23 17:31:14.464315	1	Goods receipt from GR GR-2026-000009
31	5	1	MRQS_ISSUE	3	MRQS-2026-000003	-1	184	183	1200.00	2026-01-23 17:49:25.300025	5	Parts issued via MRQS MRQS-2026-000003
32	3	1	DO_ISSUE	10	DO-2026-000010	-1	118	117	2500.00	2026-01-23 18:06:19.789239	5	Counter sale via DO DO-2026-000010
33	3	1	MRQS_ISSUE	4	MRQS-2026-000004	-1	117	116	2500.00	2026-01-25 01:33:44.300527	5	Parts issued via MRQS MRQS-2026-000004
34	3	1	DO_ISSUE	11	DO-2026-000011	-1	116	115	2500.00	2026-01-25 14:44:45.394155	1	Counter sale via DO DO-2026-000011
35	4	1	DO_ISSUE	12	DO-2026-000012	-1	\N	\N	3500.00	2026-01-25 14:50:03.308412	1	DO issued to Muhammad Ahtisham
36	4	1	DO_ISSUE	13	DO-2026-000013	-1	\N	\N	3500.00	2026-01-25 15:07:57.191239	1	DO issued to Muhammad Ahtisham
37	4	1	DO_ISSUE	12	DO-2026-000012	-1	48	47	3500.00	2026-01-25 15:08:13.920871	1	Counter sale via DO DO-2026-000012
38	4	1	DO_ISSUE	13	DO-2026-000013	-1	47	46	3500.00	2026-01-25 15:08:58.849356	1	Counter sale via DO DO-2026-000013
39	4	1	DO_ISSUE	14	DO-2026-000014	-1	46	45	3500.00	2026-01-25 15:18:03.996227	1	Counter sale via DO DO-2026-000014
40	13	2	GR	10	GR-2026-000010	20	0	20	1000.00	2026-02-02 18:33:35.435532	1	Goods receipt from GR GR-2026-000010
41	13	1	GR	11	GR-2026-000011	10	0	10	1000.00	2026-02-02 18:33:47.818495	1	Goods receipt from GR GR-2026-000011
42	13	1	MRQS_ISSUE	6	MRQS-2026-000006	-1	10	9	1000.00	2026-02-02 18:41:11.038125	1	Parts issued via MRQS MRQS-2026-000006
43	13	1	DO_ISSUE	15	DO-2026-000015	-1	9	8	1200.00	2026-02-02 19:00:26.10832	1	Counter sale via DO DO-2026-000015
44	13	1	MRQS_ISSUE	9	MRQS-2026-000009	-1	8	7	1000.00	2026-02-02 20:53:40.684954	1	Parts issued via MRQS MRQS-2026-000009
45	5	1	MRQS_ISSUE	10	MRQS-2026-000010	-1	183	182	1500.00	2026-02-02 21:10:46.585657	1	Parts issued via MRQS MRQS-2026-000010
46	5	1	MRQS_ISSUE	10	MRQS-2026-000010	-1	182	181	1500.00	2026-02-02 21:16:40.086583	1	Parts issued via MRQS MRQS-2026-000010
47	5	1	MRQS_ISSUE	10	MRQS-2026-000010	-1	181	180	1500.00	2026-02-02 21:27:24.766076	1	Parts issued via MRQS MRQS-2026-000010
48	4	1	MRQS_ISSUE	14	MRQS-2026-000012	-1	45	44	4200.00	2026-02-02 21:40:15.763655	1	Parts issued via MRQS MRQS-2026-000012
49	4	1	MRTS_RETURN	1	MRTS-2026-000001	1	44	45	4200.00	2026-02-02 22:08:51.528974	1	Parts returned via MRTS MRTS-2026-000001
50	4	1	MRTS_RETURN	2	MRTS-2026-000002	1	45	46	4200.00	2026-02-02 22:18:12.267739	1	Parts returned via MRTS MRTS-2026-000002
51	13	1	MRQS_ISSUE	16	MRQS-2026-000014	-1	7	6	1200.00	2026-02-02 22:25:34.522615	1	Parts issued via MRQS MRQS-2026-000014
52	13	1	MRTS_RETURN	3	MRTS-2026-000003	1	6	7	1200.00	2026-02-02 22:31:01.758519	1	Parts returned via MRTS MRTS-2026-000003
53	5	1	MRTS_RETURN	4	MRTS-2026-000004	1	180	181	1800.00	2026-02-02 22:36:35.584276	1	Parts returned via MRTS MRTS-2026-000004
54	5	1	MRQS_ISSUE	17	MRQS-2026-000015	-1	181	180	1800.00	2026-02-02 22:37:15.069141	1	Parts issued via MRQS MRQS-2026-000015
55	5	1	MRQS_ISSUE	18	MRQS-2026-000016	-1	180	179	1800.00	2026-02-02 22:49:11.033325	1	Parts issued via MRQS MRQS-2026-000016
56	8	1	MRQS_ISSUE	19	MRQS-2026-000017	-1	10	9	2160.00	2026-02-02 22:51:52.304089	1	Parts issued via MRQS MRQS-2026-000017
57	5	1	DO_ISSUE	16	DO-2026-000016	-12	179	167	1800.00	2026-02-02 23:04:46.053601	1	Counter sale via DO DO-2026-000016
58	8	1	MRQS_ISSUE	20	MRQS-2026-000018	-6	9	3	2160.00	2026-02-02 23:07:51.405004	1	Parts issued via MRQS MRQS-2026-000018
59	3	1	MRQS_ISSUE	21	MRQS-2026-000019	-1	115	114	3000.00	2026-02-02 23:30:12.388607	1	Parts issued via MRQS MRQS-2026-000019
60	3	1	MRQS_ISSUE	22	MRQS-2026-000020	-1	114	113	3000.00	2026-02-02 23:40:31.629628	1	Parts issued via MRQS MRQS-2026-000020
61	1	1	GR	12	GR-2026-000012	10	34	44	15000.00	2026-02-03 10:34:59.874355	1	Goods receipt from GR GR-2026-000012
62	8	1	GR	13	GR-2026-000013	10	3	13	1800.00	2026-02-03 10:35:13.307149	1	Goods receipt from GR GR-2026-000013
63	8	1	GR	14	GR-2026-000014	10	13	23	1800.00	2026-02-03 10:35:42.543581	1	Goods receipt from GR GR-2026-000014
64	1	1	GR	15	GR-2026-000015	3	44	47	15000.00	2026-02-03 10:35:55.730027	1	Goods receipt from GR GR-2026-000015
65	1	1	GR	16	GR-2026-000016	10	47	57	15000.00	2026-02-03 10:36:12.433121	1	Goods receipt from GR GR-2026-000016
66	1	1	GR	17	GR-2026-000017	6	57	63	15000.00	2026-02-03 10:36:34.797223	1	Goods receipt from GR GR-2026-000017
67	1	1	GR	18	GR-2026-000018	10	63	73	15000.00	2026-02-03 10:37:09.63371	1	Goods receipt from GR GR-2026-000018
68	2	1	GR	18	GR-2026-000018	5	16	21	18000.00	2026-02-03 10:37:09.63371	1	Goods receipt from GR GR-2026-000018
69	3	1	GR	18	GR-2026-000018	8	113	121	1800.00	2026-02-03 10:37:09.63371	1	Goods receipt from GR GR-2026-000018
70	2	1	GR	19	GR-2026-000019	1	21	22	18000.00	2026-02-03 10:37:27.899833	1	Goods receipt from GR GR-2026-000019
\.


--
-- TOC entry 5414 (class 0 OID 17256)
-- Dependencies: 260
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (invoice_item_id, invoice_id, item_type, description, quantity, rate_per_unit, amount, gst_percentage, gst_amount, fst_percentage, fst_amount, discount, net_amount, waive_off) FROM stdin;
1	1	PRD	Compressor 1 Ton	1.00	15000.00	15000.00	18.00	2700.00	0.00	0.00	0.00	17700.00	0.00
2	1	PRD	Compressor 1.5 Ton	2.00	18000.00	36000.00	18.00	6480.00	0.00	0.00	0.00	42480.00	0.00
5	4	SER	Dismantling Charges	1.00	1000.00	1000.00	18.00	180.00	0.00	0.00	0.00	1180.00	0.00
6	5	SER	Visit Charges (24 Hours)	1.00	1500.00	1500.00	18.00	270.00	0.00	0.00	0.00	1770.00	0.00
7	5	PRD	Thermostat Digital (UW)	1.00	1200.00	1200.00	18.00	216.00	0.00	0.00	0.00	1416.00	0.00
8	6	PRD	Thermostat Digital	1.00	1200.00	1200.00	18.00	216.00	0.00	0.00	0.00	1416.00	0.00
9	7	PRD	PCB Board Universal	1.00	2500.00	2500.00	18.00	450.00	0.00	0.00	0.00	2950.00	0.00
10	8	PRD	charging port	1.00	1200.00	1200.00	18.00	216.00	0.00	0.00	0.00	1416.00	0.00
14	12	SER	Transport Charges (per km)	1.00	50.00	50.00	18.00	9.00	0.00	0.00	0.00	59.00	0.00
15	13	SER	Visit Charges (48 Hours)	1.00	566.00	566.00	18.00	101.88	0.00	0.00	0.00	667.88	0.00
16	13	PRD	Thermostat Digital (UW)	1.00	1800.00	1800.00	18.00	324.00	0.00	0.00	0.00	2124.00	0.00
17	14	SER	Visit Charges (24 Hours)	1.00	900.00	900.00	18.00	162.00	0.00	0.00	0.00	1062.00	0.00
18	14	PRD	Heating Element 1500W (UW)	1.00	2160.00	2160.00	18.00	388.80	0.00	0.00	0.00	2548.80	0.00
19	15	PRD	Thermostat Digital	12.00	1800.00	21600.00	18.00	3888.00	0.00	0.00	0.00	25488.00	0.00
24	18	SER	Dismantling Charges	1.00	1000.00	1000.00	18.00	180.00	0.00	0.00	0.00	1180.00	0.00
25	18	PRD	Heating Element 1500W (UW)	6.00	2160.00	12960.00	18.00	2332.80	0.00	0.00	0.00	15292.80	0.00
36	27	SER	Visit Charges (48 Hours)	1.00	1200.00	1200.00	18.00	216.00	0.00	0.00	0.00	1416.00	0.00
37	27	PRD	PCB Board Universal (UW) - Warranty Covered	1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00
38	28	SER	Visit Charges (24 Hours)	1.00	1400.00	1400.00	18.00	252.00	0.00	0.00	0.00	1652.00	0.00
39	28	PRD	PCB Board Universal (UW)	1.00	3000.00	3000.00	18.00	540.00	0.00	0.00	0.00	3540.00	0.00
\.


--
-- TOC entry 5412 (class 0 OID 17209)
-- Dependencies: 258
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (invoice_id, invoice_number, invoice_type, complaint_id, do_id, customer_id, customer_name, phone, address, cnic, invoice_date, job_number, sales_tax_reg, customer_order_number, customer_order_date, area_id, subtotal, gst_total, fst_total, discount, net_amount, waive_off, payment_terms, dispatch_mode, status, is_co, created_by, created_at) FROM stdin;
1	RWP-2026-000001	Counter Sale	\N	7	\N	Ali Hassan	03001234567	House 123, Street 5, Rawalpindi	1234567890123	2026-01-22 14:46:37.968763	\N	\N	\N	\N	1	51000.00	9180.00	0.00	0.00	60180.00	0.00	\N	\N	Paid	f	1	2026-01-22 14:46:37.968763
6	RWP-2026-000004	Counter Sale	\N	9	\N	Muhammad Ahtisham	030024324324	rawalpindi	\N	2026-01-23 18:01:38.036154	\N	\N	\N	\N	1	1200.00	216.00	0.00	0.00	1416.00	0.00	\N	\N	Paid	f	5	2026-01-23 18:01:38.036154
5	RWP-2026-000003	Complaint Service	3	\N	3	Ayesha Malik	03221234567	Villa 7, DHA Phase 2, Islamabad	\N	2026-01-23 17:58:17.992095	\N	\N	\N	\N	1	2700.00	486.00	0.00	0.00	3186.00	0.00	cash on delivery	\N	Paid	f	5	2026-01-23 17:58:17.992095
4	RWP-2026-000002	Complaint Service	1	\N	2	Ali Hassan	03111234567	Flat 4B, Green Plaza, Islamabad	\N	2026-01-22 15:44:34.4038	\N	\N	\N	\N	1	1000.00	180.00	0.00	0.00	1180.00	0.00	\N	\N	Paid	t	1	2026-01-22 15:44:34.4038
7	RWP-2026-000005	Counter Sale	\N	10	\N	Beenish Ayub	03305266999	CA-197/224 chistiabad satellite town	\N	2026-01-23 18:06:56.567428	\N	\N	\N	\N	1	2500.00	450.00	0.00	0.00	2950.00	0.00	\N	\N	Paid	f	5	2026-01-23 18:06:56.567428
8	RWP-2026-000006	Counter Sale	\N	15	\N	usman ghani	43434rwerewr	satellite town Rawalpindi		2026-02-02 19:01:23.767573	\N	\N	\N	\N	1	1200.00	216.00	0.00	0.00	1416.00	0.00	\N	\N	Paid	f	1	2026-02-02 19:01:23.767573
13	RWP-2026-000008	Complaint Service	9	\N	2	Ali Hassan	03111234567	Flat 4B, Green Plaza, Islamabad	\N	2026-02-02 22:49:46.841647	\N	\N	\N	\N	1	2366.00	425.88	0.00	0.00	2791.88	0.00	\N	\N	Paid	f	1	2026-02-02 22:49:46.841647
12	RWP-2026-000007	Complaint Service	8	\N	9	anhar	034234342			2026-02-02 22:47:03.510152	\N	\N	\N	\N	1	50.00	9.00	0.00	0.00	59.00	0.00	\N	\N	Paid	f	1	2026-02-02 22:47:03.510152
14	RWP-2026-000009	Complaint Service	6	\N	5	Muhammad Shami	03305266999	Chistiabad Satellite Town	61101-47399507	2026-02-02 22:52:49.584799	\N	\N	\N	\N	1	3060.00	550.80	0.00	0.00	3610.80	0.00	\N	\N	Paid	f	1	2026-02-02 22:52:49.584799
15	RWP-2026-000010	Counter Sale	\N	16	\N	Muhammad Ahtisham	sd4324324	rawalpindi		2026-02-02 23:04:55.925458	\N	\N	\N	\N	1	21600.00	3888.00	0.00	0.00	25488.00	0.00	\N	\N	Paid	f	1	2026-02-02 23:04:55.925458
18	RWP-2026-000011	Complaint Service	4	\N	1	Muhammad Qasim Abbas	03001234567	House #123, Street 5, Rawalpindi	\N	2026-02-02 23:10:08.293616	\N	\N	\N	\N	1	13960.00	2512.80	0.00	0.00	16472.80	0.00	\N	\N	Paid	f	1	2026-02-02 23:10:08.293616
28	RWP-2026-000013	Complaint Service	5	\N	6	Beenish Ayub	03305266999	CA-197/224 chistiabad satellite town	61101-3123213-2	2026-02-02 23:53:27.311549	\N	\N	\N	\N	1	4400.00	792.00	0.00	0.00	5192.00	0.00	\N	\N	Paid	f	1	2026-02-02 23:53:27.311549
27	RWP-2026-000012	Complaint Service	10	\N	9	anhar	034234342			2026-02-02 23:52:53.917731	\N	\N	\N	\N	1	1200.00	216.00	0.00	0.00	1416.00	0.00	\N	\N	Paid	f	1	2026-02-02 23:52:53.917731
\.


--
-- TOC entry 5386 (class 0 OID 16870)
-- Dependencies: 232
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (item_id, item_code, description, category, unit_price, is_active, created_at, selling_price, markup_percentage) FROM stdin;
1	COMP-001	Compressor 1 Ton	Spare Part	15000.00	t	2026-01-17 22:27:06.759785	18000.00	20.00
2	COMP-002	Compressor 1.5 Ton	Spare Part	18000.00	t	2026-01-17 22:27:06.770661	21600.00	20.00
3	PCB-001	PCB Board Universal	Spare Part	2500.00	t	2026-01-17 22:27:06.776804	3000.00	20.00
4	MOTOR-001	Fan Motor	Spare Part	3500.00	t	2026-01-17 22:27:06.780424	4200.00	20.00
6	RELAY-001	Overload Relay	Spare Part	800.00	t	2026-01-17 22:27:06.78635	960.00	20.00
7	FILTER-001	Water Filter	Spare Part	500.00	t	2026-01-17 22:27:06.790849	600.00	20.00
8	ELEM-001	Heating Element 1500W	Spare Part	1800.00	t	2026-01-17 22:27:06.795171	2160.00	20.00
9	PUMP-001	Drain Pump	Spare Part	2200.00	t	2026-01-17 22:27:06.798889	2640.00	20.00
10	VALVE-001	Gas Valve	Spare Part	1500.00	t	2026-01-17 22:27:06.803464	1800.00	20.00
11	TEST-ITEM-1768852893682	Updated Test Compressor Unit	Compressor	28000.00	t	2026-01-20 01:01:33.693247	33600.00	20.00
5	THERMO-001	Thermostat Digital	Spare Part	1500.00	t	2026-01-17 22:27:06.783577	1800.00	20.00
12	fsdfdsgf-548	sdsgdgs	Gas	9999.99	f	2026-01-25 00:22:26.818924	11999.99	20.00
13	chat-fs-w4324	charging port	Spare Part	1000.00	t	2026-02-02 18:28:39.214563	1200.00	20.00
\.


--
-- TOC entry 5400 (class 0 OID 17060)
-- Dependencies: 246
-- Data for Name: material_requisitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.material_requisitions (mrqs_id, mrqs_number, complaint_id, technician_id, area_id, mrqs_date, status, created_at) FROM stdin;
1	MRQS-2026-000001	1	2	1	2026-01-23 01:39:29.688754	Issued	2026-01-23 01:39:29.688754
2	MRQS-2026-000002	1	2	1	2026-01-23 01:40:41.663437	Issued	2026-01-23 01:40:41.663437
3	MRQS-2026-000003	3	2	1	2026-01-23 17:47:39.059134	Issued	2026-01-23 17:47:39.059134
5	MRQS-2026-000005	1	2	1	2026-01-25 01:20:26.422313	Rejected	2026-01-25 01:20:26.422313
4	MRQS-2026-000004	1	2	1	2026-01-25 01:13:52.902734	Issued	2026-01-25 01:13:52.902734
6	MRQS-2026-000006	7	3	1	2026-02-02 18:40:15.536426	Issued	2026-02-02 18:40:15.536426
7	MRQS-2026-000007	7	3	1	2026-02-02 19:19:33.782347	Rejected	2026-02-02 19:19:33.782347
8	MRQS-2026-000008	7	3	1	2026-02-02 19:41:40.829389	Rejected	2026-02-02 19:41:40.829389
9	MRQS-2026-000009	7	3	1	2026-02-02 19:56:25.988797	Issued	2026-02-02 19:56:25.988797
10	MRQS-2026-000010	8	2	1	2026-02-02 20:58:48.608186	Issued	2026-02-02 20:58:48.608186
14	MRQS-2026-000012	8	2	1	2026-02-02 21:40:08.074645	Issued	2026-02-02 21:40:08.074645
13	MRQS-2026-000011	8	2	1	2026-02-02 21:27:46.071251	Rejected	2026-02-02 21:27:46.071251
15	MRQS-2026-000013	8	2	1	2026-02-02 21:49:15.490888	Rejected	2026-02-02 21:49:15.490888
16	MRQS-2026-000014	8	2	1	2026-02-02 22:25:02.666962	Issued	2026-02-02 22:25:02.666962
17	MRQS-2026-000015	8	2	1	2026-02-02 22:37:06.927103	Issued	2026-02-02 22:37:06.927103
18	MRQS-2026-000016	9	2	1	2026-02-02 22:49:00.722754	Issued	2026-02-02 22:49:00.722754
19	MRQS-2026-000017	6	3	1	2026-02-02 22:51:43.987627	Issued	2026-02-02 22:51:43.987627
20	MRQS-2026-000018	4	2	1	2026-02-02 23:07:44.075457	Issued	2026-02-02 23:07:44.075457
21	MRQS-2026-000019	10	3	1	2026-02-02 23:29:48.534372	Issued	2026-02-02 23:29:48.534372
22	MRQS-2026-000020	5	2	1	2026-02-02 23:40:25.68019	Issued	2026-02-02 23:40:25.68019
\.


--
-- TOC entry 5404 (class 0 OID 17111)
-- Dependencies: 250
-- Data for Name: material_returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.material_returns (mrts_id, mrts_number, complaint_id, technician_id, area_id, mrts_date, created_at) FROM stdin;
1	MRTS-2026-000001	8	1	1	2026-02-02 22:08:51.514972	2026-02-02 22:08:51.514972
2	MRTS-2026-000002	8	1	1	2026-02-02 22:18:12.260124	2026-02-02 22:18:12.260124
3	MRTS-2026-000003	8	1	1	2026-02-02 22:31:01.748945	2026-02-02 22:31:01.748945
4	MRTS-2026-000004	8	1	1	2026-02-02 22:36:35.572957	2026-02-02 22:36:35.572957
\.


--
-- TOC entry 5402 (class 0 OID 17090)
-- Dependencies: 248
-- Data for Name: mrqs_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mrqs_items (mrqs_item_id, mrqs_id, item_id, quantity, unit_price, item_status, amount) FROM stdin;
1	1	5	1	1200.00	UW	1200.00
2	2	4	1	3500.00	OPB	3500.00
3	3	5	1	1200.00	UW	1200.00
4	4	3	1	2500.00	UW	2500.00
5	5	6	1	800.00	UW	800.00
6	6	13	1	1000.00	UW	1000.00
7	7	13	1	0.00	UW	0.00
8	8	13	1	0.00	UW	0.00
9	9	13	1	1000.00	UW	1000.00
10	10	5	1	1500.00	UW	1500.00
13	13	4	1	4200.00	UW	4200.00
14	14	4	1	4200.00	UW	4200.00
15	15	4	1	4200.00	UW	4200.00
16	16	13	1	1200.00	UW	1200.00
17	17	5	1	1800.00	UW	1800.00
18	18	5	1	1800.00	UW	1800.00
19	19	8	1	2160.00	UW	2160.00
20	20	8	6	2160.00	UW	12960.00
21	21	3	1	3000.00	UW	3000.00
22	22	3	1	3000.00	UW	3000.00
\.


--
-- TOC entry 5406 (class 0 OID 17139)
-- Dependencies: 252
-- Data for Name: mrts_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mrts_items (mrts_item_id, mrts_id, item_id, quantity, unit_price, item_status, amount) FROM stdin;
1	1	4	1	4200.00	UW	4200.00
2	2	4	1	4200.00	UW	4200.00
3	3	13	1	1200.00	OPB	1200.00
4	4	5	1	1800.00	OPB	1800.00
\.


--
-- TOC entry 5420 (class 0 OID 17402)
-- Dependencies: 267
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notification_id, user_id, type, title, message, reference_type, reference_id, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 5380 (class 0 OID 16820)
-- Dependencies: 226
-- Data for Name: operational_areas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operational_areas (area_id, area_name, area_code, is_active) FROM stdin;
1	Rawalpindi, PEL Service Center	RWP	t
3	Lahore Service Center	LHR	t
4	Updated Test Service Center	TST-1768852893721	t
2	Islamabad Service Center  buhahah	ISB	t
5	quetta hahhahha	qut	t
\.


--
-- TOC entry 5392 (class 0 OID 16934)
-- Dependencies: 238
-- Data for Name: po_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.po_items (po_item_id, po_id, item_id, quantity, unit_price, status) FROM stdin;
1	1	1	10	15000.00	Normal
2	1	2	5	18000.00	FOC
3	1	3	8	1800.00	OPB
4	2	1	10	15000.00	Normal
5	2	2	5	18000.00	FOC
6	2	3	8	1800.00	OPB
7	3	1	10	15000.00	Normal
8	3	2	5	18000.00	FOC
9	3	3	8	1800.00	OPB
10	4	1	10	15000.00	Normal
11	4	2	5	18000.00	FOC
12	4	3	8	1800.00	OPB
13	5	2	1	18000.00	Normal
14	6	5	1	1200.00	FOC
15	7	4	41	3500.00	Normal
16	8	5	100	1200.00	Normal
17	9	3	100	2500.00	OPB
18	10	1	10	15000.00	Normal
19	11	1	10	15000.00	Normal
20	12	1	6	15000.00	Normal
21	13	1	3	15000.00	Normal
22	14	8	10	1800.00	Normal
23	15	8	10	1800.00	Normal
24	16	2	5	18000.00	Normal
25	17	13	30	1000.00	Normal
\.


--
-- TOC entry 5382 (class 0 OID 16833)
-- Dependencies: 228
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (product_id, product_name, product_code, category, is_active, created_at) FROM stdin;
1	Instant Geyser	IG	Appliance	t	2026-01-17 22:27:06.712637
2	Storage Geyser	SG	Appliance	t	2026-01-17 22:27:06.716734
3	Electric Geyser	EG	Appliance	t	2026-01-17 22:27:06.719066
4	Refrigerator Side By Side	REF-SBS	Appliance	t	2026-01-17 22:27:06.721195
5	Refrigerator No Frost	REF-NF	Appliance	t	2026-01-17 22:27:06.723082
6	Refrigerator Direct Cool	REF-DC	Appliance	t	2026-01-17 22:27:06.725021
7	Split AC 1 Ton	AC-1T	Appliance	t	2026-01-17 22:27:06.72708
8	Split AC 1.5 Ton	AC-1.5T	Appliance	t	2026-01-17 22:27:06.729277
9	Split AC 2 Ton	AC-2T	Appliance	t	2026-01-17 22:27:06.730947
10	Washing Machine Fully Automatic	WM-FA	Appliance	t	2026-01-17 22:27:06.733034
11	Washing Machine Semi Automatic	WM-SA	Appliance	t	2026-01-17 22:27:06.734558
12	LED TV 32 INCH	TV-32	Appliance	t	2026-01-17 22:27:06.735536
13	LED TV 43 INCH	TV-43	Appliance	t	2026-01-17 22:27:06.736869
14	LED TV 55 INCH	TV-55	Appliance	t	2026-01-17 22:27:06.73801
15	Cooking Range	CR	Appliance	t	2026-01-17 22:27:06.738791
16	Microwave Oven	MWO	Appliance	t	2026-01-17 22:27:06.739766
17	Deep Freezer	DF	Appliance	t	2026-01-17 22:27:06.741628
18	Updated Test Refrigerator	TEST-REF-1768852893645	Refrigerator - Updated	t	2026-01-20 01:01:33.659561
19	hahha 	hehe-red-11535		t	2026-01-25 00:21:02.344701
\.


--
-- TOC entry 5390 (class 0 OID 16909)
-- Dependencies: 236
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_orders (po_id, po_number, vendor_id, po_date, status, total_amount, created_by, created_at) FROM stdin;
2	PO-2026-000002	3	2026-01-18	received	254400.00	1	2026-01-19 01:25:00.387814
3	PO-2026-000003	1	2026-01-19	received	254400.00	1	2026-01-19 23:42:25.050464
4	PO-2026-000004	1	2026-01-19	received	254400.00	1	2026-01-20 00:35:49.116094
6	PO-2026-000006	4	2026-01-23	received	1200.00	1	2026-01-23 16:11:10.586376
7	PO-2026-000007	5	2026-01-23	received	143500.00	1	2026-01-23 16:34:20.013063
8	PO-2026-000008	5	2026-01-23	received	120000.00	1	2026-01-23 16:58:06.845216
9	PO-2026-000009	5	2026-01-23	received	250000.00	1	2026-01-23 17:29:59.188647
16	PO-2026-000016	4	2026-01-24	cancelled	90000.00	1	2026-01-25 01:57:35.181914
17	PO-2026-000017	5	2026-02-02	received	30000.00	1	2026-02-02 18:32:51.582516
10	PO-2026-000010	5	2026-01-24	received	150000.00	5	2026-01-25 01:35:46.980717
15	PO-2026-000015	5	2026-01-24	received	18000.00	1	2026-01-25 01:44:54.640676
14	PO-2026-000014	5	2026-01-24	received	18000.00	1	2026-01-25 01:44:25.774797
13	PO-2026-000013	5	2026-01-24	received	45000.00	1	2026-01-25 01:39:58.531592
11	PO-2026-000011	5	2026-01-24	received	150000.00	5	2026-01-25 01:35:52.749785
12	PO-2026-000012	5	2026-01-24	received	90000.00	5	2026-01-25 01:36:35.104407
1	PO-2026-000001	1	2026-01-18	received	254400.00	1	2026-01-19 01:19:47.700851
5	PO-2026-000005	2	2026-01-23	received	18000.00	1	2026-01-23 15:44:50.952327
\.


--
-- TOC entry 5384 (class 0 OID 16847)
-- Dependencies: 230
-- Data for Name: service_tariffs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_tariffs (tariff_id, product_id, visit_charges_24h, visit_charges_48h, gas_charges, inspection_charges_csc, washing_charges, transport_charges_per_km, dismantling_charges, reinstallation_charges, created_at, updated_at) FROM stdin;
2	1	1200.00	1000.00	2500.00	700.00	900.00	40.00	1000.00	1000.00	2026-01-22 14:41:37.325436	2026-01-22 14:41:37.325436
3	2	1200.00	1000.00	2500.00	700.00	900.00	40.00	1000.00	1000.00	2026-01-22 14:41:37.325436	2026-01-22 14:41:37.325436
4	3	1200.00	1000.00	2500.00	700.00	900.00	40.00	1000.00	1000.00	2026-01-22 14:41:37.325436	2026-01-22 14:41:37.325436
5	4	1500.00	1300.00	3000.00	800.00	1200.00	50.00	1300.00	1300.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
6	5	1500.00	1300.00	3000.00	800.00	1200.00	50.00	1300.00	1300.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
7	6	1500.00	1300.00	3000.00	800.00	1200.00	50.00	1300.00	1300.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
8	18	1500.00	1300.00	3000.00	800.00	1200.00	50.00	1300.00	1300.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
9	7	1800.00	1500.00	3500.00	1000.00	1500.00	60.00	2000.00	2000.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
10	8	1800.00	1500.00	3500.00	1000.00	1500.00	60.00	2000.00	2000.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
11	9	1800.00	1500.00	3500.00	1000.00	1500.00	60.00	2000.00	2000.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
12	10	1800.00	1500.00	3500.00	1000.00	1500.00	60.00	2000.00	2000.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
13	11	1800.00	1500.00	3500.00	1000.00	1500.00	60.00	2000.00	2000.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
14	10	1300.00	1100.00	0.00	700.00	1000.00	40.00	1200.00	1200.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
15	11	1300.00	1100.00	0.00	700.00	1000.00	40.00	1200.00	1200.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
16	12	1400.00	1200.00	0.00	800.00	0.00	40.00	1000.00	1000.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
17	13	1400.00	1200.00	0.00	800.00	0.00	40.00	1000.00	1000.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
18	14	1400.00	1200.00	0.00	800.00	0.00	40.00	1000.00	1000.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
20	16	1200.00	1000.00	0.00	700.00	0.00	40.00	800.00	800.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
21	17	1500.00	1300.00	2800.00	800.00	1000.00	50.00	1200.00	1200.00	2026-01-22 14:43:40.167894	2026-01-22 14:43:40.167894
19	15	1499.00	1300.00	2800.00	900.00	1100.00	50.00	1400.00	1400.00	2026-01-22 14:43:40.167894	2026-01-25 00:23:06.625691
22	19	900.00	566.00	345.00	345.00	34435.00	5345.00	543.00	435.00	2026-01-25 00:23:54.992372	2026-01-25 00:23:54.992372
\.


--
-- TOC entry 5374 (class 0 OID 16770)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, password_hash, full_name, email, phone, role, is_active, created_at, updated_at) FROM stdin;
4	reception1	$2a$10$Vynv65ErNvUzbWmXXqX6w.DTufM4ttMIxTniRo2/3shW9sBoS5NXe	Sara Ahmed	sara@salescare.com	03131234567	receptionist	t	2026-01-17 22:27:06.702232	2026-01-17 22:27:06.702232
5	manager1	$2a$10$Vynv65ErNvUzbWmXXqX6w.DTufM4ttMIxTniRo2/3shW9sBoS5NXe	Hassan Malik	hassan@salescare.com	03141234567	manager	t	2026-01-17 22:27:06.702232	2026-01-17 22:27:06.702232
3	tech2	$2a$10$6c5CVXa/47vf.1k9pPzbOe0TKMPnAvwDFpGx6oYLJS603qVF2s2za	Fatima Khan	fatima@salescare.com	03121234567	technician	t	2026-01-17 22:27:06.702232	2026-02-03 00:13:58.825192
1	admin	$2a$10$PcTd5dcameSIzTvxhRMe6OMAYE2zYThqoqEIeJPRjpPb37RAkiRwG	Muhammad Ahtisham	admin@salescare.com	03001234567	admin	t	2026-01-17 22:27:06.702232	2026-02-03 00:20:42.646732
7	anharhehe	$2a$10$l0Cf5FzfMYPYvBRaw2GfaO8iZ.3/bmcjWmfmwIdp2/LYsnViQc9e.	anharhehe			receptionist	t	2026-02-03 00:16:19.286556	2026-02-03 00:21:03.669591
8	usman	$2a$10$lxxdTbprrTayNaFfVaPKIO9ntkLIjttVp10bXWWj5tayhdXuL/Ifi	usman ghani	usman@salescare.com		technician	t	2026-02-03 00:21:46.498875	2026-02-03 00:21:46.498875
2	tech1	$2a$10$Vynv65ErNvUzbWmXXqX6w.DTufM4ttMIxTniRo2/3shW9sBoS5NXe	tech1	shamimuhammad77@gmail.com	+923305266999	technician	t	2026-01-17 22:27:06.702232	2026-02-03 17:43:44.47291
\.


--
-- TOC entry 5378 (class 0 OID 16803)
-- Dependencies: 224
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (vendor_id, vendor_code, vendor_name, vendor_type, contact_person, phone, email, address, is_active, created_at) FROM stdin;
1	VEN-001	ABC Parts Supplier	Vendor	\N	03001111111	\N	Commercial Market, Rawalpindi	t	2026-01-17 22:27:06.814991
3	VEN-TEST-001	ABC Electronics Supplier	Vendor	Ahmed Ali	03001234567	abc@electronics.com	Plot 123, Industrial Area, Rawalpindi	t	2026-01-19 01:25:00.085632
2	LPR-001	Local Purchase Rawalpindi	LPR		03002222222		Saddar, Rawalpindi	t	2026-01-17 22:27:06.814991
4	VEN-155641	Test Supplier	Vendor	Muhammad Ahtisham	03305266999	shamimuhammad77@gmail.com	CA-197/224 satellite town Rawalpindi	t	2026-01-23 16:10:11.040364
5	VEN-155643	ahtisham electronics	Vendor	Muhammad Ahtisham	03305266999	shamimuhammad77@gmail.com	CA-197/224 satellite town Rawalpindi	t	2026-01-23 16:32:13.463946
\.


--
-- TOC entry 5456 (class 0 OID 0)
-- Dependencies: 263
-- Name: approval_history_approval_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.approval_history_approval_id_seq', 32, true);


--
-- TOC entry 5457 (class 0 OID 0)
-- Dependencies: 243
-- Name: complaints_complaint_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.complaints_complaint_id_seq', 25, true);


--
-- TOC entry 5458 (class 0 OID 0)
-- Dependencies: 221
-- Name: customers_customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_customer_id_seq', 12, true);


--
-- TOC entry 5459 (class 0 OID 0)
-- Dependencies: 253
-- Name: delivery_orders_do_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_orders_do_id_seq', 16, true);


--
-- TOC entry 5460 (class 0 OID 0)
-- Dependencies: 255
-- Name: do_items_do_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.do_items_do_item_id_seq', 20, true);


--
-- TOC entry 5461 (class 0 OID 0)
-- Dependencies: 239
-- Name: goods_receipts_gr_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goods_receipts_gr_id_seq', 19, true);


--
-- TOC entry 5462 (class 0 OID 0)
-- Dependencies: 241
-- Name: gr_items_gr_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gr_items_gr_item_id_seq', 27, true);


--
-- TOC entry 5463 (class 0 OID 0)
-- Dependencies: 233
-- Name: inventory_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_inventory_id_seq', 32, true);


--
-- TOC entry 5464 (class 0 OID 0)
-- Dependencies: 261
-- Name: inventory_transactions_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_transactions_transaction_id_seq', 70, true);


--
-- TOC entry 5465 (class 0 OID 0)
-- Dependencies: 259
-- Name: invoice_items_invoice_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_items_invoice_item_id_seq', 39, true);


--
-- TOC entry 5466 (class 0 OID 0)
-- Dependencies: 257
-- Name: invoices_invoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_invoice_id_seq', 28, true);


--
-- TOC entry 5467 (class 0 OID 0)
-- Dependencies: 231
-- Name: items_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.items_item_id_seq', 13, true);


--
-- TOC entry 5468 (class 0 OID 0)
-- Dependencies: 245
-- Name: material_requisitions_mrqs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.material_requisitions_mrqs_id_seq', 22, true);


--
-- TOC entry 5469 (class 0 OID 0)
-- Dependencies: 249
-- Name: material_returns_mrts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.material_returns_mrts_id_seq', 4, true);


--
-- TOC entry 5470 (class 0 OID 0)
-- Dependencies: 247
-- Name: mrqs_items_mrqs_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mrqs_items_mrqs_item_id_seq', 22, true);


--
-- TOC entry 5471 (class 0 OID 0)
-- Dependencies: 251
-- Name: mrts_items_mrts_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mrts_items_mrts_item_id_seq', 4, true);


--
-- TOC entry 5472 (class 0 OID 0)
-- Dependencies: 266
-- Name: notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_notification_id_seq', 1, false);


--
-- TOC entry 5473 (class 0 OID 0)
-- Dependencies: 225
-- Name: operational_areas_area_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operational_areas_area_id_seq', 5, true);


--
-- TOC entry 5474 (class 0 OID 0)
-- Dependencies: 237
-- Name: po_items_po_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.po_items_po_item_id_seq', 25, true);


--
-- TOC entry 5475 (class 0 OID 0)
-- Dependencies: 227
-- Name: products_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_product_id_seq', 19, true);


--
-- TOC entry 5476 (class 0 OID 0)
-- Dependencies: 235
-- Name: purchase_orders_po_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_orders_po_id_seq', 17, true);


--
-- TOC entry 5477 (class 0 OID 0)
-- Dependencies: 229
-- Name: service_tariffs_tariff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_tariffs_tariff_id_seq', 22, true);


--
-- TOC entry 5478 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 8, true);


--
-- TOC entry 5479 (class 0 OID 0)
-- Dependencies: 223
-- Name: vendors_vendor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vendors_vendor_id_seq', 5, true);


--
-- TOC entry 5169 (class 2606 OID 17380)
-- Name: approval_history approval_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_pkey PRIMARY KEY (approval_id);


--
-- TOC entry 5131 (class 2606 OID 17028)
-- Name: complaints complaints_complaint_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_complaint_number_key UNIQUE (complaint_number);


--
-- TOC entry 5133 (class 2606 OID 17026)
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (complaint_id);


--
-- TOC entry 5092 (class 2606 OID 16801)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);


--
-- TOC entry 5151 (class 2606 OID 17176)
-- Name: delivery_orders delivery_orders_do_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_orders
    ADD CONSTRAINT delivery_orders_do_number_key UNIQUE (do_number);


--
-- TOC entry 5153 (class 2606 OID 17174)
-- Name: delivery_orders delivery_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_orders
    ADD CONSTRAINT delivery_orders_pkey PRIMARY KEY (do_id);


--
-- TOC entry 5155 (class 2606 OID 17197)
-- Name: do_items do_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.do_items
    ADD CONSTRAINT do_items_pkey PRIMARY KEY (do_item_id);


--
-- TOC entry 5125 (class 2606 OID 16970)
-- Name: goods_receipts goods_receipts_gr_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_gr_number_key UNIQUE (gr_number);


--
-- TOC entry 5127 (class 2606 OID 16968)
-- Name: goods_receipts goods_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_pkey PRIMARY KEY (gr_id);


--
-- TOC entry 5129 (class 2606 OID 16995)
-- Name: gr_items gr_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gr_items
    ADD CONSTRAINT gr_items_pkey PRIMARY KEY (gr_item_id);


--
-- TOC entry 5115 (class 2606 OID 16897)
-- Name: inventory inventory_item_id_area_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_item_id_area_id_key UNIQUE (item_id, area_id);


--
-- TOC entry 5117 (class 2606 OID 16895)
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (inventory_id);


--
-- TOC entry 5167 (class 2606 OID 17291)
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (transaction_id);


--
-- TOC entry 5163 (class 2606 OID 17273)
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (invoice_item_id);


--
-- TOC entry 5159 (class 2606 OID 17229)
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- TOC entry 5161 (class 2606 OID 17227)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (invoice_id);


--
-- TOC entry 5109 (class 2606 OID 16885)
-- Name: items items_item_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_item_code_key UNIQUE (item_code);


--
-- TOC entry 5111 (class 2606 OID 16883)
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (item_id);


--
-- TOC entry 5139 (class 2606 OID 17073)
-- Name: material_requisitions material_requisitions_mrqs_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_requisitions
    ADD CONSTRAINT material_requisitions_mrqs_number_key UNIQUE (mrqs_number);


--
-- TOC entry 5141 (class 2606 OID 17071)
-- Name: material_requisitions material_requisitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_requisitions
    ADD CONSTRAINT material_requisitions_pkey PRIMARY KEY (mrqs_id);


--
-- TOC entry 5145 (class 2606 OID 17122)
-- Name: material_returns material_returns_mrts_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_mrts_number_key UNIQUE (mrts_number);


--
-- TOC entry 5147 (class 2606 OID 17120)
-- Name: material_returns material_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_pkey PRIMARY KEY (mrts_id);


--
-- TOC entry 5143 (class 2606 OID 17099)
-- Name: mrqs_items mrqs_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mrqs_items
    ADD CONSTRAINT mrqs_items_pkey PRIMARY KEY (mrqs_item_id);


--
-- TOC entry 5149 (class 2606 OID 17147)
-- Name: mrts_items mrts_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mrts_items
    ADD CONSTRAINT mrts_items_pkey PRIMARY KEY (mrts_item_id);


--
-- TOC entry 5177 (class 2606 OID 17416)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 5099 (class 2606 OID 16831)
-- Name: operational_areas operational_areas_area_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operational_areas
    ADD CONSTRAINT operational_areas_area_code_key UNIQUE (area_code);


--
-- TOC entry 5101 (class 2606 OID 16829)
-- Name: operational_areas operational_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operational_areas
    ADD CONSTRAINT operational_areas_pkey PRIMARY KEY (area_id);


--
-- TOC entry 5123 (class 2606 OID 16945)
-- Name: po_items po_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_items
    ADD CONSTRAINT po_items_pkey PRIMARY KEY (po_item_id);


--
-- TOC entry 5103 (class 2606 OID 16843)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- TOC entry 5105 (class 2606 OID 16845)
-- Name: products products_product_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_code_key UNIQUE (product_code);


--
-- TOC entry 5119 (class 2606 OID 16920)
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (po_id);


--
-- TOC entry 5121 (class 2606 OID 16922)
-- Name: purchase_orders purchase_orders_po_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number);


--
-- TOC entry 5107 (class 2606 OID 16863)
-- Name: service_tariffs service_tariffs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_tariffs
    ADD CONSTRAINT service_tariffs_pkey PRIMARY KEY (tariff_id);


--
-- TOC entry 5088 (class 2606 OID 16785)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5090 (class 2606 OID 16787)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5095 (class 2606 OID 16816)
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (vendor_id);


--
-- TOC entry 5097 (class 2606 OID 16818)
-- Name: vendors vendors_vendor_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_vendor_code_key UNIQUE (vendor_code);


--
-- TOC entry 5170 (class 1259 OID 17388)
-- Name: idx_approval_history_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_approval_history_date ON public.approval_history USING btree (performed_at DESC);


--
-- TOC entry 5171 (class 1259 OID 17386)
-- Name: idx_approval_history_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_approval_history_document ON public.approval_history USING btree (document_type, document_id);


--
-- TOC entry 5172 (class 1259 OID 17387)
-- Name: idx_approval_history_performed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_approval_history_performed_by ON public.approval_history USING btree (performed_by);


--
-- TOC entry 5134 (class 1259 OID 17307)
-- Name: idx_complaints_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_customer ON public.complaints USING btree (customer_id);


--
-- TOC entry 5135 (class 1259 OID 17310)
-- Name: idx_complaints_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_date ON public.complaints USING btree (complaint_date);


--
-- TOC entry 5136 (class 1259 OID 17308)
-- Name: idx_complaints_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_status ON public.complaints USING btree (status);


--
-- TOC entry 5137 (class 1259 OID 17309)
-- Name: idx_complaints_technician; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_technician ON public.complaints USING btree (assigned_technician);


--
-- TOC entry 5093 (class 1259 OID 17425)
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- TOC entry 5164 (class 1259 OID 17316)
-- Name: idx_inv_transactions_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inv_transactions_date ON public.inventory_transactions USING btree (transaction_date);


--
-- TOC entry 5165 (class 1259 OID 17315)
-- Name: idx_inv_transactions_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inv_transactions_item ON public.inventory_transactions USING btree (item_id);


--
-- TOC entry 5112 (class 1259 OID 17312)
-- Name: idx_inventory_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_area ON public.inventory USING btree (area_id);


--
-- TOC entry 5113 (class 1259 OID 17311)
-- Name: idx_inventory_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_item ON public.inventory USING btree (item_id);


--
-- TOC entry 5156 (class 1259 OID 17314)
-- Name: idx_invoices_complaint; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_complaint ON public.invoices USING btree (complaint_id);


--
-- TOC entry 5157 (class 1259 OID 17313)
-- Name: idx_invoices_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_date ON public.invoices USING btree (invoice_date);


--
-- TOC entry 5173 (class 1259 OID 17424)
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- TOC entry 5174 (class 1259 OID 17423)
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- TOC entry 5175 (class 1259 OID 17422)
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- TOC entry 5086 (class 1259 OID 17426)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 5223 (class 2620 OID 17399)
-- Name: items trigger_auto_calculate_selling_price; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_auto_calculate_selling_price BEFORE INSERT OR UPDATE OF unit_price, markup_percentage ON public.items FOR EACH ROW EXECUTE FUNCTION public.auto_calculate_selling_price();


--
-- TOC entry 5224 (class 2620 OID 17320)
-- Name: complaints update_complaints_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5222 (class 2620 OID 17319)
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5221 (class 2620 OID 17318)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5219 (class 2606 OID 17381)
-- Name: approval_history approval_history_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(user_id);


--
-- TOC entry 5190 (class 2606 OID 17039)
-- Name: complaints complaints_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.operational_areas(area_id);


--
-- TOC entry 5191 (class 2606 OID 17044)
-- Name: complaints complaints_assigned_technician_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_assigned_technician_fkey FOREIGN KEY (assigned_technician) REFERENCES public.users(user_id);


--
-- TOC entry 5192 (class 2606 OID 17054)
-- Name: complaints complaints_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5193 (class 2606 OID 17029)
-- Name: complaints complaints_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- TOC entry 5194 (class 2606 OID 17034)
-- Name: complaints complaints_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- TOC entry 5195 (class 2606 OID 17049)
-- Name: complaints complaints_service_tariff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_service_tariff_id_fkey FOREIGN KEY (service_tariff_id) REFERENCES public.service_tariffs(tariff_id);


--
-- TOC entry 5206 (class 2606 OID 17177)
-- Name: delivery_orders delivery_orders_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_orders
    ADD CONSTRAINT delivery_orders_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.operational_areas(area_id);


--
-- TOC entry 5207 (class 2606 OID 17182)
-- Name: delivery_orders delivery_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_orders
    ADD CONSTRAINT delivery_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5208 (class 2606 OID 17198)
-- Name: do_items do_items_do_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.do_items
    ADD CONSTRAINT do_items_do_id_fkey FOREIGN KEY (do_id) REFERENCES public.delivery_orders(do_id) ON DELETE CASCADE;


--
-- TOC entry 5209 (class 2606 OID 17203)
-- Name: do_items do_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.do_items
    ADD CONSTRAINT do_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 5185 (class 2606 OID 16976)
-- Name: goods_receipts goods_receipts_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.operational_areas(area_id);


--
-- TOC entry 5186 (class 2606 OID 16971)
-- Name: goods_receipts goods_receipts_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(po_id);


--
-- TOC entry 5187 (class 2606 OID 16981)
-- Name: goods_receipts goods_receipts_received_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.users(user_id);


--
-- TOC entry 5188 (class 2606 OID 16996)
-- Name: gr_items gr_items_gr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gr_items
    ADD CONSTRAINT gr_items_gr_id_fkey FOREIGN KEY (gr_id) REFERENCES public.goods_receipts(gr_id) ON DELETE CASCADE;


--
-- TOC entry 5189 (class 2606 OID 17001)
-- Name: gr_items gr_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gr_items
    ADD CONSTRAINT gr_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 5179 (class 2606 OID 16903)
-- Name: inventory inventory_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.operational_areas(area_id);


--
-- TOC entry 5180 (class 2606 OID 16898)
-- Name: inventory inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 5216 (class 2606 OID 17297)
-- Name: inventory_transactions inventory_transactions_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.operational_areas(area_id);


--
-- TOC entry 5217 (class 2606 OID 17292)
-- Name: inventory_transactions inventory_transactions_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 5218 (class 2606 OID 17302)
-- Name: inventory_transactions inventory_transactions_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(user_id);


--
-- TOC entry 5215 (class 2606 OID 17274)
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id) ON DELETE CASCADE;


--
-- TOC entry 5210 (class 2606 OID 17245)
-- Name: invoices invoices_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.operational_areas(area_id);


--
-- TOC entry 5211 (class 2606 OID 17230)
-- Name: invoices invoices_complaint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.complaints(complaint_id);


--
-- TOC entry 5212 (class 2606 OID 17250)
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5213 (class 2606 OID 17240)
-- Name: invoices invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- TOC entry 5214 (class 2606 OID 17235)
-- Name: invoices invoices_do_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_do_id_fkey FOREIGN KEY (do_id) REFERENCES public.delivery_orders(do_id);


--
-- TOC entry 5196 (class 2606 OID 17084)
-- Name: material_requisitions material_requisitions_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_requisitions
    ADD CONSTRAINT material_requisitions_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.operational_areas(area_id);


--
-- TOC entry 5197 (class 2606 OID 17074)
-- Name: material_requisitions material_requisitions_complaint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_requisitions
    ADD CONSTRAINT material_requisitions_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.complaints(complaint_id);


--
-- TOC entry 5198 (class 2606 OID 17079)
-- Name: material_requisitions material_requisitions_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_requisitions
    ADD CONSTRAINT material_requisitions_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(user_id);


--
-- TOC entry 5201 (class 2606 OID 17133)
-- Name: material_returns material_returns_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.operational_areas(area_id);


--
-- TOC entry 5202 (class 2606 OID 17123)
-- Name: material_returns material_returns_complaint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.complaints(complaint_id);


--
-- TOC entry 5203 (class 2606 OID 17128)
-- Name: material_returns material_returns_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(user_id);


--
-- TOC entry 5199 (class 2606 OID 17105)
-- Name: mrqs_items mrqs_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mrqs_items
    ADD CONSTRAINT mrqs_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 5200 (class 2606 OID 17100)
-- Name: mrqs_items mrqs_items_mrqs_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mrqs_items
    ADD CONSTRAINT mrqs_items_mrqs_id_fkey FOREIGN KEY (mrqs_id) REFERENCES public.material_requisitions(mrqs_id) ON DELETE CASCADE;


--
-- TOC entry 5204 (class 2606 OID 17153)
-- Name: mrts_items mrts_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mrts_items
    ADD CONSTRAINT mrts_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 5205 (class 2606 OID 17148)
-- Name: mrts_items mrts_items_mrts_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mrts_items
    ADD CONSTRAINT mrts_items_mrts_id_fkey FOREIGN KEY (mrts_id) REFERENCES public.material_returns(mrts_id) ON DELETE CASCADE;


--
-- TOC entry 5220 (class 2606 OID 17417)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5183 (class 2606 OID 16951)
-- Name: po_items po_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_items
    ADD CONSTRAINT po_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- TOC entry 5184 (class 2606 OID 16946)
-- Name: po_items po_items_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_items
    ADD CONSTRAINT po_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(po_id) ON DELETE CASCADE;


--
-- TOC entry 5181 (class 2606 OID 16928)
-- Name: purchase_orders purchase_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5182 (class 2606 OID 16923)
-- Name: purchase_orders purchase_orders_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- TOC entry 5178 (class 2606 OID 16864)
-- Name: service_tariffs service_tariffs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_tariffs
    ADD CONSTRAINT service_tariffs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);


-- Completed on 2026-02-03 18:52:33

--
-- PostgreSQL database dump complete
--

\unrestrict wSMi6Tzr4Lpl2iOI9cPuNEyDuxCdM5ndSSB4H4tLdpm1epDXwsFxezzN0ZBVtQm

