export type BrStudioService = {
  slug: string;
  eyebrow: string;
  title: string;
  tagline: string;
  description: string;
  includes: string[];
  idealFor: string[];
  benefits: string[];
  whatsappMessage: string;
};

export const BR_STUDIOS_WHATSAPP = "528117470102";

export const brStudioServices: BrStudioService[] = [
  {
    slug: "paginas-web",
    eyebrow: "Presencia digital",
    title: "Páginas web",
    tagline: "Tu negocio merece verse tan profesional como realmente es.",
    description:
      "Creamos sitios web claros, modernos y comerciales para presentar mejor tu negocio, comunicar con confianza y generar más oportunidades.",
    includes: [
      "Landing pages y sitios informativos",
      "Páginas de servicios y catálogos comerciales",
      "Diseño responsive para móvil y escritorio",
      "Llamados a la acción y contacto directo",
    ],
    idealFor: ["Negocios locales", "Marcas personales", "Servicios profesionales", "Catálogos comerciales"],
    benefits: ["Presencia profesional", "Información clara", "Más oportunidades de contacto"],
    whatsappMessage: "Hola BR STUDIOS, me interesa cotizar una página web para mi negocio.",
  },
  {
    slug: "aplicaciones",
    eyebrow: "Operación digital",
    title: "Aplicaciones",
    tagline: "Herramientas digitales para operar mejor.",
    description:
      "Desarrollamos aplicaciones web y móviles para usuarios, equipos y procesos con interfaces claras y una experiencia moderna.",
    includes: [
      "Aplicaciones web y móviles",
      "Paneles internos para equipos",
      "Seguimiento, consultas y operaciones",
      "Experiencias centradas en usuarios reales",
    ],
    idealFor: ["Reservas", "Equipos internos", "Seguimiento", "Operaciones y consulta"],
    benefits: ["Más agilidad", "Más organización", "Experiencia moderna"],
    whatsappMessage: "Hola BR STUDIOS, me interesa cotizar una aplicación para mi proyecto.",
  },
  {
    slug: "e-commerce",
    eyebrow: "Venta en línea",
    title: "E-commerce",
    tagline: "Vende en línea con más confianza.",
    description:
      "Creamos tiendas digitales con catálogo, pagos y una experiencia clara para tus clientes.",
    includes: [
      "Catálogo de productos",
      "Carrito y flujo de compra claro",
      "Integración de pagos",
      "Estructura preparada para crecer",
    ],
    idealFor: ["Productos físicos", "Catálogos", "Pedidos", "Venta directa"],
    benefits: ["Catálogo atractivo", "Proceso de compra claro", "Más ventas potenciales"],
    whatsappMessage: "Hola BR STUDIOS, me interesa cotizar una tienda en línea / e-commerce.",
  },
  {
    slug: "sistemas-a-la-medida",
    eyebrow: "Control operativo",
    title: "Sistemas a la medida",
    tagline: "Más control para tu operación.",
    description:
      "Desarrollamos sistemas internos y ERP pensados alrededor del flujo real de tu negocio.",
    includes: [
      "Sistemas internos y paneles administrativos",
      "Procesos conectados alrededor de tu operación",
      "Información centralizada",
      "Base escalable para control y crecimiento",
    ],
    idealFor: ["Cotizaciones", "Seguimiento", "Inventario", "Compras y administración"],
    benefits: ["Procesos conectados", "Información centralizada", "Más control operativo"],
    whatsappMessage: "Hola BR STUDIOS, me interesa cotizar un sistema a la medida.",
  },
  {
    slug: "ui-ux",
    eyebrow: "Experiencia y diseño",
    title: "UI/UX",
    tagline: "Experiencias claras, modernas y profesionales.",
    description:
      "Diseñamos interfaces que ayudan a que tu sistema se sienta útil, ordenado y fácil de usar.",
    includes: [
      "Diseño de interfaces",
      "Jerarquía visual y estructura",
      "Optimización de claridad y experiencia",
      "Sistema visual consistente",
    ],
    idealFor: ["Apps", "Paneles", "Plataformas", "Productos digitales"],
    benefits: ["Más claridad", "Mejor experiencia", "Imagen más profesional"],
    whatsappMessage: "Hola BR STUDIOS, me interesa cotizar diseño UI/UX.",
  },
  {
    slug: "automatizacion",
    eyebrow: "Conecta procesos",
    title: "Automatización",
    tagline: "Conecta procesos y ahorra tiempo.",
    description:
      "Integramos herramientas y flujos para reducir trabajo repetitivo y mejorar la continuidad operativa.",
    includes: [
      "Integración de herramientas y flujos",
      "Automatización de tareas repetitivas",
      "Conexión entre formularios, notificaciones y datos",
      "Seguimiento con mayor continuidad",
    ],
    idealFor: ["Formularios", "Notificaciones", "Bases de datos", "APIs y procesos repetitivos"],
    benefits: ["Menos tareas manuales", "Más continuidad", "Mejor seguimiento"],
    whatsappMessage: "Hola BR STUDIOS, me interesa cotizar automatización para mi negocio.",
  },
];

export function getWhatsAppUrl(message: string) {
  return `https://wa.me/${BR_STUDIOS_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
