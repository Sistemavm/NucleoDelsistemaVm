"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import React, { useEffect, useState } from "react";
import "./globals.css";
import { supabase, hasSupabase } from "../lib/supabaseClient";
// 👇👇👇 AGREGAR ESTE HOOK AL INICIO DEL ARCHIVO, después de los imports
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return isMobile;
}


/* ===== TIPOS NUEVOS ===== */
type GradoProducto = "A+" | "A" | "A-" | "AB";
type EstadoProducto = "EN STOCK" | "VENDIDO" | "EN REPARACION" | "INGRESANDO";
type UbicacionProducto = "LOCAL" | "DEPOSITO" | "DEPOSITO_2";

type Producto = {
  id: string;
  name: string;
  modelo: string;
  capacidad?: string;
  imei: string;
  grado: GradoProducto;
  estado: EstadoProducto;
  ubicacion: UbicacionProducto;
  color: string;
  precio_compra: number;
  precio_venta: number;
  // 👇👇👇 AGREGAR ESTAS DOS LÍNEAS NUEVAS
  precio_consumidor_final: number;
  precio_revendedor: number;
  costo_reparacion: number;
  descripcion?: string;
  fecha_ingreso: string;
  vendido_en?: string;
  vendido_a?: string;
};

// Cliente adaptado a TU estructura
type Cliente = {
  id: string;
  name: string;           // En tu BD es 'name' no 'nombre'
  apellido?: string;      // Nueva columna que vamos a agregar
  telefono?: string;      // Nueva columna que vamos a agregar  
  email?: string;         // Nueva columna que vamos a agregar
  debt: number;           // Ya existe en tu BD
  deuda_total: number;    // Ya existe en tu BD  
  saldo_favor: number;    // Ya existe en tu BD
  dni?: string;           // Ya existe en tu BD
  direccion?: string;     // Ya existe en tu BD
  creado_por: string;     // Ya existe en tu BD
  fecha_registro: string; // Ya existe en tu BD
  deuda_manual?: boolean; // Ya existe en tu BD
};

type ItemVenta = {
  productId: string;
  imei: string;
  name: string;
  modelo: string;
  grado: GradoProducto;
  color: string;
  precio_venta: number;
  costo_reparacion: number;
  comision_entrega: number;
  vendedor_id: string;
  vendedor_nombre: string;
};

type Venta = {
  id: string;
  number: number;
  date_iso: string;
  client_id: string;
  client_name: string;    // Cambiado para coincidir con tu estructura
  client_dni?: string;
  client_telefono?: string;
  items: ItemVenta[];
  total: number;
  costo_total: number;
  ganancia: number;
  comisiones_total: number;
  payments: {
    cash: number;
    transfer: number;
    change: number;
    alias?: string;
    saldo_aplicado: number;
  };
  status: "Pagada" | "No Pagada";
  vendedor_id: string;
  vendedor_nombre: string;
  tipo: "Venta";
};

type Turno = {
  id: string;
  fecha: string;
  hora: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  tipo: "ENTREGA" | "REPARACION" | "CONSULTA";
  estado: "PENDIENTE" | "CONFIRMADO" | "COMPLETADO" | "CANCELADO";
  productos: string[];
  descripcion?: string;
  vendedor_asignado?: string;
  created_at: string;
};

type Pedido = {
  id: string;
  client_id: string;
  client_name: string;
  client_number: number;
  items: any[];
  total: number;
  status: "pendiente" | "aceptado" | "listo" | "cancelado";
  date_iso: string;
  observaciones?: string;
  accepted_by?: string;
  accepted_at?: string;
  completed_at?: string;
   comprobante_url?: string;
  comprobante_subido_at?: string;
};
// 👇👇👇 AGREGAR ESTE NUEVO TIPO PARA DETALLE DE DEUDAS
type DetalleDeuda = {
  factura_id: string;
  factura_numero: number;
  fecha: string;
  monto_total: number;
  monto_pagado: number;
  monto_debe: number;
  items: any[];
};
type Comprobante = {
  id: string;
  factura_id?: string;
  debt_payment_id?: string;
  comprobante_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
};

// 👇👇👇 AGREGAR ESTE NUEVO TIPO PARA PAGOS DE DEUDA
type DebtPayment = {
  id: string;
  number: number;
  date_iso: string;
  client_id: string;
  client_name: string;
  vendor_id?: string;
  vendor_name?: string;
  cash_amount: number;
  transfer_amount: number;
  total_amount: number;
  alias?: string;
  saldo_aplicado?: number;
  debt_before: number;
  debt_after: number;
  aplicaciones?: any[];  // 👈 ESTA LÍNEA ES CRÍTICA
  deuda_real_antes?: number;
   comprobante_url?: string;
  comprobante_subido_at?: string;
};
/* ===== helpers ===== */
const pad = (n: number, width = 8) => String(n).padStart(width, "0");
const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(
    isNaN(n as any) ? 0 : n || 0
  );
const parseNum = (v: any) => {
  const x = typeof v === "number" ? v : parseFloat(String(v ?? "0").replace(",", "."));
  return isNaN(x) ? 0 : x;
};
const todayISO = () => new Date().toISOString();
const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

/* ===== seed inicial (solo UI mientras carga Supabase) ===== */
function seedState() {
  return {
    meta: {
      invoiceCounter: 1,
      budgetCounter: 1,
      lastSavedInvoiceId: null as null | string,
      cashFloat: 0,
      cashFloatByDate: {} as Record<string, number>,
      commissionsByDate: {} as Record<string, number>,
      gabiFundsByDate: {} as Record<string, number>,
    },
    auth: { adminKey: "46892389" },
    vendors: [] as any[],
    clients: [] as any[],
    products: [] as any[],
    invoices: [] as any[],
    budgets: [] as any[],
    gastos: [] as any[],
    devoluciones: [] as any[],
    debt_payments: [] as DebtPayment[], // 👈 ESTA LÍNEA DEBE USAR EL TIPO DebtPayment
    queue: [] as any[],
    gabiFunds: [] as any[],
    pedidos: [] as Pedido[],
  };
}


async function loadFromSupabase(fallback: any) {
  if (!hasSupabase) return fallback;
  const out = clone(fallback);
  
  // meta
  const { data: meta, error: metaErr } = await supabase
    .from("meta").select("*").eq("key","counters").maybeSingle();
  if (metaErr) { console.error("SELECT meta:", metaErr); alert("No pude leer 'meta' de Supabase."); }
  if (meta?.value) out.meta = { ...out.meta, ...meta.value };

  // 👇👇👇 AGREGAR AQUÍ - Cargar comisiones
  const { data: commissionsData, error: commErr } = await supabase
    .from("commissions")
    .select("*");

  if (commErr) {
    console.error("SELECT commissions:", commErr);
  } else if (commissionsData) {
    const commissionsByDate: Record<string, number> = {};
    commissionsData.forEach((row: any) => {
      commissionsByDate[row.day] = parseNum(row.amount);
    });
    out.meta.commissionsByDate = commissionsByDate;
  }
  // 👆👆👆 HASTA AQUÍ
    const { data: turnos, error: turnosErr } = await supabase
    .from("turnos")
    .select("*")
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (turnosErr) {
    console.error("SELECT turnos:", turnosErr);
  } else if (turnos) {
    out.turnos = turnos;
  }
  // 👇👇👇 AGREGAR AQUÍ - Cargar cash_floats
const { data: cashFloatsData, error: cashFloatsErr } = await supabase
  .from("cash_floats")
  .select("*");

if (cashFloatsErr) {
  console.error("SELECT cash_floats:", cashFloatsErr);
} else if (cashFloatsData) {
  const cashFloatByDate: Record<string, number> = {};
  cashFloatsData.forEach((row: any) => {
    cashFloatByDate[row.day] = parseNum(row.amount);
  });
  out.meta.cashFloatByDate = cashFloatByDate;
}
  // 👇👇👇 AGREGAR AQUÍ - Cargar fondos de Gabi
const { data: gabiFundsData, error: gabiErr } = await supabase
  .from("gabi_funds")
  .select("*")
  .order("day", { ascending: false });

if (gabiErr) {
  console.error("SELECT gabi_funds:", gabiErr);
} else if (gabiFundsData) {
  const gabiFundsByDate: Record<string, number> = {};
  gabiFundsData.forEach((row: any) => {
    gabiFundsByDate[row.day] = parseNum(row.initial_amount);
  });
  out.meta.gabiFundsByDate = gabiFundsByDate;
  out.gabiFunds = gabiFundsData;
}

  // vendors (esto ya existe, DEJARLO COMO ESTÁ)
  const { data: vendors, error: vendErr } = await supabase.from("vendors").select("*");
  if (vendErr) { console.error("SELECT vendors:", vendErr); alert("No pude leer 'vendors' de Supabase."); }
  if (vendors) out.vendors = vendors;
  
// clients
const { data: clients, error: cliErr } = await supabase.from("clients").select("*");
if (cliErr) { 
  console.error("SELECT clients:", cliErr); 
  alert("No pude leer 'clients' de Supabase."); 
}
if (clients) {
  out.clients = clients.map((c: any) => ({
    ...c,
    creado_por: c.creado_por || "sistema",
    fecha_creacion: c.fecha_creacion || c.date_iso || todayISO(),
    deuda_manual: c.deuda_manual || false
  }));
}

  // products
  const { data: products, error: prodErr } = await supabase.from("products").select("*");
  if (prodErr) { console.error("SELECT products:", prodErr); alert("No pude leer 'products' de Supabase."); }
  if (products) {
    out.products = products.map((p: any) => ({
      ...p,
      stock_minimo: p.stock_min !== null ? parseNum(p.stock_min) : 0,
       precio_consumidor_final: p.precio_consumidor_final || p.precio_venta || 0,
      precio_revendedor: p.precio_revendedor || (p.precio_venta ? p.precio_venta * 0.85 : 0)
    }));
  }

  // invoices
  const { data: invoices, error: invErr } = await supabase.from("invoices").select("*").order("number");
  if (invErr) { console.error("SELECT invoices:", invErr); alert("No pude leer 'invoices' de Supabase."); }
  if (invoices) out.invoices = invoices;

  // 👇👇👇 AGREGAR AQUÍ - Cargar devoluciones
  const { data: devoluciones, error: devErr } = await supabase
    .from("devoluciones").select("*").order("date_iso", { ascending: false });
  if (devErr) { 
    console.error("SELECT devoluciones:", devErr); 
    alert("No pude leer 'devoluciones' de Supabase."); 
  }
  if (devoluciones) out.devoluciones = devoluciones;
  // 👆👆👆 HASTA AQUÍ
    // 👇👇👇 AGREGAR AQUÍ - Cargar debt_payments
  // 👇👇👇 DESCOMENTAR Y CORREGIR ESTA SECCIÓN - Cargar debt_payments
  const { data: debtPayments, error: dpErr } = await supabase
    .from("debt_payments")
    .select("*")
    .order("date_iso", { ascending: false });

  if (dpErr) { 
    console.error("SELECT debt_payments:", dpErr); 
    alert("No pude leer 'debt_payments' de Supabase."); 
  }
  if (debtPayments) out.debt_payments = debtPayments;
  // 👆👆👆 HASTA AQUÍ

  // budgets
  const { data: budgets, error: budErr } = await supabase.from("budgets").select("*").order("number");
  if (budErr) { console.error("SELECT budgets:", budErr); alert("No pude leer 'budgets' de Supabase."); }
  if (budgets) out.budgets = budgets;
    // 👇👇👇 AGREGAR AQUÍ - Cargar pedidos
  const { data: pedidos, error: pedidosErr } = await supabase
    .from("pedidos")
    .select("*")
    .order("date_iso", { ascending: false });

  if (pedidosErr) {
    console.error("SELECT pedidos:", pedidosErr);
  } else if (pedidos) {
    out.pedidos = pedidos;
  }
  // 👆👆👆 HASTA AQUÍ

  // Si está vacío, NO sembrar datos de ejemplo (nada de demo).
  if (!out.vendors?.length && !out.clients?.length && !out.products?.length) {
    // Solo aseguro counters en meta para que la app no falle.
    await supabase.from("meta").upsert({
      key: "counters",
      value: {
        invoiceCounter: 1,
        budgetCounter: 1,
        cashFloat: out.meta?.cashFloat ?? 0,
        cashFloatByDate: out.meta?.cashFloatByDate ?? {},
        commissionsByDate: out.meta?.commissionsByDate ?? {},
      },
    });
  }

  return out;
}

async function saveCountersSupabase(meta: any) {
  if (!hasSupabase) return;
  await supabase.from("meta").upsert({
    key: "counters",
    value: {
      invoiceCounter: meta.invoiceCounter,
      budgetCounter: meta.budgetCounter,
      cashFloat: meta.cashFloat ?? 0,
      cashFloatByDate: meta.cashFloatByDate ?? {},
       commissionsByDate: meta.commissionsByDate ?? {},   // 👈
    },
  });
}





/* ====== UI atoms ====== */
function Card({ title, actions, className = "", children }: any) {
  return (
<div className={"rounded-2xl border border-emerald-800 bg-emerald-900/60 p-4 " + className}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
function Button({ children, onClick, type = "button", tone = "emerald", className = "", disabled }: any) {
  const map: any = {
    emerald: "bg-emerald-600 hover:bg-emerald-500 border-emerald-700/50",
    slate: "bg-slate-700 hover:bg-slate-600 border-slate-700",
    red: "bg-red-600 hover:bg-red-500 border-red-700/50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold shadow-sm border disabled:opacity-60 ${map[tone]} ${className}`}
    >
      {children}
    </button>
  );
}
function Input({ label, value, onChange, placeholder = "", type = "text", className = "", disabled }: any) {
  return (
    <label className="block w-full">
      {label && <div className="text-xs text-slate-300 mb-1">{label}</div>}
      <input
        value={value}
        type={type}
        onChange={(e) => onChange && onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-60 ${className}`}
      />
    </label>
  );
}
const NumberInput = (props: any) => <Input {...props} type="text" />;
function Select({ label, value, onChange, options, className = "" }: any) {
  return (
    <label className="block w-full">
      {label && <div className="text-xs text-slate-300 mb-1">{label}</div>}
      <select
        value={value}
        onChange={(e) => onChange && onChange((e.target as HTMLSelectElement).value)}
        className={`w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 ${className}`}
      >
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
const Chip = ({ children, tone = "slate" }: any) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
      tone === "emerald" ? "bg-emerald-800/40 text-emerald-200 border-emerald-700/40" : "bg-slate-800/60 text-slate-200 border-slate-700/50"
    } border`}
  >
    {children}
  </span>
);
/* ===== COMPONENTE SUBIR COMPROBANTE ===== */
function SubirComprobante({ tipo, id, session, onComprobanteSubido }: {
  tipo: 'factura' | 'debt_payment';
  id: string;
  session: any;
  onComprobanteSubido: () => void;
}) {
  const [subiendo, setSubiendo] = useState(false);

  const manejarSubida = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    // Validar que sea imagen
    if (!archivo.type.startsWith('image/')) {
      alert('Por favor, sube solo archivos de imagen (JPG, PNG, etc.)');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (archivo.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }

    setSubiendo(true);

    try {
      // 1. Subir archivo a Storage
      const comprobanteUrl = await subirComprobante(archivo, tipo, id);
      
      // 2. Asociar comprobante al registro
      await asociarComprobante(tipo, id, comprobanteUrl, session);
      
      alert('✅ Comprobante subido correctamente');
      onComprobanteSubido();
    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Error al subir comprobante: ${error.message}`);
    } finally {
      setSubiendo(false);
      // Limpiar input
      event.target.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        onChange={manejarSubida}
        disabled={subiendo}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        title="Subir comprobante"
      />
      <button
        disabled={subiendo}
        className={`text-sm px-2 py-1 border rounded ${
          subiendo 
            ? 'bg-slate-600 text-slate-400 border-slate-700' 
            : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-500'
        }`}
      >
        {subiendo ? '📤 Subiendo...' : '📎 Comprobante'}
      </button>
    </div>
  );
}
/* ===== NUEVOS COMPONENTES PARA SISTEMA iPHONES ===== */
// Agregar esta función antes del componente ProductosiPhoneTab
function calcularDiasEnStock(producto: Producto): number {
  const fechaIngreso = new Date(producto.fecha_ingreso);
  const hoy = new Date();
  const diferenciaTiempo = hoy.getTime() - fechaIngreso.getTime();
  const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
  return diferenciaDias;
}
// 1. COMPONENTE DE INVENTARIO DE iPHONES
// 1. COMPONENTE DE INVENTARIO DE iPHONES
function ProductosiPhoneTab({ state, setState, session, showError, showSuccess, showInfo }: any) {
  const [modo, setModo] = useState<"lista" | "nuevo" | "editar">("lista");
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  
  // Estados para nuevo producto
  const [modelo, setModelo] = useState("");
  const [capacidad, setCapacidad] = useState(""); // 👈 NUEVO ESTADO
  const [imei, setImei] = useState("");
  const [grado, setGrado] = useState<GradoProducto>("A");
  const [color, setColor] = useState("");
  const [precioCompra, setPrecioCompra] = useState("");
  const [precioConsumidorFinal, setPrecioConsumidorFinal] = useState("");
  const [precioRevendedor, setPrecioRevendedor] = useState("");
  const [costoReparacion, setCostoReparacion] = useState("");
  const [ubicacion, setUbicacion] = useState<UbicacionProducto>("LOCAL");
  const [descripcion, setDescripcion] = useState("");
  
  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState<EstadoProducto>("EN STOCK");
  const [filtroModelo, setFiltroModelo] = useState("Todos");
  const [filtroCapacidad, setFiltroCapacidad] = useState("Todos"); // 👈 NUEVO FILTRO
  const [filtroGrado, setFiltroGrado] = useState("Todos");
  const [filtroUbicacion, setFiltroUbicacion] = useState("Todos");
  const [filtroDiasStock, setFiltroDiasStock] = useState("Todos"); // 👈 NUEVO FILTRO

  const productosStockBajo = state.products.filter((p: Producto) => 
    p.estado === "EN STOCK" && 
    calcularDiasEnStock(p) > 30
  );

  const modelosiPhone = [
    // iPhone 8 Series
    "iPhone 8", "iPhone 8 Plus",
    
    // iPhone X Series
    "iPhone X", "iPhone XS", "iPhone XS Max", "iPhone XR",
    
    // iPhone 11 Series
    "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
    
    // iPhone 12 Series
    "iPhone 12", "iPhone 12 mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
    
    // iPhone 13 Series
    "iPhone 13", "iPhone 13 mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
    
    // iPhone 14 Series
    "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
    
    // iPhone 15 Series
    "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
    
    // iPhone 16 Series (futuros modelos)
    "iPhone 16", "iPhone 16 Pro", "iPhone 16 Pro Max",
    
    // iPhone 17 Series (futuros modelos)
    "iPhone 17", "iPhone 17 Air", "iPhone 17 Pro", "iPhone 17 Pro Max"
  ];

  // 👇👇👇 CAPACIDADES DISPONIBLES
  const capacidades = ["64GB", "128GB", "256GB", "512GB", "1TB"];

  const colores = [
    "Negro", "Blanco", "Rojo", "Azul", "Verde", "Rosa", "Morado", "Gold", "Graphite"
  ];

  async function agregarProducto() {
    if (!modelo || !capacidad || !imei) { // 👈 AGREGAR VALIDACIÓN DE CAPACIDAD
showError("Complete modelo, capacidad e IMEI");
      return;
    }

    // Verificar IMEI único
    const imeiExistente = state.products.find((p: Producto) => p.imei === imei);
    if (imeiExistente) {
showError("El IMEI ya existe en el sistema");
      return;
    }

    // 👇👇👇 CREAR NOMBRE AUTOMÁTICO CON MODELO + CAPACIDAD
    const nombreCompleto = `${modelo} ${capacidad}`;

    const nuevoProducto: Producto = {
      id: "ip_" + Math.random().toString(36).slice(2, 9),
      name: nombreCompleto, // 👈 USAR NOMBRE AUTOMÁTICO
      modelo,
      capacidad, // 👈 AGREGAR CAPACIDAD AL PRODUCTO
      imei,
      grado,
      color,
      estado: "EN STOCK",
      ubicacion,
      precio_compra: parseNum(precioCompra),
      precio_consumidor_final: parseNum(precioConsumidorFinal),
      precio_revendedor: parseNum(precioRevendedor),
      precio_venta: parseNum(precioConsumidorFinal), // Mantener por compatibilidad
      costo_reparacion: parseNum(costoReparacion),
      descripcion: descripcion || undefined,
      fecha_ingreso: todayISO()
    };

    const st = clone(state);
    st.products.push(nuevoProducto);
    setState(st);

    if (hasSupabase) {
      await supabase.from("products").insert(nuevoProducto);
    }

    // Limpiar formulario
    setModelo("");
    setCapacidad(""); // 👈 LIMPIAR CAPACIDAD
    setImei("");
    setPrecioCompra("");
setPrecioConsumidorFinal("");
setPrecioRevendedor("");
    setCostoReparacion("");
    setDescripcion("");
    setModo("lista");
// 🔥 NOTIFICACIÓN BONITA EN VEZ DE ALERT FEO
// 🔥 NOTIFICACIÓN BONITA EN VEZ DE ALERT FEO
showSuccess(`✅ iPhone ${modelo} ${capacidad} agregado correctamente al inventario`);
}

// También en cambiarEstadoTurno:
async function cambiarEstadoTurno(turnoId: string, nuevoEstado: Turno["estado"]) {
  const st = clone(state);
  const turno = st.turnos.find((t: Turno) => t.id === turnoId);
  if (turno) {
    turno.estado = nuevoEstado;
    setState(st);

    if (hasSupabase) {
      await supabase.from("turnos")
        .update({ estado: nuevoEstado })
        .eq("id", turnoId);
    }
    
    // 🔥 Notificación de cambio de estado
    showInfo(`📅 Estado cambiado a: ${nuevoEstado}`);
  }
}

  function cambiarUbicacionProducto(productoId: string, nuevaUbicacion: UbicacionProducto) {
    const st = clone(state);
    const producto = st.products.find((p: Producto) => p.id === productoId);
    if (producto) {
      producto.ubicacion = nuevaUbicacion;
      setState(st);

      if (hasSupabase) {
        supabase.from("products")
          .update({ ubicacion: nuevaUbicacion })
          .eq("id", productoId);
      }
    }
  }
  // Función para cambiar estado del producto
async function cambiarEstadoProducto(productoId: string, nuevoEstado: EstadoProducto) {
  const st = clone(state);
  const producto = st.products.find((p: Producto) => p.id === productoId);
  if (producto) {
    producto.estado = nuevoEstado;
    setState(st);

    if (hasSupabase) {
      await supabase.from("products")
        .update({ estado: nuevoEstado })
        .eq("id", productoId);
    }
    
    showSuccess(`✅ Estado cambiado a: ${nuevoEstado}`);
  }
}

  // Calcular capital total en inventario
  const capitalTotal = state.products
    .filter((p: Producto) => p.estado === "EN STOCK")
    .reduce((total: number, p: Producto) => total + p.precio_compra + p.costo_reparacion, 0);

  // 👇👇👇 FILTRAR PRODUCTOS CON LOS NUEVOS FILTROS
  const productosFiltrados = state.products.filter((p: Producto) => {
    const cumpleEstado = p.estado === filtroEstado;
    const cumpleModelo = filtroModelo === "Todos" || p.modelo === filtroModelo;
    const cumpleCapacidad = filtroCapacidad === "Todos" || p.capacidad === filtroCapacidad;
    const cumpleGrado = filtroGrado === "Todos" || p.grado === filtroGrado;
    const cumpleUbicacion = filtroUbicacion === "Todos" || p.ubicacion === filtroUbicacion;
    
    // 👇👇👇 FILTRAR POR DÍAS EN STOCK
    let cumpleDiasStock = true;
    if (filtroDiasStock !== "Todos") {
      const dias = calcularDiasEnStock(p);
      switch (filtroDiasStock) {
        case "7_dias": cumpleDiasStock = dias <= 7; break;
        case "15_dias": cumpleDiasStock = dias <= 15; break;
        case "30_dias": cumpleDiasStock = dias > 30; break;
        case "60_dias": cumpleDiasStock = dias > 60; break;
      }
    }

    return cumpleEstado && cumpleModelo && cumpleCapacidad && cumpleGrado && cumpleUbicacion && cumpleDiasStock;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Resumen de capital */}
      <Card title="💰 Capital en Inventario">
        <div className="text-3xl font-bold text-emerald-400">
          {money(capitalTotal)}
        </div>
        <div className="text-sm text-slate-400 mt-1">
          Total invertido en productos en stock
        </div>
      </Card>

      {modo === "lista" && (
        <>
          <Card 
            title="📱 Inventario de iPhones"
            actions={
              <Button onClick={() => setModo("nuevo")}>
                ➕ Agregar iPhone
              </Button>
            }
          >
            {/* 👇👇👇 NUEVOS FILTROS MEJORADOS */}
            <div className="grid md:grid-cols-6 gap-3 mb-4">
              <Select
                label="Estado"
                value={filtroEstado}
                onChange={setFiltroEstado}
                options={[
                  { value: "EN STOCK", label: "🟢 EN STOCK" },
                  { value: "VENDIDO", label: "💰 VENDIDO" },
                  { value: "EN REPARACION", label: "🛠️ EN REPARACIÓN" },
                  { value: "INGRESANDO", label: "📥 INGRESANDO" },
                ]}
              />
              <Select
                label="Modelo"
                value={filtroModelo}
                onChange={setFiltroModelo}
                options={[
                  { value: "Todos", label: "Todos los modelos" },
                  ...Array.from(new Set(state.products.map((p: Producto) => p.modelo)))
                    .filter(m => m) // Filtrar valores nulos
                    .map(m => ({ value: m, label: m }))
                ]}
              />
              <Select
                label="Capacidad"
                value={filtroCapacidad}
                onChange={setFiltroCapacidad}
                options={[
                  { value: "Todos", label: "Todas las capacidades" },
                  ...Array.from(new Set(state.products.map((p: Producto) => p.capacidad)))
                    .filter(c => c) // Filtrar valores nulos
                    .map(c => ({ value: c, label: c }))
                ]}
              />
              <Select
                label="Grado"
                value={filtroGrado}
                onChange={setFiltroGrado}
                options={[
                  { value: "Todos", label: "Todos los grados" },
                  ...Array.from(new Set(state.products.map((p: Producto) => p.grado)))
                    .map(g => ({ value: g, label: g }))
                ]}
              />
              <Select
                label="Ubicación"
                value={filtroUbicacion}
                onChange={setFiltroUbicacion}
                options={[
                  { value: "Todos", label: "Todas las ubicaciones" },
                  { value: "LOCAL", label: "🏪 LOCAL" },
                  { value: "DEPOSITO", label: "📦 DEPÓSITO" },
                  { value: "DEPOSITO_2", label: "📦 DEPÓSITO 2" },
                ]}
              />
              <Select
                label="Días en Stock"
                value={filtroDiasStock}
                onChange={setFiltroDiasStock}
                options={[
                  { value: "Todos", label: "Todos" },
                  { value: "7_dias", label: "≤ 7 días" },
                  { value: "15_dias", label: "≤ 15 días" },
                  { value: "30_dias", label: "> 30 días" },
                  { value: "60_dias", label: "> 60 días" },
                ]}
              />
            </div>

            <div className="flex justify-between items-center mb-3">
              <Chip tone="emerald">
                {productosFiltrados.length} productos encontrados
              </Chip>
              {filtroDiasStock === "30_dias" || filtroDiasStock === "60_dias" ? (
                <Chip tone="red">
                  ⚠️ Productos con mucho tiempo en stock
                </Chip>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-400">
                  <tr>
                    <th className="py-2 px-2">Modelo</th>
                    <th className="py-2 px-2">Capacidad</th>
                    <th className="py-2 px-2">IMEI</th>
                    <th className="py-2 px-2">Grado</th>
                    <th className="py-2 px-2">Color</th>
                    <th className="py-2 px-2">Estado</th>
                    <th className="py-2 px-2">Ubicación</th>
                    <th className="py-2 px-2">Días Stock</th>
                    <th className="py-2 px-2">Costo Total</th>
                    <th className="py-2 px-2">P. Final</th>
      <th className="py-2 px-2">P. Revendedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {productosFiltrados.map((producto: Producto) => {
                    const diasEnStock = calcularDiasEnStock(producto);
                    return (
                    <tr key={producto.id} className={
                      producto.estado === "VENDIDO" ? "bg-green-900/20" :
                      producto.estado === "EN REPARACION" ? "bg-yellow-900/20" :
                      producto.estado === "INGRESANDO" ? "bg-blue-900/20" : ""
                    }>
                      <td className="py-2 px-2">
                        <div className="font-medium">{producto.modelo}</div>
                      </td>
                      <td className="py-2 px-2 font-semibold">
                        {producto.capacidad || "N/A"}
                      </td>
                      <td className="py-2 px-2 font-mono text-xs">{producto.imei}</td>
                      <td className="py-2 px-2">
                        <Chip tone={
                          producto.grado === "A+" ? "emerald" :
                          producto.grado === "A" ? "blue" :
                          producto.grado === "A-" ? "yellow" : "slate"
                        }>
                          {producto.grado}
                        </Chip>
                      </td>
                      <td className="py-2 px-2">{producto.color}</td>
                      <td className="py-2 px-2">
                        <Select
                          value={producto.estado}
                          onChange={(v: EstadoProducto) => cambiarEstadoProducto(producto.id, v)}
                          options={[
                            { value: "EN STOCK", label: "🟢 EN STOCK" },
                            { value: "VENDIDO", label: "💰 VENDIDO" },
                            { value: "EN REPARACION", label: "🛠️ EN REPARACIÓN" },
                            { value: "INGRESANDO", label: "📥 INGRESANDO" },
                          ]}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Select
                          value={producto.ubicacion}
                          onChange={(v: UbicacionProducto) => cambiarUbicacionProducto(producto.id, v)}
                          options={[
                            { value: "LOCAL", label: "🏪 LOCAL" },
                            { value: "DEPOSITO", label: "📦 DEPÓSITO" },
                            { value: "DEPOSITO_2", label: "📦 DEPÓSITO 2" },
                          ]}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <span className={
                          diasEnStock > 30 ? "text-amber-400 font-semibold" :
                          diasEnStock > 60 ? "text-red-400 font-bold" : "text-slate-300"
                        }>
                          {diasEnStock} días
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        {money(producto.precio_compra + producto.costo_reparacion)}
                      </td>
                      <td className="py-2 px-2 font-semibold">
                        {money(producto.precio_venta)}
                      </td>
                      <td className="py-2 px-2 font-semibold">
          {money(producto.precio_revendedor)}
        </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {modo === "nuevo" && (
        <Card title="➕ Agregar Nuevo iPhone">
          <div className="grid md:grid-cols-2 gap-4">
            {/* 👇👇👇 ELIMINADO: Input de nombre */}
            <Select
              label="Modelo"
              value={modelo}
              onChange={setModelo}
              options={[
                { value: "", label: "Seleccionar modelo" },
                ...modelosiPhone.map(m => ({ value: m, label: m }))
              ]}
            />
            {/* 👇👇👇 NUEVO: Selector de capacidad */}
            <Select
              label="Capacidad"
              value={capacidad}
              onChange={setCapacidad}
              options={[
                { value: "", label: "Seleccionar capacidad" },
                ...capacidades.map(c => ({ value: c, label: c }))
              ]}
            />
            <Input
              label="IMEI"
              value={imei}
              onChange={setImei}
              placeholder="15 dígitos"
            />
            <Select
              label="Grado"
              value={grado}
              onChange={setGrado}
              options={[
                { value: "A+", label: "A+ - Excelente" },
                { value: "A", label: "A - Muy Bueno" },
                { value: "A-", label: "A- - Bueno" },
                { value: "AB", label: "AB - Regular" },
              ]}
            />
            <Select
              label="Color"
              value={color}
              onChange={setColor}
              options={colores.map(c => ({ value: c, label: c }))}
            />
            <Select
              label="Ubicación"
              value={ubicacion}
              onChange={setUbicacion}
              options={[
                { value: "LOCAL", label: "🏪 LOCAL" },
                { value: "DEPOSITO", label: "📦 DEPÓSITO" },
                { value: "DEPOSITO_2", label: "📦 DEPÓSITO 2" },
              ]}
            />
           {/* Precio de Compra */}
      <NumberInput
        label="Precio de Compra"
        value={precioCompra}
        onChange={setPrecioCompra}
        placeholder="0"
      />
      
      {/* Costo de Reparación - CON CÁLCULO AUTOMÁTICO MEJORADO */}
<div className="space-y-2">
  <NumberInput
    label="Costo de Reparación"
    value={costoReparacion}
    onChange={(valor) => {
      setCostoReparacion(valor);
      // Calcular precio de venta sugerido automáticamente
      const costoTotal = parseNum(precioCompra) + parseNum(valor);
      const precioVentaSugerido = costoTotal * 1.3; // 30% de ganancia
      if (parseNum(precioConsumidorFinal) === 0 || parseNum(precioConsumidorFinal) < precioVentaSugerido) {
        setPrecioConsumidorFinal(String(Math.round(precioVentaSugerido)));
      }
    }}
    placeholder="0"
  />
</div>

      {/* Precio de Venta con sugerencia automática */}
      {/* Precio de Venta con sugerencia automática */}
<div className="space-y-2">
  <NumberInput
    label="Precio Consumidor Final"
    value={precioConsumidorFinal}
    onChange={setPrecioConsumidorFinal}
    placeholder="0"
  />
  
  <NumberInput
    label="Precio Revendedor"
    value={precioRevendedor}
    onChange={setPrecioRevendedor}
    placeholder="0"
  />
  <div className="text-xs text-slate-400">
    💡 Sugerido: {money(
      (parseNum(precioCompra) + parseNum(costoReparacion)) * 1.3
    )} (30% ganancia)
  </div>
</div>

      {/* 👇👇👇 TARJETA DE RESUMEN DE COSTOS */}
      <div className="md:col-span-2">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-sm font-semibold mb-2 text-center">📊 Resumen de Costos</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-slate-400">Compra</div>
              <div className="font-semibold">{money(parseNum(precioCompra))}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Reparación</div>
              <div className="font-semibold">{money(parseNum(costoReparacion))}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Costo Total</div>
              <div className="font-bold text-lg text-emerald-400">
                {money(parseNum(precioCompra) + parseNum(costoReparacion))}
              </div>
            </div>
          </div>
          
          {/* Línea de ganancia */}
          <div className="mt-3 pt-3 border-t border-slate-700">
           <div className="flex justify-between items-center">
  <span className="text-sm text-slate-400">Ganancia estimada:</span>
  <span className={`font-bold ${
    (parseNum(precioConsumidorFinal) - (parseNum(precioCompra) + parseNum(costoReparacion))) > 0 
      ? 'text-green-400' 
      : 'text-red-400'
  }`}>
    {money(parseNum(precioConsumidorFinal) - (parseNum(precioCompra) + parseNum(costoReparacion)))}
  </span>
</div>
<div className="flex justify-between items-center text-xs text-slate-500">
  <span>Margen:</span>
  <span>
    {((parseNum(precioConsumidorFinal) - (parseNum(precioCompra) + parseNum(costoReparacion))) / 
     (parseNum(precioCompra) + parseNum(costoReparacion)) * 100).toFixed(1)}%
  </span>
</div>
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
        <Input
          label="Descripción (opcional)"
          value={descripcion}
          onChange={setDescripcion}
          placeholder="Detalles adicionales, fallas, etc."
        />
      </div>

      <div className="md:col-span-2 flex gap-2 justify-end">
        <Button tone="slate" onClick={() => setModo("lista")}>
          Cancelar
        </Button>
        <Button onClick={agregarProducto}>
          Guardar iPhone
        </Button>
      </div>
    </div>
  </Card>
)}
    </div>
  );
}
// 2. COMPONENTE DE VENTAS DE iPHONES
function VentasiPhoneTab({ state, setState, session }: any) {
  const [clientId, setClientId] = useState("");
  const [vendedorId, setVendedorId] = useState(session.role === "admin" ? state.vendors[0]?.id : session.id);
  const [items, setItems] = useState<ItemVenta[]>([]);
  const [comisionEntrega, setComisionEntrega] = useState("");
  
  // Filtros para productos
  const [filtroModelo, setFiltroModelo] = useState("Todos");
  const [filtroGrado, setFiltroGrado] = useState("Todos");
  const [filtroUbicacion, setFiltroUbicacion] = useState("Todos");

  const productosDisponibles = state.products.filter((p: Producto) => 
    p.estado === "EN STOCK" &&
    (filtroModelo === "Todos" || p.modelo === filtroModelo) &&
    (filtroGrado === "Todos" || p.grado === filtroGrado) &&
    (filtroUbicacion === "Todos" || p.ubicacion === filtroUbicacion)
  );

  function agregarItem(producto: Producto) {
    const item: ItemVenta = {
      productId: producto.id,
      imei: producto.imei,
      name: producto.name,
      modelo: producto.modelo,
      grado: producto.grado,
      color: producto.color,
      precio_venta: producto.precio_venta,
      costo_reparacion: producto.costo_reparacion,
      comision_entrega: parseNum(comisionEntrega) || 0,
      vendedor_id: vendedorId,
      vendedor_nombre: state.vendors.find((v: any) => v.id === vendedorId)?.name || "Vendedor"
    };

    setItems([...items, item]);
  }

  async function finalizarVenta() {
    if (!clientId || items.length === 0) {
      alert("Seleccione cliente y agregue productos");
      return;
    }

    const st = clone(state);
    const number = st.meta.invoiceCounter++;
    const id = "venta_" + number;

    const cliente = st.clients.find((c: any) => c.id === clientId);
    const vendedor = st.vendors.find((v: any) => v.id === vendedorId);

    // Calcular totales
    const total = items.reduce((sum, item) => sum + item.precio_venta, 0);
    const costoTotal = items.reduce((sum, item) => sum + item.costo_reparacion, 0);
    const comisionesTotal = items.reduce((sum, item) => sum + item.comision_entrega, 0);
    const ganancia = total - costoTotal - comisionesTotal;

    const venta: Venta = {
      id,
      number,
      date_iso: todayISO(),
      client_id: clientId,
      client_name: cliente.name,
      client_telefono: cliente.telefono || "",
      client_dni: cliente.dni,
      items: clone(items),
      total,
      costo_total: costoTotal,
      ganancia,
      comisiones_total: comisionesTotal,
      payments: { cash: 0, transfer: 0, change: 0, saldo_aplicado: 0 },
      status: "No Pagada",
      vendedor_id: vendedorId,
      vendedor_nombre: vendedor.name,
      tipo: "Venta"
    };

    // Actualizar estado de productos a VENDIDO
    items.forEach(item => {
      const producto = st.products.find((p: Producto) => p.id === item.productId);
      if (producto) {
        producto.estado = "VENDIDO";
        producto.vendido_en = id;
        producto.vendido_a = clientId;
      }
    });

    st.invoices.push(venta);
    setState(st);

    if (hasSupabase) {
      await supabase.from("invoices").insert(venta);
      // Actualizar productos
      for (const item of items) {
        await supabase.from("products")
          .update({ 
            estado: "VENDIDO",
            vendido_en: id,
            vendido_a: clientId
          })
          .eq("id", item.productId);
      }
      await saveCountersSupabase(st.meta);
    }

    // Imprimir recibo
    window.dispatchEvent(new CustomEvent("print-invoice", { detail: venta } as any));
    await nextPaint();
    window.print();

    // Limpiar
    setItems([]);
    setComisionEntrega("");
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <Card title="💰 Nueva Venta de iPhone">
        <div className="grid md:grid-cols-3 gap-4">
          <Select
            label="Cliente"
            value={clientId}
            onChange={setClientId}
            options={state.clients.map((c: Cliente) => ({
              value: c.id,
              label: `${c.name} - ${c.telefono || "Sin teléfono"}`
            }))}
          />
          <Select
            label="Vendedor"
            value={vendedorId}
            onChange={setVendedorId}
            options={state.vendors.map((v: any) => ({
              value: v.id,
              label: v.name
            }))}
          />
          <NumberInput
            label="Comisión Entrega"
            value={comisionEntrega}
            onChange={setComisionEntrega}
            placeholder="0"
          />
        </div>
      </Card>

      {/* Filtros de productos */}
      <Card title="📱 Productos Disponibles">
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <Select
            label="Modelo"
            value={filtroModelo}
            onChange={setFiltroModelo}
            options={[
              { value: "Todos", label: "Todos los modelos" },
              ...Array.from(new Set(state.products.map((p: Producto) => p.modelo)))
                .map(m => ({ value: m, label: m }))
            ]}
          />
          <Select
            label="Grado"
            value={filtroGrado}
            onChange={setFiltroGrado}
            options={[
              { value: "Todos", label: "Todos los grados" },
              ...Array.from(new Set(state.products.map((p: Producto) => p.grado)))
                .map(g => ({ value: g, label: g }))
            ]}
          />
          <Select
            label="Ubicación"
            value={filtroUbicacion}
            onChange={setFiltroUbicacion}
            options={[
              { value: "Todos", label: "Todas las ubicaciones" },
              { value: "LOCAL", label: "🏪 LOCAL" },
              { value: "DEPOSITO", label: "📦 DEPÓSITO" },
              { value: "DEPOSITO_2", label: "📦 DEPÓSITO 2" },
            ]}
          />
          <div className="pt-6">
            <Chip tone="emerald">
              {productosDisponibles.length} productos
            </Chip>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Lista de productos */}
          <div className="space-y-3">
            {productosDisponibles.map((producto: Producto) => (
              <div key={producto.id} className="border border-slate-700 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{producto.name}</div>
                    <div className="text-sm text-slate-400">
                      {producto.modelo} • {producto.color} • {producto.grado}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      IMEI: {producto.imei}
                    </div>
                    <div className="text-sm mt-1">
                      <Chip tone="slate">{producto.ubicacion}</Chip>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{money(producto.precio_venta)}</div>
                    <Button 
                      onClick={() => agregarItem(producto)}
                      tone="emerald"
                      className="mt-2"
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carrito de venta */}
          <div className="space-y-4">
            <div className="font-semibold">Carrito de Venta</div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border border-slate-700 rounded-lg p-3">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-slate-400">
                        IMEI: {item.imei}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{money(item.precio_venta)}</div>
                      <button
                        onClick={() => setItems(items.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <Card>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{money(items.reduce((sum, item) => sum + item.precio_venta, 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comisiones:</span>
                    <span>{money(items.reduce((sum, item) => sum + item.comision_entrega, 0))}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-slate-700 pt-2">
                    <span>Total:</span>
                    <span>{money(items.reduce((sum, item) => sum + item.precio_venta, 0))}</span>
                  </div>
                  <Button onClick={finalizarVenta} className="w-full">
                    🚀 Finalizar Venta
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
// 3. COMPONENTE DE AGENDA DE TURNOS - VERSIÓN CORREGIDA
function AgendaTurnosTab({ state, setState, session, showError, showSuccess, showInfo }: any) {
  // 🔥 CORRECCIÓN: Función para manejar fechas consistentemente
  const obtenerFechaLocal = (fecha: Date | string) => {
    const date = new Date(fecha);
    // Ajustar a medianoche en zona horaria local
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  };

  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    return obtenerFechaLocal(new Date());
  });
  
  const [nuevoTurno, setNuevoTurno] = useState<Partial<Turno>>({
    tipo: "ENTREGA",
    estado: "PENDIENTE"
  });
  
  const [mesCalendario, setMesCalendario] = useState(new Date());

  const horariosDisponibles = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
  ];

  // 🔥 CORRECCIÓN: Filtrar turnos usando fecha local consistente
  const turnosDelDia = (state.turnos || []).filter((t: Turno) => 
    t.fecha === fechaSeleccionada
  );

  // 🔥 CORRECCIÓN: Función para generar días con fechas consistentes
  function generarDiasDelMes() {
    const year = mesCalendario.getFullYear();
    const month = mesCalendario.getMonth();
    
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
    const dias = [];
    
    // Días del mes anterior
    const primerDiaSemana = primerDia.getDay();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const fecha = new Date(year, month, -i);
      const fechaStr = obtenerFechaLocal(fecha);
      dias.push({
        fecha: fechaStr,
        esMesActual: false,
        turnos: (state.turnos || []).filter((t: Turno) => t.fecha === fechaStr)
      });
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(year, month, dia);
      const fechaStr = obtenerFechaLocal(fecha);
      const hoyStr = obtenerFechaLocal(new Date());
      
      dias.push({
        fecha: fechaStr,
        esMesActual: true,
        esHoy: fechaStr === hoyStr,
        esSeleccionado: fechaStr === fechaSeleccionada,
        turnos: (state.turnos || []).filter((t: Turno) => t.fecha === fechaStr)
      });
    }
    
    // Días del mes siguiente
    const ultimoDiaSemana = ultimoDia.getDay();
    for (let dia = 1; dia < (7 - ultimoDiaSemana); dia++) {
      const fecha = new Date(year, month + 1, dia);
      const fechaStr = obtenerFechaLocal(fecha);
      dias.push({
        fecha: fechaStr,
        esMesActual: false,
        turnos: (state.turnos || []).filter((t: Turno) => t.fecha === fechaStr)
      });
    }
    
    return dias;
  }

  // 🔥 CORRECCIÓN: Función para crear turno con fecha consistente
  async function crearTurno() {
    if (!nuevoTurno.cliente_id || !nuevoTurno.hora) {
      showError("Seleccione cliente y horario");
      return;
    }

    const cliente = state.clients.find((c: Cliente) => c.id === nuevoTurno.cliente_id);
    
    // 🔥 IMPORTANTE: Usar la fecha seleccionada directamente (ya está en formato correcto)
    const turno: Turno = {
      id: "turno_" + Math.random().toString(36).slice(2, 9),
      fecha: fechaSeleccionada, // ← Ya está en formato YYYY-MM-DD
      hora: nuevoTurno.hora!,
      cliente_id: nuevoTurno.cliente_id!,
      cliente_nombre: cliente.name,
      cliente_telefono: cliente.telefono || "",
      tipo: nuevoTurno.tipo!,
      estado: "PENDIENTE",
      productos: nuevoTurno.productos || [],
      descripcion: nuevoTurno.descripcion,
      vendedor_asignado: session.id,
      created_at: todayISO()
    };

    console.log("📅 Guardando turno:", {
      fechaSeleccionada,
      hora: nuevoTurno.hora,
      cliente: cliente.name,
      fechaEnTurno: turno.fecha
    });

    const st = clone(state);
    st.turnos = st.turnos || [];
    st.turnos.push(turno);
    setState(st);

    if (hasSupabase) {
      const { data, error } = await supabase.from("turnos").insert(turno);
      if (error) {
        console.error("❌ Error al guardar turno en Supabase:", error);
        alert("Error al guardar el turno en la base de datos");
        return;
      }
      console.log("✅ Turno guardado en Supabase:", data);
    }

    // Limpiar formulario
    setNuevoTurno({ 
      tipo: "ENTREGA", 
      estado: "PENDIENTE",
      descripcion: ""
    });
    
    showSuccess("Turno agendado correctamente");
  }

  // 🔥 CORRECCIÓN: Función para manejar cambio de fecha en el input
  const manejarCambioFecha = (nuevaFecha: string) => {
    console.log("📅 Cambiando fecha seleccionada:", nuevaFecha);
    setFechaSeleccionada(nuevaFecha);
  };

  function cambiarMesCalendario(direccion: "anterior" | "siguiente") {
    const nuevoMes = new Date(mesCalendario);
    if (direccion === "anterior") {
      nuevoMes.setMonth(nuevoMes.getMonth() - 1);
    } else {
      nuevoMes.setMonth(nuevoMes.getMonth() + 1);
    }
    setMesCalendario(nuevoMes);
  }

  function obtenerColorTipo(tipo: string) {
    switch (tipo) {
      case "ENTREGA": return "bg-blue-500";
      case "REPARACION": return "bg-orange-500";
      case "CONSULTA": return "bg-green-500";
      default: return "bg-gray-500";
    }
  }

  function obtenerIconoTipo(tipo: string) {
    switch (tipo) {
      case "ENTREGA": return "📦";
      case "REPARACION": return "🛠️";
      case "CONSULTA": return "💬";
      default: return "📅";
    }
  }

  function generarTurnosDisponibles() {
    const turnosOcupados = turnosDelDia.map((t: Turno) => t.hora);
    return horariosDisponibles.filter(hora => !turnosOcupados.includes(hora));
  }

  async function cambiarEstadoTurno(turnoId: string, nuevoEstado: Turno["estado"]) {
    const st = clone(state);
    const turno = st.turnos.find((t: Turno) => t.id === turnoId);
    if (turno) {
      turno.estado = nuevoEstado;
      setState(st);

      if (hasSupabase) {
        await supabase.from("turnos")
          .update({ estado: nuevoEstado })
          .eq("id", turnoId);
      }
    }
  }

  // COMPONENTE DE CALENDARIO VISUAL (VERSIÓN CORREGIDA)
  function CalendarioVisual() {
    const dias = generarDiasDelMes();
    const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const nombreMes = mesCalendario.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    return (
      <Card title={`📅 Calendario - ${nombreMes}`}>
        {/* Controles del mes */}
        <div className="flex justify-between items-center mb-4">
          <Button 
            tone="slate" 
            onClick={() => cambiarMesCalendario("anterior")}
          >
            ◀ Mes anterior
          </Button>
          <div className="font-semibold">{nombreMes}</div>
          <Button 
            tone="slate" 
            onClick={() => cambiarMesCalendario("siguiente")}
          >
            Mes siguiente ▶
          </Button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {nombresDias.map(dia => (
            <div key={dia} className="text-center text-sm font-semibold text-slate-400 py-2">
              {dia}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {dias.map((dia, index) => (
            <div
              key={index}
              className={`min-h-[80px] border rounded-lg p-1 cursor-pointer transition-all ${
                !dia.esMesActual ? 'bg-slate-900/20 text-slate-500 border-slate-600' : 
                dia.esSeleccionado ? 'bg-emerald-900/30 border-emerald-500' : 
                dia.esHoy ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-800/30 border-slate-700'
              } hover:bg-slate-700/50`}
              onClick={() => setFechaSeleccionada(dia.fecha)}
            >
              <div className={`text-xs font-medium text-center ${
                dia.esSeleccionado ? 'text-emerald-300' : 
                dia.esHoy ? 'text-blue-300' : ''
              }`}>
                {new Date(dia.fecha).getDate()}
              </div>
              
              {/* Mini indicadores de turnos */}
              <div className="flex flex-wrap gap-1 mt-1 justify-center">
                {dia.turnos.slice(0, 3).map((turno: Turno) => (
                  <div
                    key={turno.id}
                    className={`w-2 h-2 rounded-full ${obtenerColorTipo(turno.tipo)}`}
                    title={`${turno.hora} - ${turno.cliente_nombre}`}
                  />
                ))}
                {dia.turnos.length > 3 && (
                  <div className="w-2 h-2 rounded-full bg-gray-400" title={`+${dia.turnos.length - 3} más`} />
                )}
              </div>

              {/* Contador de turnos */}
              {dia.turnos.length > 0 && (
                <div className="text-xs text-center mt-1 text-slate-300">
                  {dia.turnos.length} turno{dia.turnos.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Entrega</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Reparación</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Consulta</span>
          </div>
        </div>
      </Card>
    );
  }
 

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* FORMULARIO PARA AGENDAR TURNOS */}
      <Card title="📅 Agenda de Turnos">
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            label="Fecha"
            type="date"
            value={fechaSeleccionada}
            onChange={manejarCambioFecha}
            min={obtenerFechaLocal(new Date())}
          />
          <Select
            label="Cliente"
            value={nuevoTurno.cliente_id || ""}
            onChange={(v) => setNuevoTurno({...nuevoTurno, cliente_id: v})}
            options={[
              { value: "", label: "Seleccionar cliente" },
              ...state.clients.map((c: Cliente) => ({
                value: c.id,
                label: `${c.name} - ${c.telefono || "Sin teléfono"}`
              }))
            ]}
          />
          <Select
            label="Horario disponible"
            value={nuevoTurno.hora || ""}
            onChange={(v) => setNuevoTurno({...nuevoTurno, hora: v})}
            options={[
              { value: "", label: "Seleccionar horario" },
              ...generarTurnosDisponibles().map(hora => ({
                value: hora,
                label: hora
              }))
            ]}
          />
          <Select
            label="Tipo de turno"
            value={nuevoTurno.tipo || "ENTREGA"}
            onChange={(v) => setNuevoTurno({...nuevoTurno, tipo: v as any})}
            options={[
              { value: "ENTREGA", label: "📦 Entrega" },
              { value: "REPARACION", label: "🛠️ Reparación" },
              { value: "CONSULTA", label: "💬 Consulta" },
            ]}
          />
          <div className="md:col-span-3">
            <Input
              label="Descripción (opcional)"
              value={nuevoTurno.descripcion || ""}
              onChange={(v) => setNuevoTurno({...nuevoTurno, descripcion: v})}
              placeholder="Motivo del turno..."
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button onClick={crearTurno}>
              Agendar Turno
            </Button>
          </div>
        </div>
      </Card>

      {/* CALENDARIO VISUAL */}
      <CalendarioVisual />

   {/* VISTA MEJORADA DE TURNOS DEL DÍA */}
<Card title={`📋 Turnos para ${fechaSeleccionada}`}>
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {horariosDisponibles.map(hora => {
      const turno = turnosDelDia.find((t: Turno) => t.hora === hora);
      return (
        <div
          key={hora}
          className={`border-2 rounded-xl p-3 transition-all ${
            turno 
              ? turno.estado === "COMPLETADO" 
                ? "bg-green-900/40 border-green-500" 
                : turno.estado === "CONFIRMADO"
                ? "bg-blue-900/40 border-blue-500"
                : turno.estado === "CANCELADO"
                ? "bg-red-900/40 border-red-500"
                : "bg-amber-900/40 border-amber-500"
              : "bg-slate-800/30 border-slate-600 hover:bg-slate-700/50 cursor-pointer"
          }`}
          onClick={() => {
            if (!turno) {
              // Pre-seleccionar este horario disponible
              setNuevoTurno({...nuevoTurno, hora});
              showInfo(`Horario ${hora} seleccionado`);
            }
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <div className={`font-bold text-lg ${
              turno ? "text-white" : "text-emerald-300"
            }`}>
              {hora}
            </div>
            {turno ? (
              <Chip tone={
                turno.estado === "COMPLETADO" ? "emerald" :
                turno.estado === "CONFIRMADO" ? "blue" :
                turno.estado === "CANCELADO" ? "red" : "amber"
              }>
                {turno.estado === "PENDIENTE" ? "⏳" : 
                 turno.estado === "CONFIRMADO" ? "✅" :
                 turno.estado === "COMPLETADO" ? "🎉" : "❌"}
              </Chip>
            ) : (
              <Chip tone="emerald">🟢 Libre</Chip>
            )}
          </div>
          
          {turno ? (
            <div className="space-y-2">
              <div className="font-semibold text-sm truncate" title={turno.cliente_nombre}>
                👤 {turno.cliente_nombre}
              </div>
              <div className="text-xs text-slate-300">
                {turno.tipo === "ENTREGA" ? "📦 Entrega" : 
                 turno.tipo === "REPARACION" ? "🛠️ Reparación" : "💬 Consulta"}
              </div>
              <div className="text-xs text-slate-400">
                📞 {turno.cliente_telefono}
              </div>
              {turno.descripcion && (
                <div className="text-xs text-slate-300 italic mt-1">
                  💬 {turno.descripcion}
                </div>
              )}
              <div className="flex gap-1 mt-2">
                <Select
                  value={turno.estado}
                  onChange={(v) => cambiarEstadoTurno(turno.id, v as any)}
                  options={[
                    { value: "PENDIENTE", label: "⏳ Pendiente" },
                    { value: "CONFIRMADO", label: "✅ Confirmado" },
                    { value: "COMPLETADO", label: "🎉 Completado" },
                    { value: "CANCELADO", label: "❌ Cancelado" },
                  ]}
                  className="text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="text-emerald-400 text-sm font-semibold">Disponible</div>
              <div className="text-xs text-slate-400 mt-1">Click para agendar</div>
            </div>
          )}
        </div>
      );
    })}
  </div>
</Card>
    </div>
  );
}
/* ===== helpers de negocio ===== */
function ensureUniqueNumber(clients: any[]) {
  if (!clients || clients.length === 0) return 1000;
  const max = clients.reduce((m, c) => Math.max(m, c.number || 0), 1000);
  return max + 1;
}

function calcInvoiceTotal(items: any[]) {
  return items.reduce((s, it) => s + parseNum(it.qty) * parseNum(it.unitPrice), 0);
}

function calcInvoiceCost(items: any[]) {
  return items.reduce((s, it) => s + parseNum(it.qty) * parseNum(it.cost || 0), 0);
}

// ✅ NUEVA FUNCIÓN: Validar stock disponible
function validarStockDisponible(products: any[], items: any[]): { valido: boolean; productosSinStock: string[] } {
  const productosSinStock: string[] = [];
  
  for (const item of items) {
    const producto = products.find((p: any) => p.id === item.productId);
    if (producto) {
      const stockActual = parseNum(producto.stock);
      const cantidadRequerida = parseNum(item.qty);
      
      if (stockActual < cantidadRequerida) {
        productosSinStock.push(`${producto.name} (Stock: ${stockActual}, Necesario: ${cantidadRequerida})`);
      }
    }
  }
  
  return {
    valido: productosSinStock.length === 0,
    productosSinStock
  };
}

function groupBy(arr: any[], key: string) {
  return arr.reduce((acc: any, it: any) => {
    const k = it[key] || "Otros";
    (acc[k] = acc[k] || []).push(it);
    return acc;
  }, {} as any);
}
/* ===== FUNCIONES PARA COMPROBANTES ===== */
async function subirComprobante(archivo: File, tipo: 'factura' | 'debt_payment', id: string): Promise<string> {
  if (!hasSupabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    console.log('=== DIAGNÓSTICO COMPLETO ===');
    
    // 1. Verificar sesión
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔐 Sesión:', session);
    
    if (!session) {
      throw new Error('Usuario no autenticado');
    }

    // 2. Preparar archivo
    const extension = archivo.name.split('.').pop() || 'jpg';
    const nombreArchivo = `${tipo}_${id}_${Date.now()}.${extension}`;
    
    console.log('📤 Subiendo:', nombreArchivo);

    // 3. Intentar subir al NUEVO bucket 'documentos'
    const { data, error } = await supabase.storage
      .from('documentos')  // ← NUEVO BUCKET
      .upload(nombreArchivo, archivo);

    if (error) {
      console.error('💥 ERROR:', error);
      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    console.log('✅ Archivo subido:', data);
    
    // 4. Obtener URL
    const { data: urlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(nombreArchivo);
    
    return urlData.publicUrl;

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Función para asociar comprobante a factura o debt_payment
async function asociarComprobante(
  tipo: 'factura' | 'debt_payment', 
  id: string, 
  comprobanteUrl: string,
  session: any
) {
  if (!hasSupabase) return;

  try {
    const ahora = todayISO();
    
    if (tipo === 'factura') {
      const { error } = await supabase
        .from('invoices')
        .update({
          comprobante_url: comprobanteUrl,
          comprobante_subido_at: ahora
        })
        .eq('id', id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('debt_payments')
        .update({
          comprobante_url: comprobanteUrl,
          comprobante_subido_at: ahora
        })
        .eq('id', id);

      if (error) throw error;
    }

    // También guardar en tabla comprobantes
    const { error: compError } = await supabase
      .from('comprobantes')
      .insert({
        [tipo === 'factura' ? 'factura_id' : 'debt_payment_id']: id,
        comprobante_url: comprobanteUrl,
        file_name: comprobanteUrl.split('/').pop() || 'comprobante.jpg',
        file_size: 0,
        uploaded_by: session?.name || 'sistema'
      });

    if (compError) console.warn('Error guardando en tabla comprobantes:', compError);

  } catch (error) {
    console.error('Error asociando comprobante:', error);
    throw error;
  }
}
  

// === Gasto del mes por cliente ===
// === Gasto del mes por cliente ===
function gastoMesCliente(state: any, clientId: string, refDate = new Date()) {
  if (!clientId) return 0;
  
  const y = refDate.getFullYear();
  const m = refDate.getMonth();
  const start = new Date(y, m, 1, 0, 0, 0, 0);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);

  // Ventas del mes (solo Facturas)
  const factMes = (state.invoices || [])
    .filter((f: any) => {
      if (f.type !== "Factura" || f.client_id !== clientId) return false;
      
      const invoiceDate = new Date(f.date_iso);
      return invoiceDate >= start && invoiceDate <= end;
    })
    .reduce((s: number, f: any) => s + parseNum(f.total), 0);

  // Devoluciones del mes del cliente
  const devsMes = (state.devoluciones || [])
    .filter((d: any) => {
      if (d.client_id !== clientId) return false;
      
      const devolucionDate = new Date(d.date_iso);
      return devolucionDate >= start && devolucionDate <= end;
    });

  // Restan al gasto si son devolución en efectivo/transferencia/saldo
  const devRestables = devsMes
    .filter((d: any) => ["efectivo", "transferencia", "saldo"].includes(String(d.metodo)))
    .reduce((s: number, d: any) => s + parseNum(d.total), 0);

  // En intercambio por OTRO producto, sumamos solo la diferencia que abonó
  const extrasIntercambio = devsMes
    .filter((d: any) => d.metodo === "intercambio_otro")
    .reduce(
      (s: number, d: any) =>
        s + parseNum(d.extra_pago_efectivo || 0) + parseNum(d.extra_pago_transferencia || 0),
      0
    );

  return Math.max(0, factMes - devRestables + extrasIntercambio);
}
// === Detalle de deudas por cliente - CORREGIDA ===
// === Detalle de deudas por cliente - CORREGIDA DEFINITIVAMENTE ===
function calcularDetalleDeudas(state: any, clientId: string): DetalleDeuda[] {
  if (!clientId) return [];
  
  const todasFacturas = (state.invoices || [])
    .filter((f: any) => 
      f.client_id === clientId && 
      f.type === "Factura"
    )
    .sort((a: any, b: any) => new Date(a.date_iso).getTime() - new Date(b.date_iso).getTime());

  const detalleDeudas = todasFacturas.map((factura: any) => {
    const totalFactura = parseNum(factura.total);
    
    // 1. Pagos DIRECTOS de la factura (al momento de la compra)
    const pagosDirectos = 
      parseNum(factura?.payments?.cash || 0) + 
      parseNum(factura?.payments?.transfer || 0) + 
      parseNum(factura?.payments?.saldo_aplicado || 0);

    // 2. Pagos ADICIONALES desde debt_payments para ESTA factura específica
    const pagosAdicionales = (state.debt_payments || [])
      .filter((pago: any) => {
        return pago.client_id === clientId && 
               pago.aplicaciones?.some((app: any) => app.factura_id === factura.id);
      })
      .reduce((sum: number, pago: any) => {
        const aplicacion = pago.aplicaciones?.find((app: any) => app.factura_id === factura.id);
        return aplicacion ? sum + parseNum(aplicacion.monto_aplicado) : sum;
      }, 0);

    // 3. Devoluciones que afectan esta factura específica
    const devolucionesFactura = (state.devoluciones || [])
      .filter((dev: any) => {
        if (dev.client_id !== clientId) return false;
        // Buscar si esta devolución incluye productos de esta factura
        return dev.items?.some((item: any) => item.facturaId === factura.id);
      })
      .reduce((sum: number, dev: any) => {
        const itemsEstaFactura = dev.items?.filter((item: any) => item.facturaId === factura.id) || [];
        return sum + itemsEstaFactura.reduce((s: number, item: any) => 
          s + (parseNum(item.qtyDevuelta) * parseNum(item.unitPrice)), 0);
      }, 0);

    const totalPagos = pagosDirectos + pagosAdicionales;
    const montoDebe = Math.max(0, totalFactura - totalPagos - devolucionesFactura);

    return {
      factura_id: factura.id,
      factura_numero: factura.number,
      fecha: factura.date_iso,
      monto_total: totalFactura,
      monto_pagado: totalPagos,
      monto_debe: montoDebe,
      items: factura.items || [],
      devoluciones: devolucionesFactura
    };
  });

  // ✅ Filtrar solo facturas con deuda pendiente REAL
  return detalleDeudas.filter(deuda => deuda.monto_debe > 0.01);
}
// === Deuda total del cliente - CORREGIDA DEFINITIVAMENTE ===
// === Deuda total del cliente - CON SALDO A FAVOR APLICADO ===
function calcularDeudaTotal(detalleDeudas: DetalleDeuda[], cliente: any): number {
  if (!cliente) return 0;
  
  // ✅ Deuda de facturas pendientes
  const deudaFacturas = detalleDeudas.reduce((total, deuda) => total + deuda.monto_debe, 0);
  
  // ✅ Deuda manual del cliente
  const deudaManual = parseNum(cliente.debt || 0);
  
  // ✅ Saldo a favor del cliente
  const saldoFavor = parseNum(cliente.saldo_favor || 0);
  
  // ✅ CALCULAR DEUDA NETA: (Deuda total - Saldo a favor) - No puede ser negativo
  const deudaBruta = deudaFacturas + deudaManual;
  const deudaNeta = Math.max(0, deudaBruta - saldoFavor);
  
  console.log(`💰 Cliente ${cliente.name}: Facturas=${deudaFacturas}, Manual=${deudaManual}, SaldoFavor=${saldoFavor}, Bruta=${deudaBruta}, Neta=${deudaNeta}`);
  
  return deudaNeta; // ← Devuelve la DEUDA NETA después de aplicar saldo a favor
}
// 👇👇👇 AGREGAR ESTA FUNCIÓN NUEVA
function obtenerDetallePagosAplicados(pagosDeudores: any[], state: any) {
  const detallePagos: any[] = [];

  pagosDeudores.forEach((pago: any) => {
    const cliente = state.clients.find((c: any) => c.id === pago.client_id);
    if (!cliente) return;

    // Obtener el detalle REAL de deudas del cliente para este pago
    const detalleDeudasCliente = calcularDetalleDeudas(state, pago.client_id);
    
    // Calcular deuda total ANTES del pago
const deudaTotalAntes = cliente ? calcularDeudaTotal(detalleDeudasCliente, cliente) : 0;
    
    // Reconstruir las aplicaciones con información completa
    const aplicacionesCompletas = pago.aplicaciones?.map((app: any) => {
      const factura = state.invoices.find((f: any) => f.id === app.factura_id);
      const deudaFactura = detalleDeudasCliente.find((d: any) => d.factura_id === app.factura_id);
      
      return {
        factura_id: app.factura_id,
        factura_numero: app.factura_numero || factura?.number || "N/E",
        fecha_factura: factura?.date_iso || pago.date_iso,
        total_factura: deudaFactura?.monto_total || factura?.total || 0,
        deuda_antes: app.deuda_antes || deudaFactura?.monto_debe || 0,
        monto_aplicado: app.monto_aplicado,
        deuda_despues: app.deuda_despues || Math.max(0, (deudaFactura?.monto_debe || 0) - app.monto_aplicado),
        tipo: "pago_factura"
      };
    }) || [];

    // Si no hay aplicaciones específicas, crear aplicación global
    if (aplicacionesCompletas.length === 0) {
      aplicacionesCompletas.push({
        factura_numero: "No especificado",
        fecha_factura: pago.date_iso,
        total_factura: 0,
        deuda_antes: pago.debt_before || 0,
        monto_aplicado: pago.total_amount,
        deuda_despues: pago.debt_after || 0,
        descripcion: "Pago aplicado globalmente",
        tipo: "global"
      });
    }

    // Calcular total aplicado y deuda pendiente
    const totalAplicado = aplicacionesCompletas.reduce((sum: number, app: any) => sum + app.monto_aplicado, 0);
    const deudaPendiente = Math.max(0, deudaTotalAntes - totalAplicado);

    detallePagos.push({
      pago_id: pago.id,
      cliente: pago.client_name,
      cliente_id: pago.client_id,
      fecha_pago: pago.date_iso,
      total_pagado: pago.total_amount,
      efectivo: pago.cash_amount,
      transferencia: pago.transfer_amount,
      alias: pago.alias || "",
      
      // INFORMACIÓN COMPLETA DE LA DEUDA
      deuda_total_antes: deudaTotalAntes, // Deuda total antes del pago
      total_aplicado: totalAplicado,      // Total realmente aplicado
      deuda_pendiente: deudaPendiente,    // Lo que queda pendiente
      
      deuda_antes_pago: pago.debt_before,
      deuda_despues_pago: pago.debt_after,
      
      // DETALLE POR FACTURA
      aplicaciones: aplicacionesCompletas,
      
      // PARA FILTRAR - solo mostrar si tiene deuda pendiente
      tiene_deuda_pendiente: deudaPendiente > 1,
      saldado_completamente: deudaPendiente <= 0.01
    });
  });

  // ✅ FILTRAR: Solo devolver pagos de clientes que aún tengan deuda pendiente
  return detallePagos.filter(pago => pago.tiene_deuda_pendiente);
}

 function Navbar({ current, setCurrent, role, onLogout }: any) {
  const TABS = [
    "Facturación",
    "Inventario iPhones", 
    "Clientes",
    "Agenda Turnos",
    "Deudores",
    "Reportes", // Solo para admin
    "Vendedores", // Solo para admin
    "Gastos y Devoluciones",
    "Pedidos Online",
    "Cola"
  ];

  const visibleTabs =
    role === "admin"
      ? TABS
      : role === "vendedor"
      ? [
          "Facturación", 
          "Clientes", 
          "Agenda Turnos", 
          "Deudores",
          "Gastos y Devoluciones",  
          "Pedidos Online",
          "Cola"
          // REPORTES ELIMINADO para vendedor
        ]
      : role === "pedido-online"
      ? ["Hacer Pedido"]
      : ["Panel"];

  return (
    <div className="sticky top-0 z-50 bg-emerald-950/80 backdrop-blur border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="iPhone Store" 
            className="h-16 w-16 rounded-sm"
          />
          <div className="text-xs text-slate-400 font-medium font-poppins tracking-wider">
            v1.0 • Desarrollado Por Tobias Carrizo
          </div>
        </div>
        
        <nav className="flex-1 flex gap-1 flex-wrap">
          {visibleTabs.map((t) => (
            <button
              key={t}
              onClick={() => setCurrent(t)}
              className={`px-3 py-1.5 rounded-xl text-sm border ${
                current === t 
                  ? "bg-emerald-600 border-emerald-700" 
                  : "bg-slate-900/60 border-slate-800 hover:bg-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="ml-auto text-xs text-slate-400 hover:text-slate-200">
          Salir
        </button>
      </div>
    </div>
  );
}

/* ===== Panel del cliente ===== */
function ClientePanel({ state, setState, session }: any) {
  const [accion, setAccion] = useState<"COMPRAR POR MAYOR" | "COMPRAR POR MENOR">("COMPRAR POR MAYOR");

  function genTicketCode() {
    const a = Math.random().toString(36).slice(2, 6);
    const b = Date.now().toString(36).slice(-5);
    return ("T-" + a + "-" + b).toUpperCase();
  }

  async function continuar() {
    const code = genTicketCode();
    const ticket = {
      id: code,
      date_iso: todayISO(),
      client_id: session.id,
      client_number: session.number,
      client_name: session.name,
      action: accion,
      status: "En cola" as const,
    };

    // guardar ticket en la cola local
    const st = clone(state);
    st.queue = Array.isArray(st.queue) ? st.queue : [];
    st.queue.push(ticket);
    setState(st);

    // guardar en Supabase (si está disponible)
    if (hasSupabase) {
      await supabase.from("tickets").insert(ticket);
    }

    // imprimir ticket
    window.dispatchEvent(new CustomEvent("print-ticket", { detail: ticket } as any));
    await nextPaint();
    window.print();
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <Card title="Bienvenido/a">
        <div className="text-sm mb-2">
          Cliente: <b>{session.name}</b> — N° <b>{session.number}</b>
        </div>
        <div className="grid gap-3">
          <Select
            label="¿Qué desea hacer?"
            value={accion}
            onChange={setAccion}
            options={[
              { value: "COMPRAR POR MENOR", label: "COMPRAR POR MENOR" },
              { value: "COMPRAR POR MAYOR", label: "COMPRAR POR MAYOR" },
            ]}
          />
          <div className="flex justify-end">
            <Button onClick={continuar}>Continuar</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* =====================  TABS  ===================== */
/* Facturación */
function FacturacionTab({ state, setState, session, showError, showSuccess, showInfo }: any) {
  const isMobile = useIsMobile();
  
  const [clientId, setClientId] = useState(state.clients[0]?.id || "");
  const [vendorId, setVendorId] = useState(session.role === "admin" ? state.vendors[0]?.id : session.id);
  const [priceList, setPriceList] = useState("1");
  const [sectionFilter, setSectionFilter] = useState("Todas");
  const [listFilter, setListFilter] = useState("Todas");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [payCash, setPayCash] = useState("");
  const [payTransf, setPayTransf] = useState("");
  const [payChange, setPayChange] = useState("");
  const [alias, setAlias] = useState("");
  const [comisionVendedor, setComisionVendedor] = useState(""); // 👈 NUEVO: Comisión
 
  // Estados para buscadores
  const [clienteSearch, setClienteSearch] = useState("");
  const [busquedaAvanzada, setBusquedaAvanzada] = useState({
    seccion: "",
    nombre: "",
    codigo: ""
  });

  const client = state.clients.find((c: any) => c.id === clientId);
  const vendor = state.vendors.find((v: any) => v.id === vendorId);
  
  // Filtrar clientes
  const filteredClients = state.clients.filter((c: any) => {
    if (!clienteSearch.trim()) return true;
    
    const searchTerm = clienteSearch.toLowerCase().trim();
    const matchName = c.name.toLowerCase().includes(searchTerm);
    const matchNumber = String(c.number).includes(searchTerm);
    
    return matchName || matchNumber;
  });
 
  const sections = ["Todas", ...Array.from(new Set(state.products.map((p: any) => p.section || "Otros")))];
  const lists = ["Todas", ...Array.from(new Set(state.products.map((p: any) => p.list_label || "General")))];

  // Filtro de productos
  const filteredProducts = state.products.filter((p: any) => {
    const okS = sectionFilter === "Todas" || p.section === sectionFilter;
    const okL = listFilter === "Todas" || p.list_label === listFilter;
    const okNombre = !busquedaAvanzada.nombre || 
      p.name.toLowerCase().includes(busquedaAvanzada.nombre.toLowerCase());
    const okSeccion = !busquedaAvanzada.seccion || 
      p.section.toLowerCase().includes(busquedaAvanzada.seccion.toLowerCase()) ||
      p.id.toLowerCase().includes(busquedaAvanzada.seccion.toLowerCase());
    
    return okS && okL && okNombre && okSeccion;
  });

  function addItem(p: any) {
    const existing = items.find((it: any) => it.productId === p.id);
    const unit = priceList === "1" ? p.price1 : p.price2;
    if (existing) setItems(items.map((it) => (it.productId === p.id ? { ...it, qty: parseNum(it.qty) + 1 } : it)));
    else setItems([...items, { 
      productId: p.id, 
      name: p.name, 
      section: p.section, 
      qty: 1, 
      unitPrice: unit, 
      cost: p.cost 
    }]);
  }

async function saveAndPrint() {
  if (!client || !vendor) return showError("Seleccioná cliente y vendedor.");
  if (items.length === 0) return showError("Agregá productos al carrito.");
  
  // Validar stock
  const validacionStock = validarStockDisponible(state.products, items);
  if (!validacionStock.valido) {
    const mensajeError = `No hay suficiente stock para los siguientes productos:\n\n${validacionStock.productosSinStock.join('\n')}`;
    return showError(mensajeError);
  }
  
  const total = calcInvoiceTotal(items);
  const cash  = parseNum(payCash);
  const transf = parseNum(payTransf);
  const comision = parseNum(comisionVendedor); // 👈 NUEVO: Comisión
  const suggestedChange = Math.max(0, cash - Math.max(0, total - transf));
  const change = payChange.trim() === "" ? suggestedChange : Math.max(0, parseNum(payChange));
  
  if (change > cash) return showError("El vuelto no puede ser mayor al efectivo entregado.");

  const st = clone(state);
  const number = st.meta.invoiceCounter++;
  const id = "inv_" + number;

  // Manejar saldo a favor
  const cl = st.clients.find((c:any) => c.id === client.id)!;
  const saldoActual = parseNum(cl.saldo_favor || 0);
  const saldoAplicado = Math.min(total, saldoActual);
  const totalTrasSaldo = total - saldoAplicado;

  // Calcular pagos aplicados
  const applied = Math.max(0, cash + transf - change);
  const debtDelta = Math.max(0, totalTrasSaldo - applied);
  const status = debtDelta > 0 ? "No Pagada" : "Pagada";

  // Actualizar cliente
  cl.saldo_favor = saldoActual - saldoAplicado;
  
  // Descontar stock
  items.forEach(item => {
    const product = st.products.find((p: any) => p.id === item.productId);
    if (product) {
      product.stock = Math.max(0, parseNum(product.stock) - parseNum(item.qty));
    }
  });

  // 👇👇👇 NUEVO: Crear factura con comisión
  const invoice = {
    id,
    number,
    date_iso: todayISO(),
    client_id: client.id,
    client_name: client.name,
    vendor_id: vendor.id,
    vendor_name: vendor.name,
    items: clone(items),
    total,
    total_after_credit: totalTrasSaldo,
    cost: calcInvoiceCost(items),
    comision_vendedor: comision, // 👈 NUEVO: Guardar comisión
    payments: { 
      cash, 
      transfer: transf, 
      change, 
      alias: alias.trim(), 
      saldo_aplicado: saldoAplicado 
    },
    status,
    type: "Factura",
  };

  st.invoices.push(invoice);
  st.meta.lastSavedInvoiceId = id;
  setState(st);

  if (hasSupabase) {
    await supabase.from("invoices").insert(invoice);
    
    await supabase.from("clients").update({ 
      saldo_favor: cl.saldo_favor 
    }).eq("id", client.id);
    
    // Actualizar stock en Supabase
    for (const item of items) {
      const product = st.products.find((p: any) => p.id === item.productId);
      if (product) {
        await supabase.from("products")
          .update({ stock: product.stock })
          .eq("id", item.productId);
      }
    }
    
    await saveCountersSupabase(st.meta);
  }

  window.dispatchEvent(new CustomEvent("print-invoice", { detail: invoice } as any));
  await nextPaint();
  window.print();
  
  // Limpiar UI
  setPayCash("");
  setPayTransf("");
  setPayChange("");
  setAlias("");
  setComisionVendedor(""); // 👈 Limpiar comisión
  setItems([]);
  
  showSuccess("✅ Factura guardada e impresa correctamente");
}

const total = calcInvoiceTotal(items);
const cash = parseNum(payCash);
const transf = parseNum(payTransf);
const comision = parseNum(comisionVendedor); // 👈 NUEVO

// Cálculos de pago
const suggestedChange = Math.max(0, cash - Math.max(0, total - transf));
const change = payChange.trim() === "" ? suggestedChange : Math.max(0, parseNum(payChange));
const paid = cash + transf;
const applied = Math.max(0, cash + transf - change);
const toPay = Math.max(0, total - applied);

  const grouped = groupBy(filteredProducts, "section");

   return (
    <div className="max-w-7xl mx-auto p-2 md:p-4 space-y-3 md:space-y-4">
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'} gap-3 md:gap-4`}>
       <Card title="Datos" className={isMobile ? 'text-sm' : ''}>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
    
    {/* Buscador de Clientes */}
    <div className="md:col-span-2">
      <div className="relative">
        <Input
          label="Buscar Cliente (Nombre o Número)"
          value={clienteSearch}
          onChange={setClienteSearch}
          placeholder="Ej: 'Kiosco' o '1001'..."
          className="pr-20"
        />
        
        {/* Resultados del buscador */}
        {clienteSearch && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-3 text-sm text-slate-400 text-center">
                No se encontraron clientes
              </div>
            ) : (
              filteredClients.slice(0, 10).map((c: any) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setClientId(c.id);
                    setClienteSearch("");
                  }}
                  className={`w-full text-left p-3 hover:bg-slate-700 border-b border-slate-700 last:border-b-0 ${
                    clientId === c.id ? 'bg-emerald-900/30' : ''
                  }`}
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-slate-400">
                    N° {c.number} | Deuda: {(() => {
                      const detalleDeudas = calcularDetalleDeudas(state, c.id);
                      const deudaNeta = calcularDeudaTotal(detalleDeudas, c);
                      return deudaNeta > 0 ? money(deudaNeta) : "✅ Al día";
                    })()}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Cliente seleccionado */}
      {client && (
        <div className="mt-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="text-sm font-medium">Cliente seleccionado:</div>
          <div className="text-sm">
            <span className="font-semibold">{client.name}</span> 
            <span className="text-slate-400 ml-2">(N° {client.number})</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Deuda: {(() => {
              const detalleDeudas = calcularDetalleDeudas(state, client.id);
              const deudaNeta = calcularDeudaTotal(detalleDeudas, client);
              return deudaNeta > 0 ? (
                <span className="text-amber-400 font-semibold">{money(deudaNeta)}</span>
              ) : (
                <span className="text-emerald-400">✅ Al día</span>
              );
            })()}
            <span className="mx-2">·</span>
            Saldo a favor: <span className="text-emerald-400 font-semibold">
              {money(client.saldo_favor || 0)}
            </span>
          </div>
        </div>
      )}
    </div>

    <Select
      label="Vendedor"
      value={vendorId}
      onChange={setVendorId}
      options={state.vendors.map((v: any) => ({ value: v.id, label: v.name }))}
    />
    
    <Select
      label="Lista de precios"
      value={priceList}
      onChange={setPriceList}
      options={[
        { value: "1", label: "Mitobicel" },
        { value: "2", label: "ElshoppingDlc" },
      ]}
    />

    {/* 👇👇👇 NUEVO: Campo para comisión del vendedor */}
    <NumberInput
      label="Comisión Vendedor"
      value={comisionVendedor}
      onChange={setComisionVendedor}
      placeholder="0"
    />
    
  </div>
</Card>

        <Card title="Pagos" className={isMobile ? 'text-sm' : ''}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 items-end">
            <NumberInput label="Efectivo" value={payCash} onChange={setPayCash} placeholder="0" />
            <NumberInput label="Transferencia" value={payTransf} onChange={setPayTransf} placeholder="0" />
            <NumberInput label="Vuelto (efectivo)" value={payChange} onChange={setPayChange} placeholder="0" />
            <Input label="Alias / CVU destino" value={alias} onChange={setAlias} placeholder="ej: mitobicel.algo.banco" />
            
            <div className="md:col-span-2 text-xs text-slate-300">
              Pagado: <span className="font-semibold">{money(paid)}</span> — 
              Falta: <span className="font-semibold">{money(toPay)}</span> — 
              Vuelto: <span className="font-semibold">{money(change)}</span>
              {comision > 0 && (
                <span> — Comisión: <span className="font-semibold text-amber-400">{money(comision)}</span></span>
              )}
            </div>
          </div>
        </Card>

        <Card title="Totales" className={isMobile ? 'text-sm' : ''}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{money(total)}</span>
            </div>
            
            {/* 👇👇👇 NUEVO: Mostrar comisión en totales */}
            {comision > 0 && (
              <div className="flex items-center justify-between text-amber-400">
                <span>Comisión Vendedor</span>
                <span>- {money(comision)}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button onClick={saveAndPrint} className="w-full md:w-auto text-center justify-center">
                {isMobile ? "🖨️ Guardar" : "Guardar e Imprimir"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* EL RESTO DEL CÓDIGO DE PRODUCTOS PERMANECE IGUAL */}
      <Card title="Productos" className={isMobile ? 'text-sm' : ''}>
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-4'} gap-2 mb-3`}>
          <Select 
            label="Sección" 
            value={sectionFilter} 
            onChange={setSectionFilter} 
            options={sections.map((s: any) => ({ value: s, label: s }))} 
          />
          <Select 
            label="Lista" 
            value={listFilter} 
            onChange={setListFilter} 
            options={lists.map((s: any) => ({ value: s, label: s }))} 
          />
          
          <div className="space-y-1">
            <Input 
              label="Buscar por nombre" 
              value={busquedaAvanzada.nombre}
              onChange={(v: string) => setBusquedaAvanzada({...busquedaAvanzada, nombre: v})}
              placeholder="Nombre del producto..."
            />
            <Input 
              label="Buscar por código/sección" 
              value={busquedaAvanzada.seccion}
              onChange={(v: string) => setBusquedaAvanzada({...busquedaAvanzada, seccion: v})}
              placeholder="Código o sección..."
            />
          </div>
          
          <div className={`${isMobile ? 'text-center' : 'pt-6'}`}>
            <Chip tone="emerald">Productos: {filteredProducts.length}</Chip>
          </div>
        </div>

        {/* BOTONES PARA LIMPIAR BÚSQUEDAS */}
        {(busquedaAvanzada.nombre || busquedaAvanzada.seccion) && (
          <div className="flex gap-2 mb-3">
            <Button 
              tone="slate" 
              onClick={() => setBusquedaAvanzada({ nombre: "", seccion: "", codigo: "" })}
              className="text-xs"
            >
              ✕ Limpiar búsquedas
            </Button>
          </div>
        )}

        <div className={`${isMobile ? 'space-y-4' : 'grid md:grid-cols-2 gap-4'}`}>
          {/* LISTA DE PRODUCTOS - IGUAL QUE ANTES */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold">Productos Disponibles</div>
              {filteredProducts.length > 0 && (
                <div className="text-xs text-slate-400">
                  {filteredProducts.length} producto(s)
                </div>
              )}
            </div>
            
            {filteredProducts.length === 0 ? (
              <div className="text-center p-6 border border-slate-800 rounded-xl">
                <div className="text-slate-400">No se encontraron productos</div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {Object.entries(grouped).map(([sec, arr]: any) => (
                  <div key={sec} className="border border-slate-800 rounded-xl">
                    <div className="px-3 py-2 text-xs font-semibold bg-slate-800/70 flex justify-between items-center">
                      <span>🗂️ {sec}</span>
                      <span className="text-slate-400">{arr.length} producto(s)</span>
                    </div>
                    <div className="divide-y divide-slate-800">
                      {arr.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-800/30 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{p.name}</div>
                            <div className="text-xs text-slate-400 truncate">
                              Precio: {money(priceList === "1" ? p.price1 : p.price2)} · 
                              Stock: {p.stock || 0}
                            </div>
                          </div>
                          <Button 
                            onClick={() => addItem(p)} 
                            tone="slate" 
                            className="shrink-0 text-xs"
                            disabled={parseNum(p.stock) <= 0}
                          >
                            {parseNum(p.stock) <= 0 ? "Sin stock" : (isMobile ? "+" : "Añadir")}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CARRITO - IGUAL QUE ANTES */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">Carrito ({items.length} producto(s))</div>
            <div className="rounded-xl border border-slate-800 divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
              {items.length === 0 && (
                <div className="p-6 text-center text-slate-400">
                  <div>🛒 El carrito está vacío</div>
                  <div className="text-xs mt-1">Agregá productos del listado</div>
                </div>
              )}
              {items.map((it, idx) => (
                <div key={idx} className="p-3 hover:bg-slate-800/20 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{it.name}</div>
                      <div className="text-xs text-slate-400">{it.section}</div>
                    </div>
                    <button 
                      onClick={() => setItems(items.filter((_: any, i: number) => i !== idx))}
                      className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0"
                      title="Eliminar producto"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      label="Cant."
                      value={it.qty}
                      onChange={(v: any) => {
                        const q = Math.max(0, parseNum(v));
                        setItems(items.map((x, i) => (i === idx ? { ...x, qty: q } : x)));
                      }}
                      className="text-xs"
                    />
                    <NumberInput
                      label="Precio"
                      value={it.unitPrice}
                      onChange={(v: any) => {
                        const q = Math.max(0, parseNum(v));
                        setItems(items.map((x, i) => (i === idx ? { ...x, unitPrice: q } : x)));
                      }}
                      className="text-xs"
                    />
                  </div>
                  <div className="text-right text-xs text-slate-300 pt-1">
                    Subtotal: <span className="font-semibold">
                      {money(parseNum(it.qty) * parseNum(it.unitPrice))}
                    </span>
                  </div>
                </div>
              ))}
              
              {items.length > 0 && (
                <div className="p-3 bg-slate-800/50 border-t border-slate-700">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total del Carrito:</span>
                    <span className="text-lg">{money(total)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* Clientes */
function ClientesTab({ state, setState, session, showError, showSuccess, showInfo }: any) {  const [name, setName] = useState("");
  const [number, setNumber] = useState(ensureUniqueNumber(state.clients));
  const [deudaInicial, setDeudaInicial] = useState(""); // 👈 NUEVO ESTADO
  const [saldoFavorInicial, setSaldoFavorInicial] = useState(""); // 👈 NUEVO ESTADO
  const [modoAdmin, setModoAdmin] = useState(false); // 👈 NUEVO ESTADO
   // 👇👇👇 PEGA LA FUNCIÓN AQUÍ - JUSTO DESPUÉS DE LOS useState
  async function limpiarDeudasInconsistentes() {
    if (!confirm("¿Estás seguro de limpiar todas las deudas inconsistentes? Esto revisará todos los clientes y ajustará las deudas según los pagos registrados.")) return;

    const st = clone(state);
    let clientesCorregidos = 0;

    st.clients.forEach((cliente: any) => {
      const detalleDeudas = calcularDetalleDeudas(st, cliente.id);
      const deudaReal = calcularDeudaTotal(detalleDeudas, cliente);
      const deudaActual = parseNum(cliente.debt);
      
      // Si hay diferencia, corregir
      if (Math.abs(deudaReal - deudaActual) > 0.01) {
        console.log(`🔧 Corrigiendo ${cliente.name}: ${money(deudaActual)} → ${money(deudaReal)}`);
        cliente.debt = deudaReal;
        clientesCorregidos++;
      }
    });

    setState(st);

    if (hasSupabase && clientesCorregidos > 0) {
      try {
        // Actualizar todos los clientes corregidos
        for (const cliente of st.clients) {
          await supabase
            .from("clients")
            .update({ debt: cliente.debt })
            .eq("id", cliente.id);
        }
        
        alert(`✅ ${clientesCorregidos} clientes corregidos. Deudas actualizadas según pagos registrados.`);
      } catch (error) {
        console.error("Error al actualizar clientes:", error);
        alert("Error al guardar las correcciones en la base de datos.");
        
        // Recargar para evitar inconsistencias
        const refreshedState = await loadFromSupabase(seedState());
        setState(refreshedState);
      }
    } else if (clientesCorregidos === 0) {
      alert("✅ No se encontraron deudas inconsistentes.");
    }
  }

  async function addClient() {
    if (!name.trim()) return;
    
    const newClient = {
      id: "c" + Math.random().toString(36).slice(2, 8),
      number: parseInt(String(number), 10),
      name: name.trim(),
      debt: modoAdmin ? parseNum(deudaInicial) : 0,
      saldo_favor: modoAdmin ? parseNum(saldoFavorInicial) : 0,
      creado_por: session?.name || "admin",
      fecha_creacion: todayISO(),
deuda_manual: modoAdmin && parseNum(deudaInicial) > 0
    };

    const st = clone(state);
    st.clients.push(newClient);
    setState(st);
    
    // Limpiar formulario
    setName("");
    setNumber(ensureUniqueNumber(st.clients));
    setDeudaInicial("");
    setSaldoFavorInicial("");
    setModoAdmin(false);

    if (hasSupabase) {
      await supabase.from("clients").insert(newClient);
    }

showSuccess(`👤 Cliente agregado ${modoAdmin ? 'con deuda/saldo manual' : 'correctamente'}`);
  }

// Función para que admin agregue deuda manualmente a cliente existente - CORREGIDA
// ✅ FUNCIÓN CORREGIDA - agregarDeudaManual
async function agregarDeudaManual(clienteId: string) {
  const deuda = prompt("Ingrese el monto de deuda a agregar:", "0");
  if (deuda === null) return;
  
  const montoDeuda = parseNum(deuda);
  if (montoDeuda < 0) return alert("El monto no puede ser negativo");

  const st = clone(state);
  const cliente = st.clients.find((c: any) => c.id === clienteId);
  
  if (cliente) {
    const deudaAnterior = parseNum(cliente.debt);
    
    // ✅ CORRECCIÓN: Sumar la deuda
    cliente.debt = deudaAnterior + montoDeuda;
    
    // ✅ CORRECCIÓN: Solo marcar como manual si realmente se agrega deuda
    if (montoDeuda > 0) {
      cliente.deuda_manual = true;
    }
    
    setState(st);

    // ✅ CORRECCIÓN MEJORADA: Guardar en Supabase con mejor manejo de errores
    if (hasSupabase) {
      try {
        console.log("💾 Guardando deuda manual en Supabase...", {
          clienteId,
          deudaAnterior,
          nuevaDeuda: cliente.debt,
          deuda_manual: cliente.deuda_manual
        });

        const { data, error } = await supabase
          .from("clients")
          .update({ 
            debt: cliente.debt,
            deuda_manual: cliente.deuda_manual
          })
          .eq("id", clienteId)
          .select(); // ✅ Agregar .select() para verificar

        if (error) {
          console.error("❌ Error Supabase al guardar deuda:", error);
          alert(`Error al guardar la deuda en la base de datos: ${error.message}`);
          
          // ✅ RECARGAR DATOS para evitar inconsistencias
          const refreshedState = await loadFromSupabase(seedState());
          setState(refreshedState);
          return;
        }

        console.log("✅ Deuda manual guardada en Supabase:", data);
        
        // ✅ ACTUALIZAR INMEDIATAMENTE el estado local con los datos de Supabase
        setTimeout(async () => {
          const refreshedState = await loadFromSupabase(seedState());
          setState(refreshedState);
        }, 500);

      } catch (error) {
        console.error("💥 Error crítico:", error);
        alert("Error de conexión con la base de datos.");
        
        // Recargar para evitar inconsistencias
        const refreshedState = await loadFromSupabase(seedState());
        setState(refreshedState);
        return;
      }
    }

    alert(`✅ Deuda agregada correctamente\n${money(deudaAnterior)} → ${money(cliente.debt)}`);
  }
}
 // Función para que admin ajuste saldo a favor manualmente
async function ajustarSaldoFavor(clienteId: string) {
  const saldo = prompt("Ingrese el nuevo saldo a favor:", "0");
  if (saldo === null) return;
  
  const montoSaldo = parseNum(saldo);
  if (montoSaldo < 0) return alert("El monto no puede ser negativo");

  const st = clone(state);
  const cliente = st.clients.find((c: any) => c.id === clienteId);
  
  if (cliente) {
    const saldoAnterior = parseNum(cliente.saldo_favor);
    cliente.saldo_favor = montoSaldo;
    
    setState(st);

    if (hasSupabase) {
      try {
        const { error } = await supabase
          .from("clients")
          .update({ saldo_favor: cliente.saldo_favor })
          .eq("id", clienteId);

        if (error) {
          console.error("❌ Error al guardar saldo:", error);
          alert("Error al guardar el saldo en la base de datos.");
          const refreshedState = await loadFromSupabase(seedState());
          setState(refreshedState);
          return;
        }
        
        console.log("✅ Saldo guardado en Supabase");
      } catch (error) {
        console.error("💥 Error crítico:", error);
        alert("Error al guardar el saldo.");
        return;
      }
    }

    alert(`Saldo a favor ajustado: ${money(saldoAnterior)} → ${money(cliente.saldo_favor)}`);
  }
}

 // Función para que admin cancele deuda manualmente
async function cancelarDeuda(clienteId: string) {
  const cliente = state.clients.find((c: any) => c.id === clienteId);
  if (!cliente) return;
  
  const confirmacion = confirm(
    `¿Está seguro de cancelar la deuda de ${cliente.name}?\nDeuda actual: ${money(cliente.debt)}`
  );
  
  if (!confirmacion) return;

  const st = clone(state);
  const clienteActualizado = st.clients.find((c: any) => c.id === clienteId);
  
  if (clienteActualizado) {
    const deudaCancelada = parseNum(clienteActualizado.debt);
    clienteActualizado.debt = 0;
    
    setState(st);

    if (hasSupabase) {
      try {
        const { error } = await supabase
          .from("clients")
          .update({ debt: 0 })
          .eq("id", clienteId);

        if (error) {
          console.error("❌ Error al cancelar deuda:", error);
          alert("Error al cancelar la deuda en la base de datos.");
          const refreshedState = await loadFromSupabase(seedState());
          setState(refreshedState);
          return;
        }
        
        console.log("✅ Deuda cancelada en Supabase");
      } catch (error) {
        console.error("💥 Error crítico:", error);
        alert("Error al cancelar la deuda.");
        return;
      }
    }

    alert(`Deuda cancelada: ${money(deudaCancelada)} → $0`);
  }
}

  const clients = Array.isArray(state.clients)
    ? [...state.clients].sort((a: any, b: any) => (a.number || 0) - (b.number || 0))
    : [];

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      {/* Card para agregar cliente normal */}
      <Card title="Agregar cliente">
        <div className="space-y-3">
          {/* Solo admin puede activar modo avanzado */}
          {session?.role === "admin" && (
            <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
              <input
                type="checkbox"
                id="modoAdmin"
                checked={modoAdmin}
                onChange={(e) => setModoAdmin(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="modoAdmin" className="text-sm font-medium">
                Modo Admin: Agregar con deuda/saldo inicial
              </label>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-3">
            <NumberInput 
              label="N° cliente" 
              value={number} 
              onChange={setNumber} 
            />
            <Input 
              label="Nombre" 
              value={name} 
              onChange={setName} 
              placeholder="Ej: Kiosco 9 de Julio" 
            />
            <div className="pt-6">
              <Button onClick={addClient}>
                Agregar
              </Button>
            </div>
          </div>

          {/* Campos solo para admin en modo avanzado */}
          {session?.role === "admin" && modoAdmin && (
            <div className="grid md:grid-cols-2 gap-3 p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
              <NumberInput
                label="Deuda inicial"
                value={deudaInicial}
                onChange={setDeudaInicial}
                placeholder="0"
              />
              <NumberInput
                label="Saldo a favor inicial"
                value={saldoFavorInicial}
                onChange={setSaldoFavorInicial}
                placeholder="0"
              />
              <div className="md:col-span-2 text-xs text-amber-300">
                ⚠️ Solo usar para casos especiales. La deuda manual se registrará en el sistema.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Listado de clientes */}
      <Card title="Listado de Clientes">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2 pr-4">N°</th>
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Deuda</th>
                <th className="py-2 pr-4">Saldo a favor</th>
                <th className="py-2 pr-4">Gasto mes</th>
                <th className="py-2 pr-4">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {clients.map((c: any) => (
                <tr key={c.id} className={c.deuda_manual ? "bg-amber-900/10" : ""}>
                  <td className="py-2 pr-4">{c.number}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      {c.name}
                      {c.deuda_manual && (
                        <span 
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-amber-800 text-amber-200 border border-amber-700"
                          title="Deuda manualmente asignada"
                        >
                          ⚠️ Manual
                        </span>
                      )}
                    </div>
                    {session?.role === "admin" && c.creado_por && (
                      <div className="text-xs text-slate-500">
                        Creado por: {c.creado_por}
                      </div>
                    )}
                  </td>
       <td className="py-2 pr-4">
  <div className={`font-medium ${
    (() => {
      const detalleDeudas = calcularDetalleDeudas(state, c.id);
      const deudaNeta = calcularDeudaTotal(detalleDeudas, c);
      return deudaNeta > 0 ? "text-amber-400" : "text-emerald-400";
    })()
  }`}>
    {(() => {
      const detalleDeudas = calcularDetalleDeudas(state, c.id);
      const deudaNeta = calcularDeudaTotal(detalleDeudas, c);
      return deudaNeta > 0 ? money(deudaNeta) : "✅ Al día";
    })()}
  </div>
</td>
                  <td className="py-2 pr-4">
                    <div className={`font-medium ${
                      c.saldo_favor > 0 ? "text-emerald-400" : "text-slate-300"
                    }`}>
                      {money(c.saldo_favor || 0)}
                    </div>
                  </td>
                  <td className="py-2 pr-4">{money(gastoMesCliente(state, c.id))}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-1">
                      {/* Solo admin puede gestionar deuda manual */}
                      {session?.role === "admin" && (
                        <>
                          <button
                            onClick={() => agregarDeudaManual(c.id)}
                            className="text-amber-400 hover:text-amber-300 text-sm px-2 py-1 border border-amber-700 rounded"
                            title="Agregar deuda manual"
                          >
                            + Deuda
                          </button>
                          <button
                            onClick={() => ajustarSaldoFavor(c.id)}
                            className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 border border-blue-700 rounded"
                            title="Ajustar saldo a favor"
                          >
                            💰 Saldo
                          </button>
                          {c.debt > 0 && (
                            <button
                              onClick={() => cancelarDeuda(c.id)}
                              className="text-red-400 hover:text-red-300 text-sm px-2 py-1 border border-red-700 rounded"
                              title="Cancelar deuda"
                            >
                              ✕ Deuda
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {clients.length === 0 && (
                <tr>
                  <td className="py-2 pr-4 text-slate-400" colSpan={6}>
                    Sin clientes cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

{session?.role === "admin" && (
  <Card title="🛠️ Panel de Control - Administrador">
    <div className="space-y-3">
      <div className="text-sm text-slate-300">
        Gestión avanzada de clientes y deudas
      </div>
      
      <div className="grid md:grid-cols-3 gap-4 text-sm">
<div className="p-3 bg-slate-800/50 rounded-lg">
  <div className="font-semibold">Clientes con deuda manual</div>
  <div className="text-amber-400 font-bold">
    {clients.filter((c: any) => c.deuda_manual && parseNum(c.debt) > 0).length}
  </div>
</div>
        
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <div className="font-semibold">Deuda manual total</div>
          <div className="text-amber-400 font-bold">
            {money(
              clients
                .filter((c: any) => c.deuda_manual)
                .reduce((sum: number, c: any) => sum + parseNum(c.debt), 0)
            )}
          </div>
        </div>
        
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <div className="font-semibold">Saldo a favor total</div>
          <div className="text-emerald-400 font-bold">
            {money(
              clients.reduce((sum: number, c: any) => sum + parseNum(c.saldo_favor), 0)
            )}
          </div>
        </div>
      </div>

      {/* 👇👇👇 AQUÍ VA EL BOTÓN NUEVO - VERSIÓN CORREGIDA */}
      <div className="border-t border-slate-700 pt-3">
        <div className="text-xs text-slate-400 mb-2">
          Herramientas de mantenimiento:
        </div>
        <Button 
          tone="red" 
          onClick={async () => {
            if (!confirm("¿Estás seguro de limpiar todas las deudas inconsistentes? Esto revisará todos los clientes y ajustará las deudas según los pagos registrados.")) return;

            const st = clone(state);
            let clientesCorregidos = 0;

            st.clients.forEach((cliente: any) => {
              const detalleDeudas = calcularDetalleDeudas(st, cliente.id);
              const deudaReal = calcularDeudaTotal(detalleDeudas, cliente);
              const deudaActual = parseNum(cliente.debt);
              
              // Si hay diferencia, corregir
              if (Math.abs(deudaReal - deudaActual) > 0.01) {
                console.log(`🔧 Corrigiendo ${cliente.name}: ${money(deudaActual)} → ${money(deudaReal)}`);
                cliente.debt = deudaReal;
                clientesCorregidos++;
              }
            });

            setState(st);

            if (hasSupabase && clientesCorregidos > 0) {
              try {
                // Actualizar todos los clientes corregidos
                for (const cliente of st.clients) {
                  await supabase
                    .from("clients")
                    .update({ debt: cliente.debt })
                    .eq("id", cliente.id);
                }
                
                alert(`✅ ${clientesCorregidos} clientes corregidos. Deudas actualizadas según pagos registrados.`);
              } catch (error) {
                console.error("Error al actualizar clientes:", error);
                alert("Error al guardar las correcciones en la base de datos.");
                
                // Recargar para evitar inconsistencias
                const refreshedState = await loadFromSupabase(seedState());
                setState(refreshedState);
              }
            } else if (clientesCorregidos === 0) {
              alert("✅ No se encontraron deudas inconsistentes.");
            }
          }}
          className="w-full"
        >
          🧹 Limpiar Deudas Inconsistentes
        </Button>
      </div>
      {/* 👆👆👆 HASTA AQUÍ EL BOTÓN NUEVO */}

      <div className="text-xs text-slate-400 border-t border-slate-700 pt-2">
        💡 Las deudas manuales se marcan con ⚠️ y solo deben usarse para casos especiales 
        (ej: deudas heredadas, ajustes contables, etc.)
      </div>
    </div>
  </Card>
)}
    </div>
  );
}







function DeudoresTab({ state, setState, session, showError, showSuccess, showInfo }: any) {// ✅ FILTRAR MEJORADO: Incluye deuda manual Y deuda de facturas
// ✅ FILTRAR: Solo clientes con deuda NETA > 0 (después de aplicar saldo)
const clients = state.clients.filter((c: any) => {
  if (!c || !c.id) return false;
  
  const detalleDeudas = calcularDetalleDeudas(state, c.id);
  const deudaNeta = calcularDeudaTotal(detalleDeudas, c); // ← Esto YA aplica saldo
  
  // Mostrar solo si tiene deuda NETA pendiente
  return deudaNeta > 0.01;
});
  const [active, setActive] = useState<string | null>(null);
  const [cash, setCash] = useState("");
  const [transf, setTransf] = useState("");
  const [alias, setAlias] = useState("");
  const [verDetalle, setVerDetalle] = useState<string | null>(null);

  // Función para ver detalle de deudas - CORREGIDA
  function verDetalleDeudas(clientId: string) {
    setVerDetalle(clientId);
  }

  // Calcular detalle de deudas para un cliente
  const detalleDeudasCliente = verDetalle ? calcularDetalleDeudas(state, verDetalle) : [];
  const clienteDetalle = state.clients.find((c: any) => c.id === verDetalle);
  const deudaTotalCliente = calcularDeudaTotal(detalleDeudasCliente, clienteDetalle);
    // 👇👇👇 AGREGAR ESTA FUNCIÓN NUEVA - SOLO PARA ADMIN
  // 👇👇👇 REEMPLAZAR LA FUNCIÓN ELIMINAR DEUDA CON ESTA VERSIÓN MEJORADA
async function eliminarDeudaCliente(clienteId: string) {
  const cliente = state.clients.find((c: any) => c.id === clienteId);
  if (!cliente) return;
  
  // Calcular deuda REAL antes de eliminar
  const detalleDeudas = calcularDetalleDeudas(state, clienteId);
  const deudaReal = calcularDeudaTotal(detalleDeudas, cliente);
  
  const confirmacion = confirm(
    `¿Está seguro de ELIMINAR COMPLETAMENTE la deuda de ${cliente.name}?\n\n` +
    `Deuda actual en sistema: ${money(cliente.debt)}\n` +
    `Deuda real calculada: ${money(deudaReal)}\n\n` +
    `⚠️ Esta acción NO se puede deshacer.`
  );
  
  if (!confirmacion) return;

  const st = clone(state);
  const clienteActualizado = st.clients.find((c: any) => c.id === clienteId);
  
  if (clienteActualizado) {
    const deudaEliminada = parseNum(clienteActualizado.debt);
    
    // ✅ CORRECCIÓN COMPLETA: Resetear completamente la deuda
    clienteActualizado.debt = 0;
    clienteActualizado.deuda_manual = false; // También quitamos el flag de deuda manual
    
    setState(st);

    if (hasSupabase) {
      try {
        const { error } = await supabase
          .from("clients")
          .update({ 
            debt: 0,
            deuda_manual: false 
          })
          .eq("id", clienteId);

        if (error) {
          console.error("❌ Error al eliminar deuda:", error);
          alert("Error al eliminar la deuda en la base de datos.");
          
          // Recargar para evitar inconsistencias
          const refreshedState = await loadFromSupabase(seedState());
          setState(refreshedState);
          return;
        }
        
        console.log("✅ Deuda eliminada en Supabase");
        
        // ✅ FORZAR ACTUALIZACIÓN DEL ESTADO para que el cliente desaparezca de deudores
        setTimeout(async () => {
          const refreshedState = await loadFromSupabase(seedState());
          setState(refreshedState);
        }, 500);
        
      } catch (error) {
        console.error("💥 Error crítico:", error);
        alert("Error al eliminar la deuda.");
        return;
      }
    }

    alert(`✅ Deuda eliminada completamente\nCliente: ${cliente.name}\nDeuda eliminada: ${money(deudaEliminada)}`);
    
    // ✅ ACTUALIZAR INMEDIATAMENTE LA VISTA
    setState({...st});
  }
}
  // 👇👇👇 NUEVA FUNCIÓN: Imprimir detalle de deudas
  async function imprimirDetalleDeudas() {
    if (!verDetalle || !clienteDetalle) return;
    
    const detalleData = {
      type: "DetalleDeuda",
      cliente: clienteDetalle,
      detalleDeudas: detalleDeudasCliente,
      deudaTotal: deudaTotalCliente,
      saldoFavor: parseNum(clienteDetalle.saldo_favor || 0)
    };

    window.dispatchEvent(new CustomEvent("print-invoice", { detail: detalleData } as any));
    await nextPaint();
    window.print();
  }

  async function registrarPago() {
    const cl = state.clients.find((c: any) => c.id === active);
    if (!cl) return;
    
    const totalPago = parseNum(cash) + parseNum(transf);
    if (totalPago <= 0) return showError("Importe inválido.");

    const st = clone(state);
    const client = st.clients.find((c: any) => c.id === active)!;

    // Calcular deuda REAL del cliente (facturas + manual)
    const detalleDeudas = calcularDetalleDeudas(st, active);
    const deudaReal = calcularDeudaTotal(detalleDeudas, client);
    
    console.log(`💳 Pago: ${totalPago}, Deuda real: ${deudaReal}`);

    if (totalPago > deudaReal) {
      return showError(`El pago (${money(totalPago)}) supera la deuda real (${money(deudaReal)})`);

    }

    // Aplicar el pago PRIMERO a la deuda manual
    let saldoRestante = totalPago;
    const aplicaciones: any[] = [];

    // 1. Pagar deuda manual primero
    const deudaManual = parseNum(client.debt);
    if (deudaManual > 0) {
      const montoAplicadoManual = Math.min(saldoRestante, deudaManual);
      
      aplicaciones.push({
        tipo: "deuda_manual",
        descripcion: "Pago de deuda manual",
        monto_aplicado: montoAplicadoManual,
        deuda_antes: deudaManual,
        deuda_despues: deudaManual - montoAplicadoManual
      });

      // Reducir deuda manual
      client.debt = Math.max(0, deudaManual - montoAplicadoManual);
      saldoRestante -= montoAplicadoManual;
    }

    // 2. Si sobra saldo, aplicar a facturas
    if (saldoRestante > 0) {
      for (const deuda of detalleDeudas) {
        if (saldoRestante <= 0) break;

        if (deuda.monto_debe > 0) {
          const montoAplicado = Math.min(saldoRestante, deuda.monto_debe);
          
          aplicaciones.push({
            factura_id: deuda.factura_id,
            factura_numero: deuda.factura_numero,
            monto_aplicado: montoAplicado,
            deuda_antes: deuda.monto_debe,
            deuda_despues: deuda.monto_debe - montoAplicado,
            tipo: "pago_factura"
          });

          saldoRestante -= montoAplicado;
        }
      }
    }

    console.log(`📊 Deuda actualizada: Manual ${deudaManual} -> ${client.debt}`);

    // Guardar en debt_payments
    const number = st.meta.invoiceCounter++;
    const id = "dp_" + number;

    const debtPayment = {
      id,
      number,
      date_iso: todayISO(),
      client_id: client.id,
      client_name: client.name,
      vendor_id: "admin",
      vendor_name: "Admin",
      cash_amount: parseNum(cash),
      transfer_amount: parseNum(transf),
      total_amount: totalPago,
      alias: alias.trim(),
      aplicaciones: aplicaciones,
      debt_before: deudaReal,
debt_after: Math.max(0, deudaReal - totalPago), // Calcular correctamente      deuda_real_antes: deudaReal,
    };

    // Guardar en debt_payments LOCAL
    st.debt_payments = st.debt_payments || [];
    st.debt_payments.push(debtPayment);
    st.meta.lastSavedInvoiceId = id;
    
    // ACTUALIZAR ESTADO PRIMERO
    setState(st);

    // Persistencia en Supabase
    if (hasSupabase) {
      try {
        console.log("💾 Guardando pago en Supabase...", debtPayment);
        
        const { data, error } = await supabase
          .from("debt_payments")
          .insert([debtPayment])
          .select();

        if (error) throw new Error(`No se pudo guardar el pago: ${error.message}`);
        
        console.log("✅ Pago guardado en Supabase:", data);

        // Actualizar cliente (deuda manual)
        const { error: clientError } = await supabase
          .from("clients")
          .update({ debt: client.debt })
          .eq("id", client.id);

        if (clientError) {
          console.error("❌ Error al actualizar cliente:", clientError);
        }

        await saveCountersSupabase(st.meta);

      } catch (error: any) {
        console.error("💥 ERROR CRÍTICO:", error);
        alert("Error al guardar el pago: " + error.message);
        
        const refreshedState = await loadFromSupabase(seedState());
        setState(refreshedState);
        return;
      }
    }

    // Limpiar UI e imprimir
    setCash("");
    setTransf("");
    setAlias("");
    setActive(null);

    window.dispatchEvent(new CustomEvent("print-invoice", { 
      detail: { 
        ...debtPayment, 
        type: "Pago de Deuda",
        items: [{ 
          productId: "pago_deuda", 
          name: "Pago de deuda", 
          section: "Finanzas", 
          qty: 1, 
          unitPrice: totalPago, 
          cost: 0 
        }],
        total: totalPago,
        payments: { 
          cash: parseNum(cash), 
          transfer: parseNum(transf), 
          change: 0,
          alias: alias.trim()
        },
        status: "Pagado",
        aplicaciones: aplicaciones,
client_debt_total: Math.max(0, deudaReal - totalPago)
      } 
    } as any));
    
    await nextPaint();
    window.print();
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* MODAL DE DETALLE DE DEUDAS - NUEVO */}
      {verDetalle && clienteDetalle && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Detalle de Deudas - {clienteDetalle.name}
                  </h2>
                  <p className="text-slate-400">
                    N° Cliente: {clienteDetalle.number} | 
                    Deuda Total: <span className="text-amber-400 font-semibold">{money(deudaTotalCliente)}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={imprimirDetalleDeudas}>
                    📄 Imprimir Detalle
                  </Button>
                  <Button tone="slate" onClick={() => setVerDetalle(null)}>
                    ✕ Cerrar
                  </Button>
                </div>
              </div>

              {/* DETALLE DE FACTURAS PENDIENTES */}
              <div className="space-y-4">
                {detalleDeudasCliente.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No hay facturas pendientes
                  </div>
                ) : (
                  detalleDeudasCliente.map((deuda: any, index: number) => (
                    <div key={deuda.factura_id} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">
                            Factura #{pad(deuda.factura_numero)}
                          </h3>
                          <p className="text-sm text-slate-400">
                            Fecha: {new Date(deuda.fecha).toLocaleDateString("es-AR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-amber-400">
                            {money(deuda.monto_debe)}
                          </div>
                          <div className="text-sm text-slate-400">
                            Total: {money(deuda.monto_total)} | Pagado: {money(deuda.monto_pagado)}
                          </div>
                        </div>
                      </div>

                      {/* ITEMS DE LA FACTURA */}
                      <div className="text-sm">
                        <div className="font-semibold mb-2">Productos:</div>
                        <div className="space-y-1">
                          {deuda.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span>{item.name} × {item.qty}</span>
                              <span>{money(parseNum(item.qty) * parseNum(item.unitPrice))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* RESUMEN FINAL */}
              <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-amber-400">
                      {money(deudaTotalCliente)}
                    </div>
                    <div className="text-sm text-slate-400">Deuda Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {detalleDeudasCliente.length}
                    </div>
                    <div className="text-sm text-slate-400">Facturas Pendientes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">
                      {money(parseNum(clienteDetalle.saldo_favor || 0))}
                    </div>
                    <div className="text-sm text-slate-400">Saldo a Favor</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card title="Deudores">
        {clients.length === 0 && <div className="text-sm text-slate-400">Sin deudas.</div>}
        <div className="divide-y divide-slate-800">
   {clients.map((c: any) => {
  const detalleDeudas = calcularDetalleDeudas(state, c.id);
  const deudaNeta = calcularDeudaTotal(detalleDeudas, c); // ← Esto YA aplica saldo a favor
  const deudaManual = parseNum(c.debt || 0);
  const saldoFavor = parseNum(c.saldo_favor || 0);
  
  // Calcular deuda BRUTA (sin aplicar saldo) para mostrar el desglose
  const deudaFacturas = detalleDeudas.reduce((sum, deuda) => sum + deuda.monto_debe, 0);
  const deudaBruta = deudaFacturas + deudaManual;

  return (
    <div key={c.id} className="border border-slate-700 rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-2">
            {c.name} (N° {c.number})
            {c.deuda_manual && deudaManual > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-amber-800 text-amber-200 border border-amber-700">
                ⚠️ Deuda Manual
              </span>
            )}
            {saldoFavor > 0 && deudaNeta === 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-emerald-800 text-emerald-200 border border-emerald-700">
                💰 Saldo a favor
              </span>
            )}
          </div>
          
          {/* ✅ INFORMACIÓN CLARA CON SALDO APLICADO */}
          <div className="text-sm text-slate-400 mt-1">
            {/* DEUDA NETA (después de saldo) */}
            <span className={`font-semibold ${
              deudaNeta > 0 ? "text-red-400" : "text-emerald-400"
            }`}>
              {deudaNeta > 0 ? `Deuda pendiente: ${money(deudaNeta)}` : "✅ Al día"}
            </span>
            
            {/* Desglose SOLO si hay deuda bruta */}
            {deudaBruta > 0 && (
              <>
                <span className="ml-2 text-slate-500">
                  (Bruta: {money(deudaBruta)})
                </span>
                
                {deudaManual > 0 && deudaFacturas > 0 && (
                  <>
                    <span className="ml-2 text-amber-400">
                      (Manual: {money(deudaManual)})
                    </span>
                    <span className="ml-2 text-blue-400">
                      (Facturas: {money(deudaFacturas)})
                    </span>
                  </>
                )}
                
                {deudaManual > 0 && deudaFacturas === 0 && (
                  <span className="ml-2 text-amber-400">
                    ← Solo deuda manual
                  </span>
                )}
                
                {deudaManual === 0 && deudaFacturas > 0 && (
                  <span className="ml-2 text-blue-400">
                    ← Solo deuda de facturas
                  </span>
                )}
              </>
            )}
            
            {/* INFORMACIÓN DE SALDO A FAVOR */}
            {saldoFavor > 0 && (
              <div className="mt-1">
                {deudaNeta === 0 ? (
                  <span className="text-emerald-400">
                    💰 Saldo a favor: {money(saldoFavor)} (no aplicado - cliente al día)
                  </span>
                ) : (
                  <span className="text-emerald-400">
                    💰 Saldo a favor: {money(saldoFavor)} (aplicado - reduce deuda)
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Detalle de facturas pendientes - solo si tiene */}
          {deudaFacturas > 0 && (
            <div className="mt-2 text-xs">
              {detalleDeudas.slice(0, 3).map((deuda, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>Factura #{deuda.factura_numero}</span>
                  <span>{money(deuda.monto_debe)}</span>
                </div>
              ))}
              {detalleDeudas.length > 3 && (
                <div className="text-slate-500">
                  +{detalleDeudas.length - 3} facturas más...
                </div>
              )}
            </div>
          )}
          
          {/* Mostrar si solo tiene deuda manual */}
          {deudaManual > 0 && deudaFacturas === 0 && (
            <div className="mt-2 text-xs text-amber-400">
              ⚠️ Deuda asignada manualmente
            </div>
          )}
        </div>
        
        <div className="flex gap-2 shrink-0">
          <Button tone="slate" onClick={() => verDetalleDeudas(c.id)}>
            📋 Detalle
          </Button>
          <Button tone="slate" onClick={() => setActive(c.id)}>
            💳 Pagar
          </Button>
          {session?.role === "admin" && (
            <Button 
              tone="red" 
              onClick={() => eliminarDeudaCliente(c.id)}
              title="Eliminar completamente la deuda"
            >
              🗑️ Eliminar Deuda
            </Button>
          )}
        </div>
      </div>
    </div>
  );
})}
        </div>
      </Card>

      {active && (
        <Card title="Registrar pago">
          <div className="grid md:grid-cols-4 gap-3">
            <NumberInput label="Efectivo" value={cash} onChange={setCash} />
            <NumberInput label="Transferencia" value={transf} onChange={setTransf} />
            <Input label="Alias/CVU" value={alias} onChange={setAlias} />
            <div className="pt-6">
              <Button onClick={registrarPago}>Guardar e imprimir recibo</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
/* Cola (vendedor/admin): aceptar / cancelar turnos de la hora actual) */
function ColaTab({ state, setState, session, showError, showSuccess, showInfo }: any) {  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Rango de la HORA actual
  function hourRange(d = new Date()) {
    const s = new Date(d);
    s.setMinutes(0, 0, 0);
    const e = new Date(d);
    e.setMinutes(59, 59, 999);
    return { startISO: s.toISOString(), endISO: e.toISOString() };
  }

  async function refresh() {
    setLoading(true);
    const { startISO, endISO } = hourRange();

    if (hasSupabase) {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .gte("date_iso", startISO)
        .lte("date_iso", endISO)
        .order("date_iso", { ascending: true });

      if (!error) setTickets(data || []);
    } else {
      // sin supabase: uso la cola local
      const list = (state.queue || [])
        .filter((t: any) => t.date_iso >= startISO && t.date_iso <= endISO)
        .sort((a: any, b: any) => a.date_iso.localeCompare(b.date_iso));
      setTickets(list);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();

    // Realtime (si hay Supabase)
    if (hasSupabase) {
      const ch = supabase
        .channel("rt-tickets")
        .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => refresh())
        .subscribe();
      return () => {
        supabase.removeChannel(ch);
      };
    }
  }, []);

  async function accept(t: any, caja = "1") {
    const now = new Date().toISOString();
    const boxVal = Number(caja);

    if (hasSupabase) {
      // Persistir y traer el row actualizado
      const { data, error } = await supabase
        .from("tickets")
        .update({
          status: "Aceptado",
          box: boxVal,
          accepted_by: session?.name ?? "-",
          accepted_at: now,
        })
        .eq("id", t.id)
        .select("*")
        .single();

      if (error) {
        console.error("Supabase UPDATE tickets error:", error);
        alert("No pude marcar el ticket como ACEPTADO en la base.");
        await refresh();
        return;
      }
       // 👇👇👇 NUEVA SUSCRIPCIÓN PARA DEBT_PAYMENTS
    const debtPaymentsSubscription = supabase
      .channel('debt-payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debt_payments'
        },
        async () => {
          console.log("🔄 Cambios en debt_payments detectados, recargando...");
          const refreshedState = await loadFromSupabase(seedState());
          setState(refreshedState);
        }
      )
      .subscribe();


      // Sincronizar UI con la verdad del server
      setTickets((prev) => prev.map((x) => (x.id === t.id ? data : x)));
      const st = clone(state);
      st.queue = Array.isArray(st.queue) ? st.queue : [];
      const i = st.queue.findIndex((x: any) => x.id === t.id);
      if (i >= 0) st.queue[i] = data;
      setState(st);
    } else {
      // Modo local (sin Supabase)
      const st = clone(state);
      st.queue = Array.isArray(st.queue) ? st.queue : [];
      const i = st.queue.findIndex((x: any) => x.id === t.id);
      if (i >= 0) {
        st.queue[i] = {
          ...st.queue[i],
          status: "Aceptado",
          box: boxVal,
          accepted_by: session?.name ?? session?.id ?? "-",
          accepted_at: now,
        };
      }
      setState(st);
      setTickets((prev) =>
        prev.map((x) =>
          x.id === t.id ? { ...x, status: "Aceptado", box: boxVal, accepted_by: session?.name ?? "-", accepted_at: now } : x
        )
      );
    }

    // Aviso a la TV
    try {
      const bc = new BroadcastChannel("turnos-tv");
      bc.postMessage({ type: "announce", client_name: t.client_name, caja: boxVal });
    } catch {}
    alert(`${t.client_name} puede pasar a la CAJA ${boxVal}`);
  }

  async function cancel(t: any) {
    if (hasSupabase) {
      // Persistir y traer el row actualizado
      const { data, error } = await supabase.from("tickets").update({ status: "Cancelado" }).eq("id", t.id).select("*").single();

      if (error) {
        console.error("Supabase UPDATE tickets cancel:", error);
        alert("No pude CANCELAR el ticket en la base.");
        await refresh();
        return;
      }

      // Sincronizar UI con server
      setTickets((prev) => prev.map((x) => (x.id === t.id ? data : x)));
      const st = clone(state);
      st.queue = Array.isArray(st.queue) ? st.queue : [];
      const i = st.queue.findIndex((x: any) => x.id === t.id);
      if (i >= 0) st.queue[i] = data;
      setState(st);
    } else {
      // Modo local
      const st = clone(state);
      st.queue = Array.isArray(st.queue) ? st.queue : [];
      const i = st.queue.findIndex((x: any) => x.id === t.id);
      if (i >= 0) st.queue[i] = { ...st.queue[i], status: "Cancelado" };
      setState(st);
      setTickets((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: "Cancelado" } : x)));
    }
  }

  const pendientes = tickets.filter((t) => t.status === "En cola");
  const aceptados = tickets.filter((t) => t.status === "Aceptado");

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card
        title="Turnos — Hora actual"
        actions={
          <Button tone="slate" onClick={refresh}>
            Actualizar
          </Button>
        }
      >
        {loading && <div className="text-sm text-slate-400">Cargando…</div>}

        {!loading && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold mb-2">En cola</div>
              <div className="rounded-xl border border-slate-800 divide-y divide-slate-800">
                {pendientes.length === 0 && <div className="p-3 text-sm text-slate-400">Sin turnos en esta hora.</div>}
                {pendientes.map((t) => (
                  <div key={t.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{t.client_name}</div>
                      <div className="text-xs text-slate-400">
                        #{t.id} · {new Date(t.date_iso).toLocaleTimeString("es-AR")} · {t.action}
                      </div>
                    </div>
                    <div className="shrink-0 flex gap-2">
                      <Button onClick={() => accept(t, "1")}>Aceptar (Caja 1)</Button>
                      <Button tone="red" onClick={() => cancel(t)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Aceptados</div>
              <div className="rounded-xl border border-slate-800 divide-y divide-slate-800">
                {aceptados.length === 0 && <div className="p-3 text-sm text-slate-400">Nadie aceptado aún.</div>}
                {aceptados.map((t) => (
                  <div key={t.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{t.client_name} — Caja {t.box ?? "1"}</div>
                      <div className="text-xs text-slate-400">
                        Aceptado por {t.accepted_by || "—"} · {t.accepted_at ? new Date(t.accepted_at).toLocaleTimeString("es-AR") : "—"}
                      </div>
                    </div>
                    <Chip tone="emerald">Aceptado</Chip>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* Vendedores */
function VendedoresTab({ state, setState }: any) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  async function add() {
    if (!name.trim() || !key.trim()) return;
    const vendor = { id: "v" + Math.random().toString(36).slice(2, 8), name: name.trim(), key: key.trim() };
    const st = clone(state);
    st.vendors.push(vendor);
    setState(st);
    setName("");
    setKey("");
    if (hasSupabase) await supabase.from("vendors").insert(vendor);
  }
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card title="Agregar vendedor">
        <div className="grid md:grid-cols-3 gap-3">
          <Input label="Nombre" value={name} onChange={setName} />
          <Input label="Clave" value={key} onChange={setKey} />
          <div className="pt-6">
            <Button onClick={add}>Agregar</Button>
          </div>
        </div>
      </Card>
      <Card title="Listado">
        <div className="divide-y divide-slate-800">
          {state.vendors.map((v: any) => (
            <div key={v.id} className="flex items-center justify-between py-2">
              <div className="text-sm">
                <span className="font-semibold">{v.name}</span> <span className="text-slate-500">({v.id})</span>
              </div>
              <span className="inline-flex text-xs bg-slate-800/60 border border-slate-700/50 rounded-full px-2 py-0.5">Clave: {v.key}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>

  );
}

/* Reportes */
function ReportesTab({ state, setState, session, showError, showSuccess, showInfo }: any) {
  const [fechaInicio, setFechaInicio] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primer día del mes
    return date.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [tipoReporte, setTipoReporte] = useState<"ventas" | "inventario" | "rentabilidad" | "tendencias" | "abc">("ventas");

  // Filtrar ventas de iPhones en el rango de fechas
  const ventasiPhone = state.invoices.filter((v: any) => {
    if (v.tipo !== "Venta") return false;
    
    const fechaVenta = new Date(v.date_iso).toISOString().split('T')[0];
    return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
  });

  // Productos en stock
  const productosStock = state.products.filter((p: Producto) => p.estado === "EN STOCK");

  // 🔥 NUEVO: Análisis ABC de inventario
  function calcularAnalisisABC() {
    const productosConValor = productosStock.map((p: Producto) => ({
      ...p,
      valorInventario: (p.precio_compra + p.costo_reparacion) * 1, // Asumiendo 1 unidad por producto
      rotacion: calcularRotacionProducto(p.id)
    }));

    // Ordenar por valor de inventario descendente
    productosConValor.sort((a, b) => b.valorInventario - a.valorInventario);

    let totalValor = productosConValor.reduce((sum, p) => sum + p.valorInventario, 0);
    let acumulado = 0;
    
    return productosConValor.map((p, index) => {
      acumulado += p.valorInventario;
      const porcentajeAcumulado = (acumulado / totalValor) * 100;
      
      let categoria = 'C';
      if (porcentajeAcumulado <= 80) categoria = 'A';
      else if (porcentajeAcumulado <= 95) categoria = 'B';
      
      return {
        ...p,
        categoria,
        porcentajeAcumulado,
        ranking: index + 1
      };
    });
  }

  // 🔥 NUEVO: Calcular rotación de producto
  function calcularRotacionProducto(productId: string) {
    const ventasProducto = ventasiPhone.filter(v => 
      v.items.some((item: any) => item.productId === productId)
    ).length;
    
    return ventasProducto;
  }

  // 🔥 NUEVO: Análisis de tendencias temporales
  function analizarTendencias() {
    const ventasPorDia: any = {};
    const ventasPorMes: any = {};
    
    ventasiPhone.forEach(venta => {
      const fecha = new Date(venta.date_iso);
      const dia = fecha.toISOString().split('T')[0];
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      
      // Por día
      ventasPorDia[dia] = (ventasPorDia[dia] || 0) + venta.total;
      
      // Por mes
      ventasPorMes[mes] = (ventasPorMes[mes] || 0) + venta.total;
    });

    // Calcular crecimiento mensual
    const meses = Object.keys(ventasPorMes).sort();
    const crecimientoMensual = [];
    
    for (let i = 1; i < meses.length; i++) {
      const mesActual = ventasPorMes[meses[i]] || 0;
      const mesAnterior = ventasPorMes[meses[i-1]] || 0;
      const crecimiento = mesAnterior > 0 ? ((mesActual - mesAnterior) / mesAnterior) * 100 : 0;
      
      crecimientoMensual.push({
        mes: meses[i],
        ventas: mesActual,
        crecimiento: parseFloat(crecimiento.toFixed(1))
      });
    }

    return {
      ventasPorDia,
      ventasPorMes,
      crecimientoMensual,
      diasConMasVentas: Object.entries(ventasPorDia)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 5)
    };
  }

  // Métricas principales de VENTAS - MEJORADO con GB
  const metricasVentas = {
    totalVentas: ventasiPhone.reduce((sum: number, v: any) => sum + v.total, 0),
    totalUnidades: ventasiPhone.reduce((sum: number, v: any) => sum + v.items.length, 0),
    gananciaTotal: ventasiPhone.reduce((sum: number, v: any) => sum + v.ganancia, 0),
    costoTotal: ventasiPhone.reduce((sum: number, v: any) => sum + v.costo_total, 0),
    comisionesTotal: ventasiPhone.reduce((sum: number, v: any) => sum + v.comisiones_total, 0),
    ticketPromedio: 0,
    
    // 🔥 MEJORADO: Por modelo + capacidad (GB)
    ventasPorModeloGB: ventasiPhone.reduce((acc: any, v: any) => {
      v.items.forEach((item: any) => {
        if (item.modelo && item.capacidad) {
          const key = `${item.modelo} ${item.capacidad}`;
          acc[key] = (acc[key] || 0) + 1;
        }
      });
      return acc;
    }, {}),

    // Por grado
    ventasPorGrado: ventasiPhone.reduce((acc: any, v: any) => {
      v.items.forEach((item: any) => {
        if (item.grado) {
          acc[item.grado] = (acc[item.grado] || 0) + 1;
        }
      });
      return acc;
    }, {}),

    // Por vendedor
    ventasPorVendedor: ventasiPhone.reduce((acc: any, v: any) => {
      const vendedor = v.vendedor_nombre || "Sin asignar";
      acc[vendedor] = (acc[vendedor] || { ventas: 0, unidades: 0, comisiones: 0 });
      acc[vendedor].ventas += v.total;
      acc[vendedor].unidades += v.items.length;
      acc[vendedor].comisiones += v.comisiones_total;
      return acc;
    }, {}),

    // 🔥 NUEVO: Por color
    ventasPorColor: ventasiPhone.reduce((acc: any, v: any) => {
      v.items.forEach((item: any) => {
        if (item.color) {
          acc[item.color] = (acc[item.color] || 0) + 1;
        }
      });
      return acc;
    }, {})
  };

  // Calcular ticket promedio
  metricasVentas.ticketPromedio = metricasVentas.totalUnidades > 0 
    ? metricasVentas.totalVentas / metricasVentas.totalUnidades 
    : 0;

  // Métricas de INVENTARIO - MEJORADO con GB
  const metricasInventario = {
    totalProductos: productosStock.length,
    capitalInvertido: productosStock.reduce((sum: number, p: Producto) => 
      sum + p.precio_compra + p.costo_reparacion, 0),
    valorVentaTotal: productosStock.reduce((sum: number, p: Producto) => 
      sum + p.precio_venta, 0),
    
    // 🔥 MEJORADO: Stock por modelo + capacidad
    stockPorModeloGB: productosStock.reduce((acc: any, p: Producto) => {
      const key = `${p.modelo} ${p.capacidad || 'N/A'}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),

    // Por ubicación
    stockPorUbicacion: productosStock.reduce((acc: any, p: Producto) => {
      acc[p.ubicacion] = (acc[p.ubicacion] || 0) + 1;
      return acc;
    }, {}),

    // Por grado en stock
    stockPorGrado: productosStock.reduce((acc: any, p: Producto) => {
      acc[p.grado] = (acc[p.grado] || 0) + 1;
      return acc;
    }, {}),

    // Productos con más tiempo en stock
    productosViejos: productosStock
      .map((p: Producto) => ({
        ...p,
        diasEnStock: calcularDiasEnStock(p)
      }))
      .filter(p => p.diasEnStock > 30)
      .sort((a, b) => b.diasEnStock - a.diasEnStock)
      .slice(0, 10),

    // 🔥 NUEVO: Análisis ABC
    analisisABC: calcularAnalisisABC()
  };

  // Métricas de RENTABILIDAD
  const metricasRentabilidad = {
    margenGananciaPromedio: metricasVentas.totalVentas > 0 
      ? (metricasVentas.gananciaTotal / metricasVentas.totalVentas) * 100 
      : 0,
    
    // Rentabilidad por modelo + GB
    rentabilidadPorModeloGB: ventasiPhone.reduce((acc: any, v: any) => {
      v.items.forEach((item: any) => {
        if (item.modelo && item.capacidad) {
          const key = `${item.modelo} ${item.capacidad}`;
          acc[key] = acc[key] || { ventas: 0, ganancia: 0, unidades: 0 };
          acc[key].ventas += item.precio_venta;
          acc[key].ganancia += (item.precio_venta - item.costo_reparacion);
          acc[key].unidades += 1;
        }
      });
      return acc;
    }, {}),

    // ROI del inventario
    roiInventario: metricasInventario.capitalInvertido > 0
      ? (metricasVentas.gananciaTotal / metricasInventario.capitalInvertido) * 100
      : 0,

    // 🔥 NUEVO: Rentabilidad por grado
    rentabilidadPorGrado: ventasiPhone.reduce((acc: any, v: any) => {
      v.items.forEach((item: any) => {
        if (item.grado) {
          acc[item.grado] = acc[item.grado] || { ventas: 0, ganancia: 0, unidades: 0 };
          acc[item.grado].ventas += item.precio_venta;
          acc[item.grado].ganancia += (item.precio_venta - item.costo_reparacion);
          acc[item.grado].unidades += 1;
        }
      });
      return acc;
    }, {})
  };

  // 🔥 NUEVO: Métricas de TENDENCIAS
  const metricasTendencias = analizarTendencias();

  // 🔥 CORREGIDO: Función de impresión simplificada y segura
  // 🔥 VERSIÓN COMPLETA Y ROBUSTA
  // 🔥 FUNCIÓN MEJORADA: Reportes separados por tipo
  async function imprimirReporte() {
    try {
      let reporteData: any = {
        type: "Reporte",
        subtipo: tipoReporte,
        titulo: `Reporte iPhones - ${tipoReporte.toUpperCase()}`,
        fechaInicio,
        fechaFin,
        periodo: `${fechaInicio} a ${fechaFin}`,
        fechaGeneracion: new Date().toLocaleString("es-AR")
      };

      // 👇👇👇 MODIFICACIÓN: "ventas" usa reporte completo, los otros específicos
      switch (tipoReporte) {
        case "ventas":
          // VENTAS usa el reporte COMPLETO (igual que antes)
          reporteData = {
            ...reporteData,
            ventas: ventasiPhone,
            gastos: state.gastos || [],
            devoluciones: state.devoluciones || [],
            transferenciasPorAlias: [],
            deudaDelDiaDetalle: [],
            deudoresActivos: [],
            pagosDeudoresDetallados: [],
            resumen: {
              ventas: metricasVentas.totalVentas,
              deudaDelDia: 0,
              efectivoNeto: ventasiPhone.reduce((sum: number, v: any) => 
                sum + parseNum(v?.payments?.cash || 0), 0),
              transferencias: ventasiPhone.reduce((sum: number, v: any) => 
                sum + parseNum(v?.payments?.transfer || 0), 0),
              flujoCajaEfectivo: 0
            }
          };
          break;

        case "inventario":
          reporteData = {
            ...reporteData,
            metricas: metricasInventario,
            productosStock: productosStock,
            resumen: {
              totalProductos: metricasInventario.totalProductos,
              capitalInvertido: metricasInventario.capitalInvertido,
              valorVentaTotal: metricasInventario.valorVentaTotal
            }
          };
          break;

        case "rentabilidad":
          reporteData = {
            ...reporteData,
            metricas: metricasRentabilidad,
            ventas: ventasiPhone,
            resumen: {
              margenGananciaPromedio: metricasRentabilidad.margenGananciaPromedio,
              roiInventario: metricasRentabilidad.roiInventario,
              gananciaTotal: metricasVentas.gananciaTotal
            }
          };
          break;

        case "tendencias":
          reporteData = {
            ...reporteData,
            metricas: metricasTendencias,
            ventas: ventasiPhone,
            resumen: {
              totalVentas: metricasVentas.totalVentas,
              crecimientoReciente: metricasTendencias.crecimientoMensual.slice(-1)[0]?.crecimiento || 0
            }
          };
          break;

        case "abc":
          reporteData = {
            ...reporteData,
            analisisABC: metricasInventario.analisisABC,
            resumen: {
              totalProductos: metricasInventario.totalProductos,
              capitalInvertido: metricasInventario.capitalInvertido,
              categoriaA: metricasInventario.analisisABC.filter((p: any) => p.categoria === 'A').length,
              categoriaB: metricasInventario.analisisABC.filter((p: any) => p.categoria === 'B').length,
              categoriaC: metricasInventario.analisisABC.filter((p: any) => p.categoria === 'C').length
            }
          };
          break;
      }

      console.log("📊 Generando reporte específico:", reporteData);

      // Disparar evento de impresión
      window.dispatchEvent(new CustomEvent("print-invoice", { detail: reporteData } as any));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      window.print();
      
    } catch (error) {
      console.error('Error al imprimir:', error);
      showError('Error al generar el reporte. Intenta nuevamente.');
    }
  }

  // 🔥 NUEVO: Función para obtener recomendaciones inteligentes
  function obtenerRecomendaciones() {
    const recomendaciones = [];

    // Análisis de inventario
    const productosSinMovimiento = productosStock.filter(p => 
      calcularRotacionProducto(p.id) === 0 && calcularDiasEnStock(p) > 60
    );

    if (productosSinMovimiento.length > 0) {
      recomendaciones.push({
        tipo: "inventario",
        titulo: "📦 Productos sin movimiento",
        mensaje: `${productosSinMovimiento.length} productos tienen más de 60 días sin venderse`,
        accion: "Considerar promociones o ajustar precios",
        urgencia: "media"
      });
    }

    // Análisis de rentabilidad
    const productosBajaRentabilidad = Object.entries(metricasRentabilidad.rentabilidadPorModeloGB)
      .filter(([, datos]: any) => (datos.ganancia / datos.ventas) * 100 < 15)
      .slice(0, 3);

    if (productosBajaRentabilidad.length > 0) {
      recomendaciones.push({
        tipo: "rentabilidad",
        titulo: "💰 Margenes bajos detectados",
        mensaje: `${productosBajaRentabilidad.length} modelos tienen margen menor al 15%`,
        accion: "Revisar precios de compra o aumentar precios de venta",
        urgencia: "alta"
      });
    }

    // Análisis de tendencias
    if (metricasTendencias.crecimientoMensual.length > 0) {
      const ultimoCrecimiento = metricasTendencias.crecimientoMensual[metricasTendencias.crecimientoMensual.length - 1];
      if (ultimoCrecimiento.crecimiento < 0) {
        recomendaciones.push({
          tipo: "tendencia",
          titulo: "📉 Tendencia negativa",
          mensaje: `Ventas del último mes disminuyeron un ${Math.abs(ultimoCrecimiento.crecimiento)}%`,
          accion: "Analizar causas y planificar estrategias de recuperación",
          urgencia: "alta"
        });
      }
    }

    return recomendaciones;
  }

  // 🔥 NUEVO: Funciones auxiliares para las nuevas cards
  const docsEnRango = state.invoices.filter((f: any) => {
    const fechaDoc = new Date(f.date_iso).toISOString().split('T')[0];
    return fechaDoc >= fechaInicio && fechaDoc <= fechaFin;
  });

  const devolucionesPeriodo = state.devoluciones.filter((d: any) => {
    const fechaDev = new Date(d.date_iso).toISOString().split('T')[0];
    return fechaDev >= fechaInicio && fechaDev <= fechaFin;
  });

  const pagosDeudores = state.invoices.filter((f: any) => {
    const fechaPago = new Date(f.date_iso).toISOString().split('T')[0];
    return f.tipo === "PagoDeuda" && fechaPago >= fechaInicio && fechaPago <= fechaFin;
  });

  const gastosPeriodo = state.gastos.filter((g: any) => {
    const fechaGasto = new Date(g.date_iso).toISOString().split('T')[0];
    return fechaGasto >= fechaInicio && fechaGasto <= fechaFin;
  });

  // Cálculos para las nuevas cards
  const totalGastos = gastosPeriodo.reduce((sum: number, g: any) => sum + parseNum(g.total), 0);
  const totalGastosEfectivo = gastosPeriodo.reduce((sum: number, g: any) => sum + parseNum(g.efectivo), 0);
  const totalGastosTransferencia = gastosPeriodo.reduce((sum: number, g: any) => sum + parseNum(g.transferencia), 0);

  const devolucionesMontoEfectivo = devolucionesPeriodo.reduce((sum: number, d: any) => sum + parseNum(d.efectivo), 0);
  const devolucionesMontoTransfer = devolucionesPeriodo.reduce((sum: number, d: any) => sum + parseNum(d.transferencia), 0);
  const devolucionesMontoTotal = devolucionesPeriodo.reduce((sum: number, d: any) => sum + parseNum(d.total), 0);

  // Transferencias por alias
  const transferenciasPorAlias: any[] = [];
  
  // Combinar transferencias de ventas y pagos de deudores
  const todasTransferencias = [
    ...ventasiPhone.filter((v: any) => parseNum(v?.payments?.transfer) > 0),
    ...pagosDeudores.filter((p: any) => parseNum(p?.payments?.transfer) > 0)
  ];

  const porAliasMap = new Map();
  todasTransferencias.forEach((doc: any) => {
    const alias = (doc?.payments?.alias || "").trim();
    const monto = parseNum(doc?.payments?.transfer);
    if (alias && monto > 0) {
      if (porAliasMap.has(alias)) {
        porAliasMap.set(alias, porAliasMap.get(alias) + monto);
      } else {
        porAliasMap.set(alias, monto);
      }
    }
  });

  const porAlias = Array.from(porAliasMap, ([alias, total]) => ({ alias, total }));

  const recomendaciones = obtenerRecomendaciones();

  // 🔥 CORREGIDO: Función auxiliar para calcular días en stock
  function calcularDiasEnStock(producto: Producto): number {
    if (!producto.fecha_ingreso) return 0;
    const fechaIngreso = new Date(producto.fecha_ingreso);
    const hoy = new Date();
    const diffTime = hoy.getTime() - fechaIngreso.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // 🔥 CORREGIDO: Función auxiliar para formatear dinero
  function money(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }

  // 🔥 CORREGIDO: Función auxiliar para parsear números
  function parseNum(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  // 🔥 CORREGIDO: Función auxiliar para padding de números
  function pad(num: number): string {
    return num.toString().padStart(4, '0');
  }

  // 🔥 CORREGIDO: Funciones para cálculo de deudas
  function calcularDetalleDeudas(state: any, clientId: string): any[] {
    return state.invoices.filter((f: any) => 
      f.client_id === clientId && 
      f.tipo === "Venta" && 
      parseNum(f.debt_after) > 0.01
    );
  }

  function calcularDeudaTotal(detalleDeudas: any[], cliente: any): number {
    const deudaFacturas = detalleDeudas.reduce((sum, f) => sum + parseNum(f.debt_after), 0);
    const saldoFavor = parseNum(cliente.saldo_favor || 0);
    return Math.max(0, deudaFacturas - saldoFavor);
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* SOLO UNA CARD DE TÍTULO - ELIMINAR LA DUPLICADA */}
      <Card title="📊 Sistema Avanzado de Reportes - iPhones">
        <div className="grid md:grid-cols-4 gap-4">
          <Select
            label="Tipo de Reporte"
            value={tipoReporte}
            onChange={setTipoReporte}
            options={[
              { value: "ventas", label: "📈 Ventas y Performance" },
              { value: "inventario", label: "📦 Análisis de Inventario" },
              { value: "rentabilidad", label: "💰 Rentabilidad y Margenes" },
              { value: "tendencias", label: "📊 Tendencias y Forecasting" },
              { value: "abc", label: "🔍 Análisis ABC" },
            ]}
          />
          <Input
            label="Fecha Inicio"
            type="date"
            value={fechaInicio}
            onChange={setFechaInicio}
          />
          <Input
            label="Fecha Fin"
            type="date"
            value={fechaFin}
            onChange={setFechaFin}
          />
          <div className="pt-6">
            <Button onClick={imprimirReporte}>
              🖨️ Imprimir Reporte
            </Button>
          </div>
        </div>
      </Card>

      {/* 🔥 NUEVO: Panel de Recomendaciones Inteligentes */}
      {recomendaciones.length > 0 && (
        <Card title="🤖 Recomendaciones Inteligentes">
          <div className="space-y-3">
            {recomendaciones.map((rec, index) => (
              <div key={index} className={`p-3 border rounded-lg ${
                rec.urgencia === "alta" ? "border-red-500 bg-red-900/20" : 
                rec.urgencia === "media" ? "border-amber-500 bg-amber-900/20" : 
                "border-blue-500 bg-blue-900/20"
              }`}>
                <div className="font-semibold">{rec.titulo}</div>
                <div className="text-sm text-slate-300">{rec.mensaje}</div>
                <div className="text-sm text-emerald-400 mt-1">💡 {rec.accion}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* REPORTE DE VENTAS - MEJORADO */}
      {tipoReporte === "ventas" && (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <Card title="💰 Ventas Totales">
              <div className="text-2xl font-bold text-emerald-400">
                {money(metricasVentas.totalVentas)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {metricasVentas.totalUnidades} unidades vendidas
              </div>
            </Card>

            <Card title="📈 Ganancia Total">
              <div className="text-2xl font-bold text-green-400">
                {money(metricasVentas.gananciaTotal)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Margen: {((metricasVentas.gananciaTotal / metricasVentas.totalVentas) * 100).toFixed(1)}%
              </div>
            </Card>

            <Card title="🎫 Ticket Promedio">
              <div className="text-2xl font-bold text-blue-400">
                {money(metricasVentas.ticketPromedio)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Por unidad vendida
              </div>
            </Card>

            <Card title="👥 Comisiones">
              <div className="text-2xl font-bold text-purple-400">
                {money(metricasVentas.comisionesTotal)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Total pagado en comisiones
              </div>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card title="📱 Ventas por Modelo y Capacidad">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {Object.entries(metricasVentas.ventasPorModeloGB)
                  .sort(([,a]: any, [,b]: any) => b - a)
                  .map(([modelo, cantidad]: any) => (
                    <div key={modelo} className="flex justify-between items-center">
                      <span className="text-sm">{modelo}</span>
                      <span className="font-semibold">{cantidad} unidades</span>
                    </div>
                  ))}
              </div>
            </Card>

            <Card title="🎨 Ventas por Color">
              <div className="space-y-2">
                {Object.entries(metricasVentas.ventasPorColor)
                  .sort(([,a]: any, [,b]: any) => b - a)
                  .map(([color, cantidad]: any) => (
                    <div key={color} className="flex justify-between items-center">
                      <span className="text-sm">{color}</span>
                      <span className="font-semibold">{cantidad} unidades</span>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          <Card title="👨‍💼 Performance por Vendedor">
            <div className="space-y-3">
              {Object.entries(metricasVentas.ventasPorVendedor)
                .sort(([,a]: any, [,b]: any) => b.ventas - a.ventas)
                .map(([vendedor, datos]: any) => (
                  <div key={vendedor} className="flex justify-between items-center p-3 border border-slate-700 rounded-lg">
                    <div>
                      <div className="font-semibold">{vendedor}</div>
                      <div className="text-xs text-slate-400">
                        {datos.unidades} unidades • Comisiones: {money(datos.comisiones)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">{money(datos.ventas)}</div>
                      <div className="text-xs text-slate-400">
                        Ticket: {money(datos.ventas / datos.unidades)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </>
      )}

      {/* REPORTE DE INVENTARIO - MEJORADO */}
      {tipoReporte === "inventario" && (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <Card title="📦 Total en Stock">
              <div className="text-2xl font-bold text-blue-400">
                {metricasInventario.totalProductos}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Productos disponibles
              </div>
            </Card>

            <Card title="💵 Capital Invertido">
              <div className="text-2xl font-bold text-amber-400">
                {money(metricasInventario.capitalInvertido)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                En compra y reparación
              </div>
            </Card>

            <Card title="💰 Valor de Venta Total">
              <div className="text-2xl font-bold text-emerald-400">
                {money(metricasInventario.valorVentaTotal)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Potencial de venta
              </div>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card title="📱 Stock por Modelo y Capacidad">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {Object.entries(metricasInventario.stockPorModeloGB)
                  .sort(([,a]: any, [,b]: any) => b - a)
                  .map(([modelo, cantidad]: any) => (
                    <div key={modelo} className="flex justify-between items-center">
                      <span className="text-sm">{modelo}</span>
                      <span className="font-semibold">{cantidad} unidades</span>
                    </div>
                  ))}
              </div>
            </Card>

            <Card title="📊 Rotación de Inventario">
              <div className="space-y-2">
                {metricasInventario.analisisABC.slice(0, 10).map((producto: any) => (
                  <div key={producto.id} className="flex justify-between items-center p-2 border border-slate-700 rounded">
                    <div>
                      <div className="text-sm font-medium">{producto.name}</div>
                      <div className="text-xs text-slate-400">
                        {producto.modelo} {producto.capacidad} • Rotación: {producto.rotacion}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      producto.categoria === 'A' ? 'bg-red-500' :
                      producto.categoria === 'B' ? 'bg-amber-500' : 'bg-green-500'
                    }`}>
                      {producto.categoria}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title="⚠️ Productos con Más de 30 Días en Stock">
            <div className="space-y-2">
              {metricasInventario.productosViejos.map((producto: any) => (
                <div key={producto.id} className="flex justify-between items-center p-2 border border-amber-700 rounded">
                  <div>
                    <div className="text-sm font-medium">{producto.name}</div>
                    <div className="text-xs text-slate-400">
                      {producto.modelo} {producto.capacidad} • {producto.grado} • {producto.ubicacion}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-semibold">{producto.diasEnStock} días</div>
                    <div className="text-xs text-slate-400">
                      Costo: {money(producto.precio_compra + producto.costo_reparacion)}
                    </div>
                  </div>
                </div>
              ))}
              {metricasInventario.productosViejos.length === 0 && (
                <div className="text-center text-slate-400 py-4">
                  ✅ No hay productos con más de 30 días en stock
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* 🔥 NUEVO: REPORTE DE TENDENCIAS */}
      {tipoReporte === "tendencias" && (
        <>
          <Card title="📊 Análisis de Tendencias Temporales">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Crecimiento Mensual</h4>
                <div className="space-y-2">
                  {metricasTendencias.crecimientoMensual.map((mes: any) => (
                    <div key={mes.mes} className="flex justify-between items-center p-2 border border-slate-700 rounded">
                      <span className="text-sm">{mes.mes}</span>
                      <div className="text-right">
                        <div className="font-semibold">{money(mes.ventas)}</div>
                        <div className={`text-xs ${mes.crecimiento >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {mes.crecimiento >= 0 ? '↗' : '↘'} {Math.abs(mes.crecimiento)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Días con Más Ventas</h4>
                <div className="space-y-2">
                  {metricasTendencias.diasConMasVentas.map(([dia, monto]: any) => (
                    <div key={dia} className="flex justify-between items-center p-2 border border-slate-700 rounded">
                      <span className="text-sm">{new Date(dia).toLocaleDateString('es-AR')}</span>
                      <span className="font-semibold text-emerald-400">{money(monto)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* 🔥 NUEVO: ANÁLISIS ABC */}
      {tipoReporte === "abc" && (
        <Card title="🔍 Análisis ABC - Clasificación de Inventario">
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <div className="text-2xl font-bold text-red-400">A</div>
                <div className="text-sm">80% del Valor</div>
                <div className="text-xs text-slate-400">Alta prioridad</div>
              </div>
              <div className="p-4 bg-amber-900/30 border border-amber-700 rounded-lg">
                <div className="text-2xl font-bold text-amber-400">B</div>
                <div className="text-sm">15% del Valor</div>
                <div className="text-xs text-slate-400">Media prioridad</div>
              </div>
              <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                <div className="text-2xl font-bold text-green-400">C</div>
                <div className="text-sm">5% del Valor</div>
                <div className="text-xs text-slate-400">Baja prioridad</div>
              </div>
            </div>

            <div className="space-y-2">
              {metricasInventario.analisisABC.map((producto: any) => (
                <div key={producto.id} className={`flex justify-between items-center p-3 border rounded-lg ${
                  producto.categoria === 'A' ? 'border-red-500 bg-red-900/20' :
                  producto.categoria === 'B' ? 'border-amber-500 bg-amber-900/20' :
                  'border-green-500 bg-green-900/20'
                }`}>
                  <div className="flex-1">
                    <div className="font-semibold">{producto.name}</div>
                    <div className="text-xs text-slate-400">
                      {producto.modelo} {producto.capacidad} • Valor: {money(producto.valorInventario)} • Rotación: {producto.rotacion}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      producto.categoria === 'A' ? 'text-red-400' :
                      producto.categoria === 'B' ? 'text-amber-400' : 'text-green-400'
                    }`}>
                      {producto.categoria}
                    </div>
                    <div className="text-xs text-slate-400">
                      Ranking: #{producto.ranking}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* REPORTE DE RENTABILIDAD */}
      {tipoReporte === "rentabilidad" && (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <Card title="💰 Margen de Ganancia Promedio">
              <div className="text-2xl font-bold text-emerald-400">
                {metricasRentabilidad.margenGananciaPromedio.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Sobre ventas totales
              </div>
            </Card>

            <Card title="📈 ROI del Inventario">
              <div className="text-2xl font-bold text-green-400">
                {metricasRentabilidad.roiInventario.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Retorno sobre inversión
              </div>
            </Card>

            <Card title="💵 Ganancia Total">
              <div className="text-2xl font-bold text-blue-400">
                {money(metricasVentas.gananciaTotal)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Ganancia neta del período
              </div>
            </Card>
          </div>

          <Card title="📊 Rentabilidad por Modelo y Capacidad">
            <div className="space-y-3">
              {Object.entries(metricasRentabilidad.rentabilidadPorModeloGB)
                .sort(([,a]: any, [,b]: any) => b.ganancia - a.ganancia)
                .slice(0, 10)
                .map(([modelo, datos]: any) => {
                  const margen = (datos.ganancia / datos.ventas) * 100;
                  return (
                    <div key={modelo} className="flex justify-between items-center p-3 border border-slate-700 rounded-lg">
                      <div>
                        <div className="font-semibold">{modelo}</div>
                        <div className="text-xs text-slate-400">
                          {datos.unidades} unidades • Ventas: {money(datos.ventas)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-400">{money(datos.ganancia)}</div>
                        <div className={`text-xs ${margen >= 20 ? 'text-green-400' : margen >= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                          Margen: {margen.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </>
      )}

      {/* 👇👇👇 LISTADO DE FACTURAS - AGREGAR ESTA CARD */}
      <Card title="📋 Listado de Facturas">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Fecha y Hora</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Vendedor</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Efectivo</th>
                <th className="py-2 pr-3">Transf.</th>
                <th className="py-2 pr-3">Vuelto</th>
                <th className="py-2 pr-3">Alias/CVU</th>
                <th className="py-2 pr-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {docsEnRango
                .slice()
                .sort((a: any, b: any) => new Date(b.date_iso).getTime() - new Date(a.date_iso).getTime())
                .map((f: any) => {
                  const cash = parseNum(f?.payments?.cash);
                  const tr = parseNum(f?.payments?.transfer);
                  const ch = parseNum(f?.payments?.change);
                  const alias = (f?.payments?.alias || "").trim() || "—";

                  return (
                    <tr key={f.id}>
                      <td className="py-2 pr-3">{pad(f.number || 0)}</td>
                      <td className="py-2 pr-3">{new Date(f.date_iso).toLocaleString("es-AR")}</td>
                      <td className="py-2 pr-3">{f.client_name}</td>
                      <td className="py-2 pr-3">{f.vendor_name}</td>
                      <td className="py-2 pr-3">{money(parseNum(f.total))}</td>
                      <td className="py-2 pr-3">{money(cash)}</td>
                      <td className="py-2 pr-3">{money(tr)}</td>
                      <td className="py-2 pr-3">{money(ch)}</td>
                      <td className="py-2 pr-3 truncate max-w-[180px]">{alias}</td>
                      <td className="py-2 pr-3">
                        <Chip tone={f.status === "Pagada" ? "emerald" : "slate"}>
                          {f.status || "—"}
                        </Chip>
                      </td>
                    </tr>
                  );
                })}
              {docsEnRango.length === 0 && (
                <tr>
                  <td className="py-3 text-slate-400" colSpan={10}>
                    Sin facturas en el período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 👇👇👇 LISTADO DE DEVOLUCIONES - AGREGAR ESTA CARD */}
      <Card title="🔄 Listado de Devoluciones">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2 pr-3">Fecha y Hora</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Método</th>
                <th className="py-2 pr-3">Efectivo</th>
                <th className="py-2 pr-3">Transf.</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {devolucionesPeriodo
                .slice()
                .sort((a: any, b: any) => new Date(b.date_iso).getTime() - new Date(a.date_iso).getTime())
                .map((d: any) => (
                  <tr key={d.id}>
                    <td className="py-2 pr-3">{new Date(d.date_iso).toLocaleString("es-AR")}</td>
                    <td className="py-2 pr-3">{d.client_name}</td>
                    <td className="py-2 pr-3 capitalize">{d.metodo}</td>
                    <td className="py-2 pr-3">{money(parseNum(d.efectivo))}</td>
                    <td className="py-2 pr-3">{money(parseNum(d.transferencia))}</td>
                    <td className="py-2 pr-3">{money(parseNum(d.total))}</td>
                    <td className="py-2 pr-3">
                      {(d.items || []).map((it: any, i: number) => (
                        <div key={i} className="text-xs">
                          {it.name} — dev.: {parseNum(it.qtyDevuelta)} × {money(parseNum(it.unitPrice))}
                        </div>
                      ))}
                      {d.metodo === "intercambio_otro" && (
                        <div className="text-xs text-slate-400 mt-1">
                          Dif. abonada: ef. {money(parseNum(d.extra_pago_efectivo || 0))} · tr. {money(parseNum(d.extra_pago_transferencia || 0))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              {devolucionesPeriodo.length === 0 && (
                <tr>
                  <td className="py-3 text-slate-400" colSpan={7}>
                    Sin devoluciones en el período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 👇👇👇 LISTADO DE DEUDORES - AGREGAR ESTA CARD */}
      <Card title="👥 Listado de Deudores Activos">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">N°</th>
                <th className="py-2 pr-3">Deuda Total</th>
                <th className="py-2 pr-3">Saldo a Favor</th>
                <th className="py-2 pr-3">Facturas Pend.</th>
                <th className="py-2 pr-3">Deuda Neta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {state.clients
                .filter((c: any) => {
                  const detalleDeudas = calcularDetalleDeudas(state, c.id);
                  const deudaNeta = calcularDeudaTotal(detalleDeudas, c);
                  return deudaNeta > 0.01;
                })
                .sort((a: any, b: any) => {
                  const deudaA = calcularDeudaTotal(calcularDetalleDeudas(state, a.id), a);
                  const deudaB = calcularDeudaTotal(calcularDetalleDeudas(state, b.id), b);
                  return deudaB - deudaA;
                })
                .map((c: any) => {
                  const detalleDeudas = calcularDetalleDeudas(state, c.id);
                  const deudaNeta = calcularDeudaTotal(detalleDeudas, c);
                  
                  return (
                    <tr key={c.id}>
                      <td className="py-2 pr-3">{c.name}</td>
                      <td className="py-2 pr-3">{c.number}</td>
                      <td className="py-2 pr-3">
                        <span className="text-amber-400">
                          {money(parseNum(c.debt))}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="text-emerald-400">
                          {money(parseNum(c.saldo_favor || 0))}
                        </span>
                      </td>
                      <td className="py-2 pr-3">{detalleDeudas.length}</td>
                      <td className="py-2 pr-3">
                        <span className="text-red-400 font-semibold">
                          {money(deudaNeta)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              {state.clients.filter((c: any) => {
                const detalleDeudas = calcularDetalleDeudas(state, c.id);
                const deudaNeta = calcularDeudaTotal(detalleDeudas, c);
                return deudaNeta > 0.01;
              }).length === 0 && (
                <tr>
                  <td className="py-3 text-slate-400" colSpan={6}>
                    No hay deudores activos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 👇👇👇 PAGO DE DEUDORES - AGREGAR ESTA CARD */}
      <Card title="💳 Listado de Pagos de Deudores">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2 pr-3">Fecha y Hora</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Monto Pagado</th>
                <th className="py-2 pr-3">Deuda Antes</th>
                <th className="py-2 pr-3">Deuda Después</th>
                <th className="py-2 pr-3">Método</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {pagosDeudores
                .sort((a: any, b: any) => new Date(b.date_iso).getTime() - new Date(a.date_iso).getTime())
                .map((pago: any) => {
                  const efectivo = parseNum(pago?.cash_amount || pago?.payments?.cash || 0);
                  const transferencia = parseNum(pago?.transfer_amount || pago?.payments?.transfer || 0);
                  const montoTotal = efectivo + transferencia;
                  const metodo = efectivo > 0 && transferencia > 0 
                    ? "Mixto" 
                    : efectivo > 0 
                      ? "Efectivo" 
                      : "Transferencia";

                  return (
                    <tr key={pago.id}>
                      <td className="py-2 pr-3">
                        {new Date(pago.date_iso).toLocaleString("es-AR")}
                      </td>
                      <td className="py-2 pr-3">{pago.client_name}</td>
                      <td className="py-2 pr-3">
                        <span className="font-medium text-emerald-400">
                          {money(montoTotal)}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="text-amber-400">
                          {money(parseNum(pago.debt_before))}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className={parseNum(pago.debt_after) > 0 ? "text-amber-400" : "text-emerald-400"}>
                          {money(parseNum(pago.debt_after))}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <Chip tone={metodo === "Efectivo" ? "emerald" : "slate"}>
                          {metodo}
                        </Chip>
                      </td>
                    </tr>
                  );
                })}
              {pagosDeudores.length === 0 && (
                <tr>
                  <td className="py-3 text-slate-400" colSpan={6}>
                    No hay pagos registrados en el período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 👇👇👇 GASTOS Y DEVOLUCIONES - AGREGAR ESTA CARD */}
      <Card title="📊 Resumen de Gastos y Devoluciones">
        <div className="grid md:grid-cols-2 gap-4">
          {/* GASTOS */}
          <div>
            <h4 className="font-semibold mb-2">💰 Gastos del Período</h4>
            <div className="space-y-2 text-sm">
              <div>Total gastos: <b>{money(totalGastos)}</b></div>
              <div>- En efectivo: {money(totalGastosEfectivo)}</div>
              <div>- En transferencia: {money(totalGastosTransferencia)}</div>
              
              {transferenciasPorAlias.length > 0 && (
                <>
                  <div className="mt-2 font-semibold">Transferencias por alias:</div>
                  <ul className="list-disc pl-5">
                    {transferenciasPorAlias.map((t) => (
                      <li key={t.alias}>{t.alias}: {money(t.total)}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* DEVOLUCIONES */}
          <div>
            <h4 className="font-semibold mb-2">🔄 Devoluciones del Período</h4>
            <div className="space-y-2 text-sm">
              <div>Cantidad: <b>{devolucionesPeriodo.length}</b></div>
              <div>- En efectivo: {money(devolucionesMontoEfectivo)}</div>
              <div>- En transferencia: {money(devolucionesMontoTransfer)}</div>
              <div>- Monto total: <b>{money(devolucionesMontoTotal)}</b></div>
            </div>
          </div>
        </div>
      </Card>

      {/* 👇👇👇 TRANSFERENCIA POR ALIAS - AGREGAR ESTA CARD */}
      <Card title="🏦 Transferencias por Alias (Ventas + Deudores)">
        {porAlias.length === 0 ? (
          <div className="text-sm text-slate-400">Sin transferencias en el período.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {porAlias.map((a: any) => (
              <div key={a.alias} className="rounded-xl border border-slate-800 p-3 flex items-center justify-between">
                <div className="text-sm font-medium truncate max-w-[60%]">{a.alias}</div>
                <div className="text-sm font-semibold text-emerald-400">{money(a.total as number)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
     

/* Presupuestos */
function PresupuestosTab({ state, setState, session, showError, showSuccess, showInfo }: any) {  const [clientId, setClientId] = useState(state.clients[0]?.id || "");
  const [vendorId, setVendorId] = useState(session.role === "admin" ? state.vendors[0]?.id : session.id);
  const [priceList, setPriceList] = useState("1");
  const [sectionFilter, setSectionFilter] = useState("Todas"); // 👈 NUEVO
  const [listFilter, setListFilter] = useState("Todas"); // 👈 NUEVO
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const client = state.clients.find((c: any) => c.id === clientId);
  const vendor = state.vendors.find((v: any) => v.id === vendorId);
  
  // 👇👇👇 AGREGAR ESTAS LÍNEAS PARA LOS FILTROS
  const sections = ["Todas", ...Array.from(new Set(state.products.map((p: any) => p.section || "Otros")))];
  const lists = ["Todas", ...Array.from(new Set(state.products.map((p: any) => p.list_label || "General")))];
  
  // 👇👇👇 MODIFICAR ESTA LÍNEA PARA INCLUIR LOS NUEVOS FILTROS
  const filteredProducts = state.products.filter((p: any) => {
    const okS = sectionFilter === "Todas" || p.section === sectionFilter;
    const okL = listFilter === "Todas" || p.list_label === listFilter;
    const okQ = !query || p.name.toLowerCase().includes(query.toLowerCase());
    return okS && okL && okQ;
  });
  
  // 👇👇👇 AGREGAR ESTA LÍNEA PARA AGRUPAR POR SECCIÓN
  const grouped = groupBy(filteredProducts, "section");

  function addItem(p: any) {
    const existing = items.find((it: any) => it.productId === p.id);
    const unit = priceList === "1" ? p.price1 : p.price2;
    if (existing) setItems(items.map((it) => (it.productId === p.id ? { ...it, qty: parseNum(it.qty) + 1 } : it)));
    else setItems([...items, { productId: p.id, name: p.name, section: p.section, qty: 1, unitPrice: unit, cost: p.cost }]);
  }
  
  // ... el resto de tus funciones permanecen EXACTAMENTE igual ...
  async function guardarPresupuesto() {
    if (!client || !vendor || items.length === 0) return;
    const st = clone(state);
    const number = st.meta.budgetCounter++;
    const id = "pr_" + number;
    const total = calcInvoiceTotal(items);
    const b = {
      id,
      number,
      date_iso: todayISO(),
      client_id: client.id,
      client_name: client.name,
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      items: clone(items),
      total,
      status: "Pendiente",
    };
    st.budgets.push(b);
    setState(st);
    if (hasSupabase) {
      await supabase.from("budgets").insert(b);
      await saveCountersSupabase(st.meta);
    }
    alert("Presupuesto guardado.");
    setItems([]);
  }

async function convertirAFactura(b: any) {
    // ✅ VALIDAR STOCK ANTES DE CONVERTIR
  const validacionStock = validarStockDisponible(state.products, b.items);
  if (!validacionStock.valido) {
    const mensajeError = `No hay suficiente stock para convertir el presupuesto:\n\n${validacionStock.productosSinStock.join('\n')}`;
    return alert(mensajeError);
  }
  
  const efectivoStr = prompt("¿Cuánto paga en EFECTIVO?", "0") ?? "0";
  const transferenciaStr = prompt("¿Cuánto paga por TRANSFERENCIA?", "0") ?? "0";
  const aliasStr = prompt("Alias/CVU destino de la transferencia (opcional):", "") ?? "";

  const efectivo = parseNum(efectivoStr);
  const transferencia = parseNum(transferenciaStr);
  const alias = aliasStr.trim();

  const st = clone(state);
  const number = st.meta.invoiceCounter++;
  const id = "inv_" + number;

  // ⭐⭐⭐⭐ DESCONTAR STOCK AL CONVERTIR PRESUPUESTO ⭐⭐⭐⭐⭐
  b.items.forEach((item: any) => {
    const product = st.products.find((p: any) => p.id === item.productId);
    if (product) {
      product.stock = Math.max(0, parseNum(product.stock) - parseNum(item.qty));
    }
  });

  const invoice = {
    id,
    number,
    date_iso: todayISO(),
    client_id: b.client_id,
    client_name: b.client_name,
    vendor_id: b.vendor_id,
    vendor_name: b.vendor_name,
    items: clone(b.items),
    total: b.total,
    cost: calcInvoiceCost(b.items),
    payments: { cash: efectivo, transfer: transferencia, alias },
    status: (efectivo + transferencia) >= b.total ? "Pagada" : "No Pagada",
    type: "Factura",
  };

  st.invoices.push(invoice);
  const budget = st.budgets.find((x: any) => x.id === b.id)!;
  budget.status = "Convertido";
  setState(st);

  if (hasSupabase) {
    await supabase.from("invoices").insert(invoice);
    await supabase.from("budgets").update({ status: "Convertido" }).eq("id", b.id);
    
    // ⭐⭐⭐⭐ ACTUALIZAR STOCK EN SUPABASE ⭐⭐⭐⭐⭐
    for (const item of b.items) {
      const product = st.products.find((p: any) => p.id === item.productId);
      if (product) {
        await supabase.from("products")
          .update({ stock: product.stock })
          .eq("id", item.productId);
      }
    }
    
    await saveCountersSupabase(st.meta);
  }

  window.dispatchEvent(new CustomEvent("print-invoice", { detail: invoice } as any));
  await nextPaint();
  window.print();
}

  const total = calcInvoiceTotal(items);
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <Card title="Nuevo presupuesto">
        <div className="grid md:grid-cols-4 gap-3">
          <Select label="Cliente" value={clientId} onChange={setClientId} options={state.clients.map((c: any) => ({ value: c.id, label: `${c.number} — ${c.name}` }))} />
          <Select label="Vendedor" value={vendorId} onChange={setVendorId} options={state.vendors.map((v: any) => ({ value: v.id, label: v.name }))} />
          <Select label="Lista de precios" value={priceList} onChange={setPriceList} options={[{ value: "1", label: "Mitobicel" }, { value: "2", label: "ElshoppingDlc" }]} />
          <Input label="Buscar producto" value={query} onChange={setQuery} placeholder="Nombre..." />
        </div>
        
        {/* 👇👇👇 AGREGAR ESTOS NUEVOS FILTROS */}
        <div className="grid md:grid-cols-4 gap-2 mt-3">
          <Select 
            label="Sección" 
            value={sectionFilter} 
            onChange={setSectionFilter} 
            options={sections.map((s: any) => ({ value: s, label: s }))} 
          />
          <Select 
            label="Lista" 
            value={listFilter} 
            onChange={setListFilter} 
            options={lists.map((s: any) => ({ value: s, label: s }))} 
          />
          <div className="md:col-span-2 pt-6">
            <Chip tone="emerald">Total productos: {filteredProducts.length}</Chip>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-3">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Productos</div>
            
            {/* 👇👇👇 MODIFICAR LA LISTA DE PRODUCTOS PARA MOSTRAR POR SECCIÓN */}
            <div className="space-y-3">
              {Object.entries(grouped).map(([sec, arr]: any) => (
                <div key={sec} className="border border-slate-800 rounded-xl">
                  <div className="px-3 py-2 text-xs font-semibold bg-slate-800/70">{sec}</div>
                  <div className="divide-y divide-slate-800">
                    {arr.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          <div className="text-xs text-slate-400">
                            L1: {money(p.price1)} L2: {money(p.price2)} 
                            <span className="text-[10px] text-slate-500 ml-1">{p.list_label}</span>
                          </div>
                        </div>
                        <Button tone="slate" onClick={() => addItem(p)}>
                          Añadir
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 👆👆👆 HASTA AQUÍ LOS CAMBIOS EN LA LISTA DE PRODUCTOS */}
          
          <div className="space-y-2">
            <div className="text-sm font-semibold">Ítems</div>
            <div className="rounded-xl border border-slate-800 divide-y divide-slate-800">
              {items.length === 0 && <div className="p-3 text-sm text-slate-400">Vacío</div>}
         {items.map((it: any, idx: number) => (
  <div key={idx} className="p-3 grid grid-cols-12 gap-2 items-center">
    <div className="col-span-6">
      <div className="text-sm font-medium">{it.name}</div>
      <div className="text-xs text-slate-400">{it.section}</div>
    </div>
    <div className="col-span-2">
      <NumberInput
        label="Cant."
        value={it.qty}
        onChange={(v: any) => {
          const q = Math.max(0, parseNum(v));
          setItems(items.map((x: any, i: number) => (i === idx ? { ...x, qty: q } : x)));
        }}
      />
    </div>
    <div className="col-span-3">
      <NumberInput
        label="Precio"
        value={it.unitPrice}
        onChange={(v: any) => {
          const q = Math.max(0, parseNum(v));
          setItems(items.map((x: any, i: number) => (i === idx ? { ...x, unitPrice: q } : x)));
        }}
      />
    </div>
    <div className="col-span-1 flex items-end justify-end pb-0.5">
      <button
        onClick={() => setItems(items.filter((_: any, i: number) => i !== idx))}
        className="text-xs text-red-400 hover:text-red-300"
      >
        ✕
      </button>
    </div>
    <div className="col-span-12 text-right text-xs text-slate-300 pt-1">
      Subtotal ítem: {money(parseNum(it.qty) * parseNum(it.unitPrice))}
    </div>
  </div>
))}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">Total</div>
              <div className="text-lg font-bold">{money(total)}</div>
            </div>
            <div className="flex justify-end">
              <Button onClick={guardarPresupuesto}>Guardar presupuesto</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* EL RESTO DE TU CÓDIGO PERMANECE EXACTAMENTE IGUAL */}
      <Card 
        title="Presupuestos guardados"
        actions={
          <Button tone="slate" onClick={async () => {
            const refreshedState = await loadFromSupabase(seedState());
            setState(refreshedState);
            alert("Presupuestos actualizados");
          }}>
            Actualizar
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2 pr-4">N°</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Cliente</th>
                <th className="py-2 pr-4">Vendedor</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {state.budgets
                .slice()
                .reverse()
                .map((b: any) => (
                  <tr key={b.id}>
                    <td className="py-2 pr-4">{pad(b.number)}</td>
                    <td className="py-2 pr-4">{new Date(b.date_iso).toLocaleString("es-AR")}</td>
                    <td className="py-2 pr-4">{b.client_name}</td>
                    <td className="py-2 pr-4">{b.vendor_name}</td>
                    <td className="py-2 pr-4">{money(b.total)}</td>
                    <td className="py-2 pr-4 flex gap-2 items-center">
  {/* Botón Editar */}
  <button
    title="Editar"
    onClick={() => {
      setClientId(b.client_id);
      setVendorId(b.vendor_id);
      setItems(clone(b.items));
      alert(`Editando presupuesto Nº ${pad(b.number)}`);
    }}
    className="text-blue-400 hover:text-blue-300 text-lg"
  >
    ✏️
  </button>

  {/* Botón Descargar PDF */}
  <button
    title="Descargar PDF"
    onClick={() => {
      const data = { ...b, type: "Presupuesto" };
      window.dispatchEvent(new CustomEvent("print-invoice", { detail: data } as any));
      setTimeout(() => window.print(), 0);
    }}
    className="text-red-400 hover:text-red-300 text-lg"
  >
    📄
  </button>

  {/* Botón Convertir o estado convertido */}
  {b.status === "Pendiente" ? (
    <Button onClick={() => convertirAFactura(b)} tone="emerald">
      Convertir a factura
    </Button>
  ) : (
    <span className="text-xs">Convertido</span>
  )}
{/* Botón Eliminar */}
<button
  title="Eliminar presupuesto"
  onClick={async () => {
    if (!confirm(`¿Seguro que deseas eliminar el presupuesto Nº ${pad(b.number)}?`)) return;
    
    const st = clone(state);
    st.budgets = st.budgets.filter((x: any) => x.id !== b.id);
    setState(st);
    
    if (hasSupabase) {
      const { error } = await supabase.from("budgets").delete().eq("id", b.id);
      if (error) {
        console.error("Error eliminando presupuesto:", error);
        alert("Error al eliminar el presupuesto de la base de datos.");
        // Recargar datos si hay error
        const refreshedState = await loadFromSupabase(seedState());
        setState(refreshedState);
        return;
      }
    }
    alert(`Presupuesto Nº ${pad(b.number)} eliminado correctamente.`);
  }}
  className="text-red-500 hover:text-red-400 text-lg ml-2"
>
  🗑️
</button>
</td>


                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}



// En GastosDevolucionesTab, reemplaza el useEffect completo por este:

/* Gastos y Devoluciones */
function GastosDevolucionesTab({ state, setState, session, showError, showSuccess, showInfo }: any) {  const [productoNuevoId, setProductoNuevoId] = useState(""); // Producto elegido para entregar
  const [cantidadNuevo, setCantidadNuevo] = useState("");     // Cantidad a entregar
  const [modo, setModo] = useState("Gasto"); // "Gasto" o "Devolución"
  const [tipoGasto, setTipoGasto] = useState("Proveedor");
  const [detalle, setDetalle] = useState("");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [alias, setAlias] = useState("");


  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [productosDevueltos, setProductosDevueltos] = useState<any[]>([]);
  const [facturasCliente, setFacturasCliente] = useState<any[]>([]);
  const [metodoDevolucion, setMetodoDevolucion] = useState("efectivo");

  // Cargar facturas cuando se selecciona un cliente
  useEffect(() => {
    if (!clienteSeleccionado) {
      setFacturasCliente([]);
      return;
    }

    // Filtrar facturas del cliente desde el estado local
    const facturasDelCliente = (state.invoices || [])
      .filter((f: any) => 
        f.client_id === clienteSeleccionado && 
        f.type === "Factura" &&
        f.items && 
        Array.isArray(f.items) && 
        f.items.length > 0
      )
      .sort((a: any, b: any) => new Date(b.date_iso).getTime() - new Date(a.date_iso).getTime());

    setFacturasCliente(facturasDelCliente);
    
    // Debug: mostrar información
    console.log("Cliente seleccionado:", clienteSeleccionado);
    console.log("Facturas encontradas:", facturasDelCliente.length);
    console.log("Facturas:", facturasDelCliente);

  }, [clienteSeleccionado, state.invoices, state.meta?.lastSavedInvoiceId, state.gastos?.length]);

  // Función para agregar producto a devolver
  const agregarProductoADevolver = (item: any, factura: any, cantidad: number) => {
    if (cantidad <= 0 || cantidad > item.qty) {
      alert("Cantidad inválida");
      return;
    }

    const productoExistente = productosDevueltos.find(
      (p) => p.productId === item.productId && p.facturaId === factura.id
    );

    if (productoExistente) {
      // Actualizar cantidad si ya existe
      setProductosDevueltos(prev =>
        prev.map(p =>
          p.productId === item.productId && p.facturaId === factura.id
            ? { ...p, qtyDevuelta: cantidad }
            : p
        )
      );
    } else {
      // Agregar nuevo producto a devolver
      setProductosDevueltos(prev => [
        ...prev,
        {
          ...item,
          facturaId: factura.id,
          facturaNumero: factura.number,
          qtyDevuelta: cantidad,
          qtyOriginal: item.qty
        }
      ]);
    }
  };

  // Función para quitar producto de la devolución
  const quitarProductoDevolucion = (productId: string, facturaId: string) => {
    setProductosDevueltos(prev =>
      prev.filter(p => !(p.productId === productId && p.facturaId === facturaId))
    );
  };

  // ==============================
  // Funciones para guardar Gasto y Devolución
  // ==============================
  async function guardarGasto() {
    if (!detalle.trim()) {
showError("El campo 'Detalle' es obligatorio.");
      return;
    }

    const efectivoFinal = montoEfectivo.trim() === "" ? 0 : parseNum(montoEfectivo);
    const transferenciaFinal = montoTransferencia.trim() === "" ? 0 : parseNum(montoTransferencia);

    if (efectivoFinal === 0 && transferenciaFinal === 0) {
showError("Debes ingresar al menos un monto en efectivo o transferencia.");
      return;
    }

    const gasto = {
      id: "g" + Math.random().toString(36).slice(2, 8),
      tipo: tipoGasto,
      detalle,
      efectivo: efectivoFinal,
      transferencia: transferenciaFinal,
      alias,
      date_iso: todayISO(),
    };

    const st = clone(state);
    st.gastos = st.gastos || [];
    st.gastos.push(gasto);
    setState(st);

    if (hasSupabase) await supabase.from("gastos").insert(gasto);

showSuccess("Gasto guardado correctamente.");
    setDetalle("");
    setMontoEfectivo("");
    setMontoTransferencia("");
    setAlias("");
  }

  async function guardarDevolucion() {
  if (!clienteSeleccionado) {
showError("Selecciona un cliente antes de guardar la devolución.");
    return;
  }

  if (productosDevueltos.length === 0) {
showError("Debes seleccionar al menos un producto para devolver.");
    return;
  }

  // Intercambio por otro producto - validación
  if (metodoDevolucion === "intercambio_otro") {
    if (!productoNuevoId || parseNum(cantidadNuevo) <= 0) {
showError("Debes seleccionar un producto nuevo y la cantidad.");
      return;
    }
  }

  const clientName = state.clients.find((c: any) => c.id === clienteSeleccionado)?.name || "Cliente desconocido";

  // Total calculado según cantidades devueltas
  const totalDevolucion = productosDevueltos.reduce(
    (s, it) => s + parseNum(it.qtyDevuelta) * parseNum(it.unitPrice),
    0
  );

  const devolucion = {
    id: "d" + Math.random().toString(36).slice(2, 8),
    client_id: clienteSeleccionado,
    client_name: clientName,
    items: productosDevueltos,
    metodo: metodoDevolucion,
    efectivo: metodoDevolucion === "efectivo" ? parseNum(montoEfectivo) : 0,
    transferencia: metodoDevolucion === "transferencia" ? parseNum(montoTransferencia) : 0,
    extra_pago_efectivo: metodoDevolucion === "intercambio_otro" ? parseNum(montoEfectivo) : 0,
    extra_pago_transferencia: metodoDevolucion === "intercambio_otro" ? parseNum(montoTransferencia) : 0,
    extra_pago_total: (metodoDevolucion === "intercambio_otro" ? parseNum(montoEfectivo) + parseNum(montoTransferencia) : 0),
    total: totalDevolucion,
    date_iso: todayISO(),
  };

  const st = clone(state);
  st.devoluciones.push(devolucion);

  // OBTENER EL CLIENTE
  const cli = st.clients.find((c: any) => c.id === clienteSeleccionado);
  
  if (!cli) {
    alert("Error: Cliente no encontrado.");
    return;
  }

  // ===== NUEVA LÓGICA: APLICAR SALDO A FAVOR A LA DEUDA =====
  if (metodoDevolucion === "saldo") {
    // 1) Acreditar saldo a favor
    cli.saldo_favor = parseNum(cli.saldo_favor) + parseNum(totalDevolucion);
    
    // 2) Aplicar saldo a favor a la deuda (si hay deuda)
    const saldoAFavor = cli.saldo_favor;
    const deudaActual = parseNum(cli.debt);
    
    if (deudaActual > 0 && saldoAFavor > 0) {
      const montoAAplicar = Math.min(saldoAFavor, deudaActual);
      
      // Reducir tanto la deuda como el saldo a favor
      cli.debt = Math.max(0, deudaActual - montoAAplicar);
      cli.saldo_favor = Math.max(0, saldoAFavor - montoAAplicar);
      
      console.log(`✅ Aplicado $${montoAAplicar} de saldo a favor a la deuda. Deuda restante: $${cli.debt}, Saldo a favor restante: $${cli.saldo_favor}`);
    }
  }

  // Stock: entra lo devuelto
  productosDevueltos.forEach((it) => {
    const prod = st.products.find((p: any) => p.id === it.productId);
    if (prod) prod.stock = parseNum(prod.stock) + parseNum(it.qtyDevuelta);
  });

  // Stock: sale lo entregado en intercambio_otro
  if (metodoDevolucion === "intercambio_otro" && productoNuevoId) {
    const nuevo = st.products.find((p: any) => p.id === productoNuevoId);
    if (nuevo) nuevo.stock = parseNum(nuevo.stock) - parseNum(cantidadNuevo);
  }

  // Actualizar las facturas originales
  productosDevueltos.forEach((productoDevuelto) => {
    const factura = st.invoices.find((f: any) => f.id === productoDevuelto.facturaId);
    if (factura) {
      const itemFactura = factura.items.find((item: any) => item.productId === productoDevuelto.productId);
      if (itemFactura) {
        // Restar la cantidad devuelta de la factura original
        itemFactura.qty = Math.max(0, parseNum(itemFactura.qty) - parseNum(productoDevuelto.qtyDevuelta));
        
        // Recalcular el total de la factura
        factura.total = calcInvoiceTotal(factura.items);
        factura.cost = calcInvoiceCost(factura.items);
        
        // Si la cantidad queda en 0, eliminar el item de la factura
        if (itemFactura.qty <= 0) {
          factura.items = factura.items.filter((item: any) => item.productId !== productoDevuelto.productId);
        }
      }
    }
  });

  setState(st);

  // Persistencia
  if (hasSupabase) {
    await supabase.from("devoluciones").insert(devolucion);

    // Actualizar cliente (deuda y saldo_favor)
    await supabase.from("clients")
      .update({ 
        debt: cli.debt,
        saldo_favor: cli.saldo_favor
      })
      .eq("id", clienteSeleccionado);

    // Persistir stocks tocados
    for (const it of productosDevueltos) {
      const nuevoStock = st.products.find((p: any) => p.id === it.productId)?.stock;
      await supabase.from("products").update({ stock: nuevoStock }).eq("id", it.productId);
    }
    
    if (metodoDevolucion === "intercambio_otro" && productoNuevoId) {
      const stockNuevo = st.products.find((p: any) => p.id === productoNuevoId)?.stock;
      await supabase.from("products").update({ stock: stockNuevo }).eq("id", productoNuevoId);
    }

    // Actualizar facturas en Supabase
    for (const productoDevuelto of productosDevueltos) {
      const factura = st.invoices.find((f: any) => f.id === productoDevuelto.facturaId);
      if (factura) {
        await supabase.from("invoices")
          .update({ 
            items: factura.items,
            total: factura.total,
            cost: factura.cost
          })
          .eq("id", factura.id);
      }
    }
  }

  // Imprimir comprobante de devolución
  window.dispatchEvent(new CustomEvent("print-devolucion", { detail: devolucion } as any));
  await nextPaint();
  window.print();

  // Mensaje informativo sobre la aplicación del saldo a la deuda
  if (metodoDevolucion === "saldo") {
    const mensaje = `Devolución registrada con éxito. 
    
Saldo a favor acreditado: $${totalDevolucion}
${cli.debt > 0 ? `Se aplicó saldo a favor a la deuda existente. Deuda actual: $${cli.debt}` : 'La deuda ha sido completamente saldada con el saldo a favor.'}`;
    
    alert(mensaje);
  } else {
    alert("Devolución registrada con éxito.");
  }

  // Limpiar formulario
  setProductosDevueltos([]);
  setClienteSeleccionado("");
  setMontoEfectivo("");
  setMontoTransferencia("");
  setMetodoDevolucion("efectivo");
  setProductoNuevoId("");
  setCantidadNuevo("");
}
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <Card 
        title="Gastos y Devoluciones"
        actions={
          <Button tone="slate" onClick={async () => {
            const refreshedState = await loadFromSupabase(seedState());
            setState(refreshedState);
            alert("Datos actualizados");
          }}>
            Actualizar datos
          </Button>
        }
      >
        <div className="grid md:grid-cols-2 gap-3">
          <Select
            label="Modo"
            value={modo}
            onChange={setModo}
            options={[
              { value: "Gasto", label: "Registrar Gasto" },
              { value: "Devolución", label: "Registrar Devolución" },
            ]}
          />
        </div>
      </Card>

      {modo === "Gasto" && (
        <Card title="Registrar Gasto">
          <div className="grid md:grid-cols-2 gap-3">
            <Select
              label="Tipo de gasto"
              value={tipoGasto}
              onChange={setTipoGasto}
              options={[
                { value: "Proveedor", label: "Proveedor" },
                { value: "Otro", label: "Otro" },
              ]}
            />
            <Input
              label="Detalle"
              value={detalle}
              onChange={setDetalle}
              placeholder="Ej: Coca-Cola, Luz, Transporte..."
            />
            <Select
  label="Tipo de gasto"
  value={tipoGasto}
  onChange={setTipoGasto}
  options={[
    { value: "Proveedor", label: "Proveedor" },
    { value: "Gabi", label: "Gabi" }, // 👈 NUEVA OPCIÓN
    { value: "Otro", label: "Otro" },
  ]}
/>
            <NumberInput
              label="Monto en efectivo"
              value={montoEfectivo}
              onChange={setMontoEfectivo}
              placeholder="0"
            />
            <NumberInput
              label="Monto en transferencia"
              value={montoTransferencia}
              onChange={setMontoTransferencia}
              placeholder="0"
            />
            <Input
              label="Alias / CVU (opcional)"
              value={alias}
              onChange={setAlias}
              placeholder="alias.cuenta.banco"
            />
            <div className="pt-6">
              <Button onClick={guardarGasto}>Guardar gasto</Button>
            </div>
          </div>
        </Card>
      )}

      {modo === "Devolución" && (
        <Card title="Registrar Devolución">
          {/* Selección de cliente */}
          <div className="grid md:grid-cols-2 gap-3">
            <Select
              label="Cliente"
              value={clienteSeleccionado}
              onChange={setClienteSeleccionado}
              options={[
                { value: "", label: "— Seleccionar cliente —" },
                ...state.clients.map((c: any) => ({
                  value: c.id,
                  label: `${c.number} - ${c.name}`,
                }))
              ]}
            />
          </div>

          {/* Listado de productos de facturas */}
          {clienteSeleccionado && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Facturas del cliente</h4>
              
              {facturasCliente.length > 0 ? (
                facturasCliente.map((factura) => (
                  <div
                    key={factura.id}
                    className="mb-4 border border-slate-800 rounded-lg p-3"
                  >
                    <div className="text-sm font-medium mb-2">
                      Factura #{factura.number} — {new Date(factura.date_iso).toLocaleDateString("es-AR")} — Total: {money(factura.total)}
                    </div>
                    
                    <table className="min-w-full text-sm">
                      <thead className="text-slate-400 bg-slate-800/50">
                        <tr>
                          <th className="text-left py-2 px-2">Producto</th>
                          <th className="text-center py-2 px-2">Cant. Original</th>
                          <th className="text-center py-2 px-2">Precio Unit.</th>
                          <th className="text-center py-2 px-2">Cant. a Devolver</th>
                          <th className="text-center py-2 px-2">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {factura.items.map((item: any, idx: number) => {
                          const productoEnDevolucion = productosDevueltos.find(
                            p => p.productId === item.productId && p.facturaId === factura.id
                          );
                          
                          return (
                            <tr key={`${factura.id}-${item.productId}`} className="border-t border-slate-700">
                              <td className="py-2 px-2">{item.name}</td>
                              <td className="text-center py-2 px-2">{item.qty}</td>
                              <td className="text-center py-2 px-2">{money(item.unitPrice)}</td>
                              <td className="text-center py-2 px-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={item.qty}
                                  defaultValue={productoEnDevolucion?.qtyDevuelta || 0}
                                  className="w-16 text-center border border-slate-700 rounded bg-slate-900 px-1 py-1"
                                  onChange={(e) => {
                                    const cantidad = parseInt(e.target.value) || 0;
                                    if (cantidad > 0) {
                                      agregarProductoADevolver(item, factura, cantidad);
                                    } else if (productoEnDevolucion) {
                                      quitarProductoDevolucion(item.productId, factura.id);
                                    }
                                  }}
                                />
                              </td>
                              <td className="text-center py-2 px-2">
                                {productoEnDevolucion ? (
                                  <button
                                    onClick={() => quitarProductoDevolucion(item.productId, factura.id)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                  >
                                    Quitar
                                  </button>
                                ) : (
                                  <span className="text-slate-500 text-sm">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400 p-3 border border-slate-800 rounded-lg">
                  Este cliente no tiene facturas registradas.
                </div>
              )}
            </div>
          )}

          {/* Resumen de productos a devolver */}
          {productosDevueltos.length > 0 && (
            <div className="mt-6 border-t border-slate-700 pt-4">
              <h4 className="text-sm font-semibold mb-2">Productos a devolver</h4>
              <div className="space-y-2">
                {productosDevueltos.map((producto, index) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-slate-800/30 rounded">
                    <div>
                      <span className="font-medium">{producto.name}</span>
                      <span className="text-slate-400 ml-2">
                        (Factura #{producto.facturaNumero})
                      </span>
                    </div>
                    <div>
                      <span>{producto.qtyDevuelta} × {money(producto.unitPrice)} = </span>
                      <span className="font-medium">{money(producto.qtyDevuelta * producto.unitPrice)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center font-semibold border-t border-slate-700 pt-2 mt-2">
                  <span>Total devolución:</span>
                  <span>
                    {money(productosDevueltos.reduce((sum, p) => sum + (p.qtyDevuelta * p.unitPrice), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Selección del método de devolución */}
          {productosDevueltos.length > 0 && (
            <div className="mt-6 border-t border-slate-700 pt-4">
              <h4 className="text-sm font-semibold mb-2">Método de devolución</h4>
              <Select
                label="Seleccionar método"
                value={metodoDevolucion}
                onChange={setMetodoDevolucion}
                options={[
                  { value: "efectivo", label: "Efectivo" },
                  { value: "transferencia", label: "Transferencia" },
                  { value: "saldo", label: "Saldo a favor" },
                  { value: "intercambio_mismo", label: "Intercambio mismo producto" },
                  { value: "intercambio_otro", label: "Intercambio por otro producto" },
                ]}
              />

              {/* Campos para intercambio por otro producto */}
              {metodoDevolucion === "intercambio_otro" && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-sm font-semibold">Producto nuevo a entregar</h4>
                  <Select
                    label="Seleccionar producto nuevo"
                    value={productoNuevoId}
                    onChange={setProductoNuevoId}
                    options={[
                      { value: "", label: "— Seleccionar producto —" },
                      ...state.products.map((p: any) => ({
                        value: p.id,
                        label: `${p.name} — Stock: ${p.stock || 0}`,
                      }))
                    ]}
                  />
                  <NumberInput
                    label="Cantidad"
                    value={cantidadNuevo}
                    onChange={setCantidadNuevo}
                    placeholder="0"
                  />

                  <h4 className="text-sm font-semibold mt-4">Pago de diferencia (opcional)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberInput
                      label="Pago en efectivo"
                      value={montoEfectivo}
                      onChange={setMontoEfectivo}
                      placeholder="0"
                    />
                    <NumberInput
                      label="Pago en transferencia"
                      value={montoTransferencia}
                      onChange={setMontoTransferencia}
                      placeholder="0"
                    />
                    <Input
                      className="col-span-2"
                      label="Alias / CVU destino"
                      value={alias}
                      onChange={setAlias}
                      placeholder="ej: mitobicel.banco"
                    />
                  </div>
                </div>
              )}

              {/* Campos para efectivo/transferencia */}
              {(metodoDevolucion === "efectivo" || metodoDevolucion === "transferencia") && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <NumberInput
                    label="Monto en efectivo"
                    value={montoEfectivo}
                    onChange={setMontoEfectivo}
                    placeholder="0"
                  />
                  <NumberInput
                    label="Monto en transferencia"
                    value={montoTransferencia}
                    onChange={setMontoTransferencia}
                    placeholder="0"
                  />
                </div>
              )}

              {/* Botón para confirmar devolución */}
              <div className="mt-4 text-right">
                <Button onClick={guardarDevolucion} tone="emerald">
                  Confirmar devolución
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// 👇👇👇 NUEVO COMPONENTE: Panel de Pedidos Online
function PedidosOnlineTab({ state, setState, session, showError, showSuccess, showInfo }: any) {  const [priceList, setPriceList] = useState("1");
  const [sectionFilter, setSectionFilter] = useState("Todas");
  const [listFilter, setListFilter] = useState("Todas");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [observaciones, setObservaciones] = useState("");

  const sections = ["Todas", ...Array.from(new Set(state.products.map((p: any) => p.section || "Otros")))];
  const lists = ["Todas", ...Array.from(new Set(state.products.map((p: any) => p.list_label || "General")))];

  const filteredProducts = state.products.filter((p: any) => {
    const okS = sectionFilter === "Todas" || p.section === sectionFilter;
    const okL = listFilter === "Todas" || p.list_label === listFilter;
    const okQ = !query || p.name.toLowerCase().includes(query.toLowerCase());
    return okS && okL && okQ;
  });

  const grouped = groupBy(filteredProducts, "section");

function addItem(p: any) {
  // ✅ VERIFICAR STOCK ANTES DE AGREGAR
  const stockActual = parseNum(p.stock);
  if (stockActual <= 0) {
    return alert(`No hay stock disponible de ${p.name}. Stock actual: ${stockActual}`);
  }
  
  const existing = items.find((it: any) => it.productId === p.id);
  const unit = priceList === "1" ? p.price1 : p.price2;
  
  if (existing) {
    // Verificar si al agregar una unidad más supera el stock
    const nuevaCantidad = parseNum(existing.qty) + 1;
    if (nuevaCantidad > stockActual) {
      return alert(`No hay suficiente stock de ${p.name}. Stock disponible: ${stockActual}`);
    }
    setItems(items.map((it) => (it.productId === p.id ? { ...it, qty: nuevaCantidad } : it)));
  } else {
    setItems([...items, { productId: p.id, name: p.name, section: p.section, qty: 1, unitPrice: unit, cost: p.cost }]);
  }
}

  async function hacerPedido() {
    if (items.length === 0) return showError("Agregá productos al pedido.");

    
    const st = clone(state);
    const pedidoId = "ped_" + Math.random().toString(36).slice(2, 9);
    const total = calcInvoiceTotal(items);

    const pedido: Pedido = {
      id: pedidoId,
      client_id: session.id,
      client_name: session.name,
      client_number: session.number,
      items: clone(items),
      total,
      status: "pendiente",
      date_iso: todayISO(),
      observaciones: observaciones.trim() || undefined,
    };

    st.pedidos.push(pedido);
    setState(st);

    if (hasSupabase) {
      await supabase.from("pedidos").insert(pedido);
    }

    // Limpiar el carrito
    setItems([]);
    setObservaciones("");
    
showSuccess("✅ Pedido enviado correctamente. Te contactaremos cuando esté listo.");
  }

  const total = calcInvoiceTotal(items);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <Card title={`Hacer Pedido Online - Cliente: ${session.name} (N° ${session.number})`}>
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <Select
            label="Lista de precios"
            value={priceList}
            onChange={setPriceList}
            options={[
              { value: "1", label: "Mitobicel" },
              { value: "2", label: "ElshoppingDlc" },
            ]}
          />
          <Select 
            label="Sección" 
            value={sectionFilter} 
            onChange={setSectionFilter} 
            options={sections.map((s: any) => ({ value: s, label: s }))} 
          />
          <Select 
            label="Lista" 
            value={listFilter} 
            onChange={setListFilter} 
            options={lists.map((s: any) => ({ value: s, label: s }))} 
          />
          <Input label="Buscar" value={query} onChange={setQuery} placeholder="Nombre del producto..." />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Lista de productos */}
          <div className="space-y-4">
            <div className="text-sm font-semibold">Productos Disponibles</div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {Object.entries(grouped).map(([sec, arr]: any) => (
                <div key={sec} className="border border-slate-800 rounded-xl">
                  <div className="px-3 py-2 text-xs font-semibold bg-slate-800/70">{sec}</div>
                  <div className="divide-y divide-slate-800">
                    {arr.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          <div className="text-xs text-slate-400">
                            Precio: {money(priceList === "1" ? p.price1 : p.price2)} · 
                            Stock: {p.stock || 0}
                          </div>
                        </div>
                        <Button onClick={() => addItem(p)} tone="slate" className="shrink-0">
                          Agregar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carrito del pedido */}
          <div className="space-y-4">
            <div className="text-sm font-semibold">Tu Pedido</div>
            <div className="rounded-xl border border-slate-800 divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
              {items.length === 0 && (
                <div className="p-4 text-sm text-slate-400 text-center">
                  Tu carrito está vacío. Agregá productos del listado.
                </div>
              )}
              {items.map((it, idx) => (
                <div key={idx} className="p-3 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-7">
                    <div className="text-sm font-medium">{it.name}</div>
                    <div className="text-xs text-slate-400">{it.section}</div>
                  </div>
                  <div className="col-span-3">
                    <NumberInput
                      label="Cant."
                      value={it.qty}
                      onChange={(v: any) => {
                        const q = Math.max(0, parseNum(v));
                        setItems(items.map((x, i) => (i === idx ? { ...x, qty: q } : x)));
                      }}
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button 
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-300 text-lg"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="col-span-12 text-right text-xs text-slate-300 pt-1">
                    Subtotal: {money(parseNum(it.qty) * parseNum(it.unitPrice))}
                  </div>
                </div>
              ))}
            </div>

            {/* Observaciones y total */}
            <div className="space-y-3">
              <Input
                label="Observaciones (opcional)"
                value={observaciones}
                onChange={setObservaciones}
                placeholder="Ej: Urgente, color específico, etc."
              />
              
              <div className="flex items-center justify-between text-lg font-bold border-t border-slate-700 pt-3">
                <span>Total del Pedido:</span>
                <span>{money(total)}</span>
              </div>

              <Button 
                onClick={hacerPedido} 
                disabled={items.length === 0}
                className="w-full py-3 text-base"
              >
                🚀 Hacer Pedido
              </Button>

              <div className="text-xs text-slate-400 text-center">
                Tu pedido será revisado y te contactaremos para coordinar el pago y entrega.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Pedidos anteriores del cliente */}
      <Card title="Tus Pedidos Anteriores">
        <div className="space-y-3">
          {state.pedidos
            .filter((p: Pedido) => p.client_id === session.id)
            .slice(0, 5) // Mostrar solo los últimos 5
            .map((pedido: Pedido) => (
              <div key={pedido.id} className="border border-slate-800 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Pedido #{pedido.id.slice(-6)}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(pedido.date_iso).toLocaleString("es-AR")}
                    </div>
                    <div className="text-sm mt-1">
                      {pedido.items.length} producto(s) - Total: {money(pedido.total)}
                    </div>
                    {pedido.observaciones && (
                      <div className="text-xs text-slate-400 mt-1">
                        Observaciones: {pedido.observaciones}
                      </div>
                    )}
                  </div>
                  <Chip tone={
                    pedido.status === "pendiente" ? "slate" :
                    pedido.status === "aceptado" ? "emerald" :
                    pedido.status === "listo" ? "emerald" : "red"
                  }>
                    {pedido.status === "pendiente" && "⏳ Pendiente"}
                    {pedido.status === "aceptado" && "✅ Aceptado"}
                    {pedido.status === "listo" && "🚀 Listo para retirar"}
                    {pedido.status === "cancelado" && "❌ Cancelado"}
                  </Chip>
                </div>
              </div>
            ))}
          
          {state.pedidos.filter((p: Pedido) => p.client_id === session.id).length === 0 && (
            <div className="text-center text-slate-400 py-4">
              No tenés pedidos anteriores.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// 👇👇👇 NUEVO COMPONENTE: Gestión de Pedidos (para admin/vendedores)
function GestionPedidosTab({ state, setState, session, showError, showSuccess, showInfo }: any) {  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  const pedidosFiltrados = state.pedidos.filter((pedido: Pedido) => {
    if (filtroEstado === "todos") return true;
    return pedido.status === filtroEstado;
  });

  async function cambiarEstado(pedidoId: string, nuevoEstado: Pedido["status"]) {
    const st = clone(state);
    const pedido = st.pedidos.find((p: Pedido) => p.id === pedidoId);
    
    if (pedido) {
      pedido.status = nuevoEstado;
      
      if (nuevoEstado === "aceptado") {
        pedido.accepted_by = session.name;
        pedido.accepted_at = todayISO();
      } else if (nuevoEstado === "listo") {
        pedido.completed_at = todayISO();
      }
      
      setState(st);

      if (hasSupabase) {
        await supabase
          .from("pedidos")
          .update({
            status: nuevoEstado,
            accepted_by: pedido.accepted_by,
            accepted_at: pedido.accepted_at,
            completed_at: pedido.completed_at
          })
          .eq("id", pedidoId);
      }

showSuccess(`📦 Pedido actualizado a: ${nuevoEstado}`);
    }
  }

async function convertirAFactura(pedido: Pedido) {
  try {
    // 1. Preguntar por los datos de pago
    const efectivoStr = prompt("¿Cuánto paga en EFECTIVO?", "0") ?? "0";
    const transferenciaStr = prompt("¿Cuánto paga por TRANSFERENCIA?", "0") ?? "0";
    const aliasStr = prompt("Alias/CVU destino de la transferencia (opcional):", "") ?? "";

    const efectivo = parseNum(efectivoStr);
    const transferencia = parseNum(transferenciaStr);
    const alias = aliasStr.trim();

    // Validaciones básicas
    if (efectivo < 0 || transferencia < 0) {
      return alert("Los montos no pueden ser negativos.");
    }

    const totalPagos = efectivo + transferencia;
    const totalPedido = parseNum(pedido.total);

    if (totalPagos > totalPedido) {
      const vuelto = totalPagos - totalPedido;
      if (!confirm(`El cliente pagó de más. ¿Dar vuelto de ${money(vuelto)}?`)) {
        return;
      }
    }

    // 2. Usar la misma lógica que FacturacionTab
    const st = clone(state);
    const number = st.meta.invoiceCounter++;
    const id = "inv_" + number;

    // Obtener el cliente para manejar saldo a favor y deuda
    const cliente = st.clients.find((c: any) => c.id === pedido.client_id);
    if (!cliente) {
      return alert("Error: Cliente no encontrado.");
    }

    // ⭐⭐ SOLUCIÓN: USAR SIEMPRE "Vendedor Online" ⭐⭐
    let vendorId = "";
    let vendorName = "Vendedor Online";

  // Buscar el vendedor "Vendedor Online" en la lista usando la función auxiliar
const vendedorOnline = obtenerVendedorOnline(st);

    if (vendedorOnline) {
      vendorId = vendedorOnline.id;
      vendorName = vendedorOnline.name;
      console.log("🔄 Usando Vendedor Online:", vendorId, vendorName);
    } else {
      // Fallback: usar el primer vendedor disponible
      const primerVendedor = st.vendors[0];
      if (primerVendedor) {
        vendorId = primerVendedor.id;
        vendorName = primerVendedor.name;
        console.warn("⚠️ Vendedor Online no encontrado, usando:", vendorId, vendorName);
      } else {
        throw new Error("No hay vendedores disponibles en el sistema");
      }
    }

    // Validar que el vendor_id existe
    const vendorExiste = st.vendors.find((v: any) => v.id === vendorId);
    if (!vendorExiste) {
      console.error("❌ Vendor ID no válido:", vendorId);
      throw new Error(`Vendedor con ID ${vendorId} no existe`);
    }

    // Calcular saldo a favor aplicado
    const saldoActual = parseNum(cliente.saldo_favor || 0);
    const saldoAplicado = Math.min(totalPedido, saldoActual);
    const totalTrasSaldo = totalPedido - saldoAplicado;

    // Calcular pagos aplicados
    const vueltoSugerido = Math.max(0, efectivo - Math.max(0, totalTrasSaldo - transferencia));
    const vuelto = vueltoSugerido;
    const applied = Math.max(0, efectivo + transferencia - vuelto);

    // Calcular deuda resultante
    const debtDelta = Math.max(0, totalTrasSaldo - applied);
    const status = debtDelta > 0 ? "No Pagada" : "Pagada";

    // ACTUALIZAR CLIENTE
    const deudaAnterior = parseNum(cliente.debt);
    cliente.saldo_favor = saldoActual - saldoAplicado;
    cliente.debt = deudaAnterior + debtDelta;

    // DESCONTAR STOCK
    pedido.items.forEach((item: any) => {
      const product = st.products.find((p: any) => p.id === item.productId);
      if (product) {
        product.stock = Math.max(0, parseNum(product.stock) - parseNum(item.qty));
      }
    });

    // Crear la factura con VENDEDOR CORRECTO
    const invoice = {
      id,
      number,
      date_iso: todayISO(),
      client_id: pedido.client_id,
      client_name: pedido.client_name,
      vendor_id: vendorId, // ⭐ Usamos el vendedor asignado
      vendor_name: vendorName, // ⭐ Nombre del vendedor
      items: pedido.items,
      total: totalPedido,
      total_after_credit: totalTrasSaldo,
      cost: calcInvoiceCost(pedido.items),
      payments: { 
        cash: efectivo, 
        transfer: transferencia, 
        change: vuelto, 
        alias: alias,
        saldo_aplicado: saldoAplicado 
      },
      status,
      type: "Factura",
      client_debt_total: cliente.debt
    };

    console.log("🔍 Factura con vendedor:", vendorId, vendorName);

    // ACTUALIZAR ESTADO LOCAL PRIMERO
    st.invoices.push(invoice);
    
    // Marcar pedido como completado
    const pedidoObj = st.pedidos.find((p: Pedido) => p.id === pedido.id);
    if (pedidoObj) {
      pedidoObj.status = "listo";
      pedidoObj.completed_at = todayISO();
    }
    
    // ACTUALIZAR ESTADO
    setState(st);

    // PERSISTIR EN SUPABASE
    if (hasSupabase) {
      console.log("📦 Intentando guardar en Supabase...");
      
      // 1. Guardar factura
      const { data: facturaData, error: invoiceError } = await supabase
        .from("invoices")
        .insert(invoice)
        .select();

      if (invoiceError) {
        console.error("❌ ERROR al guardar factura:", invoiceError);
        throw new Error(`No se pudo guardar la factura: ${invoiceError.message}`);
      }
      console.log("✅ Factura guardada:", facturaData);

      // 2. Actualizar pedido
      const { error: pedidoError } = await supabase
        .from("pedidos")
        .update({ 
          status: "listo",
          completed_at: todayISO()
        })
        .eq("id", pedido.id);

      if (pedidoError) {
        console.error("❌ ERROR al actualizar pedido:", pedidoError);
      } else {
        console.log("✅ Pedido actualizado");
      }

      // 3. Actualizar cliente
      const { error: clientError } = await supabase
        .from("clients")
        .update({ 
          debt: cliente.debt, 
          saldo_favor: cliente.saldo_favor 
        })
        .eq("id", pedido.client_id);

      if (clientError) {
        console.error("❌ ERROR al actualizar cliente:", clientError);
      } else {
        console.log("✅ Cliente actualizado");
      }

      // 4. Actualizar stock
      for (const item of pedido.items) {
        const product = st.products.find((p: any) => p.id === item.productId);
        if (product) {
          const { error: stockError } = await supabase
            .from("products")
            .update({ stock: product.stock })
            .eq("id", item.productId);
          
          if (stockError) {
            console.warn(`⚠️ No se pudo actualizar stock de ${item.name}:`, stockError);
          } else {
            console.log(`✅ Stock actualizado: ${item.name}`);
          }
        }
      }
      
      // 5. Actualizar contadores
      await saveCountersSupabase(st.meta);
      console.log("✅ Contadores actualizados");
    }

    // IMPRIMIR FACTURA
    window.dispatchEvent(new CustomEvent("print-invoice", { detail: invoice } as any));
    await nextPaint();
    window.print();

    // ACTUALIZAR DATOS PARA REPORTES
    if (hasSupabase) {
      setTimeout(async () => {
        const refreshedState = await loadFromSupabase(seedState());
        setState(refreshedState);
      }, 1500);
    }

    // MENSAJE DE ÉXITO
    alert(`✅ Pedido online convertido a Factura Nº ${number}\nCliente: ${pedido.client_name}\nTotal: ${money(totalPedido)}\nVendedor: ${vendorName}\nEstado: ${status}`);

  } catch (error) {
    console.error("💥 ERROR CRÍTICO:", error);
    alert(`❌ Error al guardar: ${error.message}\n\nRevisa la consola para más detalles.`);
  }
}
  function obtenerVendedorOnline(state: any) {
  // Buscar por nombre exacto o similar
  const vendedores = state.vendors || [];
  
  // Primero buscar por nombre exacto
  let vendedor = vendedores.find((v: any) => 
    v.name.toLowerCase() === "vendedor online"
  );
  
  // Si no existe, buscar por coincidencia parcial
  if (!vendedor) {
    vendedor = vendedores.find((v: any) => 
      v.name.toLowerCase().includes("online") || 
      v.name.toLowerCase().includes("vendedor")
    );
  }
  
  // Si aún no existe, usar el primer vendedor
  if (!vendedor && vendedores.length > 0) {
    vendedor = vendedores[0];
  }
  
  return vendedor;
}
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <Card 
        title="Gestión de Pedidos Online"
        actions={
          <div className="flex gap-2">
            <Select
              value={filtroEstado}
              onChange={setFiltroEstado}
              options={[
                { value: "todos", label: "Todos los estados" },
                { value: "pendiente", label: "Pendientes" },
                { value: "aceptado", label: "Aceptados" },
                { value: "listo", label: "Listos" },
                { value: "cancelado", label: "Cancelados" },
              ]}
            />
            <Button tone="slate" onClick={async () => {
              const refreshedState = await loadFromSupabase(seedState());
              setState(refreshedState);
            }}>
              Actualizar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {pedidosFiltrados.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              No hay pedidos {filtroEstado !== "todos" ? `con estado "${filtroEstado}"` : ""}.
            </div>
          ) : (
            pedidosFiltrados.map((pedido: Pedido) => (
              <div key={pedido.id} className="border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold">
                      Pedido #{pedido.id.slice(-6)} - {pedido.client_name} (N° {pedido.client_number})
                    </div>
                    <div className="text-sm text-slate-400">
                      {new Date(pedido.date_iso).toLocaleString("es-AR")}
                    </div>
                    {pedido.observaciones && (
                      <div className="text-sm text-slate-300 mt-1">
                        <strong>Observaciones:</strong> {pedido.observaciones}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{money(pedido.total)}</div>
                    <Chip tone={
                      pedido.status === "pendiente" ? "slate" :
                      pedido.status === "aceptado" ? "emerald" :
                      pedido.status === "listo" ? "emerald" : "red"
                    }>
                      {pedido.status === "pendiente" && "⏳ Pendiente"}
                      {pedido.status === "aceptado" && "✅ Aceptado"}
                      {pedido.status === "listo" && "🚀 Listo para retirar"}
                      {pedido.status === "cancelado" && "❌ Cancelado"}
                    </Chip>
                  </div>
                </div>

                {/* Items del pedido */}
                <div className="mb-4">
                  <div className="text-sm font-semibold mb-2">Productos:</div>
                  <div className="grid gap-2">
                    {pedido.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name} × {item.qty}</span>
                        <span>{money(parseNum(item.qty) * parseNum(item.unitPrice))}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 flex-wrap">
                  {pedido.status === "pendiente" && (
                    <>
                      <Button onClick={() => cambiarEstado(pedido.id, "aceptado")}>
                        ✅ Aceptar Pedido
                      </Button>
                      <Button tone="red" onClick={() => cambiarEstado(pedido.id, "cancelado")}>
                        ❌ Cancelar
                      </Button>
                    </>
                  )}
                  
                  {pedido.status === "aceptado" && (
                    <>
                      <Button onClick={() => cambiarEstado(pedido.id, "listo")}>
                        🚀 Marcar como Listo
                      </Button>
                      <Button onClick={() => convertirAFactura(pedido)}>
                        📄 Convertir a Factura
                      </Button>
                    </>
                  )}
                  
                  {pedido.status === "listo" && (
                    <Button onClick={() => convertirAFactura(pedido)}>
                      📄 Convertir a Factura
                    </Button>
                  )}
                  
                  <Button tone="slate" onClick={() => {
                    // Ver detalles del pedido
                    alert(`Detalles del pedido ${pedido.id}\nCliente: ${pedido.client_name}\nTotal: ${money(pedido.total)}\nProductos: ${pedido.items.length}`);
                  }}>
                    👁️ Ver Detalles
                  </Button>
                </div>

                {/* Información de procesamiento */}
                {(pedido.accepted_by || pedido.completed_at) && (
                  <div className="text-xs text-slate-400 mt-3">
                    {pedido.accepted_by && `Aceptado por: ${pedido.accepted_by} · `}
                    {pedido.accepted_at && `el ${new Date(pedido.accepted_at).toLocaleString("es-AR")}`}
                    {pedido.completed_at && ` · Listo: ${new Date(pedido.completed_at).toLocaleString("es-AR")}`}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
/* ===== helpers para impresión ===== */
const APP_TITLE = "Sistema de Gestión y Facturación — By Tobias Carrizo";
function nextPaint() {
  return new Promise<void>((res) =>
    requestAnimationFrame(() => requestAnimationFrame(() => res()))
  );
}


/* ===== Área de impresión ===== */
/* ===== Área de impresión ===== */
function PrintArea({ state }: any) {
  const [inv, setInv] = useState<any | null>(null);
  const [ticket, setTicket] = useState<any | null>(null);

  useEffect(() => {
    const hInv = (e: any) => {
      setTicket(null);
      setInv(e.detail);
    };
    const hTic = (e: any) => {
      setInv(null);
      setTicket(e.detail);
    };
    const hDev = (e: any) => {
      setInv(null);
      setTicket(null);
      setInv({ ...e.detail, type: "Devolucion" });
    };
    
    window.addEventListener("print-invoice", hInv);
    window.addEventListener("print-ticket", hTic);
    window.addEventListener("print-devolucion", hDev);
    
    return () => {
      window.removeEventListener("print-invoice", hInv);
      window.removeEventListener("print-ticket", hTic);
      window.removeEventListener("print-devolucion", hDev);
    };
  }, []);

  if (!inv && !ticket) return null;

  // ==== 1. PRIMERO LOS 4 REPORTES ESPECÍFICOS ====
  if (inv?.type === "Reporte") {
    const fmt = (n: number) => money(parseNum(n));

    // REPORTE DE INVENTARIO
    if (inv?.subtipo === "inventario") {
      return (
        <div className="only-print print-area p-14">
          <div className="max-w-[780px] mx-auto text-black">
            <div className="flex items-start justify-between">
              <div>
                <div style={{ fontWeight: 800, letterSpacing: 1, fontSize: '20px' }}>
                  REPORTE DE INVENTARIO - iPHONES
                </div>
                <div style={{ marginTop: 2 }}>VM-ELECTRONICA</div>
              </div>
              <div className="text-right text-sm">
                <div><b>Período:</b> {inv.periodo}</div>
                <div><b>Generado:</b> {inv.fechaGeneracion}</div>
              </div>
            </div>

            <div style={{ borderTop: "2px solid #000", margin: "12px 0 8px" }} />

            {/* RESUMEN INVENTARIO */}
            <div className="grid grid-cols-3 gap-4 text-center mb-6" style={{ border: "2px solid #000", padding: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '20px', color: '#2563eb' }}>{inv.resumen.totalProductos}</div>
                <div style={{ fontWeight: 600 }}>PRODUCTOS EN STOCK</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '20px', color: '#d97706' }}>{fmt(inv.resumen.capitalInvertido)}</div>
                <div style={{ fontWeight: 600 }}>CAPITAL INVERTIDO</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '20px', color: '#059669' }}>{fmt(inv.resumen.valorVentaTotal)}</div>
                <div style={{ fontWeight: 600 }}>VALOR DE VENTA</div>
              </div>
            </div>

            {/* STOCK POR MODELO */}
            <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
            <div style={{ fontWeight: 700, marginBottom: 6 }}>📦 STOCK POR MODELO Y CAPACIDAD</div>
            
            <table className="print-table text-sm" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Modelo</th>
                  <th style={{ textAlign: 'center' }}>Stock</th>
                  <th style={{ textAlign: 'right' }}>Valor Inventario</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(inv.metricas.stockPorModeloGB)
                  .sort(([,a]: any, [,b]: any) => b - a)
                  .slice(0, 15)
                  .map(([modelo, cantidad]: any) => (
                    <tr key={modelo}>
                      <td>{modelo}</td>
                      <td style={{ textAlign: 'center' }}>{cantidad} unidades</td>
                      <td style={{ textAlign: 'right' }}>
                        {fmt(inv.productosStock
                          .filter((p: any) => `${p.modelo} ${p.capacidad}` === modelo)
                          .reduce((sum: number, p: any) => sum + p.precio_compra + p.costo_reparacion, 0)
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* PRODUCTOS CON MÁS TIEMPO */}
            {inv.metricas.productosViejos.length > 0 && (
              <>
                <div style={{ borderTop: "1px solid #000", margin: "16px 0 6px" }} />
                <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠️ PRODUCTOS CON MÁS DE 30 DÍAS EN STOCK</div>
                
                <table className="print-table text-sm" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Producto</th>
                      <th style={{ textAlign: 'center' }}>Días</th>
                      <th style={{ textAlign: 'right' }}>Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.metricas.productosViejos.slice(0, 10).map((producto: any) => (
                      <tr key={producto.id}>
                        <td>{producto.name}</td>
                        <td style={{ textAlign: 'center', color: producto.diasEnStock > 60 ? '#dc2626' : '#d97706' }}>
                          {producto.diasEnStock} días
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {fmt(producto.precio_compra + producto.costo_reparacion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="mt-8 text-xs text-center">{APP_TITLE}</div>
          </div>
        </div>
      );
    }

    // REPORTE ANÁLISIS ABC
    if (inv?.subtipo === "abc") {
      const fmt = (n: number) => money(parseNum(n));
      
      return (
        <div className="only-print print-area p-14">
          <div className="max-w-[780px] mx-auto text-black">
            <div className="flex items-start justify-between">
              <div>
                <div style={{ fontWeight: 800, letterSpacing: 1, fontSize: '20px' }}>
                  ANÁLISIS ABC - CLASIFICACIÓN DE INVENTARIO
                </div>
                <div style={{ marginTop: 2 }}>VM-ELECTRONICA</div>
              </div>
              <div className="text-right text-sm">
                <div><b>Período:</b> {inv.periodo}</div>
                <div><b>Generado:</b> {inv.fechaGeneracion}</div>
              </div>
            </div>

            <div style={{ borderTop: "2px solid #000", margin: "12px 0 8px" }} />

            {/* RESUMEN CATEGORÍAS ABC */}
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div className="p-4 bg-red-900/10 border-2 border-red-700 rounded-lg">
                <div style={{ fontWeight: 700, fontSize: '24px', color: '#dc2626' }}>A</div>
                <div style={{ fontWeight: 600 }}>ALTA PRIORIDAD</div>
                <div style={{ fontSize: '14px' }}>{inv.resumen.categoriaA} productos</div>
                <div style={{ fontSize: '12px', color: '#666' }}>80% del valor</div>
              </div>
              <div className="p-4 bg-amber-900/10 border-2 border-amber-700 rounded-lg">
                <div style={{ fontWeight: 700, fontSize: '24px', color: '#d97706' }}>B</div>
                <div style={{ fontWeight: 600 }}>MEDIA PRIORIDAD</div>
                <div style={{ fontSize: '14px' }}>{inv.resumen.categoriaB} productos</div>
                <div style={{ fontSize: '12px', color: '#666' }}>15% del valor</div>
              </div>
              <div className="p-4 bg-green-900/10 border-2 border-green-700 rounded-lg">
                <div style={{ fontWeight: 700, fontSize: '24px', color: '#059669' }}>C</div>
                <div style={{ fontWeight: 600 }}>BAJA PRIORIDAD</div>
                <div style={{ fontSize: '14px' }}>{inv.resumen.categoriaC} productos</div>
                <div style={{ fontSize: '12px', color: '#666' }}>5% del valor</div>
              </div>
            </div>

            {/* DETALLE PRODUCTOS CATEGORÍA A */}
            <div style={{ borderTop: "1px solid #000", margin: "16px 0 6px" }} />
            <div style={{ fontWeight: 700, marginBottom: 6 }}>🔴 PRODUCTOS CATEGORÍA A (ALTA PRIORIDAD)</div>
            
            <table className="print-table text-sm" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Producto</th>
                  <th style={{ textAlign: 'center' }}>Ranking</th>
                  <th style={{ textAlign: 'right' }}>Valor Inventario</th>
                  <th style={{ textAlign: 'center' }}>Rotación</th>
                </tr>
              </thead>
              <tbody>
                {inv.analisisABC
                  .filter((p: any) => p.categoria === 'A')
                  .slice(0, 15)
                  .map((producto: any) => (
                    <tr key={producto.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{producto.name}</div>
                        <div style={{ fontSize: '10px', color: '#666' }}>
                          {producto.modelo} {producto.capacidad} • {producto.grado}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>#{producto.ranking}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(producto.valorInventario)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          color: producto.rotacion > 0 ? '#059669' : '#dc2626',
                          fontWeight: 600
                        }}>
                          {producto.rotacion}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <div className="mt-8 text-xs text-center">{APP_TITLE}</div>
          </div>
        </div>
      );
    }

    // REPORTE DE RENTABILIDAD
    if (inv?.subtipo === "rentabilidad") {
      const fmt = (n: number) => money(parseNum(n));
      
      return (
        <div className="only-print print-area p-14">
          <div className="max-w-[780px] mx-auto text-black">
            <div className="flex items-start justify-between">
              <div>
                <div style={{ fontWeight: 800, letterSpacing: 1, fontSize: '20px' }}>
                  REPORTE DE RENTABILIDAD - iPHONES
                </div>
                <div style={{ marginTop: 2 }}>VM-ELECTRONICA</div>
              </div>
              <div className="text-right text-sm">
                <div><b>Período:</b> {inv.periodo}</div>
                <div><b>Generado:</b> {inv.fechaGeneracion}</div>
              </div>
            </div>

            <div style={{ borderTop: "2px solid #000", margin: "12px 0 8px" }} />

            {/* RESUMEN RENTABILIDAD */}
            <div className="grid grid-cols-3 gap-4 text-center mb-6" style={{ border: "2px solid #000", padding: 12 }}>
              <div>
                <div style={{ 
                  fontWeight: 700, 
                  fontSize: '20px', 
                  color: inv.resumen.margenGananciaPromedio >= 20 ? '#059669' : 
                         inv.resumen.margenGananciaPromedio >= 10 ? '#d97706' : '#dc2626' 
                }}>
                  {inv.resumen.margenGananciaPromedio.toFixed(1)}%
                </div>
                <div style={{ fontWeight: 600 }}>MARGEN PROMEDIO</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '20px', color: '#059669' }}>
                  {fmt(inv.resumen.gananciaTotal)}
                </div>
                <div style={{ fontWeight: 600 }}>GANANCIA TOTAL</div>
              </div>
              <div>
                <div style={{ 
                  fontWeight: 700, 
                  fontSize: '20px', 
                  color: inv.resumen.roiInventario >= 50 ? '#059669' : 
                         inv.resumen.roiInventario >= 20 ? '#d97706' : '#dc2626' 
                }}>
                  {inv.resumen.roiInventario.toFixed(1)}%
                </div>
                <div style={{ fontWeight: 600 }}>ROI INVENTARIO</div>
              </div>
            </div>

            {/* RENTABILIDAD POR MODELO */}
            <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
            <div style={{ fontWeight: 700, marginBottom: 6 }}>💰 RENTABILIDAD POR MODELO</div>
            
            <table className="print-table text-sm" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Modelo</th>
                  <th style={{ textAlign: 'right' }}>Ventas</th>
                  <th style={{ textAlign: 'right' }}>Ganancia</th>
                  <th style={{ textAlign: 'center' }}>Margen</th>
                  <th style={{ textAlign: 'center' }}>Unidades</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(inv.metricas.rentabilidadPorModeloGB)
                  .sort(([,a]: any, [,b]: any) => b.ganancia - a.ganancia)
                  .slice(0, 12)
                  .map(([modelo, datos]: any) => (
                    <tr key={modelo}>
                      <td>{modelo}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(datos.ventas)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(datos.ganancia)}</td>
                      <td style={{ 
                        textAlign: 'center',
                        color: (datos.ganancia / datos.ventas * 100) >= 20 ? '#059669' : 
                               (datos.ganancia / datos.ventas * 100) >= 10 ? '#d97706' : '#dc2626',
                        fontWeight: 600
                      }}>
                        {((datos.ganancia / datos.ventas) * 100).toFixed(1)}%
                      </td>
                      <td style={{ textAlign: 'center' }}>{datos.unidades}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <div className="mt-8 text-xs text-center">{APP_TITLE}</div>
          </div>
        </div>
      );
    }

    // REPORTE DE TENDENCIAS
    if (inv?.subtipo === "tendencias") {
      const fmt = (n: number) => money(parseNum(n));
      
      return (
        <div className="only-print print-area p-14">
          <div className="max-w-[780px] mx-auto text-black">
            <div className="flex items-start justify-between">
              <div>
                <div style={{ fontWeight: 800, letterSpacing: 1, fontSize: '20px' }}>
                  REPORTE DE TENDENCIAS - iPHONES
                </div>
                <div style={{ marginTop: 2 }}>VM-ELECTRONICA</div>
              </div>
              <div className="text-right text-sm">
                <div><b>Período:</b> {inv.periodo}</div>
                <div><b>Generado:</b> {inv.fechaGeneracion}</div>
              </div>
            </div>

            <div style={{ borderTop: "2px solid #000", margin: "12px 0 8px" }} />

            {/* TENDENCIAS MENSUALES */}
            <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
            <div style={{ fontWeight: 700, marginBottom: 6 }}>📈 TENDENCIAS MENSUALES</div>
            
            <table className="print-table text-sm" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Mes</th>
                  <th style={{ textAlign: 'right' }}>Ventas</th>
                  <th style={{ textAlign: 'center' }}>Crecimiento</th>
                </tr>
              </thead>
              <tbody>
                {inv.metricas.crecimientoMensual.map((mes: any, index: number) => (
                  <tr key={mes.mes}>
                    <td>{mes.mes}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(mes.ventas)}</td>
                    <td style={{ 
                      textAlign: 'center',
                      color: mes.crecimiento >= 0 ? '#059669' : '#dc2626',
                      fontWeight: 600
                    }}>
                      {mes.crecimiento >= 0 ? '↗' : '↘'} {Math.abs(mes.crecimiento)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* DÍAS CON MÁS VENTAS */}
            <div style={{ borderTop: "1px solid #000", margin: "16px 0 6px" }} />
            <div style={{ fontWeight: 700, marginBottom: 6 }}>📊 DÍAS CON MÁS VENTAS</div>
            
            <table className="print-table text-sm" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Ventas</th>
                </tr>
              </thead>
              <tbody>
                {inv.metricas.diasConMasVentas.map(([dia, monto]: any) => (
                  <tr key={dia}>
                    <td>{new Date(dia).toLocaleDateString('es-AR')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8 text-xs text-center">{APP_TITLE}</div>
          </div>
        </div>
      );
    }

    // ==== 2. REPORTE COMPLETO (Ventas y Performance) ====
    // Este se ejecuta SOLO para "ventas" o cualquier otro subtipo no específico
    const rangoStr = (() => {
      const s = new Date(inv?.rango?.start || Date.now());
      const e = new Date(inv?.rango?.end || Date.now());
      const toDate = (d: Date) => d.toLocaleString("es-AR");
      return `${toDate(s)}  —  ${toDate(e)}`;
    })();

    return (
      <div className="only-print print-area p-14">
        <div className="max-w-[780px] mx-auto text-black">
          <div className="flex items-start justify-between">
            <div>
              <div style={{ fontWeight: 800, letterSpacing: 1 }}>REPORTE COMPLETO</div>
              <div style={{ marginTop: 2 }}>VM-ELECTRONICA</div>
            </div>
            <div className="text-right">
              <div><b>Período:</b> {rangoStr}</div>
              <div><b>Tipo:</b> {inv.periodo}</div>
              <div><b>Fecha:</b> {new Date().toLocaleString("es-AR")}</div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #000", margin: "10px 0 8px" }} />

          {/* RESUMEN PRINCIPAL MEJORADO */}
          <div className="grid grid-cols-4 gap-3 text-sm mb-4">
            <div>
              <div style={{ fontWeight: 700 }}>Ventas totales</div>
              <div>{fmt(inv.resumen.ventas)}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Deuda del día</div>
              <div style={{ color: "#f59e0b", fontWeight: 700 }}>{fmt(inv.resumen.deudaDelDia)}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Efectivo neto</div>
              <div>{fmt(inv.resumen.efectivoNeto)}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Transferencias</div>
              <div>{fmt(inv.resumen.transferencias)}</div>
            </div>
          </div>

          {/* DEUDA DEL DÍA */}
          <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
          <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>📋 Facturas con Deuda del Día</div>
          
          {inv.deudaDelDiaDetalle && inv.deudaDelDiaDetalle.length > 0 ? (
            <table className="print-table text-sm">
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>Factura</th>
                  <th style={{ width: "25%" }}>Cliente</th>
                  <th style={{ width: "20%" }}>Total</th>
                  <th style={{ width: "20%" }}>Pagado</th>
                  <th style={{ width: "25%" }}>Debe</th>
                </tr>
              </thead>
              <tbody>
                {inv.deudaDelDiaDetalle.map((f: any, i: number) => {
                  const total = parseNum(f.total);
                  const pagos = parseNum(f?.payments?.cash || 0) + 
                               parseNum(f?.payments?.transfer || 0) + 
                               parseNum(f?.payments?.saldo_aplicado || 0);
                  const debe = total - pagos;
                  
                  return (
                    <tr key={f.id}>
                      <td style={{ textAlign: "right" }}>#{pad(f.number)}</td>
                      <td>{f.client_name}</td>
                      <td style={{ textAlign: "right" }}>{fmt(total)}</td>
                      <td style={{ textAlign: "right" }}>{fmt(pagos)}</td>
                      <td style={{ textAlign: "right", color: "#f59e0b", fontWeight: 600 }}>
                        {fmt(debe)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-sm text-slate-500 p-2">No hay facturas con deuda pendiente en el día</div>
          )}

          {/* DEUDORES ACTIVOS */}
          <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
          <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>👥 Deudores Activos</div>
          
          {inv.deudoresActivos && inv.deudoresActivos.length > 0 ? (
            inv.deudoresActivos.map((deudor: any, idx: number) => (
              <div key={deudor.id} style={{ border: "1px solid #000", marginBottom: 12, padding: 10, pageBreakInside: 'avoid' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div style={{ fontWeight: 700 }}>{deudor.name} (N° {deudor.number})</div>
                    <div style={{ fontSize: 11 }}>
                      Deuda bruta: {fmt(deudor.deuda_bruta)} • Saldo favor: {fmt(deudor.saldo_favor)} • Facturas: {deudor.cantidad_facturas}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#f59e0b" }}>
                    {fmt(deudor.deuda_neta)}
                  </div>
                </div>

                {/* DETALLE POR FACTURA */}
                {deudor.detalle_facturas.map((deuda: any, factIdx: number) => (
                  <div key={factIdx} style={{ marginBottom: 8, padding: 6, border: "1px dashed #ccc" }}>
                    <div className="flex justify-between text-sm">
                      <span>Factura #{pad(deuda.factura_numero)}</span>
                      <span style={{ fontWeight: 600, color: "#f59e0b" }}>
                        {fmt(deuda.monto_debe)}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: "#666" }}>
                      Fecha: {new Date(deuda.fecha).toLocaleDateString("es-AR")} • 
                      Total: {fmt(deuda.monto_total)} • 
                      Pagado: {fmt(deuda.monto_pagado)}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500 p-2">No hay deudores activos</div>
          )}

          {/* PAGOS DE DEUDORES CON DETALLE */}
          <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
          <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>💳 Pagos de Deudores Registrados</div>
          
          {inv.pagosDeudoresDetallados && inv.pagosDeudoresDetallados.length > 0 ? (
            inv.pagosDeudoresDetallados.map((pago: any, idx: number) => (
              <div key={pago.pago_id} style={{ border: "1px solid #000", marginBottom: 12, padding: 10, pageBreakInside: 'avoid' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div style={{ fontWeight: 700 }}>{pago.cliente}</div>
                    <div style={{ fontSize: 11 }}>
                      {new Date(pago.fecha_pago).toLocaleString("es-AR")} • 
                      Efectivo: {fmt(pago.efectivo)} • 
                      Transferencia: {fmt(pago.transferencia)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: "#10b981" }}>Pagado: {fmt(pago.total_pagado)}</div>
                    <div style={{ fontSize: 11 }}>
                      Deuda: {fmt(pago.deuda_antes_pago)} → {fmt(pago.deuda_despues_pago)}
                    </div>
                  </div>
                </div>

                {/* DETALLE DE APLICACIÓN DEL PAGO */}
                {pago.aplicaciones && pago.aplicaciones.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Aplicado a:</div>
                    {pago.aplicaciones.map((app: any, appIdx: number) => (
                      <div key={appIdx} style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Factura #{pad(app.factura_numero)}:</span>
                        <span>{fmt(app.monto_aplicado)} (Deuda: {fmt(app.deuda_antes)} → {fmt(app.deuda_despues)})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500 p-2">No hay pagos de deudores en el período</div>
          )}

          {/* VENTAS */}
          <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
          <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>Ventas del período</div>
          <table className="print-table text-sm">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>#</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th style={{ width: "14%" }}>Total</th>
                <th style={{ width: "14%" }}>Efectivo</th>
                <th style={{ width: "14%" }}>Transf.</th>
                <th style={{ width: "12%" }}>Vuelto</th>
              </tr>
            </thead>
            <tbody>
              {(inv.ventas || []).map((f: any, i: number) => {
                const c = parseNum(f?.payments?.cash || 0);
                const t = parseNum(f?.payments?.transfer || 0);
                const vu = parseNum(f?.payments?.change || 0);
                return (
                  <tr key={f.id}>
                    <td style={{ textAlign: "right" }}>{String(f.number || i + 1).padStart(4, "0")}</td>
                    <td>{f.client_name}</td>
                    <td>{f.vendor_name}</td>
                    <td style={{ textAlign: "right" }}>{fmt(f.total)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(c)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(t)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(vu)}</td>
                  </tr>
                );
              })}
              {(!inv.ventas || inv.ventas.length === 0) && (
                <tr><td colSpan={7}>Sin ventas en el período.</td></tr>
              )}
            </tbody>
          </table>

          {/* GASTOS */}
          <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
          <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>Gastos</div>
          <table className="print-table text-sm">
            <thead>
              <tr>
                <th style={{ width: "14%" }}>Fecha</th>
                <th>Detalle</th>
                <th style={{ width: "14%" }}>Efectivo</th>
                <th style={{ width: "14%" }}>Transf.</th>
                <th style={{ width: "24%" }}>Alias</th>
              </tr>
            </thead>
            <tbody>
              {(inv.gastos || []).map((g: any, i: number) => (
                <tr key={g.id || i}>
                  <td>{new Date(g.date_iso).toLocaleString("es-AR")}</td>
                  <td>{g.tipo} — {g.detalle}</td>
                  <td style={{ textAlign: "right" }}>{fmt(g.efectivo)}</td>
                  <td style={{ textAlign: "right" }}>{fmt(g.transferencia)}</td>
                  <td>{g.alias || "—"}</td>
                </tr>
              ))}
              {(!inv.gastos || inv.gastos.length === 0) && (
                <tr><td colSpan={5}>Sin gastos.</td></tr>
              )}
            </tbody>
          </table>

          {/* DEVOLUCIONES */}
          <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
          <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>Devoluciones</div>
          <table className="print-table text-sm">
            <thead>
              <tr>
                <th style={{ width: "14%" }}>Fecha</th>
                <th>Cliente</th>
                <th style={{ width: "14%" }}>Método</th>
                <th style={{ width: "14%" }}>Efectivo</th>
                <th style={{ width: "14%" }}>Transf.</th>
                <th style={{ width: "14%" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(inv.devoluciones || []).map((d: any, i: number) => (
                <tr key={d.id || i}>
                  <td>{new Date(d.date_iso).toLocaleString("es-AR")}</td>
                  <td>{d.client_name}</td>
                  <td style={{ textTransform: "capitalize" }}>{d.metodo}</td>
                  <td style={{ textAlign: "right" }}>{fmt(d.efectivo)}</td>
                  <td style={{ textAlign: "right" }}>{fmt(d.transferencia)}</td>
                  <td style={{ textAlign: "right" }}>{fmt(d.total)}</td>
                </tr>
              ))}
              {(!inv.devoluciones || inv.devoluciones.length === 0) && (
                <tr><td colSpan={6}>Sin devoluciones.</td></tr>
              )}
            </tbody>
          </table>

          {/* TRANSFERENCIAS POR ALIAS */}
          <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
          <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>Transferencias por alias (ventas)</div>
          <table className="print-table text-sm">
            <thead>
              <tr>
                <th>Alias</th>
                <th style={{ width: "18%" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(inv.transferenciasPorAlias || []).map((a: any, i: number) => (
                <tr key={a.alias || i}>
                  <td>{a.alias}</td>
                  <td style={{ textAlign: "right" }}>{fmt(a.total)}</td>
                </tr>
              ))}
              {(!inv.transferenciasPorAlias || inv.transferenciasPorAlias.length === 0) && (
                <tr><td colSpan={2}>Sin transferencias en ventas.</td></tr>
              )}
            </tbody>
          </table>

          {/* FLUJO DE CAJA */}
          <div style={{ borderTop: "1px solid #000", margin: "14px 0 8px" }} />
          <div className="text-center" style={{ fontWeight: 900, fontSize: 24, letterSpacing: 1 }}>
            FLUJO DE CAJA (EFECTIVO): {fmt(inv.resumen.flujoCajaEfectivo)}
          </div>

          <div className="mt-10 text-xs text-center">{APP_TITLE}</div>
        </div>
      </div>
    );
  }

  // ==== 3. DETALLE DE DEUDAS ====
  if (inv?.type === "DetalleDeuda") {
    const fmt = (n: number) => money(parseNum(n));
    
    return (
      <div className="only-print print-area p-14">
        <div className="max-w-[780px] mx-auto text-black">
          <div className="flex items-start justify-between">
            <div>
              <div style={{ fontWeight: 800, letterSpacing: 1 }}>DETALLE DE DEUDAS</div>
              <div style={{ marginTop: 2 }}>VM-ELECTRONICA</div>
            </div>
            <div className="text-right">
              <div><b>Fecha:</b> {new Date().toLocaleString("es-AR")}</div>
              <div><b>Cliente:</b> {inv.cliente.name}</div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #000", margin: "10px 0 8px" }} />

          {/* RESUMEN */}
          <div className="grid grid-cols-3 gap-4 text-sm mb-6" style={{ border: "1px solid #000", padding: 12 }}>
            <div className="text-center">
              <div style={{ fontWeight: 700, fontSize: 18 }}>{fmt(inv.deudaTotal)}</div>
              <div>Deuda Total</div>
            </div>
            <div className="text-center">
              <div style={{ fontWeight: 700, fontSize: 18 }}>{inv.detalleDeudas.length}</div>
              <div>Facturas Pendientes</div>
            </div>
            <div className="text-center">
              <div style={{ fontWeight: 700, fontSize: 18 }}>{fmt(inv.saldoFavor)}</div>
              <div>Saldo a Favor</div>
            </div>
          </div>

          {/* DETALLE POR FACTURA */}
          <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
          <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>Detalle por Factura</div>
          
          {inv.detalleDeudas.map((deuda: any, index: number) => (
            <div key={index} style={{ border: "1px solid #000", marginBottom: 12, padding: 10 }}>
              {/* ENCABEZADO FACTURA */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div style={{ fontWeight: 700 }}>Factura #{pad(deuda.factura_numero)}</div>
                  <div style={{ fontSize: 11 }}>{new Date(deuda.fecha).toLocaleDateString("es-AR")}</div>
                </div>
                <div className="text-right">
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#f59e0b" }}>
                    {fmt(deuda.monto_debe)}
                  </div>
                  <div style={{ fontSize: 11 }}>
                    Total: {fmt(deuda.monto_total)} • Pagado: {fmt(deuda.monto_pagado)}
                  </div>
                </div>
              </div>

              {/* ITEMS */}
              <table className="print-table text-sm" style={{ width: "100%", marginTop: 8 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", width: "60%" }}>Producto</th>
                    <th style={{ textAlign: "center", width: "15%" }}>Cant.</th>
                    <th style={{ textAlign: "right", width: "25%" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {deuda.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ textAlign: "left" }}>{item.name}</td>
                      <td style={{ textAlign: "center" }}>{item.qty}</td>
                      <td style={{ textAlign: "right" }}>
                        {money(parseNum(item.qty) * parseNum(item.unitPrice))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* TOTAL FINAL */}
          <div style={{ borderTop: "2px solid #000", margin: "16px 0 8px", paddingTop: 8 }}>
            <div className="flex justify-between items-center" style={{ fontWeight: 900, fontSize: 18 }}>
              <span>DEUDA TOTAL DEL CLIENTE:</span>
              <span>{fmt(inv.deudaTotal)}</span>
            </div>
          </div>

          <div className="mt-10 text-xs text-center">{APP_TITLE}</div>
        </div>
      </div>
    );
  }

  // ==== 4. DEVOLUCIÓN ====
  if (inv?.type === "Devolucion") {
    const fmt = (n: number) => money(parseNum(n));
    
    return (
      <div className="only-print print-area p-14">
        <div className="max-w-[780px] mx-auto text-black">
          <div className="flex items-start justify-between">
            <div>
              <div style={{ fontWeight: 800, letterSpacing: 1 }}>COMPROBANTE DE DEVOLUCIÓN</div>
              <div style={{ marginTop: 2 }}>VM-ELECTRONICA</div>
            </div>
            <div className="text-right">
              <div><b>Fecha:</b> {new Date(inv.date_iso).toLocaleString("es-AR")}</div>
              <div><b>N° Comprobante:</b> {inv.id}</div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #000", margin: "10px 0 8px" }} />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div style={{ fontWeight: 700 }}>Cliente</div>
              <div>{inv.client_name}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Método de Devolución</div>
              <div className="capitalize">{inv.metodo}</div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
          <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>Productos Devueltos</div>
          
          <table className="print-table text-sm">
            <thead>
              <tr>
                <th style={{ width: "6%" }}>#</th>
                <th>Descripción</th>
                <th style={{ width: "12%" }}>Cant. Dev.</th>
                <th style={{ width: "18%" }}>Precio Unit.</th>
                <th style={{ width: "18%" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it: any, i: number) => (
                <tr key={i}>
                  <td style={{ textAlign: "right" }}>{i + 1}</td>
                  <td>
                    {it.name}
                    <div style={{ fontSize: "10px", color: "#666", fontStyle: "italic" }}>
                      {it.section || "General"}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>{parseNum(it.qtyDevuelta)}</td>
                  <td style={{ textAlign: "right" }}>{money(parseNum(it.unitPrice))}</td>
                  <td style={{ textAlign: "right" }}>
                    {money(parseNum(it.qtyDevuelta) * parseNum(it.unitPrice))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: "right", fontWeight: 600 }}>
                  Total Devolución
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{money(inv.total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Información de pagos/diferencias */}
          {(inv.efectivo > 0 || inv.transferencia > 0 || inv.extra_pago_total > 0) && (
            <>
              <div style={{ borderTop: "1px solid #000", margin: "12px 0 6px" }} />
              <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>Detalles de Pago</div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                {inv.efectivo > 0 && (
                  <div>
                    <div>Efectivo Devuelto:</div>
                    <div style={{ fontWeight: 600 }}>{money(inv.efectivo)}</div>
                  </div>
                )}
                {inv.transferencia > 0 && (
                  <div>
                    <div>Transferencia Devuelta:</div>
                    <div style={{ fontWeight: 600 }}>{money(inv.transferencia)}</div>
                  </div>
                )}
                {inv.extra_pago_efectivo > 0 && (
                  <div>
                    <div>Pago Diferencia (Efectivo):</div>
                    <div style={{ fontWeight: 600 }}>{money(inv.extra_pago_efectivo)}</div>
                  </div>
                )}
                {inv.extra_pago_transferencia > 0 && (
                  <div>
                    <div>Pago Diferencia (Transferencia):</div>
                    <div style={{ fontWeight: 600 }}>{money(inv.extra_pago_transferencia)}</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Información específica por método */}
          {inv.metodo === "saldo" && (
            <div className="mt-4 p-3 bg-slate-100 rounded text-sm">
              <div style={{ fontWeight: 700 }}>Acreditado como Saldo a Favor</div>
              <div>El monto de {money(inv.total)} ha sido acreditado al saldo a favor del cliente.</div>
            </div>
          )}

          {inv.metodo === "intercambio_otro" && inv.extra_pago_total > 0 && (
            <div className="mt-4 p-3 bg-slate-100 rounded text-sm">
              <div style={{ fontWeight: 700 }}>Diferencia Pagada</div>
              <div>El cliente abonó {money(inv.extra_pago_total)} por la diferencia del intercambio.</div>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <div style={{ fontWeight: 700 }}>¡Gracias por su confianza!</div>
            <div>Para consultas o reclamos, presente este comprobante</div>
          </div>

          <div className="mt-10 text-xs text-center">{APP_TITLE}</div>
        </div>
      </div>
    );
  }

  // ==== 5. TICKET ====
  if (ticket) {
    return (
      <div className="only-print print-area p-14">
        <div className="max-w-[520px] mx-auto text-black">
          <div className="text-center">
            <div style={{ fontWeight: 800, letterSpacing: 1, fontSize: 20 }}>TICKET DE TURNO</div>
            <div style={{ marginTop: 2, fontSize: 12 }}>VM-ELECTRONICA</div>
          </div>

          <div style={{ borderTop: "1px solid #000", margin: "10px 0 8px" }} />

          <div className="text-sm space-y-1">
            <div>
              <b>Código:</b> {ticket.id}
            </div>
            <div>
              <b>Cliente:</b> {ticket.client_name} (N° {ticket.client_number})
            </div>
            <div>
              <b>Acción:</b> {ticket.action}
            </div>
            <div>
              <b>Fecha:</b> {new Date(ticket.date_iso).toLocaleString("es-AR")}
            </div>
          </div>

          <div style={{ borderTop: "1px solid #000", margin: "10px 0 8px" }} />

          <div className="text-sm" style={{ lineHeight: 1.35 }}>
            POR FAVOR ESPERE A VER SU NÚMERO EN PANTALLA PARA INGRESAR A HACER SU PEDIDO
            O GESTIONAR SU DEVOLUCIÓN.
          </div>

          <div className="mt-10 text-xs text-center">{APP_TITLE}</div>
        </div>
      </div>
    );
  }

  // ==== 6. FACTURA (default) ====
  const paidCash = parseNum(inv?.payments?.cash || 0);
  const paidTransf = parseNum(inv?.payments?.transfer || 0);
  const change = parseNum(inv?.payments?.change || 0);
  const paid   = paidCash + paidTransf;
  const net    = Math.max(0, paid - change);
  const balance = Math.max(0, parseNum(inv.total) - net);
  const fullyPaid = balance <= 0.009;

  const clientDebtTotal = (() => {
    if (inv?.client_id) {
      const cliente = state.clients.find((c: any) => c.id === inv.client_id);
      if (cliente) {
        const detalleDeudas = calcularDetalleDeudas(state, inv.client_id);
        return calcularDeudaTotal(detalleDeudas, cliente);
      }
    }
    return parseNum(inv?.client_debt_total ?? 0);
  })();

  return (
    <div className="only-print print-area p-14">
      <div className="max-w-[780px] mx-auto text-black">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="iPhone Store" 
              className="h-20 w-20 rounded-sm"
              style={{ 
                filter: 'brightness(0) invert(0)'
              }}
            />
            <div>
              <div style={{ 
                fontWeight: 800, 
                letterSpacing: 1, 
                fontSize: '18px',
                marginBottom: '2px'
              }}>
                {inv?.type === "Presupuesto" ? "PRESUPUESTO" : "FACTURA"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #000", margin: "10px 0 6px" }} />

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div style={{ fontWeight: 700 }}>Cliente</div>
            <div>{inv.client_name}</div>
          </div>
          <div className="text-right">
            <div>
              <b>Factura Nº:</b> {pad(inv.number)}
            </div>
            <div>
              <b>Fecha:</b> {new Date(inv.date_iso).toLocaleDateString("es-AR")}
            </div>
            <div>
              <b>Estado del pago:</b> {fullyPaid ? "Pagado" : "Pendiente"}
            </div>
          </div>
        </div>

        <table className="print-table text-sm" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th style={{ width: "6%" }}>#</th>
              <th>Descripción de artículo</th>
              <th style={{ width: "12%" }}>Cantidad</th>
              <th style={{ width: "18%" }}>Precio</th>
              <th style={{ width: "18%" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it: any, i: number) => (
              <tr key={i}>
                <td style={{ textAlign: "right" }}>{i + 1}</td>
                <td>
                  {it.name}
                  <div style={{ fontSize: "10px", color: "#666", fontStyle: "italic" }}>
                    {it.section || "General"}
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>{parseNum(it.qty)}</td>
                <td style={{ textAlign: "right" }}>{money(parseNum(it.unitPrice))}</td>
                <td style={{ textAlign: "right" }}>
                  {money(parseNum(it.qty) * parseNum(it.unitPrice))}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: "right", fontWeight: 600 }}>
                Total
              </td>
              <td style={{ textAlign: "right", fontWeight: 700 }}>{money(inv.total)}</td>
            </tr>

            {typeof inv?.payments?.saldo_aplicado === "number" &&
              inv.payments.saldo_aplicado > 0 && (
                <>
                  <tr>
                    <td colSpan={4} style={{ textAlign: "right" }}>
                      Saldo a favor aplicado
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {money(parseNum(inv.payments.saldo_aplicado))}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} style={{ textAlign: "right", fontWeight: 600 }}>
                      Total luego de saldo
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {money(
                        parseNum(
                          inv.total_after_credit ??
                            (inv.total - inv.payments.saldo_aplicado)
                        )
                      )}
                    </td>
                  </tr>
                </>
              )}
          </tfoot>
        </table>

        <div className="grid grid-cols-2 gap-2 text-sm" style={{ marginTop: 8 }}>
          <div />
          <div>
            <div>
              <b>Método de pago:</b>
            </div>
            <div>CONTADO: {money(paidCash)}</div>
            <div>TRANSFERENCIA: {money(paidTransf)}</div>
            {inv?.payments?.change ? (
              <div>VUELTO: {money(parseNum(inv.payments.change))}</div>
            ) : null}
            {inv?.payments?.alias && (
              <div>Alias/CVU destino: {inv.payments.alias}</div>
            )}
            <div style={{ marginTop: 6 }}>
              <b>Cantidad pagada:</b> {money(paid)}
            </div>

            <div>
              <b>Cantidad adeudada:</b> {money(balance)}
            </div>
            <div style={{ marginTop: 6 }}>
              <b>Total adeudado como cliente:</b> {money(clientDebtTotal)}
            </div>
          </div>
        </div>

        {fullyPaid && (
          <div
            style={{
              position: "fixed",
              top: "55%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-20deg)",
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: 4,
              opacity: 0.08,
            }}
          >
            PAGADO
          </div>
        )}

        <div className="mt-10 text-xs text-center">{APP_TITLE}</div>
      </div>
    </div>
  );
}

function Login({ onLogin, vendors, adminKey, clients }: any) {
  const [role, setRole] = useState("vendedor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const APP_TITLE = "Sistema de Gestión y Facturación — By Tobias Carrizo";

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Intentando login con:', { role, email });

      if (hasSupabase) {
        console.log('✅ Conectado a Supabase, usando login local');
      }

      // 🔥 EJECUTAR SIEMPRE EL LOGIN LOCAL
      handleLocalLogin();
      
    } catch (error) {
      console.error('💥 Error en login:', error);
      alert('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  // Función de login local
  function handleLocalLogin() {
    console.log('🔄 Usando login local');
    
    if (role === "admin") {
      // Solo verifica la clave del admin, sin usuario
      if (password === adminKey) {
        onLogin({ role: "admin", name: "Admin", id: "admin" });
      } else {
        alert("Clave de administrador incorrecta.");
      }
      return;
    }

    if (role === "vendedor") {
      const v = vendors.find(
        (v: any) =>
          (v.name.toLowerCase() === email.trim().toLowerCase() || v.id === email.trim()) &&
          v.key === password
      );
      if (v) {
        onLogin({ role: "vendedor", name: v.name, id: v.id });
      } else {
        alert("Vendedor o clave incorrecta.");
      }
      return;
    }

    // Login para cliente y pedido-online - solo con número de cliente
    if (role === "cliente" || role === "pedido-online") {
      const num = parseInt(email, 10);
      if (!num) {
        alert("Ingrese un número de cliente válido.");
        return;
      }
      const cl = clients.find((c: any) => parseInt(String(c.number), 10) === num);
      if (!cl) {
        alert("N° de cliente no encontrado.");
        return;
      }
      onLogin({ 
        role: role, 
        name: cl.name, 
        id: cl.id, 
        number: cl.number 
      });
      return;
    }
  }

   return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-emerald-500/30">
        {/* Logo agrandado */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="iPhone Store" 
              className="h-40 w-40 rounded-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sistema de Gestión</h1>
          <p className="text-emerald-300 text-sm">Seleccione su tipo de acceso</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-emerald-300 mb-2">
              Tipo de Acceso
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-3 bg-slate-700 border border-emerald-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
            >
              <option value="vendedor" className="bg-slate-700">Vendedor</option>
              <option value="admin" className="bg-slate-700">Administrador</option>
              <option value="cliente" className="bg-slate-700">Cliente Presencial</option>
              <option value="pedido-online" className="bg-slate-700">Pedido Online</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-300 mb-2">
              {role === "admin" ? "Acceso Administrador" : 
               role === "vendedor" ? "Email o ID de Vendedor" : 
               "Número de Cliente"}
            </label>
            <input
              type={role === "cliente" || role === "pedido-online" ? "number" : "text"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-3 bg-slate-700 border border-emerald-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-emerald-300/50"
              placeholder={
                role === "admin" ? "Solo requiere clave" : 
                role === "vendedor" ? "Ingrese email o ID..." : 
                "Ingrese su número de cliente..."
              }
              required={role !== "admin"}
              disabled={role === "admin"}
            />
            {role === "admin" && (
              <p className="text-xs text-emerald-300/70 mt-1">Solo requiere clave de administrador</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-300 mb-2">
              {role === "admin" ? "Clave de Administrador" :
               role === "vendedor" ? "Clave de Vendedor" : 
               "DNI del Cliente"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-3 bg-slate-700 border border-emerald-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-emerald-300/50"
              placeholder={
                role === "admin" ? "Ingrese clave admin..." :
                role === "vendedor" ? "Ingrese su clave..." : 
                "Ingrese su DNI..."
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 px-4 rounded-lg hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200 font-semibold text-lg shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Iniciando sesión...
              </div>
            ) : (
              "Ingresar al Sistema"
            )}
          </button>
        </form>

        {/* Información de ayuda */}
        <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-emerald-500/30">
          <h3 className="text-sm font-semibold text-emerald-300 mb-2">Información de acceso:</h3>
          <ul className="text-xs text-emerald-200/80 space-y-1">
            <li>• <span className="text-white">Admin:</span> Solo requiere clave</li>
            <li>• <span className="text-white">Vendedor:</span> Email/ID + Clave</li>
            <li>• <span className="text-white">Cliente:</span> Número + DNI</li>
            <li>• <span className="text-white">Pedido Online:</span> Número + DNI</li>
          </ul>
        </div>

        <div className="mt-8 text-center text-xs text-emerald-300/60">
          {APP_TITLE}
        </div>
      </div>
    </div>
  );
}
// ... código anterior ...

/* ===== Página principal ===== */
export default function Page() {
  const [state, setState] = useState<any>(seedState());
  const [session, setSession] = useState<any | null>(null);
  const [tab, setTab] = useState("Facturación");

  useEffect(() => {
    if (!hasSupabase) return;
    (async () => {
      const s = await loadFromSupabase(seedState());
      setState(s);
    })();

    // Agregar esta parte para sincronización en tiempo real:
    if (hasSupabase) {
      // Suscripción para presupuestos
      const budgetSubscription = supabase
        .channel('budgets-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'budgets'
          },
          async () => {
            // Recargar los presupuestos cuando haya cambios
            const refreshedState = await loadFromSupabase(seedState());
            setState(refreshedState);
          }
        )
        .subscribe();

      // 👇👇👇 AGREGAR ESTA SUSCRIPCIÓN PARA FACTURAS
      const invoicesSubscription = supabase
        .channel('invoices-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'invoices'
          },
          async () => {
            // Recargar las facturas cuando haya cambios
            const refreshedState = await loadFromSupabase(seedState());
            setState(refreshedState);
          }
        )
        .subscribe();

      // 👇👇👇 NUEVA SUSCRIPCIÓN PARA PEDIDOS ONLINE
      const pedidosSubscription = supabase
        .channel('pedidos-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pedidos'
          },
          async () => {
            // Recargar los pedidos cuando haya cambios
            const refreshedState = await loadFromSupabase(seedState());
            setState(refreshedState);
          }
        )
        .subscribe();
       
      // 👇👇👇 NUEVA SUSCRIPCIÓN PARA DEBT_PAYMENTS
      const debtPaymentsSubscription = supabase
        .channel('debt-payments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'debt_payments'
          },
          async () => {
            console.log("🔄 Cambios en debt_payments detectados, recargando...");
            const refreshedState = await loadFromSupabase(seedState());
            setState(refreshedState);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(budgetSubscription);
        supabase.removeChannel(invoicesSubscription);
        supabase.removeChannel(pedidosSubscription);
        supabase.removeChannel(debtPaymentsSubscription);
      };
    }
  }, []);

  function onLogin(user: any) {
    setSession(user);
    // 👇👇👇 MODIFICAR ESTA LÍNEA para manejar el nuevo rol
    if (user.role === "pedido-online") {
      setTab("Hacer Pedido");
    } else {
      setTab(user.role === "cliente" ? "Panel" : "Facturación");
    }
  }

  function onLogout() {
    setSession(null);
  }

  /* ===== SISTEMA DE NOTIFICACIONES ===== */
  function NotificationSystem() {
    const [notifications, setNotifications] = useState<any[]>([]);

    // Función para agregar notificación
    const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      const id = Date.now() + Math.random();
      const newNotification = { id, message, type, timestamp: Date.now() };
      
      setNotifications(prev => [...prev, newNotification]);
      
      // Auto-remover después de 5 segundos
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    };

    // Remover notificación manualmente
    const removeNotification = (id: number) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Context para que cualquier componente pueda usar las notificaciones
    useEffect(() => {
      // @ts-ignore
      window.showNotification = addNotification;
      // @ts-ignore
      window.removeNotification = removeNotification;
    }, []);

    const getNotificationStyle = (type: string) => {
      switch (type) {
        case 'success':
          return 'bg-emerald-900/80 border-emerald-700 text-emerald-200';
        case 'error':
          return 'bg-red-900/80 border-red-700 text-red-200';
        case 'warning':
          return 'bg-amber-900/80 border-amber-700 text-amber-200';
        case 'info':
          return 'bg-blue-900/80 border-blue-700 text-blue-200';
        default:
          return 'bg-slate-900/80 border-slate-700 text-slate-200';
      }
    };

    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'success':
          return '✅';
        case 'error':
          return '❌';
        case 'warning':
          return '⚠️';
        case 'info':
          return 'ℹ️';
        default:
          return '💡';
      }
    };

    if (notifications.length === 0) return null;

    return (
      <div className="fixed top-20 right-4 z-[1000] space-y-2 max-w-sm">

        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`${getNotificationStyle(notification.type)} border rounded-xl p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-full duration-500`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Helper functions para usar en cualquier componente
  function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    if (typeof window !== 'undefined' && (window as any).showNotification) {
      (window as any).showNotification(message, type);
    } else {
      // Fallback al alert tradicional
      alert(message);
    }
  }

  function showSuccess(message: string) {
    showNotification(message, 'success');
  }

  function showError(message: string) {
    showNotification(message, 'error');
  }

  function showWarning(message: string) {
    showNotification(message, 'warning');
  }

  function showInfo(message: string) {
    showNotification(message, 'info');
  }

  return (
    <>
      {/* App visible (no se imprime) */}
      <div className="min-h-screen bg-emerald-950 text-slate-100 no-print">
        <style>{`::-webkit-scrollbar{width:10px;height:10px}::-webkit-scrollbar-track{background:#0b1220}::-webkit-scrollbar-thumb{background:#065f46;border-radius:8px}::-webkit-scrollbar-thumb:hover{background:#047857}`}</style>
        
        {/* Sistema de notificaciones */}
        <NotificationSystem />
        
        {!session ? (
          <Login
            onLogin={onLogin}
            vendors={state.vendors}
            adminKey={state.auth.adminKey}
            clients={state.clients}
          />
        ) : (
          <>
            <Navbar current={tab} setCurrent={setTab} role={session.role} onLogout={onLogout} />
{/* Panel de cliente */}
{session.role === "cliente" && tab === "Panel" && (
  <ClientePanel state={state} setState={setState} session={session} />
)}

{/* 👇👇👇 NUEVO: Panel de Pedidos Online */}
{session.role === "pedido-online" && tab === "Hacer Pedido" && (
  <PedidosOnlineTab 
    state={state} 
    setState={setState} 
    session={session}
    showError={showError}
    showSuccess={showSuccess}
    showInfo={showInfo}
  />
)}

{/* Vendedor / Admin */}

{/* 👇👇👇 AGREGAR FACTURACIÓN AQUÍ - ESTA ES LA LÍNEA QUE FALTA */}
{session.role !== "cliente" && session.role !== "pedido-online" && tab === "Facturación" && (
  <FacturacionTab 
    state={state} 
    setState={setState} 
    session={session}
    showError={showError}
    showSuccess={showSuccess}
    showInfo={showInfo}
  />
)}

{session.role !== "cliente" && session.role !== "pedido-online" && tab === "Clientes" && (
  <ClientesTab 
    state={state} 
    setState={setState} 
    session={session}
    showError={showError}
    showSuccess={showSuccess}
    showInfo={showInfo}
  />
)}
{session.role !== "cliente" && session.role !== "pedido-online" && tab === "Deudores" && (
  <DeudoresTab 
    state={state} 
    setState={setState} 
    session={session}
    showError={showError}
    showSuccess={showSuccess}
    showInfo={showInfo}
  />
)}

{/* 👇👇👇 NUEVAS PESTAÑAS SISTEMA iPHONES - AGREGAR ESTO */}
{session.role !== "cliente" && session.role !== "pedido-online" && tab === "Ventas iPhones" && (
  <VentasiPhoneTab 
    state={state} 
    setState={setState} 
    session={session}
    showError={showError}
    showSuccess={showSuccess}
  />
)}
{session.role !== "cliente" && session.role !== "pedido-online" && tab === "Inventario iPhones" && (
  <ProductosiPhoneTab 
    state={state} 
    setState={setState} 
    session={session}
    showError={showError}
    showSuccess={showSuccess}
    showInfo={showInfo}
  />
)}
{session.role !== "cliente" && session.role !== "pedido-online" && tab === "Agenda Turnos" && (
  <AgendaTurnosTab 
    state={state} 
    setState={setState} 
    session={session}
    showError={showError}
    showSuccess={showSuccess}
    showInfo={showInfo}
  />
)}
{session.role !== "cliente" && session.role !== "pedido-online" && tab === "Reportes" && (
  <ReportesTab 
    state={state} 
    setState={setState} 
    session={session}
    showError={showError}
    showSuccess={showSuccess}
    showInfo={showInfo}
  />
)}
{/* Cola */}

{session.role !== "cliente" && session.role !== "pedido-online" && tab === "Cola" && (
  <ColaTab 
    state={state} 
    setState={setState} 
    session={session}
    showError={showError}
    showSuccess={showSuccess}
    showInfo={showInfo}
  />
)}
{session.role === "admin" && session.role !== "pedido-online" && tab === "Vendedores" && (
  <VendedoresTab state={state} setState={setState} />
)}

{session.role !== "cliente" && session.role !== "pedido-online" && tab === "Presupuestos" && (
  <PresupuestosTab 
    state={state} 
    setState={setState} 
    session={session}
    showError={showError}
    showSuccess={showSuccess}
    showInfo={showInfo}
  />
)}
{session.role !== "cliente" && session.role !== "pedido-online" && tab === "Gastos y Devoluciones" && (
  <GastosDevolucionesTab 
    state={state} 
    setState={setState} 
    session={session}
    showError={showError}
    showSuccess={showSuccess}
    showInfo={showInfo}
  />
)}
{/* 👇👇👇 NUEVA PESTAÑA: Gestión de Pedidos Online */}
{session.role !== "cliente" && session.role !== "pedido-online" && tab === "Pedidos Online" && (
  <GestionPedidosTab 
    state={state} 
    setState={setState} 
    session={session}
    showError={showError}
    showSuccess={showSuccess}
    showInfo={showInfo}
  />
)}

<div className="fixed bottom-3 right-3 text-[10px] text-slate-500 select-none">
  {hasSupabase ? "Supabase activo" : "Datos en navegador"}
</div>
          </>
        )}
      </div>

      {/* Plantillas que sí se imprimen */}
      <PrintArea state={state} />
    </>
  );
}
